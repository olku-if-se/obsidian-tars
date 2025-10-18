import { Mutex } from 'async-mutex'
import type { EmbedCache } from 'obsidian'

// DocumentWriteLock class for thread-safe document editing
export class DocumentWriteLock {
	private mutex = new Mutex()

	async runExclusive<T>(fn: () => T | Promise<T>): Promise<T> {
		return this.mutex.runExclusive(fn)
	}
}

export type MsgRole = 'user' | 'assistant' | 'system'

export type SaveAttachment = (fileName: string, data: ArrayBuffer) => Promise<void>

export type ResolveEmbedAsBinary = (embed: EmbedCache) => Promise<ArrayBuffer>

export type CreatePlainText = (filePath: string, text: string) => Promise<void>

export interface Message {
	readonly role: MsgRole
	readonly content: string
	readonly embeds?: EmbedCache[]
}

export type SendRequest = (
	messages: Message[],
	controller: AbortController,
	resolveEmbedAsBinary: ResolveEmbedAsBinary,
	saveAttachment?: SaveAttachment
) => AsyncGenerator<string, void, unknown>

export type Capability =
	| 'Text Generation'
	| 'Image Vision'
	| 'PDF Vision'
	| 'Image Generation'
	| 'Image Editing'
	| 'Web Search'
	| 'Reasoning'
	| 'Tool Calling'

/**
 * Interface for injecting MCP tools into provider parameters
 * This allows providers to remain independent of MCP implementation details
 */
export interface MCPToolInjector {
	injectTools(parameters: Record<string, unknown>, providerName: string): Promise<Record<string, unknown>>
}

/**
 * Interface for advanced MCP integration including tool coordination
 * Used by providers that support autonomous tool calling
 */
export interface MCPIntegration {
	mcpToolInjector: MCPToolInjector
	toolCallingCoordinator?: unknown // ToolCallingCoordinator from mcp module
	providerAdapter?: unknown // Provider-specific adapter from mcp module
	mcpExecutor?: unknown // ToolExecutor from mcp module
	// Factory functions for creating MCP components
	createToolCallingCoordinator?: () => unknown
	createProviderAdapter?: (config: unknown) => unknown
}

// Type definitions for optional plugin integration
export interface StatusBarManager {
	// Basic interface for status bar operations
	// Methods depend on specific implementation
	[key: string]: unknown
}

export interface Editor {
	// Basic interface for editor operations
	// Methods depend on Obsidian API
	[key: string]: unknown
}

export interface PluginSettings {
	// Basic interface for plugin configuration
	mcpParallelExecution?: boolean
	mcpMaxParallelTools?: number
	[key: string]: unknown
}

export interface BaseOptions {
	apiKey: string
	baseURL: string
	model: string
	parameters: Record<string, unknown>
	enableWebSearch?: boolean
	// MCP tool integration - always provided by the system (may contain no tools)
	mcpToolInjector?: MCPToolInjector
	mcpIntegration?: MCPIntegration // Advanced MCP integration for tool coordination
	// Document context for tool execution
	documentPath?: string // Current document path for tool execution context
	statusBarManager?: StatusBarManager
	editor?: Editor
	pluginSettings?: PluginSettings
	documentWriteLock?: DocumentWriteLock
	beforeToolExecution?: () => Promise<void>
}

export interface ProviderSettings {
	tag: string
	readonly vendor: string
	options: BaseOptions
}

export interface Optional {
	apiSecret: string
	endpoint: string
	apiVersion: string
}

/**
 * Abstract base class for AI providers
 * Provides a consistent interface and common functionality for all LLM providers
 */
export abstract class BaseProvider {
	/** Unique identifier for this provider */
	abstract readonly name: string

	/** Default configuration options for this provider */
	abstract readonly defaultOptions: BaseOptions

	/** List of available model names for this provider */
	abstract readonly models: string[]

	/** URL where users can obtain API keys */
	abstract readonly websiteToObtainKey: string

	/** Capabilities supported by this provider */
	abstract readonly capabilities: Capability[]

	/**
	 * Create a send request function with the given options
	 */
	abstract createSendRequest(options: BaseOptions): SendRequest

	/**
	 * Validate provider-specific options
	 */
	validateOptions(options: BaseOptions): boolean {
		return !!(options.apiKey && options.model && options.baseURL)
	}

	/**
	 * Get capability emoji for display
	 */
	getCapabilityEmoji(capability: Capability): string {
		const emojiMap: Record<Capability, string> = {
			'Text Generation': '💬',
			'Image Vision': '👁️',
			'PDF Vision': '📄',
			'Image Generation': '🎨',
			'Image Editing': '✏️',
			'Web Search': '🔍',
			Reasoning: '🧠',
			'Tool Calling': '🔧'
		}
		return emojiMap[capability] || '❓'
	}

	/**
	 * Format error messages consistently
	 */
	formatError(error: unknown, context: string): string {
		if (error instanceof Error) {
			return `${this.name} Error in ${context}: ${error.message}`
		}
		return `${this.name} Error in ${context}: ${String(error)}`
	}
}

/**
 * Interface for provider vendor objects
 * Maintains compatibility with existing plugin architecture
 */
export interface Vendor {
	readonly name: string
	readonly defaultOptions: BaseOptions
	readonly sendRequestFunc: (options: BaseOptions) => SendRequest
	readonly models: string[]
	readonly websiteToObtainKey: string
	readonly capabilities: Capability[]
}

/**
 * Create default options with required MCP fields
 */
export function createDefaultOptions(options: Omit<BaseOptions, 'mcpToolInjector' | 'mcpIntegration'>): BaseOptions {
	return {
		...options,
		mcpToolInjector: undefined, // Will be injected by the system
		mcpIntegration: undefined // Will be injected by the system
	}
}

/**
 * Convert a BaseProvider instance to a Vendor interface
 */
export function providerToVendor(provider: BaseProvider): Vendor {
	return {
		name: provider.name,
		defaultOptions: provider.defaultOptions,
		sendRequestFunc: provider.createSendRequest.bind(provider),
		models: provider.models,
		websiteToObtainKey: provider.websiteToObtainKey,
		capabilities: provider.capabilities
	}
}
