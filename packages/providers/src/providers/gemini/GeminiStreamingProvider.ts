import { GoogleGenAI } from '@google/genai'
import { inject, injectable } from '@needle-di/core'
import type { ILoggingService, ISettingsService, Message } from '@tars/contracts'
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
import { GeminiCompletionsStream } from './GeminiCompletionsStream'

export interface GeminiProviderOptions {
	apiKey: string
	model: string
	temperature?: number
	maxOutputTokens?: number
}

/**
 * Google Gemini Streaming Provider - Comprehensive Callbacks
 *
 * Uses official @google/genai SDK v1.26.0+
 *
 * Google's advanced AI models with multimodal capabilities
 *
 * Features:
 * - ✅ Gemini 2.5 Pro (thinking model)
 * - ✅ Gemini 2.5 Flash (best price-performance)
 * - ✅ Gemini 2.5 Flash-Lite (fastest, cheapest)
 * - ✅ Long context (up to 2M tokens)
 * - ✅ Multimodal (text, images, video, audio)
 * - ✅ Tool calling
 * - ✅ Comprehensive callbacks
 */
@injectable()
export class GeminiStreamingProvider extends StreamingProviderBase {
	readonly name = 'gemini'
	readonly displayName = 'Google Gemini'
	readonly websiteToObtainKey = 'https://makersuite.google.com/app/apikey'
	readonly capabilities: LlmCapability[] = ['Text Generation', 'Image Vision', 'Tool Calling', 'Reasoning']

	private client: GoogleGenAI | null = null
	private providerOptions: GeminiProviderOptions | null = null

	constructor(loggingService = inject(tokens.Logger), settingsService = inject(tokens.Settings)) {
		super(loggingService, settingsService)
	}

	/**
	 * Get available models (as of Oct 2025)
	 * Pricing (per MTok): Flash-Lite $0.0375-$0.15, Flash $0.15-$0.60, Pro $1.25-$5
	 */
	get models(): LlmModel[] {
		return toLlmModels(
			[
				// Gemini 2.5 series (Latest - Oct 2025)
				'gemini-2.5-flash-lite', // CHEAPEST: $0.0375 in / $0.15 out
				'gemini-2.5-flash', // Best price-performance: $0.15 in / $0.60 out
				'gemini-2.5-pro', // Thinking model: $1.25 in / $5 out

				// Gemini 2.0 series (Previous generation)
				'gemini-2.0-flash', // Fast: $0.10 in / $0.40 out
				'gemini-2.0-flash-lite', // Fast and cheap

				// Gemini 1.5 series (Legacy)
				'gemini-1.5-flash', // Legacy fast
				'gemini-1.5-pro', // Legacy pro
				'gemini-1.0-pro' // Legacy
			],
			this.capabilities
		)
	}

	/**
	 * Get default options
	 * Using Flash-Lite 2.5 - cheapest and fastest model
	 */
	get defaultOptions(): GeminiProviderOptions {
		return {
			apiKey: '',
			model: 'gemini-2.5-flash-lite', // Cheapest and fastest
			temperature: 0.7,
			maxOutputTokens: 4096
		}
	}

	/**
	 * Initialize the provider with options
	 */
	initialize(options: GeminiProviderOptions): void {
		if (!options.apiKey) {
			throw new Error('Gemini API key is required')
		}

		this.providerOptions = options
		this.client = new GoogleGenAI({ apiKey: options.apiKey })

		this.loggingService.info('Gemini provider initialized', {
			model: options.model
		})
	}

	/**
	 * Stream with comprehensive callbacks (Gold Standard)
	 * Follows OpenAI/Claude reference implementation
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
					model: this.providerOptions?.model || 'unknown',
					messages
				})
				tools = toolsResult.tools
				this.loggingService.debug('Received tools from consumer', { count: tools?.length || 0 })
			}

			// 2. BEFORE STREAM START
			let finalMessages = messages
			let finalTools = tools
			let finalOptions = config.providerOptions

			if (callbacks?.beforeStreamStart) {
				const beforeResult: BeforeStreamStartResult = await callbacks.beforeStreamStart({
					messages,
					provider: this.name,
					model: this.providerOptions?.model || 'unknown',
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
					model: this.providerOptions?.model || 'unknown',
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
					model: this.providerOptions?.model || 'unknown',
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

	/**
	 * Helper to create stream with tools
	 */
	private createCompletionStreamWithTools(
		messages: Message[],
		config: StreamConfig,
		tools?: ToolDefinition[]
	): ICompletionsStream {
		if (!this.client) {
			throw new Error('Gemini provider not initialized')
		}

		if (!this.providerOptions) {
			throw new Error('Gemini provider options not set')
		}

		return GeminiCompletionsStream.from(
			messages,
			{
				model: this.providerOptions.model,
				temperature: this.providerOptions.temperature,
				maxOutputTokens: this.providerOptions.maxOutputTokens || 4096,
				providerOptions: config.providerOptions
			},
			this.client,
			tools
		)
	}

	protected createCompletionStream(messages: Message[], config: StreamConfig): ICompletionsStream {
		return this.createCompletionStreamWithTools(messages, config)
	}
}
