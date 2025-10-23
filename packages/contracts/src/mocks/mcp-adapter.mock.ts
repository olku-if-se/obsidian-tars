import type {
	IMCPAdapter,
	MCPGenerationConfig,
	MCPToolInjectionResult,
} from "../services/IMCPAdapter";

/**
 * No-op MCP adapter implementation
 * Used when MCP integration is not available or not needed
 *
 * This adapter provides stub implementations that:
 * - Return false for hasToolCalling()
 * - Return unchanged parameters for injectTools()
 * - Throw error for generateWithTools() (should not be called)
 */
export class McpAdapterMock implements IMCPAdapter {
	/**
	 * Tool calling is not available in NoOp adapter
	 */
	hasToolCalling(): boolean {
		return false;
	}

	/**
	 * Returns parameters unchanged (no tools injected)
	 */
	async injectTools(
		params: Record<string, unknown>,
		_providerName: string,
	): Promise<MCPToolInjectionResult> {
		return {
			parameters: params,
			tools: [],
		};
	}

	/**
	 * Throws error - should not be called when hasToolCalling() is false
	 */
	async *generateWithTools(
		_config: MCPGenerationConfig,
	): AsyncGenerator<string, void, unknown> {
		// This should never be called when hasToolCalling() returns false
		// Yield error message instead of throwing to satisfy generator contract
		yield "Error: MCP tool calling not available in NoOp adapter";
		throw new Error("MCP tool calling not available in NoOp adapter");
	}

	/**
	 * No initialization needed
	 */
	async initialize(): Promise<void> {
		// No-op
	}

	/**
	 * No cleanup needed
	 */
	async dispose(): Promise<void> {
		// No-op
	}
}

/**
 * Singleton instance for convenience
 */
export const noOpMCPAdapter = new NoOpMCPAdapter();
