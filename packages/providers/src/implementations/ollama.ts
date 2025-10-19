import { createLogger } from '@tars/logger'
import { Ollama } from 'ollama'
import type { BaseOptions, Message, ResolveEmbedAsBinary, SendRequest, Vendor } from '../interfaces'
import { createMCPIntegrationHelper } from '../mcp-integration-helper'

const logger = createLogger('providers:ollama')

const sendRequestFunc = (settings: BaseOptions): SendRequest =>
	async function* (messages: Message[], controller: AbortController, _resolveEmbedAsBinary: ResolveEmbedAsBinary) {
		const {
			parameters,
			documentPath,
			statusBarManager,
			editor,
			pluginSettings,
			documentWriteLock,
			beforeToolExecution,
			...optionsExcludingParams
		} = settings
		const options = { ...optionsExcludingParams, ...parameters }
		const { baseURL, model, ...remains } = options

		// Create MCP integration helper
		const mcpHelper = createMCPIntegrationHelper(settings)

		// Tool-aware path: Use coordinator for autonomous tool calling
		if (mcpHelper?.hasToolCalling()) {
			try {
				const client = new Ollama({ host: baseURL })

				yield* mcpHelper.generateWithTools({
					documentPath: documentPath || 'unknown.md',
					providerName: 'Ollama',
					messages,
					controller,
					client,
					statusBarManager,
					editor,
					pluginSettings,
					documentWriteLock,
					beforeToolExecution
				})

				return
			} catch (error) {
				logger.warn('Tool calling failed, falling back to streaming pipeline', error)
				// Fall through to original path
			}
		}

		// Original streaming path with tool injection
		let requestParams: Record<string, unknown> = { model, ...remains }

		logger.info('starting ollama chat', { baseURL, model, messageCount: messages.length })
		logger.debug('initial request params', { ...requestParams, messages: `${messages.length} messages` })

		if (mcpHelper) {
			requestParams = await mcpHelper.injectTools(requestParams, 'Ollama')
			logger.debug('mcp tools injected successfully')
		}

		const ollama = new Ollama({ host: baseURL })

		try {
			logger.debug('initiating streaming chat request')
			const response = (await ollama.chat({ ...requestParams, messages, stream: true } as Parameters<
				typeof ollama.chat
			>[0])) as unknown as AsyncIterable<{ message: { content: string } }>

			let responseChunkCount = 0
			try {
				for await (const part of response) {
					responseChunkCount++
					if (controller.signal.aborted) {
						logger.info('request aborted', { chunkCount: responseChunkCount })
						ollama.abort()
						break
					}

					const content = part.message?.content || ''
					logger.debug('received chunk', {
						chunk: responseChunkCount,
						contentLength: content.length,
						preview: content.substring(0, 100)
					})

					if (content) {
						yield content
					} else {
						logger.warn('empty content received from stream', { chunk: responseChunkCount })
					}
				}
			} catch (streamError) {
				logger.error('error during ollama stream', streamError)
				throw streamError
			}

			logger.info('stream completed', { chunkCount: responseChunkCount })
		} catch (connectionError) {
			logger.error('failed to connect to ollama', connectionError)
			throw new Error(
				`Ollama connection failed: ${connectionError instanceof Error ? connectionError.message : String(connectionError)}`
			)
		}
	}

export const ollamaVendor: Vendor = {
	name: 'Ollama',
	defaultOptions: {
		apiKey: '',
		baseURL: 'http://127.0.0.1:11434',
		model: 'llama3.1',
		parameters: {}
	},
	sendRequestFunc,
	models: [
		'llama2',
		'llama3',
		'llama3.1',
		'llama3.2',
		'llama3.3',
		'codellama',
		'mistral',
		'mixtral',
		'qwen',
		'gemma'
	],
	websiteToObtainKey: 'https://ollama.com',
	capabilities: ['Text Generation', 'Tool Calling']
}
