import type { DocumentWriteLock } from '../services/document'

// Define EmbedCache interface to avoid Obsidian dependency
// This matches the Obsidian EmbedCache interface structure
export interface EmbedCache {
	link: string
	path?: string
	original: string
	displayText?: string
	position: {
		start: {
			offset: number
			col: number
			line: number
		}
		end: {
			offset: number
			col: number
			line: number
		}
	}
}

// DocumentWriteLock implementation is in services/document.ts

export type MsgRole = 'user' | 'assistant' | 'system' | 'tool'

export type SaveAttachment = (fileName: string, data: ArrayBuffer) => Promise<void>

export type ResolveEmbedAsBinary = (embed: EmbedCache) => Promise<ArrayBuffer>

export type CreatePlainText = (filePath: string, text: string) => Promise<void>

export type NormalizePath = (path: string) => string

/**
 * Configuration for framework-specific settings
 * Allows providers to be framework-agnostic while receiving necessary configuration
 */
export interface FrameworkConfig {
	/** App folder name for logging and file operations */
	appFolder?: string
	/** Path normalization function */
	normalizePath?: NormalizePath
	/** Notice system for showing user notifications */
	noticeSystem?: NoticeSystem
	/** HTTP request system */
	requestSystem?: RequestSystem
	/** Platform information */
	platform?: PlatformInfo
	/** Additional framework-specific configuration */
	[key: string]: unknown
}

export interface Message {
	readonly role: MsgRole
	readonly content: string
	readonly embeds?: EmbedCache[]
}

export type SendRequest = (
	messages: Message[],
	controller: AbortController,
	resolveEmbedAsBinary: ResolveEmbedAsBinary,
	saveAttachment?: SaveAttachment,
	normalizePath?: NormalizePath
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
 * Interface for MCP Tool Executor (Provider-specific)
 * Manages execution of MCP tools with proper error handling
 * Note: This is a legacy interface - use ToolExecutor from services/mcp-types instead
 * @deprecated Use ToolExecutor from services/mcp-types
 */
export interface ProviderToolExecutor {
	executeTool(serverId: string, toolName: string, arguments_: Record<string, unknown>): Promise<unknown>
}

/**
 * Interface for MCP Server Manager (Provider-specific)
 * Manages lifecycle and tool discovery for MCP servers
 * Note: This is a legacy interface - use MCPServerManager from services/mcp-types instead
 * @deprecated Use MCPServerManager from services/mcp-types
 */
export interface ProviderMCPServerManager {
	getToolDiscoveryCache(): {
		getSnapshot(): Promise<ToolSnapshot>
	}
}

/**
 * Interface for Tool Snapshot from MCP server discovery
 */
export interface ToolSnapshot {
	servers: Array<{
		serverId: string
		serverName: string
		tools: Array<{
			name: string
			description: string
			inputSchema: Record<string, unknown>
		}>
	}>
	mapping: Map<string, { id: string; name: string }>
}

/**
 * Interface for Provider-specific MCP Adapter
 * Converts MCP tools to provider-specific formats
 */
export interface ProviderAdapter {
	initialize?(config: { preloadTools?: boolean }): Promise<void>
	convertTools?(): Promise<unknown>
}

/**
 * Interface for Tool Calling Coordinator
 * Orchestrates autonomous tool calling for providers that support it
 */
export interface ToolCallingCoordinator {
	generateWithTools(
		messages: Array<{ role: string; content: string; embeds?: EmbedCache[] }>,
		adapter: ProviderAdapter,
		executor: ProviderToolExecutor,
		options: {
			documentPath: string
			statusBarManager?: StatusBarManager
			editor?: Editor
			autoUseDocumentCache?: boolean
			parallelExecution?: boolean
			maxParallelTools?: number
			documentWriteLock?: DocumentWriteLock
			onBeforeToolExecution?: () => Promise<void>
		}
	): AsyncGenerator<string, void, unknown>
}

/**
 * Interface for advanced MCP integration including tool coordination
 * Used by providers that support autonomous tool calling
 */
export interface MCPIntegration {
	mcpToolInjector: MCPToolInjector
	toolCallingCoordinator?: ToolCallingCoordinator
	providerAdapter?: ProviderAdapter
	mcpExecutor?: ProviderToolExecutor
	// Factory functions for creating MCP components
	createToolCallingCoordinator?: () => ToolCallingCoordinator
	createProviderAdapter?: (config: unknown) => ProviderAdapter
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

/**
 * Interface for showing notices to users
 * Framework-agnostic replacement for Obsidian's Notice
 */
export interface NoticeSystem {
	show(message: string): void
}

/**
 * Interface for making HTTP requests
 * Framework-agnostic replacement for Obsidian's requestUrl
 */
export interface RequestSystem {
	requestUrl(url: string, options?: RequestUrlOptions): Promise<RequestUrlResponse>
}

export interface RequestUrlOptions {
	method?: string
	headers?: Record<string, string>
	body?: string
	throw?: boolean
}

export interface RequestUrlResponse {
	status: number
	text: string
	json?: unknown
	headers: Record<string, string>
}

/**
 * Interface for platform detection
 * Framework-agnostic replacement for Obsidian's Platform
 */
export interface PlatformInfo {
	isMobileApp: boolean
	isDesktop: boolean
	isMacOS: boolean
	isWindows: boolean
	isLinux: boolean
	isIosApp: boolean
	isAndroidApp: boolean
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
	// Framework-specific configuration
	frameworkConfig?: FrameworkConfig
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

	/** List of available models for this provider */
	abstract readonly models: LlmModel[]

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
	readonly models: LlmModel[]
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

export interface LlmStreamProcessor {
	process(delta: string): string[]
	complete(): string[]
}

export interface LlmModel {
	id: string
	label?: string
	description?: string
	capabilities: LlmCapability[]
	systemPrelude?: Message
	createStreamProcessor?: () => LlmStreamProcessor
}

export class NoOpStreamProcessor implements LlmStreamProcessor {
	process(delta: string): string[] {
		return delta ? [delta] : []
	}

	complete(): string[] {
		return []
	}
}

export function getModelById(models: LlmModel[], modelId: string): LlmModel | undefined {
	return models.find(model => model.id === modelId)
}

export function toLlmModels(ids: string[], capabilities: LlmCapability[]): LlmModel[] {
	return ids.map((id) => ({ id, capabilities }))
}

// === New Universal Provider Interfaces ===

/**
 * Universal LLM Provider Interface
 * All providers implement this for consistency
 */
export interface LlmProvider {
	/** Unique provider name */
	readonly name: string
	/** Human-readable display name */
	readonly displayName: string
	/** Capabilities this provider supports */
	readonly capabilities: LlmCapability[]
	/** Default configuration */
	readonly defaultOptions: BaseOptions

	/** Create streaming request function */
	createSendRequest(options: BaseOptions): SendRequest

	/** Validate provider configuration */
	validateOptions(options: BaseOptions): boolean
}

/** Updated capability type for LlmProvider */
export type LlmCapability =
	| 'Text Generation'
	| 'Image Vision'
	| 'PDF Vision'
	| 'Image Generation'
	| 'Image Editing'
	| 'Web Search'
	| 'Reasoning'
	| 'Tool Calling'
