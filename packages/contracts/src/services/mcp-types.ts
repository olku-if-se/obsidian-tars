import type { ConnectionState as ConnectionStateType } from '../types'
export { ConnectionState } from '../types'

export interface ILogger {
	debug(message: string, context?: Record<string, unknown>): void
	info(message: string, context?: Record<string, unknown>): void
	warn(message: string, context?: Record<string, unknown>): void
	error(message: string, error?: Error, context?: Record<string, unknown>): void
}

export interface INotificationHandler {
	onSessionLimitReached(documentPath: string, limit: number, current: number): Promise<'continue' | 'cancel'>
	onSessionReset(documentPath: string): void
	onServerAutoDisabled(serverId: string, serverName: string, failureCount: number): void
}

export type StatusReportType = 'generation' | 'mcp' | 'tool' | 'system'

export interface IStatusReporter {
	reportServerStatus(serverId: string, status: 'connected' | 'disconnected' | 'error' | 'retrying'): void
	reportActiveExecutions(count: number): void
	reportSessionCount(documentPath: string, count: number, limit: number): void
	reportError(type: StatusReportType, message: string, error: Error, context?: Record<string, unknown>): void
}

export enum TransportProtocol {
	STDIO = 'stdio',
	SSE = 'sse'
}

export enum ExecutionStatus {
	PENDING = 'pending',
	EXECUTING = 'executing',
	SUCCESS = 'success',
	ERROR = 'error',
	TIMEOUT = 'timeout',
	CANCELLED = 'cancelled'
}

export type ConfigDisplayMode = 'simple' | 'command'

export const CommandDisplayMode = {
	Simple: 'simple',
	Command: 'command'
} as const

export type CommandDisplayModeValue = (typeof CommandDisplayMode)[keyof typeof CommandDisplayMode]

export type ConversionFormat = 'json' | 'url' | 'shell'

export interface ConversionCapability {
	canShowAsJson: boolean
	canShowAsUrl: boolean
	canShowAsShell: boolean
	currentFormat: ConversionFormat
	mcpRemoteCompatible: boolean
}

export interface MCPServerConfig {
	id: string
	name: string
	configInput: string
	displayMode?: ConfigDisplayMode
	enabled: boolean
	lastConnectedAt?: number
	failureCount: number
	autoDisabled: boolean
}

export type JSONSchema = Record<string, unknown>

export interface ToolDefinition {
	name: string
	description?: string
	inputSchema: JSONSchema
}

export interface ToolServerInfo {
	id: string
	name: string
}

export type ToolInvocationSource = 'user-codeblock' | 'ai-autonomous'

export type ToolResultContentType = 'text' | 'json' | 'markdown' | 'image'
export type ToolResultDisplayFormat = 'inline' | 'block' | 'collapsed'

export interface ToolExecutionResult {
	content: unknown
	contentType: ToolResultContentType
	executionDuration: number
	tokensUsed?: number
	displayFormat?: ToolResultDisplayFormat
	cached?: boolean
	cacheAge?: number
}

export interface ErrorInfo {
	message: string
	code?: string
	details?: unknown
	timestamp: number
}

export interface ToolInvocationRequest {
	id: string
	serverId: string
	toolName: string
	parameters: Record<string, unknown>
	source: ToolInvocationSource
	documentPath: string
	sectionLine?: number
	status: ExecutionStatus
	submittedAt: number
	startedAt?: number
	completedAt?: number
	retryAttempt: number
	maxRetries: number
	result?: ToolExecutionResult
	error?: ErrorInfo
}

export interface ToolExecutionRequest {
	serverId: string
	toolName: string
	parameters: Record<string, unknown>
	source: ToolInvocationSource
	documentPath: string
	sectionLine?: number
	signal?: AbortSignal
}

export interface ToolExecutionResultWithId extends ToolExecutionResult {
	requestId: string
}

export interface RetryPolicy {
	maxAttempts: number
	initialDelay: number
	maxDelay: number
	backoffMultiplier: number
	jitter: boolean
	transientErrorCodes: string[]
}

export interface RetryState {
	isRetrying: boolean
	currentAttempt: number
	nextRetryAt?: number
	backoffIntervals: number[]
	lastError?: Error
}

export interface ServerHealthStatus {
	serverId: string
	connectionState: ConnectionStateType
	lastPingAt?: number
	pingLatency?: number
	consecutiveFailures: number
	retryState: RetryState
	autoDisabledAt?: number
}

export type ExecutionHistoryStatus = 'pending' | 'success' | 'error' | 'timeout' | 'cancelled'

export interface ExecutionHistoryEntry {
	requestId: string
	serverId: string
	serverName: string
	toolName: string
	timestamp: number
	duration: number
	status: ExecutionHistoryStatus
	errorMessage?: string
}

export interface ExecutionTracker {
	concurrentLimit: number
	sessionLimit: number
	activeExecutions: Set<string>
	totalExecuted: number
	stopped: boolean
	executionHistory: ExecutionHistoryEntry[]
}

export interface AIToolContext {
	tools: Array<{
		serverId: string
		serverName: string
		toolName: string
		description: string
		inputSchema: JSONSchema
	}>
	executeTool(serverId: string, toolName: string, params: Record<string, unknown>): Promise<ToolExecutionResult>
	enabledServers: string[]
	sectionBinding?: string
}

export interface CacheStats {
	hits: number
	misses: number
	size: number
	oldestEntryAge: number | null
}

export interface ToolDiscoverySnapshot {
	mapping: Map<string, ToolServerInfo>
	servers: Array<{
		serverId: string
		serverName: string
		tools: ToolDefinition[]
	}>
}

export interface ToolDiscoveryMetrics {
	requests: number
	hits: number
	misses: number
	batched: number
	invalidations: number
	inFlight: boolean
	lastUpdatedAt: number | null
	lastBuildDurationMs: number | null
	lastServerCount: number
	lastToolCount: number
	lastError: string | null
	lastInvalidationAt: number | null
	lastInvalidationReason: string | null
}

export interface ToolDiscoveryCache {
	getSnapshot(options?: { forceRefresh?: boolean }): Promise<ToolDiscoverySnapshot>
	getCachedSnapshot(): ToolDiscoverySnapshot | null
	getToolMapping(options?: { forceRefresh?: boolean }): Promise<Map<string, ToolServerInfo>>
	getCachedMapping(): Map<string, ToolServerInfo> | null
	preload(): Promise<void>
	invalidate(reason?: string): void
	getMetrics(): ToolDiscoveryMetrics
}

export interface MCPServerClient {
	listTools(): Promise<ToolDefinition[]>
	callTool(toolName: string, parameters: Record<string, unknown>, timeout?: number): Promise<ToolExecutionResult>
	isConnected?(): boolean
	connect?(): Promise<void>
	disconnect?(): Promise<void>
}

export interface MCPServerManagerEvents {
	'server-started': [serverId: string]
	'server-stopped': [serverId: string]
	'server-failed': [serverId: string, error: Error]
	'server-auto-disabled': [serverId: string]
	'server-retry': [serverId: string, attempt: number, nextRetryIn: number, error: Error]
}

export interface MCPManagerInitializeOptions {
	failureThreshold?: number
	retryPolicy?: RetryPolicy
}

export interface MCPServerManager {
	initialize(configs: MCPServerConfig[], options?: MCPManagerInitializeOptions): Promise<void>
	startServer(serverId: string): Promise<void>
	stopServer(serverId: string): Promise<void>
	getClient(serverId: string): MCPServerClient | undefined
	getHealthStatus(serverId: string): ServerHealthStatus | undefined
	performHealthCheck(): Promise<void>
	reenableServer(serverId: string): Promise<void>
	listServers(): MCPServerConfig[]
	getToolDiscoveryCache(): ToolDiscoveryCache
	getToolDiscoveryMetrics(): ToolDiscoveryMetrics
	shutdown(): Promise<void>
	on<E extends keyof MCPServerManagerEvents>(event: E, listener: (...args: MCPServerManagerEvents[E]) => void): this
	off<E extends keyof MCPServerManagerEvents>(event: E, listener: (...args: MCPServerManagerEvents[E]) => void): this
	once?<E extends keyof MCPServerManagerEvents>(event: E, listener: (...args: MCPServerManagerEvents[E]) => void): this
}

export interface DocumentSessionState {
	documentPath: string
	totalSessionCount: number
	lastAccessed: number
}

export interface SessionNotificationHandlers {
	onLimitReached: (documentPath: string, limit: number, current: number) => Promise<'continue' | 'cancel'>
	onSessionReset: (documentPath: string) => void
}

export interface ToolExecutorOptions {
	timeout?: number
	sessionNotifications?: SessionNotificationHandlers
	enableCache?: boolean
	cacheTTL?: number
	logger?: ILogger
	statusReporter?: IStatusReporter
	notificationHandler?: INotificationHandler
}

export interface ToolExecutorStats {
	activeExecutions: number
	totalExecuted: number
	sessionLimit: number
	concurrentLimit: number
	stopped: boolean
	currentDocumentPath?: string
	documentSessions: DocumentSessionState[]
}

export interface ToolExecutorLimits {
	concurrentLimit?: number
	sessionLimit?: number
}

export interface ToolExecutor {
	executeTool(request: ToolExecutionRequest): Promise<ToolExecutionResult>
	executeToolWithId(request: ToolExecutionRequest): Promise<ToolExecutionResultWithId>
	canExecute(documentPath?: string): boolean
	getStats(): ToolExecutorStats
	updateLimits(limits: ToolExecutorLimits): void
	stop(): void
	reset(): void
	getHistory(): ExecutionHistoryEntry[]
	getDocumentSessionCount(documentPath: string): number
	cancelExecution(requestId: string): Promise<void>
	switchDocument(documentPath: string): void
	clearDocumentSession(documentPath: string): void
	resetSessionCount(documentPath: string): void
	getTotalSessionCount(documentPath: string): number
	clearCache(): void
	clearServerCache(serverId: string): void
	clearToolCache(serverId: string, toolName: string): void
	purgeExpiredCache(): void
	getCacheStats(): CacheStats
	getCacheHitRate(): number
	setCacheEnabled(enabled: boolean): void
	setCacheTTL(ttlMs: number): void
}

export interface MCPUseServerConfig {
	command: string
	args: string[]
	env?: Record<string, string>
}

export interface MCPUseConfig {
	mcpServers: Record<string, MCPUseServerConfig>
}

export interface ClaudeDesktopMCPConfig {
	mcpServers: Record<
		string,
		{
			command: string
			args?: string[]
			env?: Record<string, string>
		}
	>
}

export interface ToolCall {
	id: string
	name: string
	arguments: Record<string, unknown>
}

export interface TextChunk {
	type: 'text'
	content: string
}

export interface ToolCallChunk {
	type: 'tool_call'
	id: string
	name?: string
	arguments?: string
	index?: number
}

export type StreamChunk = TextChunk | ToolCallChunk

export interface ToolResponseParser<TProviderChunk = unknown> {
	parseChunk(chunk: TProviderChunk): StreamChunk | null
	hasCompleteToolCalls(): boolean
	getToolCalls(): ToolCall[]
	reset(): void
}

export interface OpenAIChunk {
	choices: Array<{
		delta?: {
			content?: string | null
			tool_calls?: Array<{
				index: number
				id?: string
				type?: 'function'
				function?: {
					name?: string
					arguments?: string
				}
			}>
		}
		finish_reason?: string | null
	}>
}

export type ClaudeStreamEvent =
	| {
			type: 'content_block_start'
			index: number
			content_block:
				| {
						type: 'text'
						text: string
				  }
				| {
						type: 'tool_use'
						id: string
						name: string
						input: Record<string, unknown>
				  }
	  }
	| {
			type: 'content_block_delta'
			index: number
			delta:
				| {
						type: 'text_delta'
						text: string
				  }
				| {
						type: 'input_json_delta'
						partial_json: string
				  }
	  }
	| {
			type: 'content_block_stop'
			index: number
	  }
	| {
			type: 'message_delta'
			delta: {
				stop_reason?: string
			}
	  }

export interface OllamaChunk {
	message?: {
		content?: string
		tool_calls?: Array<{
			function: {
				name: string
				arguments: Record<string, unknown>
			}
		}>
	}
	done?: boolean
}
