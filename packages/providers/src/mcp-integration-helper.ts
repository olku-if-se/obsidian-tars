import type {
	BaseOptions,
	DocumentWriteLock,
	Editor,
	MCPIntegration,
	MCPToolInjector,
	Message,
	StatusBarManager
} from '@tars/contracts'
import { createLogger } from '@tars/logger'

const logger = createLogger('providers:mcp-integration')

/**
 * Configuration for MCP tool generation
 */
export interface MCPGenerateConfig {
	documentPath: string
	providerName: string
	messages: Message[]
	controller: AbortController
	client?: unknown // Provider-specific client (OpenAI, Anthropic, etc.)
	statusBarManager?: StatusBarManager
	editor?: Editor
	pluginSettings?: Record<string, unknown>
	documentWriteLock?: DocumentWriteLock
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
			const coordinator = this.mcpIntegration.toolCallingCoordinator
			const adapter = this.mcpIntegration.providerAdapter
			const mcpExec = this.mcpIntegration.mcpExecutor

			if (!coordinator || !adapter || !mcpExec) {
				throw new Error('Missing required MCP components for tool calling')
			}

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
				parallelExecution: (pluginOpts as any)?.mcpParallelExecution ?? false,
				maxParallelTools: (pluginOpts as any)?.mcpMaxParallelTools ?? 3,
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
			if (!this.mcpToolInjector) {
				logger.warn(`MCP tool injector not available for ${providerName}`)
				return parameters
			}
			return await this.mcpToolInjector.injectTools(parameters, providerName)
		} catch (error) {
			logger.error(`Failed to inject MCP tools for ${providerName}`, {
				error: error instanceof Error ? error.message : String(error),
				providerName
			})
			return parameters // Return original parameters on failure
		}
	}

	/**
	 * Generate with automatic fallback from tool calling to tool injection
	 */
	async *generateWithFallback(config: MCPGenerateConfig): AsyncGenerator<string, void, unknown> {
		const { providerName } = config

		// Try tool calling first
		if (this.hasToolCalling()) {
			try {
				yield* this.generateWithTools(config)
				return
			} catch (error) {
				logger.warn('Tool calling path failed, trying tool injection fallback', {
					error: error instanceof Error ? error.message : String(error),
					providerName
				})
			}
		} else {
			logger.info(`Tool calling not available for ${providerName}, using tool injection`)
		}

		// Fallback to tool injection approach
		const { client, messages, controller } = config
		logger.info(`Using tool injection fallback for ${providerName}`)

		// This would need to be implemented by each provider
		// since the API calls are provider-specific
		throw new Error(`Tool injection fallback not implemented for ${providerName}`)
	}
}

/**
 * Create MCP integration helper from provider settings
 */
export function createMCPIntegrationHelper(settings: BaseOptions): MCPIntegrationHelper | null {
	try {
		const { mcpIntegration, mcpToolInjector } = settings

		// If neither integration is available, return null
		if (!mcpIntegration && !mcpToolInjector) {
			logger.debug('No MCP integration available for provider')
			return null
		}

		// If only tool injector is available, create minimal integration
		const integration = mcpIntegration || {
			mcpToolInjector: mcpToolInjector!
		}

		const injector = mcpToolInjector || integration.mcpToolInjector

		if (!injector) {
			logger.warn('MCP tool injector not available in integration settings')
			return null
		}

		return new MCPIntegrationHelper(integration, injector)
	} catch (error) {
		logger.error('Failed to create MCP integration helper', {
			error: error instanceof Error ? error.message : String(error)
		})
		return null
	}
}
