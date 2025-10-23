import type {
	McpIntegration,
	McpToolInjector,
	ProviderAdapter,
	ProviderToolExecutor,
	ToolCallingCoordinator,
} from "../providers";

/**
 * Mock implementation for MCPIntegration - allows providers to work without full MCP infrastructure
 * This provides a fast way to complete the task without full MCP setup
 */
export class McpIntegrationMock implements McpIntegration {
	mcpToolInjector: McpToolInjector = {
		async injectTools(
			parameters: Record<string, unknown>,
		): Promise<Record<string, unknown>> {
			return parameters;
		},
	};
	toolCallingCoordinator?: ToolCallingCoordinator;
	providerAdapter?: ProviderAdapter;
	mcpExecutor?: ProviderToolExecutor;
}

export const McpIntegrationNoOp: McpIntegration = new McpIntegrationMock();
