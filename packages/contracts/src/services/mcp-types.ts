/**
 * MCP-related type definitions for Model Context Protocol integration
 * These interfaces represent the contracts between different components
 */

// Session tracking and notification types
export interface DocumentSessionState {
	documentPath: string
	totalSessionCount: number
	lastAccessed: number
}

export interface SessionNotificationHandlers {
	onLimitReached: (documentPath: string, limit: number, current: number) => Promise<'continue' | 'cancel'>
	onSessionReset: (documentPath: string) => void
}

// Tool execution types
export interface ToolExecutionRequest {
	serverId: string
	toolName: string
	parameters: Record<string, unknown>
	source: 'user-codeblock' | 'ai-autonomous'
	documentPath: string
	sectionLine?: number
	signal?: AbortSignal
}

export interface ToolExecutionResult {
	content: unknown
	contentType: 'json' | 'markdown' | 'text' | 'image'
	executionDuration: number
	tokensUsed?: number
	cached?: boolean
	cacheAge?: number
}

export interface ToolExecutionResultWithId extends ToolExecutionResult {
	requestId: string
}

export interface ToolExecutorOptions {
	timeout?: number
	sessionNotifications?: SessionNotificationHandlers
	enableCache?: boolean
	cacheTTL?: number
}

// Retry policy for server operations
export interface RetryPolicy {
	maxAttempts: number
	initialDelay: number
	maxDelay: number
	backoffMultiplier: number
	jitter: boolean
	transientErrorCodes: string[]
}

// Server management options
export interface ManagerOptions {
	failureThreshold?: number
	retryPolicy?: RetryPolicy
}

// Server management types
export interface MCPServerManager {
	// Core server management
	initialize(configs: MCPServerConfig[], options?: ManagerOptions): Promise<void>
	shutdown(): Promise<void>
	isInitialized(): boolean

	// Server operations
	addServer(config: MCPServerConfig): Promise<void>
	removeServer(serverId: string): Promise<void>
	updateServer(serverId: string, config: Partial<MCPServerConfig>): Promise<void>

	// Server access
	getServer(serverId: string): MCPServerClient | undefined
	getAllServers(): MCPServerClient[]
	getEnabledServers(): MCPServerClient[]

	// Health monitoring
	getServerHealth(serverId: string): ServerHealthStatus | undefined
	getAllServerHealth(): Record<string, ServerHealthStatus>
	performHealthCheck(): Promise<void>

	// Capabilities
	getServerCapabilities(serverId: string): ServerCapabilities | undefined
	getAllTools(): Promise<ToolDefinition[]>
	getToolsByServer(serverId: string): Promise<ToolDefinition[]>
}

export interface MCPServerClient {
	// Basic client operations
	connect(): Promise<void>
	disconnect(): Promise<void>
	isConnected(): boolean
	reconnect(): Promise<void>

	// Tool operations
	listTools(): Promise<ToolDefinition[]>
	callTool(toolName: string, parameters: Record<string, unknown>, timeout?: number): Promise<ToolExecutionResult>

	// Server information
	getServerInfo(): ServerInfo
	getCapabilities(): ServerCapabilities

	// Connection management
 getConnectionState(): ConnectionState
	getConnectionMetrics(): ConnectionMetrics
}

// Tool executor interface
export interface ToolExecutor {
	// Execution operations
	execute(request: ToolExecutionRequest): Promise<ToolExecutionResultWithId>
	executeBatch(requests: ToolExecutionRequest[]): Promise<ToolExecutionResultWithId[]>

	// Session management
	getSessionState(documentPath: string): DocumentSessionState | undefined
	resetSession(documentPath: string): void
	getAllSessionStates(): DocumentSessionState[]

	// Limits and tracking
	getConcurrentLimit(): number
	getSessionLimit(): number
	getActiveExecutions(): number
	getTotalExecuted(): number

	// Configuration
	updateOptions(options: Partial<ToolExecutorOptions>): void
	getOptions(): ToolExecutorOptions
}

// Core data types
export interface MCPServerConfig {
	id: string
	name: string
	enabled: boolean
	deploymentType: 'managed' | 'external'
	transport: 'stdio' | 'sse'
	[key: string]: unknown
}

export interface ToolDefinition {
	name: string
	description?: string
	inputSchema: JSONSchema
}

export interface ServerCapabilities {
	tools: boolean
	prompts: boolean
	resources: boolean
}

export interface ServerInfo {
	id: string
	name: string
	version?: string
	capabilities: ServerCapabilities
}

export interface ServerHealthStatus {
	serverId: string
	connectionState: ConnectionState
	lastPingAt?: number
	pingLatency?: number
	consecutiveFailures: number
	isHealthy: boolean
}

export interface ConnectionMetrics {
	connectedAt?: number
	lastActivityAt?: number
	totalRequests: number
	successfulRequests: number
	failedRequests: number
	averageLatency?: number
}

// Enums
export enum ConnectionState {
	DISCONNECTED = 'disconnected',
	CONNECTING = 'connecting',
	CONNECTED = 'connected',
	ERROR = 'error'
}

// Type aliases
export type JSONSchema = Record<string, unknown>