import type {
	MCPIntegration,
	MCPToolInjector,
	ProviderAdapter,
	ProviderToolExecutor,
	ToolCallingCoordinator
} from '../providers/base'

/**
 * Mock implementation for MCPIntegration - allows providers to work without full MCP infrastructure
 * This provides a fast way to complete the task without full MCP setup
 */
export class MockMCPIntegration implements MCPIntegration {
	mcpToolInjector: MCPToolInjector = {
		async injectTools(parameters: Record<string, unknown>): Promise<Record<string, unknown>> {
			return parameters
		}
	}
	toolCallingCoordinator?: ToolCallingCoordinator
	providerAdapter?: ProviderAdapter
	mcpExecutor?: ProviderToolExecutor
}
