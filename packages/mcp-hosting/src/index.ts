// Abstract interfaces for host integration

// Types
export type {
	AIToolContext,
	ConnectionState,
	ErrorInfo,
	ExecutionHistoryEntry,
	ExecutionStatus,
	ExecutionTracker,
	MCPServerConfig,
	RetryPolicy,
	RetryState,
	ServerHealthStatus,
	ToolDefinition,
	ToolExecutionResult,
	ToolInvocationRequest,
	ToolServerInfo
} from '@tars/contracts/services/mcp-types'
export { TransportProtocol } from '@tars/contracts/services/mcp-types'
export type { ILogger } from './adapters/ILogger'
// Default implementations
export { ConsoleLogger, NoOpLogger } from './adapters/ILogger'
export type { INotificationHandler } from './adapters/INotificationHandler'
export { DefaultNotificationHandler } from './adapters/INotificationHandler'
export type { IStatusReporter } from './adapters/IStatusReporter'
export { NoOpStatusReporter } from './adapters/IStatusReporter'
// Caching
export { DocumentToolCache } from './caching/DocumentToolCache'
export { ResultCache } from './caching/ResultCache'
export { ToolDiscoveryCache } from './caching/ToolDiscoveryCache'
// Configuration types and utilities
export type { ClaudeDesktopMCPConfig } from './config'
export {
	MCP_CONFIG_EXAMPLES,
	parseConfigInput,
	toMCPUseFormat,
	validateConfigInput
} from './config'
// Display mode utilities
export {
	CommandDisplayMode,
	type CommandDisplayModeValue,
	type ConversionCapability,
	type ConversionFormat,
	commandToRemoteUrl,
	detectConversionCapability,
	isValidRemoteUrl,
	normalizeDisplayMode,
	remoteUrlToCommand
} from './config/displayMode'
// Error classes
export {
	ConnectionError,
	DockerError,
	ExecutionLimitError,
	isConnectionError,
	isExecutionLimitError,
	isMCPError,
	isTimeoutError,
	MCPError,
	ServerNotAvailableError,
	TimeoutError,
	ToolExecutionError,
	ToolNotFoundError,
	ValidationError,
	YAMLParseError
} from './errors'
// Executor types
export type {
	DocumentSessionState,
	SessionNotificationHandlers,
	ToolExecutionRequest,
	ToolExecutionResultWithId,
	ToolExecutorOptions
} from './executor/ToolExecutor'
export { ToolExecutor } from './executor/ToolExecutor'
// Core classes
export { MCPServerManager } from './manager/MCPServerManager'
// MCP-Use adapter utilities
export type {
	MCPUseConfig,
	MCPUseServerConfig
} from './manager/mcpUseAdapter'
export {
	canUseMCPUse,
	partitionConfigs,
	toMCPUseConfig,
	toMCPUseServerConfig
} from './manager/mcpUseAdapter'
// Parser functionality
export type {
	ClaudeStreamEvent,
	OllamaChunk,
	OpenAIChunk,
	StreamChunk,
	TextChunk,
	ToolCall,
	ToolCallChunk,
	ToolResponseParser
} from './parser/toolResponseParser'
export {
	ClaudeToolResponseParser,
	OllamaToolResponseParser,
	OpenAIToolResponseParser
} from './parser/toolResponseParser'
// Retry logic
export {
	calculateRetryDelay,
	createInitialRetryState,
	DEFAULT_RETRY_POLICY,
	isTransientError,
	shouldRetry,
	sleep,
	updateRetryState,
	withRetry
} from './retry'

// Utility functions
export {
	formatErrorWithContext,
	getErrorMessage,
	logError,
	logWarning,
	safeAsync
} from './utils'
