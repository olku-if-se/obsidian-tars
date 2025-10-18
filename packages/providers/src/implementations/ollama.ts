import { createLogger } from '@tars/logger'
import { Ollama } from 'ollama'
import type { BaseOptions, Message, ResolveEmbedAsBinary, SendRequest, Vendor } from '../interfaces'

const logger = createLogger('providers:ollama')

const sendRequestFunc = (settings: BaseOptions): SendRequest =>
	async function* (messages: Message[], controller: AbortController, _resolveEmbedAsBinary: ResolveEmbedAsBinary) {
		const {
			parameters,
			mcpToolInjector,
			mcpIntegration,
			mcpExecutor,
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

		// Tool-aware path: Use coordinator for autonomous tool calling
		if (mcpIntegration?.toolCallingCoordinator && mcpIntegration?.providerAdapter) {
			try {
				// biome-ignore lint/suspicious/noExplicitAny: MCP types are optional dependencies
				const coordinator = mcpIntegration.toolCallingCoordinator as any
				// biome-ignore lint/suspicious/noExplicitAny: MCP types are optional dependencies
				const adapter = mcpIntegration.providerAdapter as any
				// biome-ignore lint/suspicious/noExplicitAny: MCP types are optional dependencies
				const pluginOpts = pluginSettings as any
				// biome-ignore lint/suspicious/noExplicitAny: MCP types are optional dependencies
				const mcpExec = mcpExecutor as any

				const _ollama = new Ollama({ host: baseURL })

				// Initialize adapter if needed
				if (adapter.initialize) {
					await adapter.initialize({ preloadTools: false })
				}

				// Convert messages to coordinator format
				const formattedMessages = messages.map((msg) => ({
					role: msg.role,
					content: msg.content,
					embeds: msg.embeds
				}))

				yield* coordinator.generateWithTools(formattedMessages, adapter, mcpExec, {
					documentPath: documentPath || 'unknown.md',
					statusBarManager,
					editor,
					autoUseDocumentCache: true,
					parallelExecution: pluginOpts?.mcpParallelExecution ?? false,
					maxParallelTools: pluginOpts?.mcpMaxParallelTools ?? 3,
					documentWriteLock,
					onBeforeToolExecution: beforeToolExecution
				})

				return
			} catch (error) {
				logger.warn('tool-aware path unavailable, falling back to streaming pipeline', error)
				// Fall through to original path
			}
		}

		// Original streaming path (backward compatible)
		let requestParams: Record<string, unknown> = { model, ...remains }

		logger.info('starting ollama chat', { baseURL, model, messageCount: messages.length })
		logger.debug('initial request params', { ...requestParams, messages: `${messages.length} messages` })

		if (mcpToolInjector) {
			try {
				requestParams = await mcpToolInjector.injectTools(requestParams, 'Ollama')
				logger.debug('mcp tools injected successfully')
			} catch (error) {
				logger.warn('failed to inject MCP tools for ollama', error)
			}
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
	models: [],
	websiteToObtainKey: 'https://ollama.com',
	capabilities: ['Text Generation', 'Tool Calling']
}
