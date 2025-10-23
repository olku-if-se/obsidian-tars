import type { ToolDefinition } from "../../../providers/src/tools";
import type { Message } from "../providers";

/**
 * MCP adapter interface for future integration
 * This interface defines how providers interact with MCP (Model Context Protocol)
 *
 * Note: This is currently a placeholder for future implementation
 * The actual MCP integration will be built later as an adapter to this interface
 */

/**
 * MCP generation configuration
 */
export interface MCPGenerationConfig {
	/** Document path for context */
	documentPath: string;

	/** Provider name */
	providerName: string;

	/** Conversation messages */
	messages: Message[];

	/** Abort controller */
	controller: AbortController;

	/** Provider-specific client */
	client?: unknown;

	/** Status bar manager */
	statusBarManager?: unknown;

	/** Editor instance */
	editor?: unknown;

	/** Plugin settings */
	pluginSettings?: Record<string, unknown>;

	/** Document write lock */
	documentWriteLock?: unknown;

	/** Pre-tool execution hook */
	beforeToolExecution?: () => Promise<void>;
}

/**
 * MCP tool injection result
 */
export interface MCPToolInjectionResult {
	/** Updated request parameters with injected tools */
	parameters: Record<string, unknown>;

	/** Injected tools */
	tools?: ToolDefinition[];
}

/**
 * MCP adapter interface
 */
export interface IMCPAdapter {
	/**
	 * Check if tool calling is available
	 */
	hasToolCalling(): boolean;

	/**
	 * Inject MCP tools into request parameters
	 * Modifies the request parameters to include available MCP tools
	 *
	 * @param params - Provider request parameters
	 * @param providerName - Name of the provider
	 * @returns Updated parameters with injected tools
	 */
	injectTools(
		params: Record<string, unknown>,
		providerName: string,
	): Promise<MCPToolInjectionResult>;

	/**
	 * Generate with tools using MCP coordinator
	 * Handles autonomous tool calling with MCP integration
	 *
	 * @param config - Generation configuration
	 * @returns Async generator yielding content chunks
	 */
	generateWithTools(
		config: MCPGenerationConfig,
	): AsyncGenerator<string, void, unknown>;

	/**
	 * Initialize the adapter
	 * Optional initialization logic for the adapter
	 */
	initialize?(): Promise<void>;

	/**
	 * Cleanup resources
	 * Optional cleanup logic for the adapter
	 */
	dispose?(): Promise<void>;
}
