// @ts-expect-error - Type definitions resolved via workspace build pipeline
import { inject, injectable } from '@needle-di/core'
import type {
	MCPServerManager,
	ToolDiscoveryCache,
	ToolExecutionResult,
	ToolExecutor,
	ToolServerInfo
} from '@tars/mcp-hosting'
import { OllamaToolResponseParser } from '@tars/mcp-hosting'
import type { Logger, LoggerFactory } from '@tars/logger'
import type { Ollama } from 'ollama/browser'
import type { OllamaAdapterRuntimeConfig } from '@tars/contracts'
import {
	LoggerFactoryToken,
	MCPServerManagerToken,
	OllamaClientToken,
	OllamaRuntimeConfigToken,
	ToolExecutorToken
} from '@tars/contracts'
import type { Message, ProviderAdapter } from '../toolCallingCoordinator'

interface OllamaChunk {
	message?: {
		content?: string
		tool_calls?: Array<{
			function: {
				name: string
				arguments: Record<string, unknown>
			}
		}>
	}
	done?: boolean
}

/**
 * @deprecated Retained for type compatibility only. Passing this config to the
 * constructor will throw at runtime—register dependencies via DI instead.
 */
export interface OllamaAdapterConfig {
	mcpManager: MCPServerManager
	mcpExecutor: ToolExecutor
	ollamaClient: Ollama
	controller: AbortController
	model: string
}

@injectable()
export class OllamaProviderAdapter implements ProviderAdapter<OllamaChunk> {
	private readonly mcpManager: MCPServerManager
	private readonly mcpExecutor: ToolExecutor
	private readonly client: Ollama
	private readonly toolDiscoveryCache: ToolDiscoveryCache
	private runtimeConfig: OllamaAdapterRuntimeConfig
	private controller: AbortController
	private model: string
	private toolMapping: Map<string, ToolServerInfo> | null = null
	private cachedTools: Array<{
		type: 'function'
		function: { name: string; description?: string; parameters?: unknown }
	}> | null = null
	private readonly parser = new OllamaToolResponseParser()
	private readonly logger: Logger
	private readonly streamLogger: Logger

	constructor(
		@inject(MCPServerManagerToken) mcpManager: MCPServerManager,
		@inject(ToolExecutorToken) mcpExecutor: ToolExecutor,
		@inject(OllamaClientToken) ollamaClient: Ollama,
		@inject(OllamaRuntimeConfigToken) runtimeConfig: OllamaAdapterRuntimeConfig,
		@inject(LoggerFactoryToken) loggerFactory: LoggerFactory,
		config?: OllamaAdapterConfig
	) {
		if (config) {
			throw new Error(
				'OllamaAdapterConfig-based construction is no longer supported. Register dependencies via dependency injection.'
			)
		}

		this.mcpManager = mcpManager
		this.mcpExecutor = mcpExecutor
		this.client = ollamaClient
		this.runtimeConfig = resolveRuntimeConfig(runtimeConfig)
		this.controller = this.runtimeConfig.createAbortController()
		this.model = this.runtimeConfig.model
		this.toolDiscoveryCache = this.mcpManager.getToolDiscoveryCache()
		this.logger = loggerFactory.create('mcp:ollama-adapter')
		this.streamLogger = loggerFactory.createChild('mcp:ollama-adapter', 'stream')

		this.mcpManager.on('server-started', () => this.invalidateCache())
		this.mcpManager.on('server-stopped', () => this.invalidateCache())
		this.mcpManager.on('server-failed', () => this.invalidateCache())
	}

	async initialize(options?: { preloadTools?: boolean }): Promise<void> {
		this.logger.debug('initializing adapter')

		try {
			if (options?.preloadTools === false) {
				this.logger.debug('lazy initialization enabled; deferring tool preload')
				this.toolMapping = this.toolDiscoveryCache.getCachedMapping()
				this.cachedTools = null
				return
			}

			const tools = await this.buildTools()
			this.logger.debug('tools preloaded', { count: tools.length })
			this.logger.debug('initialization complete')
		} catch (error) {
			this.logger.error('adapter initialization failed', error)
			throw error
		}
	}

	private invalidateCache(): void {
		this.cachedTools = null
		this.toolMapping = null
	}

	setAbortController(controller: AbortController): void {
		this.controller = controller
		this.runtimeConfig = {
			...this.runtimeConfig,
			createAbortController: () => controller
		}
	}

	getAbortController(): AbortController {
		return this.controller
	}

	setModel(model: string): void {
		if (!model) {
			throw new Error('OllamaProviderAdapter requires a non-empty model identifier')
		}
		this.model = model
		this.runtimeConfig = {
			...this.runtimeConfig,
			model
		}
	}

	getModel(): string {
		return this.model
	}

	getParser(): OllamaToolResponseParser {
		return this.parser
	}

	findServer(toolName: string): ToolServerInfo | null {
		if (!this.toolMapping) {
			const cached = this.toolDiscoveryCache.getCachedMapping()
			if (cached) {
				this.toolMapping = cached
			} else {
				throw new Error('OllamaProviderAdapter tool mapping not initialized - call initialize() first')
			}
		}
		return this.toolMapping.get(toolName) ?? null
	}

	async *sendRequest(messages: Message[]): AsyncGenerator<OllamaChunk> {
		this.logger.debug('starting sendRequest', { messageCount: messages.length })

		if (!this.client) {
			throw new Error('Ollama client dependency not resolved')
		}

		if (!this.model) {
			throw new Error('Ollama model not configured')
		}

		const tools = await this.buildTools()
		const formattedMessages = await this.formatMessages(messages)

		this.logger.debug('messages formatted for ollama', { count: formattedMessages.length })
		this.logger.debug('available tools for ollama request', { count: tools.length })

		const requestParams = {
			model: this.model,
			messages: formattedMessages,
			stream: true,
			tools: tools.length > 0 ? tools : undefined
		}

		this.logger.debug('ollama request params prepared', {
			model: this.model,
			messageCount: formattedMessages.length,
			toolCount: tools.length,
			stream: true
		})

		try {
			// biome-ignore lint/suspicious/noExplicitAny: Chat API expects loosely typed params
			const response = (await this.client.chat(requestParams as any)) as unknown as AsyncIterable<OllamaChunk>

			let chunkCount = 0
			try {
				for await (const chunk of response) {
					chunkCount++
					this.streamLogger.debug('received chunk', {
						chunk: chunkCount,
						hasMessage: Boolean(chunk.message),
						done: chunk.done
					})
					if (this.controller.signal.aborted) {
						this.streamLogger.info('request aborted', { chunkCount })
						this.client.abort()
						break
					}

					this.streamLogger.debug('chunk summary', {
						hasMessage: Boolean(chunk.message),
						contentLength: chunk.message?.content?.length || 0,
						hasToolCalls: Boolean(chunk.message?.tool_calls?.length),
						toolCallCount: chunk.message?.tool_calls?.length || 0,
						done: chunk.done
					})

					if (!chunk.message?.content && !chunk.message?.tool_calls?.length) {
						this.streamLogger.debug('chunk without content or tool calls', { chunk: chunkCount, done: chunk.done })
					}

					yield chunk
				}
			} catch (streamError) {
				this.streamLogger.error('error during streaming', streamError)
				throw streamError
			}

			this.streamLogger.info('streaming completed', { chunkCount })
		} catch (connectionError) {
			this.logger.error('failed to connect to ollama', connectionError)
			throw new Error(
				`Ollama connection failed: ${connectionError instanceof Error ? connectionError.message : String(connectionError)}`
			)
		}
	}

	formatToolResult(_toolCallId: string, result: ToolExecutionResult): Message {
		return {
			role: 'tool',
			tool_call_id: _toolCallId,
			content: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
		}
	}

	private async buildTools(): Promise<
		Array<{ type: 'function'; function: { name: string; description?: string; parameters?: unknown } }>
	> {
		if (this.cachedTools) {
			this.logger.debug('using cached tools', { count: this.cachedTools.length })
			return this.cachedTools
		}

		this.logger.debug('building tools from discovery cache')
		const snapshot = await this.toolDiscoveryCache.getSnapshot()
		this.toolMapping = snapshot.mapping

		const tools = snapshot.servers.flatMap((server) =>
			server.tools.map((tool) => ({
				type: 'function' as const,
				function: {
					name: tool.name,
					description: tool.description,
					parameters: tool.inputSchema as unknown
				}
			}))
		)

		this.logger.debug('discovery cache tools built', {
			toolCount: tools.length,
			serverCount: snapshot.servers.length
		})
		this.cachedTools = tools
		return tools
	}

	private async formatMessages(messages: Message[]): Promise<Array<Record<string, unknown>>> {
		return messages.map((msg) => {
			if (msg.tool_calls && msg.tool_calls.length > 0) {
				return {
					role: 'assistant',
					content: msg.content ?? '',
					tool_calls: msg.tool_calls.map((toolCall) => ({
						id: toolCall.id,
						type: 'function',
						function: {
							name: toolCall.name,
							arguments: toolCall.arguments
						}
					}))
				}
			}

			if (msg.role === 'tool') {
				return {
					role: 'tool',
					tool_call_id: msg.tool_call_id,
					content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
				}
			}

			return {
				role: msg.role,
				content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
			}
		})
	}
}

function resolveRuntimeConfig(runtimeConfig?: OllamaAdapterRuntimeConfig): OllamaAdapterRuntimeConfig {
	if (!runtimeConfig) {
		throw new Error('OllamaProviderAdapter requires runtime configuration provided through dependency injection')
	}

	const { model, createAbortController } = runtimeConfig

	if (!model) {
		throw new Error('OllamaProviderAdapter requires a model configuration')
	}

	return {
		model,
		createAbortController: createAbortController ?? (() => new AbortController())
	}
}
