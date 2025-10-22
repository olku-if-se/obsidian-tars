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

export interface AzureProviderOptions {
	apiKey: string
	baseURL: string
	deployment: string  // Azure deployment name
	apiVersion?: string
	temperature?: number
}

/**
 * Azure OpenAI Streaming Provider
 * 
 * Microsoft's managed OpenAI service
 * 
 * Features:
 * - ✅ Enterprise-grade security
 * - ✅ OpenAI-compatible API
 * - ✅ Regional deployment
 * - ✅ Private network support
 * - ✅ Comprehensive callbacks
 */
@injectable()
export class AzureStreamingProvider extends StreamingProviderBase {
	readonly name = 'azure'
	readonly displayName = 'Azure OpenAI'
	readonly websiteToObtainKey = 'https://portal.azure.com'
	readonly capabilities: LlmCapability[] = [
		'Text Generation',
		'Image Vision',
		'Image Generation',
		'Tool Calling',
		'Reasoning'
	]

	private client: OpenAI | null = null
	private providerOptions: AzureProviderOptions | null = null

	constructor(
		loggingService = inject(tokens.Logger),
		settingsService = inject(tokens.Settings)
	) {
		super(loggingService, settingsService)
	}

	/**
	 * Get available models (deployment names)
	 */
	get models(): LlmModel[] {
		return toLlmModels(
			[
				// Common Azure deployments
				'gpt-4o',
				'gpt-4o-mini',
				'gpt-4-turbo',
				'gpt-4',
				'gpt-35-turbo'
			],
			this.capabilities
		)
	}

	/**
	 * Get default options
	 */
	get defaultOptions(): AzureProviderOptions {
		return {
			apiKey: '',
			baseURL: '',
			deployment: 'gpt-4o',
			apiVersion: '2024-08-01-preview',
			temperature: 0.7
		}
	}

	/**
	 * Initialize the provider with options
	 */
	initialize(options: AzureProviderOptions): void {
		if (!options.apiKey) {
			throw new Error('Azure API key is required')
		}

		if (!options.baseURL) {
			throw new Error('Azure baseURL is required')
		}

		if (!options.deployment) {
			throw new Error('Azure deployment name is required')
		}

		this.providerOptions = options
		
		// Azure OpenAI uses a different URL structure
		// Format: https://{resource}.openai.azure.com/openai/deployments/{deployment}
		const azureEndpoint = `${options.baseURL}/openai/deployments/${options.deployment}`
		
		this.client = new OpenAI({
			apiKey: options.apiKey,
			baseURL: azureEndpoint,
			defaultQuery: { 'api-version': options.apiVersion || '2024-08-01-preview' },
			defaultHeaders: { 'api-key': options.apiKey }
		})

		this.loggingService.info('Azure OpenAI provider initialized', {
			deployment: options.deployment,
			baseURL: options.baseURL,
			apiVersion: options.apiVersion
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
					model: this.providerOptions?.deployment || 'unknown',
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
					model: this.providerOptions?.deployment || 'unknown',
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
					model: this.providerOptions?.deployment || 'unknown',
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
					model: this.providerOptions?.deployment || 'unknown',
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
			throw new Error('Azure OpenAI provider not initialized')
		}

		const openAIMessages = messages.map(toOpenAIMessage)
		
		return OpenAICompletionsStream.from(
			openAIMessages,
			{
				model: this.providerOptions!.deployment,
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
