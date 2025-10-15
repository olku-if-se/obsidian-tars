import type { EmbedCache } from 'obsidian'
import type { DocumentWriteLock } from '@tars/logger'

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
	messages: readonly Message[],
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

export interface BaseOptions {
	apiKey: string
	baseURL: string
	model: string
	parameters: Record<string, unknown>
	enableWebSearch?: boolean
	// MCP tool integration - injected by the system when available
	mcpManager?: unknown // MCPServerManager from mcp module
	mcpExecutor?: unknown // ToolExecutor from mcp module
	documentPath?: string // Current document path for tool execution context
	statusBarManager?: unknown // StatusBarManager for error logging
	editor?: unknown // Active Obsidian editor for markdown persistence
	pluginSettings?: unknown // Plugin settings for parallel execution configuration
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
			'Reasoning': '🧠',
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