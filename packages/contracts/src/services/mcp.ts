import type { MCPServerManager, ToolExecutor } from './mcp-types'

/**
 * MCP service interface for Model Context Protocol integration
 */
export interface IMcpService {
	/**
	 * Get the tool executor for running MCP tools
	 */
	getToolExecutor(): ToolExecutor

	/**
	 * Get the MCP server manager
	 */
	getServerManager(): MCPServerManager

	/**
	 * Get the code block processor for rendering MCP results
	 */
	getCodeBlockProcessor(): CodeBlockProcessor

	/**
	 * Initialize MCP service
	 */
	initialize(): Promise<void>

	/**
	 * Shutdown MCP service
	 */
	shutdown(): Promise<void>

	/**
	 * Check if MCP is available and ready
	 */
	isReady(): boolean

	/**
	 * Get current MCP status information
	 */
	getStatus(): McpStatus
}

/**
 * Code block processor interface for handling MCP tool execution in markdown
 */
export interface CodeBlockProcessor {
	/**
	 * Process a code block containing MCP tool invocation
	 */
	processCodeBlock(serverName: string, content: string): Promise<string>

	/**
	 * Render tool execution results in markdown format
	 */
	renderResults(results: unknown, metadata?: Record<string, unknown>): string

	/**
	 * Validate tool invocation syntax
	 */
	validateInvocation(content: string): boolean

	/**
	 * Extract tool name and arguments from code block content
	 */
	parseToolInvocation(content: string): { toolName: string; arguments: Record<string, unknown> } | null
}

/**
 * MCP status information
 */
export interface McpStatus {
	/**
	 * Overall readiness state
	 */
	ready: boolean

	/**
	 * Number of active servers
	 */
	activeServers: number

	/**
	 * Number of currently executing tools
	 */
	activeExecutions: number

	/**
	 * Last error if any
	 */
	lastError?: string

	/**
	 * Last update timestamp
	 */
	lastUpdated: Date
}
