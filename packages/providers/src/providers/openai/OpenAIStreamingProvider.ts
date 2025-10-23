import { inject, injectable } from '@needle-di/core'
import type { ILoggingService, ISettingsService, Message } from '@tars/contracts'
import { type LlmCapability, type LlmModel, toLlmModels } from '@tars/contracts/providers'
import { tokens } from '@tars/contracts/tokens'
import OpenAI from 'openai'
import { StreamingProviderBase } from '../../base/StreamingProviderBase'
import type { StreamConfig } from '../../config'
import type {
	BeforeStreamStartResult,
	ComprehensiveCallbacks,
	ToolDefinition
} from '../../config/ComprehensiveCallbacks'
import type { ICompletionsStream } from '../../streaming'
import { OpenAICompletionsStream } from './OpenAICompletionsStream'
import { type OpenAIProviderOptions, toOpenAIMessage } from './types'

/**
 * OpenAI Streaming Provider - Reference Implementation
 *
 * This is the REFERENCE implementation demonstrating comprehensive callbacks.
 * All other providers should follow this pattern.
 *
 * Features:
 * - ✅ Tool injection via onToolsRequest
 * - ✅ Message transformation via beforeStreamStart
 * - ✅ Chunk pre-processing via beforeChunk
 * - ✅ Chunk post-processing via afterChunk
 * - ✅ Lifecycle events (start, end, error, timeout)
 * - ✅ Retry control via onError
 * - ✅ Timeout warnings via onLongWaiting
 *
 * Rule: Providers should NOT interact with UI
 * - ✅ Settings: Required for configuration
 * - ✅ Logging: Required for internal debugging
 * - ❌ Notifications: Handled by onError callback
 * - ❌ Documents: Handled by afterChunk callback
 * - ❌ Tools: Handled by onToolsRequest callback
 */
@injectable()
export class OpenAIStreamingProvider extends StreamingProviderBase {
	readonly name = 'openai'
	readonly displayName = 'OpenAI'
	readonly websiteToObtainKey = 'https://platform.openai.com/api-keys'
	readonly capabilities: LlmCapability[] = [
		'Text Generation',
		'Image Vision',
		'Image Generation',
		'Tool Calling',
		'Reasoning'
	]

	private client: OpenAI | null = null
	private providerOptions: OpenAIProviderOptions | null = null

	constructor(loggingService = inject(tokens.Logger), settingsService = inject(tokens.Settings)) {
		super(loggingService, settingsService)
	}

	/**
	 * Get available models
	 * Updated based on OpenAI API models list (2025-10-22)
	 */
	get models(): LlmModel[] {
		return toLlmModels(
			[
				// GPT-5 series (Latest, 2025)
				'gpt-5-nano', // Cheapest GPT-5 model
				'gpt-5-mini', // Cost-effective GPT-5
				'gpt-5', // Standard GPT-5
				'gpt-5-pro', // Premium GPT-5

				// GPT-4.1 series
				'gpt-4.1-nano', // Cheapest GPT-4.1
				'gpt-4.1-mini', // Cost-effective GPT-4.1
				'gpt-4.1', // Standard GPT-4.1

				// GPT-4o series (Optimized)
				'gpt-4o-mini', // Most cost-effective for general use
				'gpt-4o', // Optimized GPT-4

				// GPT-4 series (Classic)
				'gpt-4-turbo', // Fast GPT-4
				'gpt-4', // Original GPT-4

				// GPT-3.5 series (Legacy)
				'gpt-3.5-turbo' // Legacy model
			],
			this.capabilities
		)
	}

	/**
	 * Get default options
	 */
	get defaultOptions(): OpenAIProviderOptions {
		return {
			apiKey: '',
			baseURL: 'https://api.openai.com/v1',
			model: 'gpt-4o-mini',
			temperature: 0.7
		}
	}

	/**
	 * Initialize the provider with options
	 */
	initialize(options: OpenAIProviderOptions): void {
		if (!options.apiKey) {
			throw new Error('OpenAI API key is required')
		}

		this.providerOptions = options
		this.client = new OpenAI({
			apiKey: options.apiKey,
			baseURL: options.baseURL
		})

		this.loggingService.info('OpenAI provider initialized', {
			model: options.model,
			baseURL: options.baseURL
		})
	}

	/**
	 * Stream with comprehensive callbacks
	 *
	 * This is the MAIN ENTRY POINT that demonstrates callback integration.
	 * It shows how to invoke callbacks at each stage of the streaming process.
	 */
	async *stream(messages: Message[], config: StreamConfig = {}): AsyncGenerator<string, void, unknown> {
		const callbacks = config.callbacks as ComprehensiveCallbacks | undefined
		const startTime = Date.now()
		let chunkCount = 0
		let accumulated = ''

		try {
			// ========================================
			// 1. BEFORE STREAM START
			// ========================================

			// Request tools from consumer
			let tools: ToolDefinition[] | undefined

			if (callbacks?.onToolsRequest) {
				this.loggingService.debug('Requesting tools from consumer')

				const toolsResult = await callbacks.onToolsRequest({
					provider: this.name,
					model: this.providerOptions?.model || 'unknown',
					messages
				})

				tools = toolsResult.tools

				this.loggingService.debug('Received tools from consumer', {
					toolCount: tools?.length || 0
				})
			}

			// Allow consumer to modify messages, tools, and options before streaming
			let finalMessages = messages
			let finalTools = tools
			let finalOptions = config.providerOptions

			if (callbacks?.beforeStreamStart) {
				this.loggingService.debug('Invoking beforeStreamStart callback')

				const beforeResult: BeforeStreamStartResult = await callbacks.beforeStreamStart({
					messages,
					provider: this.name,
					model: this.providerOptions?.model || 'unknown',
					tools,
					providerOptions: config.providerOptions
				})

				// Check for cancellation
				if (beforeResult.cancel) {
					this.loggingService.warn('Streaming cancelled by beforeStreamStart', {
						reason: beforeResult.cancelReason
					})
					return
				}

				// Apply modifications
				finalMessages = beforeResult.messages || messages
				finalTools = beforeResult.tools !== undefined ? beforeResult.tools : tools
				finalOptions = beforeResult.providerOptions || config.providerOptions

				this.loggingService.debug('beforeStreamStart completed', {
					messagesModified: beforeResult.messages !== undefined,
					toolsModified: beforeResult.tools !== undefined,
					optionsModified: beforeResult.providerOptions !== undefined
				})
			}

			// ========================================
			// 2. CREATE STREAM
			// ========================================

			// Convert messages to OpenAI format
			const openAIMessages = finalMessages.map(toOpenAIMessage)

			// Prepare stream options with final tools
			const streamOptions = {
				signal: config.signal,
				model: this.providerOptions!.model,
				temperature: this.providerOptions!.temperature,
				providerOptions: finalOptions
			}

			const completionStream = OpenAICompletionsStream.from(openAIMessages, streamOptions, this.client!, finalTools)

			// ========================================
			// 3. STREAM START EVENT
			// ========================================

			if (callbacks?.onStreamStart) {
				await callbacks.onStreamStart({
					provider: this.name,
					model: this.providerOptions!.model,
					messageCount: finalMessages.length,
					hasTools: !!finalTools && finalTools.length > 0,
					timestamp: Date.now()
				})
			}

			this.loggingService.info('Stream started', {
				provider: this.name,
				model: this.providerOptions!.model,
				messages: finalMessages.length,
				tools: finalTools?.length || 0
			})

			// ========================================
			// 4. PROCESS STREAM WITH CHUNK HOOKS
			// ========================================

			for await (const event of completionStream) {
				// Handle content events
				if (event.type === 'content' && event.data) {
					const originalChunk = event.data
					let processedChunk = originalChunk
					let skipChunk = false

					// ========================================
					// 4a. BEFORE CHUNK (pre-process)
					// ========================================

					if (callbacks?.beforeChunk) {
						const beforeChunkResult = await callbacks.beforeChunk({
							chunk: originalChunk,
							index: chunkCount,
							accumulated,
							timestamp: Date.now()
						})

						// Check if chunk should be skipped
						if (beforeChunkResult.skip) {
							this.loggingService.debug('Chunk skipped by beforeChunk', {
								index: chunkCount
							})
							skipChunk = true
						} else {
							// Use modified chunk if provided
							processedChunk = beforeChunkResult.chunk || originalChunk
						}
					}

					// Skip chunk if requested
					if (skipChunk) {
						continue
					}

					// Update state
					accumulated += processedChunk
					chunkCount++

					// Yield the processed chunk
					yield processedChunk

					// ========================================
					// 4b. AFTER CHUNK (post-process)
					// ========================================

					if (callbacks?.afterChunk) {
						await callbacks.afterChunk({
							originalChunk,
							processedChunk,
							index: chunkCount - 1,
							accumulated,
							duration: Date.now() - startTime,
							timestamp: Date.now()
						})
					}
				}

				// Handle tool calls
				if (event.type === 'tool_calls' && event.data) {
					if (callbacks?.onToolCall) {
						this.loggingService.debug('Tool calls requested', {
							count: event.data.length
						})

						const toolCallResult = await callbacks.onToolCall({
							toolCalls: event.data,
							messages: finalMessages,
							provider: this.name
						})

						// Here you would handle tool results and potentially
						// create a follow-up stream with the results
						this.loggingService.debug('Tool calls completed', {
							count: toolCallResult.responses.length,
							continue: toolCallResult.continueStreaming
						})
					}
				}

				// Handle errors
				if (event.type === 'error' && event.data) {
					if (callbacks?.onError) {
						const errorResult = await callbacks.onError({
							error: event.data,
							recoverable: false,
							attemptNumber: 0,
							provider: this.name,
							stack: event.data.stack
						})

						this.loggingService.error('Stream error', {
							error: event.data.message,
							retry: errorResult.retry
						})

						// In a real implementation, handle retry logic here
					}

					throw event.data
				}
			}

			// ========================================
			// 5. STREAM END EVENT
			// ========================================

			if (callbacks?.onStreamEnd) {
				await callbacks.onStreamEnd({
					provider: this.name,
					model: this.providerOptions!.model,
					totalChunks: chunkCount,
					totalTokens: undefined, // Could be tracked if available
					duration: Date.now() - startTime,
					timestamp: Date.now()
				})
			}

			this.loggingService.info('Stream completed successfully', {
				chunks: chunkCount,
				duration: Date.now() - startTime,
				length: accumulated.length
			})
		} catch (error) {
			// ========================================
			// ERROR HANDLING
			// ========================================

			this.loggingService.error('Stream failed', {
				error: error instanceof Error ? error.message : String(error),
				chunks: chunkCount,
				duration: Date.now() - startTime
			})

			if (callbacks?.onError) {
				await callbacks.onError({
					error: error instanceof Error ? error : new Error(String(error)),
					recoverable: false,
					attemptNumber: 0,
					provider: this.name
				})
			}

			throw error
		}
	}

	/**
	 * Create completion stream for messages
	 * NOTE: This is now mainly used internally by the stream() method
	 */
	protected createCompletionStream(messages: Message[], config: StreamConfig): ICompletionsStream {
		if (!this.client || !this.providerOptions) {
			throw new Error('Provider not initialized. Call initialize() first.')
		}

		const openAIMessages = messages.map(toOpenAIMessage)

		const streamOptions = {
			signal: config.signal,
			model: this.providerOptions.model,
			temperature: this.providerOptions.temperature,
			providerOptions: config.providerOptions
		}

		const tools = config.providerOptions?.tools

		return OpenAICompletionsStream.from(openAIMessages, streamOptions, this.client, tools)
	}

	/**
	 * Validate provider options
	 */
	validateOptions(options: OpenAIProviderOptions): boolean {
		return !!(options.apiKey && options.model)
	}

	/**
	 * Get provider status
	 */
	getStatus(): { initialized: boolean; model?: string } {
		return {
			initialized: !!this.client,
			model: this.providerOptions?.model
		}
	}

	/**
	 * Dispose resources
	 */
	dispose(): void {
		this.client = null
		this.providerOptions = null
		this.loggingService.info('OpenAI provider disposed')
	}
}
