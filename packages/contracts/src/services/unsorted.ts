import type { CodeBlockProcessor } from '../services/mcp'
import type { MCPServerConfig, ToolExecutionResult } from '../services/mcp-types'

export interface OllamaAdapterRuntimeConfig {
	readonly model: string
	readonly createAbortController?: () => AbortController
}

// Additional interface for server configuration management
export interface IServerConfigManager {
	getServerConfigs(): MCPServerConfig[]
	getServerByName(serverName: string): MCPServerConfig | undefined
	updateServerConfigs(configs: MCPServerConfig[]): void
}

// Enhanced code block processor interface with DOM rendering
export interface ICodeBlockProcessor extends CodeBlockProcessor {
	// Enhanced version of parseToolInvocation with full signature
	parseToolInvocationExtended(
		source: string,
		language: string
	): { serverId: string; toolName: string; parameters: Record<string, unknown> } | null

	// Additional methods for DOM rendering
	renderResult(
		el: HTMLElement,
		result: ToolExecutionResult,
		options?: { collapsible?: boolean; showMetadata?: boolean }
	): void
	renderError(el: HTMLElement, error: { message: string; details?: unknown; timestamp: number }): void
	renderStatus(el: HTMLElement, status: 'pending' | 'executing', onCancel?: () => void): void
	parseYAMLParameters(lines: string[]): Record<string, unknown>
}

// Additional interface for server configuration management
export interface IServerConfigManager {
	getServerConfigs(): MCPServerConfig[]
	getServerByName(serverName: string): MCPServerConfig | undefined
	updateServerConfigs(configs: MCPServerConfig[]): void
}
