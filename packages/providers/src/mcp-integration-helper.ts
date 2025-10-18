import { createLogger } from '@tars/logger'
import type { BaseOptions, MCPIntegration, MCPToolInjector, Message, SendRequest } from './interfaces'

const logger = createLogger('providers:mcp-integration')

/**
 * Configuration for MCP tool generation
 */
export interface MCPGenerateConfig {
	documentPath: string
	providerName: string
	messages: Message[]
	controller: AbortController
	client?: any // Provider-specific client (OpenAI, Anthropic, etc.)
	statusBarManager?: any
	editor?: any
	pluginSettings?: any
	documentWriteLock?: any
	beforeToolExecution?: () => Promise<void>
}

/**
 * Helper class to centralize MCP integration logic
 * Removes duplicate code from provider implementations
 */
export class MCPIntegrationHelper {
	private mcpIntegration: MCPIntegration
	private mcpToolInjector: MCPToolInjector

	constructor(mcpIntegration: MCPIntegration, mcpToolInjector: MCPToolInjector) {
		this.mcpIntegration = mcpIntegration
		this.mcpToolInjector = mcpToolInjector
	}

	/**
	 * Check if tool calling is available
	 */
	hasToolCalling(): boolean {
		return !!(this.mcpIntegration?.toolCallingCoordinator && this.mcpIntegration?.providerAdapter)
	}

	/**
	 * Generate with tools using the coordinator (autonomous tool calling)
	 */
	async *generateWithTools(config: MCPGenerateConfig): AsyncGenerator<string, void, unknown> {
		if (!this.hasToolCalling()) {
			throw new Error('Tool calling not available')
		}

		const {
			documentPath,
			providerName,
			messages,
			client,
			statusBarManager,
			editor,
			pluginSettings,
			documentWriteLock,
			beforeToolExecution
		} = config

		try {
			const coordinator = this.mcpIntegration.toolCallingCoordinator as any
			const adapter = this.mcpIntegration.providerAdapter as any
			const mcpExec = this.mcpIntegration.mcpExecutor as any

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

			// Extract plugin settings for parallel execution
			const pluginOpts = pluginSettings || {}

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
		} catch (error) {
			logger.warn('Tool calling failed, falling back to regular generation', error)
			throw error
		}
	}

	/**
	 * Inject tools into request parameters (legacy approach)
	 */
	async injectTools(parameters: Record<string, unknown>, providerName: string): Promise<Record<string, unknown>> {
		try {
			return await this.mcpToolInjector.injectTools(parameters, providerName)
		} catch (error) {
			logger.warn(`Failed to inject MCP tools for ${providerName}`, error)
			return parameters // Return original parameters on failure
		}
	}

	/**
	 * Generate with automatic fallback from tool calling to tool injection
	 */
	async *generateWithFallback(config: MCPGenerateConfig): AsyncGenerator<string, void, unknown> {
		// Try tool calling first
		if (this.hasToolCalling()) {
			try {
				yield* this.generateWithTools(config)
				return
			} catch (error) {
				logger.info('Tool calling path failed, trying tool injection fallback', error)
			}
		}

		// Fallback to tool injection approach
		const { providerName, client, messages, controller } = config
		logger.info(`Using tool injection fallback for ${providerName}`)

		// This would need to be implemented by each provider
		// since the API calls are provider-specific
		throw new Error('Tool injection fallback must be implemented by provider')
	}
}

/**
 * Create MCP integration helper from provider settings
 */
export function createMCPIntegrationHelper(settings: BaseOptions): MCPIntegrationHelper | null {
	const { mcpIntegration, mcpToolInjector } = settings

	// If neither integration is available, return null
	if (!mcpIntegration && !mcpToolInjector) {
		return null
	}

	// If only tool injector is available, create minimal integration
	const integration = mcpIntegration || {
		mcpToolInjector: mcpToolInjector!
	}

	const injector = mcpToolInjector || integration.mcpToolInjector

	return new MCPIntegrationHelper(integration, injector)
}
