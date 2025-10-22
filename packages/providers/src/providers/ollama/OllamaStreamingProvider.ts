import { injectable, inject } from '@needle-di/core'
import { tokens } from '@tars/contracts/tokens'
import type { Message, ILoggingService, ISettingsService } from '@tars/contracts'
import { type LlmCapability, type LlmModel, toLlmModels } from '@tars/contracts/providers'
import OpenAI from 'openai'
import { StreamingProviderBase } from '../../base/StreamingProviderBase'
import type { StreamConfig } from '../../config'
import type { ComprehensiveCallbacks, BeforeStreamStartResult, ToolDefinition } from '../../config/ComprehensiveCallbacks'
import type { ICompletionsStream } from '../../streaming'
import { OpenAICompletionsStream } from '../openai/OpenAICompletionsStream'
import { toOpenAIMessage } from '../openai/types'

export interface OllamaProviderOptions {
	apiKey?: string
	baseURL: string
	model: string
	temperature?: number
}

/**
 * Ollama Streaming Provider - OpenAI-Compatible
 * 
 * Supports both local Ollama and Ollama Cloud
 * 
 * Features:
 * - ✅ OpenAI-compatible API
 * - ✅ Local model hosting OR cloud-hosted
 * - ✅ Privacy-focused (local mode)
 * - ✅ Multiple open-source models
 * - ✅ Comprehensive callbacks
 * 
 * Usage:
 * - Local: baseURL: 'http://localhost:11434/v1' (no API key needed)
 * - Cloud: baseURL: 'https://ollama.com/api/v1' (requires API key)
 * 
 * Note: Ollama Cloud uses OpenAI-compatible v1 endpoint
 * Their native /api/chat endpoint is different - we use v1 for compatibility
 */
@injectable()
export class OllamaStreamingProvider extends StreamingProviderBase {
	readonly name = 'ollama'
	readonly displayName = 'Ollama'
	readonly websiteToObtainKey = 'https://ollama.ai'
	readonly capabilities: LlmCapability[] = [
		'Text Generation',
		'Tool Calling'
	]

	private client: OpenAI | null = null
	private providerOptions: OllamaProviderOptions | null = null

	constructor(
		loggingService = inject(tokens.Logger),
		settingsService = inject(tokens.Settings)
	) {
		super(loggingService, settingsService)
	}

	/**
	 * Get available models
	 * Local models use standard names (llama3.2:latest)
	 * Cloud models use special -cloud suffix format
	 */
	get models(): LlmModel[] {
		return toLlmModels(
			[
				// Ollama Cloud models (require API key)
				'gpt-oss:20b-cloud',          // Smallest cloud model
				'gpt-oss:120b-cloud',         // Larger cloud model
				'glm-4.6:cloud',              // GLM model
				'deepseek-v3.1:671b-cloud',   // DeepSeek massive model
				'kimi-k2:1t-cloud',           // Kimi 1 trillion params
				'qwen3-coder:480b-cloud',     // Qwen coder model
				
				// Local Ollama models (no API key needed)
				'llama3.2:latest',
				'llama3.2:3b',
				'llama3.1:latest',
				'qwen2.5:latest',
				'mistral:latest',
				'codellama:latest',
				'deepseek-coder:latest',
				'phi3:latest'
			],
			this.capabilities
		)
	}

	/**
	 * Get default options
	 */
	get defaultOptions(): OllamaProviderOptions {
		return {
			baseURL: 'http://localhost:11434/v1',
			model: 'llama3.2:latest',
			temperature: 0.7
		}
	}

	/**
	 * Initialize the provider with options
	 */
	initialize(options: OllamaProviderOptions): void {
		if (!options.model) {
			throw new Error('Ollama model is required')
		}

		this.providerOptions = options
		this.client = new OpenAI({
			apiKey: options.apiKey || 'ollama', // Ollama doesn't require API key
			baseURL: options.baseURL
		})

		this.loggingService.info('Ollama provider initialized', {
			model: options.model,
			baseURL: options.baseURL
		})
	}

	/**
	 * Stream with comprehensive callbacks (Gold Standard)
	 * Follows OpenAI reference implementation
	 */
	async *stream(
		messages: Message[],
		config: StreamConfig = {}
	): AsyncGenerator<string, void, unknown> {
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
			const completionStream = this.createCompletionStreamWithTools(finalMessages, { ...config, providerOptions: finalOptions }, finalTools)

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
	private createCompletionStreamWithTools(messages: Message[], config: StreamConfig, tools?: ToolDefinition[]): ICompletionsStream {
		if (!this.client) {
			throw new Error('Ollama provider not initialized')
		}

		const openAIMessages = messages.map(toOpenAIMessage)
		
		return OpenAICompletionsStream.from(
			openAIMessages,
			{
				model: this.providerOptions!.model,
				temperature: this.providerOptions?.temperature,
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
