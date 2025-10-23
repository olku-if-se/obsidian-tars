import Anthropic from '@anthropic-ai/sdk'
import { inject, injectable } from '@needle-di/core'
import type { Message } from '@tars/contracts'
import { type LlmCapability, type LlmModel, toLlmModels } from '@tars/contracts/providers'
import { tokens } from '@tars/contracts/tokens'
import type { BeforeStreamStartResult, ComprehensiveCallbacks, ToolDefinition } from 'src/base/ComprehensiveCallbacks'
import type { StreamConfig } from 'src/base/StreamConfig'
import { StreamingProviderBase } from 'src/base/StreamingProviderBase'
import type { ICompletionsStream } from 'src/streaming'
import { ClaudeCompletionsStream } from './ClaudeCompletionsStream'

export interface ClaudeProviderOptions {
	apiKey: string
	baseURL?: string
	model: string
	temperature?: number
	maxTokens?: number
}

/**
 * Claude (Anthropic) Streaming Provider - Comprehensive Callbacks
 *
 * Anthropic's Claude models with native API format
 *
 * Features:
 * - ✅ Claude 3.5 Sonnet, Opus, Haiku
 * - ✅ Long context (200K tokens)
 * - ✅ Computer use capability
 * - ✅ Vision support
 * - ✅ Comprehensive callbacks
 */
@injectable()
export class ClaudeStreamingProvider extends StreamingProviderBase {
	readonly name = 'claude'
	readonly displayName = 'Claude'
	readonly websiteToObtainKey = 'https://console.anthropic.com'
	readonly capabilities: LlmCapability[] = ['Text Generation', 'Image Vision', 'Tool Calling', 'Reasoning']

	private client: Anthropic | null = null
	private providerOptions: ClaudeProviderOptions | null = null

	constructor(loggingService = inject(tokens.Logger), settingsService = inject(tokens.Settings)) {
		super(loggingService, settingsService)
	}

	/**
	 * Get available models (as of Oct 2025)
	 * Pricing (per MTok): Haiku $1-$5, Sonnet $3-$15, Opus $15-$75
	 */
	get models(): LlmModel[] {
		return toLlmModels(
			[
				// Claude 4.5 series (Latest - Oct 2025)
				'claude-haiku-4-5', // CHEAPEST: $1 in / $5 out (fast, near-frontier)
				'claude-sonnet-4-5', // Best coding model: $3 in / $15 out

				// Claude 4 series
				'claude-sonnet-4', // Previous frontier
				'claude-opus-4-1', // High capability

				// Claude 3.5 series (Legacy)
				'claude-3-5-haiku-20241022', // $0.25 in / $1.25 out
				'claude-3-5-sonnet-20241022', // $3 in / $15 out
				'claude-3-5-sonnet-20240620', // Previous version

				// Claude 3 series (Legacy)
				'claude-3-haiku-20240307', // $0.25 in / $1.25 out
				'claude-3-sonnet-20240229', // $3 in / $15 out
				'claude-3-opus-20240229' // $15 in / $75 out
			],
			this.capabilities
		)
	}

	/**
	 * Get default options
	 * Using Claude 3.5 Haiku - cheapest model at $0.25/$1.25 per MTok
	 * (4.5 Haiku is faster but 4x more expensive at $1/$5 per MTok)
	 */
	get defaultOptions(): ClaudeProviderOptions {
		return {
			apiKey: '',
			baseURL: 'https://api.anthropic.com',
			model: 'claude-3-5-haiku-20241022', // Cheapest model - 4x cheaper than 4.5 Haiku
			temperature: 0.7,
			maxTokens: 4096
		}
	}

	/**
	 * Initialize the provider with options
	 */
	initialize(options: ClaudeProviderOptions): void {
		if (!options.apiKey) {
			throw new Error('Claude API key is required')
		}

		this.providerOptions = options
		this.client = new Anthropic({
			apiKey: options.apiKey,
			baseURL: options.baseURL
		})

		this.logger.info('Claude provider initialized', {
			model: options.model,
			baseURL: options.baseURL
		})
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
					model: this.providerOptions?.model || 'unknown',
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
					model: this.providerOptions?.model || 'unknown',
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
		if (!this.client) {
			throw new Error('Claude provider not initialized')
		}

		return ClaudeCompletionsStream.from(
			messages,
			{
				model: this.providerOptions?.model,
				temperature: this.providerOptions?.temperature,
				maxTokens: this.providerOptions?.maxTokens || 4096,
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
