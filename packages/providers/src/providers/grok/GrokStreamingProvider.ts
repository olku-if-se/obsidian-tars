import { inject, injectable } from '@needle-di/core'
import type { ILogger, ISettingsService, Message, ResolveEmbedAsBinary } from '@tars/contracts'
import { type LlmCapability, type LlmModel, toLlmModels } from '@tars/contracts/providers'
import { tokens } from '@tars/contracts/tokens'
import { StreamingProviderBase } from '../../base/StreamingProviderBase'
import type { StreamConfig } from '../../config'
import type {
	BeforeStreamStartResult,
	ComprehensiveCallbacks,
	ToolDefinition
} from '../../base/ComprehensiveCallbacks'
import type { ICompletionsStream } from '../../streaming'
import { convertEmbedToImageUrl } from '../../utils'
import { GrokCompletionsStream } from './GrokCompletionsStream'
import { type ContentItem, type GrokMessage, type GrokProviderOptions, toGrokMessage } from './types'

/**
 * Grok (xAI) streaming provider
 * OpenAI-compatible with reasoning support
 *
 * Features:
 * - Real-time data access via X platform
 * - Reasoning mode with callout formatting
 * - Multi-modal (text + images)
 * - OpenAI-compatible tool calling
 */
@injectable()
export class GrokStreamingProvider extends StreamingProviderBase {
	readonly name = 'grok'
	readonly displayName = 'Grok'
	readonly websiteToObtainKey = 'https://console.x.ai'
	readonly capabilities: LlmCapability[] = ['Text Generation', 'Image Vision', 'Tool Calling', 'Reasoning']

	private apiKey: string | null = null
	private providerOptions: GrokProviderOptions | null = null
	private resolveEmbedAsBinary: ResolveEmbedAsBinary | null = null

	constructor(loggingService = inject(tokens.Logger), settingsService = inject(tokens.Settings)) {
		super(loggingService, settingsService)
	}

	/**
	 * Get available models
	 */
	get models(): LlmModel[] {
		return toLlmModels(['grok-beta', 'grok-vision-beta'], this.capabilities)
	}

	/**
	 * Get default options
	 */
	get defaultOptions(): GrokProviderOptions {
		return {
			apiKey: '',
			baseURL: 'https://api.x.ai/v1/chat/completions',
			model: 'grok-beta',
			temperature: 0.7
		}
	}

	/**
	 * Stream with comprehensive callbacks (Gold Standard)
	 * Follows OpenAI reference implementation
	 */
	async *stream(messages: Message[], config: StreamConfig = {}): AsyncGenerator<string, void, unknown> {
		const callbacks = config.callbacks as ComprehensiveCallbacks | undefined
		const startTime = Date.now()
		let chunkCount = 0
		let accumulated = ''

		try {
			// 1. REQUEST TOOLS
			let tools: ToolDefinition[] | undefined
			if (callbacks?.onToolsRequest) {
				const toolsResult = await callbacks.onToolsRequest({
					provider: this.name,
					model: this.providerOptions!.model,
					messages
				})
				tools = toolsResult.tools
				this.logger.debug('Received tools from consumer', { count: tools?.length || 0 })
			}

			// 2. BEFORE STREAM START
			let finalMessages = messages
			let finalTools = tools
			let finalOptions = config.providerOptions

			if (callbacks?.beforeStreamStart) {
				const beforeResult: BeforeStreamStartResult = await callbacks.beforeStreamStart({
					messages,
					provider: this.name,
					model: this.providerOptions!.model,
					tools,
					providerOptions: config.providerOptions
				})

				if (beforeResult.cancel) {
					this.logger.warn('Stream cancelled', { reason: beforeResult.cancelReason })
					return
				}

				finalMessages = beforeResult.messages || messages
				finalTools = beforeResult.tools !== undefined ? beforeResult.tools : tools
				finalOptions = beforeResult.providerOptions || config.providerOptions
			}

			// 3. CREATE STREAM
			const completionStream = this.createCompletionStreamWithTools(
				finalMessages,
				{ ...config, providerOptions: finalOptions },
				finalTools
			)

			// 4. STREAM START
			if (callbacks?.onStreamStart) {
				await callbacks.onStreamStart({
					provider: this.name,
					model: this.providerOptions!.model,
					messageCount: finalMessages.length,
					hasTools: !!finalTools && finalTools.length > 0,
					timestamp: Date.now()
				})
			}

			// 5. PROCESS CHUNKS
			for await (const event of completionStream) {
				if (event.type === 'content' && event.data) {
					const originalChunk = event.data
					let processedChunk = originalChunk
					let skipChunk = false

					// BEFORE CHUNK
					if (callbacks?.beforeChunk) {
						const beforeChunkResult = await callbacks.beforeChunk({
							chunk: originalChunk,
							index: chunkCount,
							accumulated,
							timestamp: Date.now()
						})

						if (beforeChunkResult.skip) {
							skipChunk = true
						} else {
							processedChunk = beforeChunkResult.chunk || originalChunk
						}
					}

					if (skipChunk) continue

					accumulated += processedChunk
					chunkCount++
					yield processedChunk

					// AFTER CHUNK
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

				if (event.type === 'tool_calls' && event.data && callbacks?.onToolCall) {
					await callbacks.onToolCall({
						toolCalls: event.data,
						messages: finalMessages,
						provider: this.name
					})
				}

				if (event.type === 'error' && event.data) {
					if (callbacks?.onError) {
						await callbacks.onError({
							error: event.data,
							recoverable: false,
							attemptNumber: 0,
							provider: this.name
						})
					}
					throw event.data
				}
			}

			// 6. STREAM END
			if (callbacks?.onStreamEnd) {
				await callbacks.onStreamEnd({
					provider: this.name,
					model: this.providerOptions!.model,
					totalChunks: chunkCount,
					duration: Date.now() - startTime,
					timestamp: Date.now()
				})
			}
		} catch (error) {
			this.logger.error('Stream failed', { error })
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
	 * Helper to create stream with tools
	 */
	private createCompletionStreamWithTools(
		messages: Message[],
		config: StreamConfig,
		tools?: ToolDefinition[]
	): ICompletionsStream {
		const updatedConfig = {
			...config,
			providerOptions: { ...config.providerOptions, tools }
		}
		return this.createCompletionStream(messages, updatedConfig)
	}

	/**
	 * Initialize the provider with options
	 */
	initialize(options: GrokProviderOptions, resolveEmbedAsBinary?: ResolveEmbedAsBinary): void {
		if (!options.apiKey) {
			throw new Error('Grok API key is required')
		}

		if (!options.model) {
			throw new Error('Grok model is required')
		}

		this.providerOptions = options
		this.apiKey = options.apiKey
		this.resolveEmbedAsBinary = resolveEmbedAsBinary || null

		this.logger?.info?.('Grok provider initialized', {
			model: options.model,
			baseURL: options.baseURL
		})
	}

	/**
	 * Create completion stream for messages
	 * Implements abstract method from StreamingProviderBase
	 */
	protected createCompletionStream(messages: Message[], config: StreamConfig): ICompletionsStream {
		if (!this.apiKey || !this.providerOptions) {
			throw new Error('Provider not initialized. Call initialize() first.')
		}

		// Convert messages to Grok format with embed resolution
		const grokMessages = this.convertMessages(messages)

		// Prepare stream options
		const streamOptions = {
			signal: config.signal,
			model: this.providerOptions.model,
			temperature: this.providerOptions.temperature,
			apiKey: this.apiKey,
			baseURL: this.providerOptions.baseURL,
			providerOptions: config.providerOptions
		}

		// Extract tools from config if available
		const tools = config.providerOptions?.tools

		this.logger?.debug?.('Creating Grok completion stream', {
			messageCount: messages.length,
			model: streamOptions.model,
			hasTools: !!tools
		})

		return GrokCompletionsStream.from(grokMessages, streamOptions, tools)
	}

	/**
	 * Convert generic messages to Grok format
	 * Handles multi-modal content with image embeds
	 */
	private convertMessages(messages: Message[]): GrokMessage[] {
		return messages.map((msg) => {
			// Handle messages with embeds (images)
			if (msg.embeds && msg.embeds.length > 0 && this.resolveEmbedAsBinary) {
				const content: ContentItem[] = []

				// Add text if present
				if (msg.content.trim()) {
					content.push({
						type: 'text',
						text: msg.content
					})
				}

				// Convert embeds to image URLs
				// Note: This is synchronous conversion, actual resolution happens in stream
				for (const embed of msg.embeds) {
					// Placeholder - actual conversion needs async resolver
					// In real implementation, this would be done before streaming
					content.push({
						type: 'image_url',
						image_url: {
							url: `data:image;base64,${embed}` // Simplified
						}
					})
				}

				return {
					role: msg.role as any,
					content
				}
			}

			// Simple text message
			return toGrokMessage(msg)
		})
	}

	/**
	 * Validate provider options
	 */
	validateOptions(options: GrokProviderOptions): boolean {
		if (!options.apiKey) {
			return false
		}

		if (!options.model) {
			return false
		}

		return true
	}

	/**
	 * Get provider status
	 */
	getStatus(): { initialized: boolean; model?: string; baseURL?: string } {
		return {
			initialized: !!this.apiKey,
			model: this.providerOptions?.model,
			baseURL: this.providerOptions?.baseURL
		}
	}

	/**
	 * Dispose resources
	 */
	dispose(): void {
		this.apiKey = null
		this.providerOptions = null
		this.resolveEmbedAsBinary = null
		this.logger?.info?.('Grok provider disposed')
	}
}
