// DI Tokens for MCP-related services
export const ToolExecutorToken = Symbol('ToolExecutor')
export const MCPServerManagerToken = Symbol('MCPServerManager')
export const MCPServerClientToken = Symbol('MCPServerClient')
export const CodeBlockProcessorToken = Symbol('CodeBlockProcessor')
export const OllamaClientToken = Symbol('OllamaClient')
export const OllamaRuntimeConfigToken = Symbol('OllamaRuntimeConfig')
export const ServerConfigManagerToken = Symbol('ServerConfigManager')
export const SessionNotificationHandlersToken = Symbol('SessionNotificationHandlers')

// Type assertions to help TypeScript understand the token-service relationship
export type ToolExecutorToken = typeof ToolExecutorToken
export type MCPServerManagerToken = typeof MCPServerManagerToken
export type MCPServerClientToken = typeof MCPServerClientToken
export type CodeBlockProcessorToken = typeof CodeBlockProcessorToken
export type OllamaClientToken = typeof OllamaClientToken
export type OllamaRuntimeConfigToken = typeof OllamaRuntimeConfigToken
export type ServerConfigManagerToken = typeof ServerConfigManagerToken
export type SessionNotificationHandlersToken = typeof SessionNotificationHandlersToken
