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
import { DeepseekCompletionsStream } from './DeepseekCompletionsStream'
import { type DeepseekProviderOptions, toDeepseekMessage } from './types'

/**
 * Deepseek streaming provider
 * OpenAI-compatible with reasoning support
 *
 * Features:
 * - Reasoning mode with callout formatting
 * - OpenAI-compatible tool calling
 * - Advanced models (deepseek-chat, deepseek-reasoner)
 */
@injectable()
export class DeepseekStreamingProvider extends StreamingProviderBase {
	readonly name = 'deepseek'
	readonly displayName = 'DeepSeek'
	readonly websiteToObtainKey = 'https://platform.deepseek.com'
	readonly capabilities: LlmCapability[] = ['Text Generation', 'Tool Calling', 'Reasoning']

	private client: OpenAI | null = null
	private providerOptions: DeepseekProviderOptions | null = null

	constructor(loggingService = inject(tokens.Logger), settingsService = inject(tokens.Settings)) {
		super(loggingService, settingsService)
	}

	/**
	 * Get available models
	 */
	get models(): LlmModel[] {
		return toLlmModels(['deepseek-chat', 'deepseek-reasoner'], this.capabilities)
	}

	/**
	 * Get default options
	 */
	get defaultOptions(): DeepseekProviderOptions {
		return {
			apiKey: '',
			baseURL: 'https://api.deepseek.com',
			model: 'deepseek-chat',
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
			let tools: ToolDefinition[] | undefined
			if (callbacks?.onToolsRequest) {
				const toolsResult = await callbacks.onToolsRequest({
					provider: this.name,
					model: this.providerOptions!.model,
					messages
				})
				tools = toolsResult.tools
				this.loggingService.debug('Received tools from consumer', { count: tools?.length || 0 })
			}

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
					this.loggingService.warn('Stream cancelled', { reason: beforeResult.cancelReason })
					return
				}

				finalMessages = beforeResult.messages || messages
				finalTools = beforeResult.tools !== undefined ? beforeResult.tools : tools
				finalOptions = beforeResult.providerOptions || config.providerOptions
			}

			const completionStream = this.createCompletionStreamWithTools(
				finalMessages,
				{ ...config, providerOptions: finalOptions },
				finalTools
			)

			if (callbacks?.onStreamStart) {
				await callbacks.onStreamStart({
					provider: this.name,
					model: this.providerOptions!.model,
					messageCount: finalMessages.length,
					hasTools: !!finalTools && finalTools.length > 0,
					timestamp: Date.now()
				})
			}

			for await (const event of completionStream) {
				if (event.type === 'content' && event.data) {
					const originalChunk = event.data
					let processedChunk = originalChunk
					let skipChunk = false

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
			this.loggingService.error('Stream failed', { error })
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
	initialize(options: DeepseekProviderOptions): void {
		if (!options.apiKey) {
			throw new Error('Deepseek API key is required')
		}

		this.providerOptions = options
		this.client = new OpenAI({
			apiKey: options.apiKey,
			baseURL: options.baseURL,
			dangerouslyAllowBrowser: true
		})

		this.loggingService?.info?.('Deepseek provider initialized', {
			model: options.model,
			baseURL: options.baseURL
		})
	}

	/**
	 * Create completion stream for messages
	 * Implements abstract method from StreamingProviderBase
	 */
	protected createCompletionStream(messages: Message[], config: StreamConfig): ICompletionsStream {
		if (!this.client || !this.providerOptions) {
			throw new Error('Provider not initialized. Call initialize() first.')
		}

		// Convert messages to Deepseek format
		const deepseekMessages = messages.map(toDeepseekMessage)

		// Prepare stream options
		const streamOptions = {
			signal: config.signal,
			model: this.providerOptions.model,
			temperature: this.providerOptions.temperature,
			providerOptions: config.providerOptions
		}

		// Extract tools from config if available
		const tools = config.providerOptions?.tools

		this.loggingService?.debug?.('Creating Deepseek completion stream', {
			messageCount: messages.length,
			model: streamOptions.model,
			hasTools: !!tools
		})

		return DeepseekCompletionsStream.from(deepseekMessages, streamOptions, this.client, tools)
	}

	/**
	 * Validate provider options
	 */
	validateOptions(options: DeepseekProviderOptions): boolean {
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
		this.loggingService?.info?.('Deepseek provider disposed')
	}
}
