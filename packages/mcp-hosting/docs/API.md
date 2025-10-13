# MCP Hosting Package - API Reference

## Table of Contents

- [Core Classes](#core-classes)
- [Abstract Interfaces](#abstract-interfaces)
- [Type Definitions](#type-definitions)
- [Error Classes](#error-classes)
- [Utility Functions](#utility-functions)

## Core Classes

### MCPServerManager

Manages MCP server lifecycle, health monitoring, and retry logic.

```typescript
class MCPServerManager extends EventEmitter<MCPServerManagerEvents>
```

#### Constructor

```typescript
constructor(options?: {
  logger?: ILogger
  statusReporter?: IStatusReporter
})
```

#### Methods

##### `initialize(configs, options?)`

Initialize the manager with server configurations.

```typescript
async initialize(
  configs: MCPServerConfig[],
  options?: {
    failureThreshold?: number
    retryPolicy?: RetryPolicy
  }
): Promise<void>
```

##### `startServer(serverId)`

Start a specific MCP server with retry logic.

```typescript
async startServer(serverId: string): Promise<void>
```

##### `stopServer(serverId)`

Stop a specific MCP server.

```typescript
async stopServer(serverId: string): Promise<void>
```

##### `getClient(serverId)`

Get MCP client wrapper for a server.

```typescript
getClient(serverId: string): MCPClientWrapper | undefined
```

##### `listServers()`

Get list of all server configurations.

```typescript
listServers(): MCPServerConfig[]
```

##### `getHealthStatus(serverId)`

Get health status for a server.

```typescript
getHealthStatus(serverId: string): ServerHealthStatus | undefined
```

##### `performHealthCheck()`

Perform health check on all servers.

```typescript
async performHealthCheck(): Promise<void>
```

##### `shutdown()`

Shutdown all servers and cleanup.

```typescript
async shutdown(): Promise<void>
```

#### Events

```typescript
interface MCPServerManagerEvents {
  'server-started': [serverId: string]
  'server-stopped': [serverId: string]
  'server-failed': [serverId: string, error: Error]
  'server-auto-disabled': [serverId: string]
  'server-retry': [serverId: string, attempt: number, nextRetryIn: number, error: Error]
}
```

### ToolExecutor

Executes MCP tools with limits, caching, and session tracking.

```typescript
class ToolExecutor
```

#### Constructor

```typescript
constructor(
  manager: MCPServerManager,
  tracker: ExecutionTracker,
  options?: ToolExecutorOptions
)
```

#### Methods

##### `executeTool(request)`

Execute a tool request.

```typescript
async executeTool(request: ToolExecutionRequest): Promise<ToolExecutionResult>
```

##### `executeToolWithId(request)`

Execute a tool request and return result with request ID.

```typescript
async executeToolWithId(request: ToolExecutionRequest): Promise<ToolExecutionResultWithId>
```

##### `canExecute(documentPath?)`

Check if tool execution is currently allowed.

```typescript
canExecute(documentPath?: string): boolean
```

##### `getStats()`

Get current execution statistics.

```typescript
getStats(): {
  activeExecutions: number
  totalExecuted: number
  sessionLimit: number
  concurrentLimit: number
  stopped: boolean
  currentDocumentPath?: string
  documentSessions: DocumentSessionState[]
}
```

##### `updateLimits(limits)`

Update execution limits.

```typescript
updateLimits(limits: { concurrentLimit?: number; sessionLimit?: number }): void
```

##### `cancelExecution(requestId)`

Cancel a pending execution.

```typescript
async cancelExecution(requestId: string): Promise<void>
```

##### `clearCache()`

Clear all cached results.

```typescript
clearCache(): void
```

##### `getCacheStats()`

Get cache statistics.

```typescript
getCacheStats(): CacheStats
```

## Abstract Interfaces

### ILogger

Abstract interface for logging functionality.

```typescript
interface ILogger {
  debug(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, error?: Error, context?: Record<string, unknown>): void
}
```

#### Default Implementations

##### ConsoleLogger

```typescript
class ConsoleLogger implements ILogger {
  constructor(prefix?: string)
}
```

##### NoOpLogger

```typescript
class NoOpLogger implements ILogger {
  debug(): void
  info(): void
  warn(): void
  error(): void
}
```

### IStatusReporter

Abstract interface for status reporting.

```typescript
interface IStatusReporter {
  reportServerStatus(serverId: string, status: 'connected' | 'disconnected' | 'error' | 'retrying'): void
  reportActiveExecutions(count: number): void
  reportSessionCount(documentPath: string, count: number, limit: number): void
  reportError(type: string, message: string, error: Error, context?: Record<string, unknown>): void
}
```

#### Default Implementations

##### NoOpStatusReporter

```typescript
class NoOpStatusReporter implements IStatusReporter {
  reportServerStatus(): void
  reportActiveExecutions(): void
  reportSessionCount(): void
  reportError(): void
}
```

### INotificationHandler

Abstract interface for user notifications.

```typescript
interface INotificationHandler {
  onSessionLimitReached(documentPath: string, limit: number, current: number): Promise<'continue' | 'cancel'>
  onSessionReset(documentPath: string): void
  onServerAutoDisabled(serverId: string, serverName: string, failureCount: number): void
}
```

#### Default Implementations

##### DefaultNotificationHandler

```typescript
class DefaultNotificationHandler implements INotificationHandler {
  async onSessionLimitReached(): Promise<'continue' | 'cancel'>
  onSessionReset(): void
  onServerAutoDisabled(): void
}
```

## Type Definitions

### Core Types

#### MCPServerConfig

```typescript
interface MCPServerConfig {
  id: string
  name: string
  configInput: string
  enabled: boolean
  failureCount: number
  autoDisabled: boolean
  lastConnectedAt?: number
}
```

#### ToolExecutionResult

```typescript
interface ToolExecutionResult {
  content: unknown
  contentType: 'text' | 'json' | 'markdown' | 'image'
  executionDuration: number
  tokensUsed?: number
  cached?: boolean
  cacheAge?: number
}
```

#### ToolExecutionRequest

```typescript
interface ToolExecutionRequest {
  serverId: string
  toolName: string
  parameters: Record<string, unknown>
  source: 'user-codeblock' | 'ai-autonomous'
  documentPath: string
  sectionLine?: number
  signal?: AbortSignal
}
```

### Retry Types

#### RetryPolicy

```typescript
interface RetryPolicy {
  maxAttempts: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
  jitter: boolean
  transientErrorCodes: string[]
}
```

#### RetryState

```typescript
interface RetryState {
  isRetrying: boolean
  currentAttempt: number
  nextRetryAt?: number
  backoffIntervals: number[]
  lastError?: Error
}
```

### Health Monitoring Types

#### ServerHealthStatus

```typescript
interface ServerHealthStatus {
  serverId: string
  connectionState: ConnectionState
  lastPingAt?: number
  pingLatency?: number
  consecutiveFailures: number
  retryState: RetryState
  autoDisabledAt?: number
}
```

#### ExecutionTracker

```typescript
interface ExecutionTracker {
  concurrentLimit: number
  sessionLimit: number
  activeExecutions: Set<string>
  totalExecuted: number
  stopped: boolean
  executionHistory: ExecutionHistoryEntry[]
}
```

## Error Classes

### MCPError

Base error class for all MCP-related errors.

```typescript
class MCPError extends Error {
  code: string
  details?: unknown
  timestamp: number
}
```

### Specific Error Types

#### ConnectionError

```typescript
class ConnectionError extends MCPError
```

#### ToolNotFoundError

```typescript
class ToolNotFoundError extends MCPError {
  constructor(toolName: string, serverName: string)
}
```

#### ExecutionLimitError

```typescript
class ExecutionLimitError extends MCPError {
  constructor(
    limitType: 'concurrent' | 'session',
    current: number,
    limit: number,
    context?: Record<string, unknown>
  )
}
```

#### ServerNotAvailableError

```typescript
class ServerNotAvailableError extends MCPError {
  constructor(serverName: string, reason: string)
}
```

#### ToolExecutionError

```typescript
class ToolExecutionError extends MCPError {
  constructor(toolName: string, serverName: string, originalError: Error)
}
```

## Utility Functions

### Error Utilities

#### `getErrorMessage(error)`

Extract error message from unknown error type.

```typescript
function getErrorMessage(error: unknown): string
```

#### `formatErrorWithContext(context, error)`

Format error with context for logging.

```typescript
function formatErrorWithContext(context: string, error: unknown): string
```

#### `logError(context, error)`

Log error with context.

```typescript
function logError(context: string, error: unknown): void
```

#### `logWarning(context, error)`

Log warning with context.

```typescript
function logWarning(context: string, error: unknown): void
```

### Async Utilities

#### `safeAsync(operation, fallback, errorMessage)`

Safe async operation wrapper.

```typescript
async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback: T,
  errorMessage: string
): Promise<T>
```

### Configuration Utilities

#### `parseConfigInput(input)`

Parse configuration input to determine format.

```typescript
function parseConfigInput(input: string): {
  type: 'url' | 'command' | 'json'
  serverName: string
  mcpUseConfig: { command: string; args: string[]; env?: Record<string, string> } | null
  url?: string
  error?: string
} | null
```

#### `validateConfigInput(input)`

Validate configuration input.

```typescript
function validateConfigInput(input: string): string | null
```

#### `toMCPUseFormat(config)`

Convert MCPServerConfig to mcp-use format.

```typescript
function toMCPUseFormat(config: MCPServerConfig): {
  serverName: string
  command: string
  args: string[]
  env?: Record<string, string>
} | null
```

### Retry Utilities

#### `withRetry(fn, policy?, onRetry?)`

Execute function with retry logic.

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  policy?: RetryPolicy,
  onRetry?: (attempt: number, error: Error, nextRetryIn: number) => void
): Promise<T>
```

#### `isTransientError(error, policy)`

Classify error as transient or permanent.

```typescript
function isTransientError(error: Error, policy: RetryPolicy): boolean
```

#### `calculateRetryDelay(attempt, policy)`

Calculate next retry delay with exponential backoff.

```typescript
function calculateRetryDelay(attempt: number, policy: RetryPolicy): number
```

## Constants

### Default Values

```typescript
const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 5,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
  transientErrorCodes: ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', ...]
}

const MCP_CONFIG_EXAMPLES = {
  command: { /* ... */ },
  json: { /* ... */ },
  url: { /* ... */ }
}
```

## Migration Guide

### From Plugin Internal API

If you're migrating from the plugin's internal MCP API:

1. **Replace imports**: Change from `'./mcp/Module'` to `'@tars/mcp-hosting'`
2. **Add adapters**: Implement ILogger, IStatusReporter, INotificationHandler for your host
3. **Update initialization**: Pass adapters to MCPServerManager constructor
4. **Update error handling**: Use new error classes and type guards

### Example Migration

```typescript
// Before (plugin internal)
import { MCPServerManager } from './mcp/managerMCPUse'
const manager = new MCPServerManager()

// After (mcp-hosting package)
import { MCPServerManager, ObsidianLogger, StatusBarReporter } from '@tars/mcp-hosting'
const manager = new MCPServerManager({
  logger: new ObsidianLogger(),
  statusReporter: new StatusBarReporter(statusBar)
})