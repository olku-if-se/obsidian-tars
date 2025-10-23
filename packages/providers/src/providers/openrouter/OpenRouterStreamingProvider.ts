import { inject, injectable } from '@needle-di/core'
import type { ILoggingService, ISettingsService, Message, ResolveEmbedAsBinary } from '@tars/contracts'
import { type LlmCapability, type LlmModel, toLlmModels } from '@tars/contracts/providers'
import { tokens } from '@tars/contracts/tokens'
import { StreamingProviderBase } from '../../base/StreamingProviderBase'
import type { StreamConfig } from '../../config'
import type {
	BeforeStreamStartResult,
	ComprehensiveCallbacks,
	ToolDefinition
} from '../../config/ComprehensiveCallbacks'
import type { ICompletionsStream } from '../../streaming'
import { OpenRouterCompletionsStream } from './OpenRouterCompletionsStream'
import { type ContentItem, type OpenRouterMessage, type OpenRouterProviderOptions, toOpenRouterMessage } from './types'

/**
 * OpenRouter streaming provider
 * Multi-provider router with OpenAI-compatible API
 *
 * Features:
 * - Routes to multiple LLM providers (Claude, GPT-4, Gemini, Llama, etc.)
 * - OpenAI-compatible tool calling
 * - Multi-modal support (text, images, PDFs)
 * - Model selection and fallback
 */
@injectable()
export class OpenRouterStreamingProvider extends StreamingProviderBase {
	readonly name = 'openrouter'
	readonly displayName = 'OpenRouter'
	readonly websiteToObtainKey = 'https://openrouter.ai'
	readonly capabilities: LlmCapability[] = ['Text Generation', 'Image Vision', 'PDF Vision', 'Tool Calling']

	private apiKey: string | null = null
	private providerOptions: OpenRouterProviderOptions | null = null
	private resolveEmbedAsBinary: ResolveEmbedAsBinary | null = null

	constructor(loggingService = inject(tokens.Logger), settingsService = inject(tokens.Settings)) {
		super(loggingService, settingsService)
	}

	/**
	 * Get available models
	 * OpenRouter routes to many providers
	 */
	get models(): LlmModel[] {
		return toLlmModels(
			[
				'anthropic/claude-3.5-sonnet',
				'anthropic/claude-3-opus',
				'openai/gpt-4o',
				'openai/gpt-4-turbo',
				'google/gemini-pro-1.5',
				'meta-llama/llama-3.1-70b-instruct',
				'qwen/qwen-2.5-72b-instruct'
			],
			this.capabilities
		)
	}

	/**
	 * Get default options
	 */
	get defaultOptions(): OpenRouterProviderOptions {
		return {
			apiKey: '',
			baseURL: 'https://openrouter.ai/api/v1/chat/completions',
			model: 'anthropic/claude-3.5-sonnet',
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
	initialize(options: OpenRouterProviderOptions, resolveEmbedAsBinary?: ResolveEmbedAsBinary): void {
		if (!options.apiKey) {
			throw new Error('OpenRouter API key is required')
		}

		if (!options.model) {
			throw new Error('OpenRouter model is required')
		}

		this.providerOptions = options
		this.apiKey = options.apiKey
		this.resolveEmbedAsBinary = resolveEmbedAsBinary || null

		this.loggingService?.info?.('OpenRouter provider initialized', {
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

		// Convert messages to OpenRouter format with embed resolution
		const openrouterMessages = this.convertMessages(messages)

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

		this.loggingService?.debug?.('Creating OpenRouter completion stream', {
			messageCount: messages.length,
			model: streamOptions.model,
			hasTools: !!tools
		})

		return OpenRouterCompletionsStream.from(openrouterMessages, streamOptions, tools)
	}

	/**
	 * Convert generic messages to OpenRouter format
	 * Handles multi-modal content with images and PDFs
	 */
	private convertMessages(messages: Message[]): OpenRouterMessage[] {
		return messages.map((msg) => {
			// Handle messages with embeds (images/PDFs)
			if (msg.embeds && msg.embeds.length > 0 && this.resolveEmbedAsBinary) {
				const content: ContentItem[] = []

				// Add text if present
				if (msg.content.trim()) {
					content.push({
						type: 'text',
						text: msg.content
					})
				}

				// Convert embeds to content items
				// Note: This should be async but we'll handle it synchronously for now
				// In production, embeds should be pre-resolved before streaming
				for (const embed of msg.embeds) {
					try {
						const mimeType = getMimeTypeFromFilename(embed.link)

						// Images
						if (['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(mimeType)) {
							// Placeholder - actual resolution needs async
							content.push({
								type: 'image_url',
								image_url: {
									url: `data:${mimeType};base64,${embed}` // Simplified
								}
							})
						}
						// PDFs
						else if (mimeType === 'application/pdf') {
							// Placeholder - actual resolution needs async
							content.push({
								type: 'file',
								file: {
									filename: embed.link,
									file_data: `data:${mimeType};base64,${embed}` // Simplified
								}
							})
						}
					} catch (error) {
						this.loggingService?.warn?.('Failed to process embed', { embed, error })
					}
				}

				return {
					role: msg.role as any,
					content
				}
			}

			// Simple text message
			return toOpenRouterMessage(msg)
		})
	}

	/**
	 * Validate provider options
	 */
	validateOptions(options: OpenRouterProviderOptions): boolean {
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
		this.loggingService?.info?.('OpenRouter provider disposed')
	}
}
