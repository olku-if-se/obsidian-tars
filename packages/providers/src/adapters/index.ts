/**
 * MCP adapter interfaces and implementations
 * Provides integration layer for Model Context Protocol
 */

export type { IMCPAdapter, MCPGenerationConfig, MCPToolInjectionResult } from './IMCPAdapter'
export { NoOpMCPAdapter, noOpMCPAdapter } from './NoOpMCPAdapter'
