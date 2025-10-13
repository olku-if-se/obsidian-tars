# Integration Guide

This guide explains how to integrate the `@tars/mcp-hosting` package into different host environments.

## Overview

The package is designed to be host-agnostic through abstract interfaces. To use it in your application, you need to:

1. **Implement Abstract Interfaces**: Create adapters for your host environment
2. **Initialize Components**: Set up MCPServerManager and ToolExecutor with your adapters
3. **Handle Events**: Listen to server and execution events
4. **Configure Servers**: Define MCP server configurations

## Step 1: Implement Abstract Interfaces

### ILogger Implementation

Create a logger adapter for your environment:

```typescript
import type { ILogger } from '@tars/mcp-hosting'

export class MyLogger implements ILogger {
  private prefix: string

  constructor(prefix = '[MCP]') {
    this.prefix = prefix
  }

  debug(message: string, context?: Record<string, unknown>): void {
    console.debug(`${this.prefix} ${message}`, context)
  }

  info(message: string, context?: Record<string, unknown>): void {
    console.info(`${this.prefix} ${message}`, context)
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(`${this.prefix} ${message}`, context)
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    console.error(`${this.prefix} ${message}`, error, context)
  }
}
```

### IStatusReporter Implementation

Create a status reporter for your environment:

```typescript
import type { IStatusReporter } from '@tars/mcp-hosting'

export class MyStatusReporter implements IStatusReporter {
  reportServerStatus(serverId: string, status: 'connected' | 'disconnected' | 'error' | 'retrying'): void {
    // Update your UI or send metrics
    console.log(`Server ${serverId} status: ${status}`)
  }

  reportActiveExecutions(count: number): void {
    // Update active execution count in your UI
    console.log(`Active executions: ${count}`)
  }

  reportSessionCount(documentPath: string, count: number, limit: number): void {
    // Update session count for document
    console.log(`Document ${documentPath}: ${count}/${limit} sessions`)
  }

  reportError(type: string, message: string, error: Error, context?: Record<string, unknown>): void {
    // Log or report errors to your error tracking system
    console.error(`[${type}] ${message}`, error, context)
  }
}
```

### INotificationHandler Implementation

Create a notification handler for user interactions:

```typescript
import type { INotificationHandler } from '@tars/mcp-hosting'

export class MyNotificationHandler implements INotificationHandler {
  async onSessionLimitReached(documentPath: string, limit: number, current: number): Promise<'continue' | 'cancel'> {
    // Show user dialog or notification
    const userChoice = await showDialog(
      `Session limit reached for ${documentPath}`,
      `Current: ${current}, Limit: ${limit}`,
      ['Continue', 'Cancel']
    )
    return userChoice === 'Continue' ? 'continue' : 'cancel'
  }

  onSessionReset(documentPath: string): void {
    // Notify user that session was reset
    showNotification(`Session counter reset for ${documentPath}`)
  }

  onServerAutoDisabled(serverId: string, serverName: string, failureCount: number): void {
    // Notify user that server was auto-disabled
    showNotification(`Server "${serverName}" disabled after ${failureCount} failures`)
  }
}
```

## Step 2: Initialize Components

### Basic Setup

```typescript
import { MCPServerManager, ToolExecutor } from '@tars/mcp-hosting'
import { MyLogger, MyStatusReporter, MyNotificationHandler } from './adapters'

// Create adapters
const logger = new MyLogger()
const statusReporter = new MyStatusReporter()
const notificationHandler = new MyNotificationHandler()

// Initialize server manager
const manager = new MCPServerManager({
  logger,
  statusReporter
})

// Initialize tool executor
const tracker = {
  concurrentLimit: 3,
  sessionLimit: 50,
  activeExecutions: new Set<string>(),
  totalExecuted: 0,
  stopped: false,
  executionHistory: []
}

const executor = new ToolExecutor(manager, tracker, {
  logger,
  statusReporter,
  notificationHandler
})
```

### Server Configuration

Configure your MCP servers:

```typescript
const serverConfigs = [
  {
    id: 'filesystem',
    name: 'Filesystem',
    configInput: 'npx @modelcontextprotocol/server-filesystem /path/to/files',
    enabled: true,
    failureCount: 0,
    autoDisabled: false
  },
  {
    id: 'memory',
    name: 'Memory',
    configInput: 'npx @modelcontextprotocol/server-memory',
    enabled: true,
    failureCount: 0,
    autoDisabled: false
  }
]

// Initialize servers
await manager.initialize(serverConfigs, {
  failureThreshold: 3,
  retryPolicy: {
    maxAttempts: 5,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
    transientErrorCodes: ['ECONNREFUSED', 'ETIMEDOUT']
  }
})
```

## Step 3: Handle Events

Listen to server and execution events:

```typescript
// Server lifecycle events
manager.on('server-started', (serverId) => {
  console.log(`Server ${serverId} started`)
})

manager.on('server-stopped', (serverId) => {
  console.log(`Server ${serverId} stopped`)
})

manager.on('server-failed', (serverId, error) => {
  console.error(`Server ${serverId} failed:`, error)
})

manager.on('server-auto-disabled', (serverId) => {
  console.log(`Server ${serverId} auto-disabled due to failures`)
})

manager.on('server-retry', (serverId, attempt, nextRetryIn, error) => {
  console.log(`Server ${serverId} retry attempt ${attempt} in ${nextRetryIn}ms`)
})
```

## Step 4: Execute Tools

Execute tools with the configured executor:

```typescript
try {
  const result = await executor.executeTool({
    serverId: 'filesystem',
    toolName: 'read_file',
    parameters: {
      path: '/path/to/file.txt'
    },
    source: 'user-codeblock',
    documentPath: 'document.md'
  })

  console.log('Tool result:', result)
} catch (error) {
  console.error('Tool execution failed:', error)
}
```

## Environment-Specific Integrations

### CLI Application

For CLI applications, use simple console-based adapters:

```typescript
import { MCPServerManager, ToolExecutor, ConsoleLogger } from '@tars/mcp-hosting'

const logger = new ConsoleLogger('[MCP-CLI]')
const statusReporter = new NoOpStatusReporter()
const notificationHandler = new DefaultNotificationHandler()

const manager = new MCPServerManager({ logger, statusReporter })
const executor = new ToolExecutor(manager, tracker, {
  logger,
  statusReporter,
  notificationHandler
})
```

### Web Application

For web applications, implement DOM-based notifications:

```typescript
class WebNotificationHandler implements INotificationHandler {
  async onSessionLimitReached(documentPath: string, limit: number, current: number) {
    const modal = document.getElementById('mcp-modal')
    modal.style.display = 'block'
    // Show modal with continue/cancel options
    return new Promise((resolve) => {
      // Set up event listeners for buttons
      document.getElementById('continue-btn').onclick = () => {
        modal.style.display = 'none'
        resolve('continue')
      }
      document.getElementById('cancel-btn').onclick = () => {
        modal.style.display = 'none'
        resolve('cancel')
      }
    })
  }

  onSessionReset(documentPath: string): void {
    this.showToast(`Session reset for ${documentPath}`)
  }

  onServerAutoDisabled(serverId: string, serverName: string, failureCount: number): void {
    this.showToast(`Server ${serverName} disabled after ${failureCount} failures`)
  }

  private showToast(message: string): void {
    // Show toast notification
  }
}
```

### VS Code Extension

For VS Code extensions, use VS Code APIs:

```typescript
import * as vscode from 'vscode'
import type { INotificationHandler, ILogger, IStatusReporter } from '@tars/mcp-hosting'

export class VSCodeLogger implements ILogger {
  private channel: vscode.OutputChannel

  constructor() {
    this.channel = vscode.window.createOutputChannel('MCP')
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.channel.appendLine(`[DEBUG] ${message}`)
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.channel.appendLine(`[INFO] ${message}`)
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.channel.appendLine(`[WARN] ${message}`)
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.channel.appendLine(`[ERROR] ${message}: ${error?.message}`)
  }
}

export class VSCodeNotificationHandler implements INotificationHandler {
  async onSessionLimitReached(documentPath: string, limit: number, current: number) {
    const choice = await vscode.window.showWarningMessage(
      `Session limit reached for ${documentPath} (${current}/${limit})`,
      'Continue',
      'Cancel'
    )
    return choice === 'Continue' ? 'continue' : 'cancel'
  }

  onSessionReset(documentPath: string): void {
    vscode.window.showInformationMessage(`Session counter reset for ${documentPath}`)
  }

  onServerAutoDisabled(serverId: string, serverName: string, failureCount: number): void {
    vscode.window.showWarningMessage(`Server "${serverName}" disabled after ${failureCount} failures`)
  }
}
```

## Error Handling

Handle different types of errors appropriately:

```typescript
import {
  isMCPError,
  isConnectionError,
  isExecutionLimitError,
  isTimeoutError
} from '@tars/mcp-hosting'

try {
  await executor.executeTool(request)
} catch (error) {
  if (isExecutionLimitError(error)) {
    // Handle session or concurrent limit exceeded
    if (error.limitType === 'session') {
      // Offer to reset session or continue
    } else {
      // Wait for concurrent executions to complete
    }
  } else if (isConnectionError(error)) {
    // Handle connection issues
    showError('Connection failed. Please check server configuration.')
  } else if (isTimeoutError(error)) {
    // Handle timeout
    showError('Tool execution timed out. Please try again.')
  } else if (isMCPError(error)) {
    // Handle other MCP errors
    showError(`MCP Error: ${error.message}`)
  } else {
    // Handle unexpected errors
    showError('An unexpected error occurred')
  }
}
```

## Performance Considerations

### Caching

The package includes built-in result caching. Configure TTL appropriately:

```typescript
const executor = new ToolExecutor(manager, tracker, {
  enableCache: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
})

// Monitor cache performance
const stats = executor.getCacheStats()
console.log(`Cache hit rate: ${stats.hitRate}%`)
```

### Concurrent Limits

Configure concurrent execution limits based on your environment:

```typescript
const tracker = {
  concurrentLimit: 3,  // Adjust based on server capacity
  sessionLimit: 100,  // Adjust based on memory constraints
  activeExecutions: new Set<string>(),
  totalExecuted: 0,
  stopped: false,
  executionHistory: []
}
```

### Health Monitoring

Set up periodic health checks:

```typescript
// Check server health every 30 seconds
setInterval(async () => {
  try {
    await manager.performHealthCheck()
  } catch (error) {
    logger.error('Health check failed', error)
  }
}, 30000)
```

## Testing

Test your integration thoroughly:

```typescript
import { MCPServerManager, ToolExecutor, NoOpLogger, NoOpStatusReporter, DefaultNotificationHandler } from '@tars/mcp-hosting'

describe('My MCP Integration', () => {
  let manager: MCPServerManager
  let executor: ToolExecutor

  beforeEach(() => {
    manager = new MCPServerManager({
      logger: new NoOpLogger(),
      statusReporter: new NoOpStatusReporter()
    })

    const tracker = {
      concurrentLimit: 10,
      sessionLimit: -1,
      activeExecutions: new Set<string>(),
      totalExecuted: 0,
      stopped: false,
      executionHistory: []
    }

    executor = new ToolExecutor(manager, tracker, {
      logger: new NoOpLogger(),
      statusReporter: new NoOpStatusReporter(),
      notificationHandler: new DefaultNotificationHandler()
    })
  })

  it('should execute tools successfully', async () => {
    // Mock server setup
    await manager.initialize([/* server configs */])

    // Test tool execution
    const result = await executor.executeTool({
      serverId: 'test-server',
      toolName: 'test-tool',
      parameters: {},
      source: 'user-codeblock',
      documentPath: 'test.md'
    })

    expect(result).toBeDefined()
  })
})
```

## Troubleshooting

### Common Issues

#### "mcp-use not found" Error

Ensure mcp-use is installed as a dependency and marked as external in your build system:

```javascript
// esbuild.config.js
export default {
  external: ['mcp-use', '@modelcontextprotocol/sdk']
}
```

#### Server Connection Failures

Check server configuration and network connectivity:

```typescript
// Enable detailed logging
const logger = new MyLogger()
logger.debug('Server configuration', { config })

// Check for common issues
const parsed = parseConfigInput(configInput)
if (parsed?.error) {
  console.error('Configuration error:', parsed.error)
}
```

#### Memory Leaks

Monitor execution cleanup:

```typescript
// Check for active executions that weren't cleaned up
const stats = executor.getStats()
if (stats.activeExecutions > 0) {
  console.warn(`${stats.activeExecutions} executions may not have been cleaned up`)
}
```

### Debug Mode

Enable debug logging for troubleshooting:

```typescript
const logger = new MyLogger()
logger.debug('Detailed operation info', { context })

// Monitor all server events
manager.on('server-started', (id) => logger.info(`Server started: ${id}`))
manager.on('server-failed', (id, error) => logger.error(`Server failed: ${id}`, error))
```

## Best Practices

1. **Always implement all three adapters** (ILogger, IStatusReporter, INotificationHandler)
2. **Handle errors gracefully** with appropriate user feedback
3. **Monitor performance** and adjust limits as needed
4. **Use caching** to improve performance for repeated operations
5. **Clean up resources** in shutdown handlers
6. **Test thoroughly** with various failure scenarios
7. **Log appropriately** for debugging and monitoring

## Support

For issues and questions:

1. Check this integration guide
2. Review the API documentation
3. Look at the example implementations
4. Check existing tests for usage patterns
5. Open an issue in the main TARS repository

## Next Steps

After successful integration:

1. **Monitor performance** in production
2. **Gather user feedback** on the integration
3. **Consider contributing** adapters for other environments
4. **Plan for future enhancements** based on usage patterns