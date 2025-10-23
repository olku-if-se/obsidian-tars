import type { McpToolInjector } from "../providers";

/**
 * Mock implementation for MCPToolInjector - provides no-op tool injection
 * This provides a fast way to complete the task without full MCP setup
 */
export class McpToolInjectorMock implements McpToolInjector {
	async injectTools(
		parameters: Record<string, unknown>,
		providerName: string,
	): Promise<Record<string, unknown>> {
		console.log(
			`[MOCK] MCP tool injection called for provider: ${providerName}`,
		);
		return parameters; // No-op implementation
	}
}

export const McpToolInjectorNoOp: McpToolInjector = new McpToolInjectorMock();
