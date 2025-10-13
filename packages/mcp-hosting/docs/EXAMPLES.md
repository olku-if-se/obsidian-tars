# Usage Examples

This document provides practical examples of using the `@tars/mcp-hosting` package in different scenarios.

## Basic CLI Tool

Create a simple CLI tool that uses MCP servers:

```typescript
#!/usr/bin/env node

import { MCPServerManager, ToolExecutor, ConsoleLogger } from '@tars/mcp-hosting'
import { Command } from 'commander'

const program = new Command()

program
  .name('mcp-cli')
  .description('CLI tool for MCP server interaction')
  .version('1.0.0')

program
  .command('list-tools')
  .description('List available tools from MCP servers')
  .action(async () => {
    const logger = new ConsoleLogger('[MCP-CLI]')
    const manager = new MCPServerManager({ logger })

    try {
      await manager.initialize([
        {
          id: 'filesystem',
          name: 'Filesystem',
          configInput: 'npx @modelcontextprotocol/server-filesystem /tmp',
          enabled: true,
          failureCount: 0,
          autoDisabled: false
        }
      ])

      const servers = manager.listServers()
      for (const server of servers) {
        if (server.enabled) {
          const client = manager.getClient(server.id)
          if (client) {
            try {
              const tools = await client.listTools()
              console.log(`\n${server.name} (${server.id}):`)
              tools.forEach(tool => {
                console.log(`  - ${tool.name}: ${tool.description || 'No description'}`)
              })
            } catch (error) {
              console.error(`Failed to list tools for ${server.name}:`, error)
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize MCP manager:', error)
    } finally {
      await manager.shutdown()
    }
  })

program
  .command('execute <server> <tool>')
  .description('Execute a tool')
  .option('-p, --param <key=value>', 'Tool parameters', [])
  .action(async (serverId, toolName, options) => {
    const logger = new ConsoleLogger('[MCP-CLI]')
    const manager = new MCPServerManager({ logger })

    try {
      // Parse parameters
      const parameters: Record<string, unknown> = {}
      options.param.forEach((param: string) => {
        const [key, ...values] = param.split('=')
        const value = values.join('=')
        if (key && value !== undefined) {
          // Try to parse as JSON, fallback to string
          try {
            parameters[key] = JSON.parse(value)
          } catch {
            parameters[key] = value
          }
        }
      })

      await manager.initialize([
        {
          id: serverId,
          name: serverId,
          configInput: `npx @modelcontextprotocol/server-${serverId}`,
          enabled: true,
          failureCount: 0,
          autoDisabled: false
        }
      ])

      const tracker = {
        concurrentLimit: 1,
        sessionLimit: -1,
        activeExecutions: new Set<string>(),
        totalExecuted: 0,
        stopped: false,
        executionHistory: []
      }

      const executor = new ToolExecutor(manager, tracker, { logger })

      const result = await executor.executeTool({
        serverId,
        toolName,
        parameters,
        source: 'user-codeblock',
        documentPath: 'cli-execution'
      })

      console.log('Result:', JSON.stringify(result, null, 2))
    } catch (error) {
      console.error('Tool execution failed:', error)
    } finally {
      await manager.shutdown()
    }
  })

program.parse()
```

## Web Application Integration

Integrate MCP hosting into a web application:

```typescript
import { MCPServerManager, ToolExecutor } from '@tars/mcp-hosting'

// Web-specific adapters
class WebLogger {
  debug(message: string, context?: Record<string, unknown>): void {
    console.debug(`[MCP] ${message}`, context)
  }

  info(message: string, context?: Record<string, unknown>): void {
    console.info(`[MCP] ${message}`, context)
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(`[MCP] ${message}`, context)
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    console.error(`[MCP] ${message}`, error, context)
  }
}

class WebStatusReporter {
  private statusElement: HTMLElement

  constructor(statusElement: HTMLElement) {
    this.statusElement = statusElement
  }

  reportServerStatus(serverId: string, status: 'connected' | 'disconnected' | 'error' | 'retrying'): void {
    const indicator = this.statusElement.querySelector(`[data-server="${serverId}"]`)
    if (indicator) {
      indicator.className = `server-status ${status}`
    }
  }

  reportActiveExecutions(count: number): void {
    const counter = this.statusElement.querySelector('.active-executions')
    if (counter) {
      counter.textContent = `Active: ${count}`
    }
  }

  reportSessionCount(documentPath: string, count: number, limit: number): void {
    // Update document-specific counters
  }

  reportError(type: string, message: string, error: Error, context?: Record<string, unknown>): void {
    // Show error in UI or send to error tracking
    this.showErrorToast(message)
  }

  private showErrorToast(message: string): void {
    // Show toast notification
  }
}

class WebNotificationHandler {
  async onSessionLimitReached(documentPath: string, limit: number, current: number): Promise<'continue' | 'cancel'> {
    return new Promise((resolve) => {
      const modal = document.getElementById('session-limit-modal') as HTMLDialogElement
      modal.showModal()

      const continueBtn = document.getElementById('continue-session')
      const cancelBtn = document.getElementById('cancel-session')

      const cleanup = (result: 'continue' | 'cancel') => {
        modal.close()
        resolve(result)
      }

      continueBtn?.addEventListener('click', () => cleanup('continue'))
      cancelBtn?.addEventListener('click', () => cleanup('cancel'))
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

// Usage in React component
export function useMCP() {
  const [manager, setManager] = useState<MCPServerManager | null>(null)
  const [executor, setExecutor] = useState<ToolExecutor | null>(null)

  useEffect(() => {
    const initializeMCP = async () => {
      const logger = new WebLogger()
      const statusReporter = new WebStatusReporter(document.getElementById('mcp-status')!)
      const notificationHandler = new WebNotificationHandler()

      const mcpManager = new MCPServerManager({ logger, statusReporter })

      // Configure servers from user settings or defaults
      const servers = await loadMCPServers()
      await mcpManager.initialize(servers)

      const tracker = {
        concurrentLimit: 3,
        sessionLimit: 50,
        activeExecutions: new Set<string>(),
        totalExecuted: 0,
        stopped: false,
        executionHistory: []
      }

      const toolExecutor = new ToolExecutor(mcpManager, tracker, {
        logger,
        statusReporter,
        notificationHandler
      })

      setManager(mcpManager)
      setExecutor(toolExecutor)
    }

    initializeMCP()

    return () => {
      manager?.shutdown()
    }
  }, [])

  const executeTool = useCallback(async (request: ToolExecutionRequest) => {
    if (!executor) throw new Error('MCP not initialized')
    return executor.executeTool(request)
  }, [executor])

  return { executeTool, manager, executor }
}
```

## VS Code Extension

Create a VS Code extension with MCP support:

```typescript
import * as vscode from 'vscode'
import { MCPServerManager, ToolExecutor } from '@tars/mcp-hosting'

// VS Code specific adapters
export class VSCodeLogger {
  private channel: vscode.OutputChannel

  constructor(context: vscode.ExtensionContext) {
    this.channel = vscode.window.createOutputChannel('MCP Extension')
    context.subscriptions.push(this.channel)
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

export class VSCodeStatusReporter {
  private statusBarItem: vscode.StatusBarItem

  constructor(context: vscode.ExtensionContext) {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
    this.statusBarItem.show()
    context.subscriptions.push(this.statusBarItem)
  }

  reportServerStatus(serverId: string, status: 'connected' | 'disconnected' | 'error' | 'retrying'): void {
    const statusText = {
      connected: '$(check) Connected',
      disconnected: '$(x) Disconnected',
      error: '$(error) Error',
      retrying: '$(sync~spin) Retrying'
    }[status]

    this.statusBarItem.text = `MCP: ${statusText}`
  }

  reportActiveExecutions(count: number): void {
    if (count > 0) {
      this.statusBarItem.text = `MCP: ${count} active`
    }
  }

  reportSessionCount(documentPath: string, count: number, limit: number): void {
    // Update document-specific status if needed
  }

  reportError(type: string, message: string, error: Error, context?: Record<string, unknown>): void {
    vscode.window.showErrorMessage(`MCP ${type}: ${message}`)
  }
}

export class VSCodeNotificationHandler {
  async onSessionLimitReached(documentPath: string, limit: number, current: number): Promise<'continue' | 'cancel'> {
    const choice = await vscode.window.showWarningMessage(
      `MCP session limit reached for ${documentPath}`,
      `Current: ${current}/${limit}`,
      'Continue',
      'Cancel'
    )

    return choice === 'Continue' ? 'continue' : 'cancel'
  }

  onSessionReset(documentPath: string): void {
    vscode.window.showInformationMessage(`MCP session reset for ${documentPath}`)
  }

  onServerAutoDisabled(serverId: string, serverName: string, failureCount: number): void {
    vscode.window.showWarningMessage(
      `MCP server "${serverName}" has been automatically disabled after ${failureCount} consecutive failures`
    )
  }
}

// Extension activation
export async function activate(context: vscode.ExtensionContext) {
  const logger = new VSCodeLogger(context)
  const statusReporter = new VSCodeStatusReporter(context)
  const notificationHandler = new VSCodeNotificationHandler()

  const manager = new MCPServerManager({ logger, statusReporter })

  // Load server configurations from VS Code settings
  const config = vscode.workspace.getConfiguration('mcp')
  const servers = config.get<MCPServerConfig[]>('servers') || []

  await manager.initialize(servers)

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

  // Register commands
  const executeCommand = vscode.commands.registerCommand('mcp.executeTool', async () => {
    const toolName = await vscode.window.showInputBox({
      prompt: 'Enter tool name (format: server:tool)',
      placeHolder: 'filesystem:read_file'
    })

    if (!toolName) return

    const [serverId, tool] = toolName.split(':')
    if (!serverId || !tool) {
      vscode.window.showErrorMessage('Invalid format. Use: server:tool')
      return
    }

    try {
      const result = await executor.executeTool({
        serverId,
        toolName: tool,
        parameters: {},
        source: 'user-codeblock',
        documentPath: vscode.window.activeTextEditor?.document.fileName || 'untitled'
      })

      const output = typeof result.content === 'string'
        ? result.content
        : JSON.stringify(result.content, null, 2)

      const document = await vscode.workspace.openTextDocument({
        content: output,
        language: 'json'
      })
      await vscode.window.showTextDocument(document)
    } catch (error) {
      vscode.window.showErrorMessage(`Tool execution failed: ${error}`)
    }
  })

  context.subscriptions.push(executeCommand)

  // Cleanup on deactivation
  context.subscriptions.push({
    dispose: () => {
      manager.shutdown()
    }
  })
}
```

## Docker Container Integration

Use MCP hosting in a Docker container:

```typescript
import { MCPServerManager, ToolExecutor } from '@tars/mcp-hosting'
import { Docker } from 'dockerode'

class DockerLogger {
  debug(message: string, context?: Record<string, unknown>): void {
    console.debug(`[MCP-Docker] ${message}`, context)
  }

  info(message: string, context?: Record<string, unknown>): void {
    console.info(`[MCP-Docker] ${message}`, context)
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(`[MCP-Docker] ${message}`, context)
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    console.error(`[MCP-Docker] ${message}`, error, context)
  }
}

class DockerNotificationHandler {
  async onSessionLimitReached(documentPath: string, limit: number, current: number): Promise<'continue' | 'cancel'> {
    // In container environment, always continue or use simple logic
    console.log(`Session limit reached for ${documentPath}: ${current}/${limit}`)
    return 'continue'
  }

  onSessionReset(documentPath: string): void {
    console.log(`Session reset for ${documentPath}`)
  }

  onServerAutoDisabled(serverId: string, serverName: string, failureCount: number): void {
    console.log(`Server ${serverName} disabled after ${failureCount} failures`)
  }
}

// Container startup script
async function main() {
  const logger = new DockerLogger()
  const statusReporter = {
    reportServerStatus: () => {},
    reportActiveExecutions: () => {},
    reportSessionCount: () => {},
    reportError: (type: string, message: string, error: Error) => {
      logger.error(message, error, { type })
    }
  }
  const notificationHandler = new DockerNotificationHandler()

  const manager = new MCPServerManager({ logger, statusReporter })

  // Configure servers for container environment
  const servers = [
    {
      id: 'filesystem',
      name: 'Filesystem',
      configInput: 'npx @modelcontextprotocol/server-filesystem /app/data',
      enabled: true,
      failureCount: 0,
      autoDisabled: false
    },
    {
      id: 'docker',
      name: 'Docker',
      configInput: JSON.stringify({
        command: 'npx',
        args: ['@modelcontextprotocol/server-docker']
      }),
      enabled: true,
      failureCount: 0,
      autoDisabled: false
    }
  ]

  await manager.initialize(servers)

  const tracker = {
    concurrentLimit: 5,
    sessionLimit: 100,
    activeExecutions: new Set<string>(),
    totalExecuted: 0,
    stopped: false,
    executionHistory: []
  }

  const executor = new ToolExecutor(manager, tracker, {
    logger,
    statusReporter,
    notificationHandler,
    timeout: 60000 // Longer timeout for container operations
  })

  // Set up health check endpoint
  const http = require('http')
  const server = http.createServer(async (req: any, res: any) => {
    if (req.url === '/health') {
      try {
        await manager.performHealthCheck()
        const stats = executor.getStats()
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          status: 'healthy',
          servers: manager.listServers().length,
          activeExecutions: stats.activeExecutions,
          totalExecuted: stats.totalExecuted
        }))
      } catch (error) {
        res.writeHead(503, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'unhealthy', error: error.message }))
      }
    } else if (req.url === '/metrics') {
      const cacheStats = executor.getCacheStats()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        cache: cacheStats,
        execution: executor.getStats()
      }))
    }
  })

  server.listen(8080, () => {
    console.log('MCP container service listening on port 8080')
  })

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Shutting down MCP container service...')
    await manager.shutdown()
    server.close(() => {
      console.log('Shutdown complete')
      process.exit(0)
    })
  })
}

main().catch(console.error)
```

## Electron Application

Integrate MCP hosting into an Electron application:

```typescript
import { app, BrowserWindow, ipcMain } from 'electron'
import { MCPServerManager, ToolExecutor } from '@tars/mcp-hosting'
import * as path from 'path'

class ElectronLogger {
  private mainWindow: BrowserWindow

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
  }

  debug(message: string, context?: Record<string, unknown>): void {
    console.debug(`[MCP] ${message}`, context)
    this.mainWindow.webContents.send('mcp-log', { level: 'debug', message, context })
  }

  info(message: string, context?: Record<string, unknown>): void {
    console.info(`[MCP] ${message}`, context)
    this.mainWindow.webContents.send('mcp-log', { level: 'info', message, context })
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(`[MCP] ${message}`, context)
    this.mainWindow.webContents.send('mcp-log', { level: 'warn', message, context })
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    console.error(`[MCP] ${message}`, error, context)
    this.mainWindow.webContents.send('mcp-error', { message, error: error?.message, context })
  }
}

class ElectronNotificationHandler {
  private mainWindow: BrowserWindow

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
  }

  async onSessionLimitReached(documentPath: string, limit: number, current: number): Promise<'continue' | 'cancel'> {
    return new Promise((resolve) => {
      const choice = this.mainWindow.webContents.send('mcp-session-limit', {
        documentPath,
        limit,
        current
      })

      ipcMain.once('mcp-session-limit-response', (event, response: 'continue' | 'cancel') => {
        resolve(response)
      })
    })
  }

  onSessionReset(documentPath: string): void {
    this.mainWindow.webContents.send('mcp-session-reset', { documentPath })
  }

  onServerAutoDisabled(serverId: string, serverName: string, failureCount: number): void {
    this.mainWindow.webContents.send('mcp-server-disabled', {
      serverId,
      serverName,
      failureCount
    })
  }
}

// Main process setup
let manager: MCPServerManager | null = null
let executor: ToolExecutor | null = null

app.whenReady().then(async () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  const logger = new ElectronLogger(mainWindow)
  const statusReporter = {
    reportServerStatus: (serverId: string, status: string) => {
      mainWindow.webContents.send('mcp-server-status', { serverId, status })
    },
    reportActiveExecutions: (count: number) => {
      mainWindow.webContents.send('mcp-active-executions', { count })
    },
    reportSessionCount: () => {},
    reportError: (type: string, message: string, error: Error) => {
      logger.error(message, error, { type })
    }
  }
  const notificationHandler = new ElectronNotificationHandler(mainWindow)

  manager = new MCPServerManager({ logger, statusReporter })

  // Load servers from app configuration
  const servers = await loadMCPServers()
  await manager.initialize(servers)

  const tracker = {
    concurrentLimit: 3,
    sessionLimit: 50,
    activeExecutions: new Set<string>(),
    totalExecuted: 0,
    stopped: false,
    executionHistory: []
  }

  executor = new ToolExecutor(manager, tracker, {
    logger,
    statusReporter,
    notificationHandler
  })

  // IPC handlers for renderer process
  ipcMain.handle('mcp-execute-tool', async (event, request) => {
    if (!executor) throw new Error('MCP not initialized')
    return executor.executeTool(request)
  })

  ipcMain.handle('mcp-list-servers', async () => {
    if (!manager) throw new Error('MCP not initialized')
    return manager.listServers()
  })

  ipcMain.handle('mcp-get-stats', async () => {
    if (!executor) throw new Error('MCP not initialized')
    return executor.getStats()
  })

  // Cleanup on app quit
  app.on('before-quit', async () => {
    if (manager) {
      await manager.shutdown()
    }
  })
})
```

## Testing Examples

### Unit Tests

```typescript
import { MCPServerManager, ToolExecutor, NoOpLogger, NoOpStatusReporter, DefaultNotificationHandler } from '@tars/mcp-hosting'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
    // Mock server setup would go here
    const mockClient = {
      callTool: vi.fn().mockResolvedValue({
        content: 'test result',
        contentType: 'text' as const,
        executionDuration: 100
      })
    }

    vi.spyOn(manager, 'getClient').mockReturnValue(mockClient as any)

    const result = await executor.executeTool({
      serverId: 'test-server',
      toolName: 'test-tool',
      parameters: {},
      source: 'user-codeblock',
      documentPath: 'test.md'
    })

    expect(result.content).toBe('test result')
    expect(mockClient.callTool).toHaveBeenCalledWith('test-tool', {})
  })

  it('should handle execution limits', async () => {
    const tracker = {
      concurrentLimit: 1,
      sessionLimit: -1,
      activeExecutions: new Set<string>(['existing']),
      totalExecuted: 0,
      stopped: false,
      executionHistory: []
    }

    executor = new ToolExecutor(manager, tracker, {
      logger: new NoOpLogger(),
      statusReporter: new NoOpStatusReporter(),
      notificationHandler: new DefaultNotificationHandler()
    })

    await expect(executor.executeTool({
      serverId: 'test-server',
      toolName: 'test-tool',
      parameters: {},
      source: 'user-codeblock',
      documentPath: 'test.md'
    })).rejects.toThrow('concurrent limit reached')
  })
})
```

### Integration Tests

```typescript
import { MCPServerManager, ToolExecutor } from '@tars/mcp-hosting'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'

describe('MCP Integration Tests', () => {
  let manager: MCPServerManager
  let executor: ToolExecutor

  beforeAll(async () => {
    manager = new MCPServerManager({
      logger: new ConsoleLogger('[TEST]'),
      statusReporter: new NoOpStatusReporter()
    })

    await manager.initialize([
      {
        id: 'memory',
        name: 'Memory',
        configInput: 'npx @modelcontextprotocol/server-memory',
        enabled: true,
        failureCount: 0,
        autoDisabled: false
      }
    ])

    const tracker = {
      concurrentLimit: 3,
      sessionLimit: -1,
      activeExecutions: new Set<string>(),
      totalExecuted: 0,
      stopped: false,
      executionHistory: []
    }

    executor = new ToolExecutor(manager, tracker, {
      logger: new ConsoleLogger('[TEST]'),
      statusReporter: new NoOpStatusReporter(),
      notificationHandler: new DefaultNotificationHandler()
    })
  })

  afterAll(async () => {
    await manager.shutdown()
  })

  it('should execute real tool against memory server', async () => {
    const result = await executor.executeTool({
      serverId: 'memory',
      toolName: 'memory_get',
      parameters: { key: 'test-key' },
      source: 'user-codeblock',
      documentPath: 'test.md'
    })

    expect(result).toBeDefined()
    expect(result.executionDuration).toBeGreaterThan(0)
  })
})
```

## Configuration Examples

### Environment-Based Configuration

```typescript
function loadServersFromEnvironment(): MCPServerConfig[] {
  const servers: MCPServerConfig[] = []

  // Load from environment variables
  if (process.env.MCP_FILESYSTEM_ENABLED === 'true') {
    servers.push({
      id: 'filesystem',
      name: 'Filesystem',
      configInput: process.env.MCP_FILESYSTEM_PATH || '/tmp',
      enabled: true,
      failureCount: 0,
      autoDisabled: false
    })
  }

  if (process.env.MCP_GIT_ENABLED === 'true') {
    servers.push({
      id: 'git',
      name: 'Git',
      configInput: 'npx @modelcontextprotocol/server-git',
      enabled: true,
      failureCount: 0,
      autoDisabled: false
    })
  }

  return servers
}
```

### File-Based Configuration

```typescript
import { readFileSync } from 'fs'
import { parseConfigInput } from '@tars/mcp-hosting'

function loadServersFromFile(configPath: string): MCPServerConfig[] {
  const config = JSON.parse(readFileSync(configPath, 'utf-8'))

  return config.servers.map((server: any) => ({
    id: server.id,
    name: server.name,
    configInput: server.config,
    enabled: server.enabled ?? true,
    failureCount: 0,
    autoDisabled: false
  }))
}
```

## Performance Monitoring

Monitor MCP performance in your application:

```typescript
class PerformanceMonitor {
  private metrics = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageExecutionTime: 0,
    cacheHitRate: 0
  }

  constructor(private executor: ToolExecutor) {}

  startMonitoring(): void {
    setInterval(() => {
      this.collectMetrics()
      this.reportMetrics()
    }, 60000) // Every minute
  }

  private collectMetrics(): void {
    const stats = this.executor.getStats()
    const cacheStats = this.executor.getCacheStats()

    this.metrics = {
      totalExecutions: stats.totalExecuted,
      successfulExecutions: stats.executionHistory.filter(h => h.status === 'success').length,
      failedExecutions: stats.executionHistory.filter(h => h.status === 'error').length,
      averageExecutionTime: this.calculateAverageExecutionTime(stats.executionHistory),
      cacheHitRate: cacheStats.hitRate
    }
  }

  private calculateAverageExecutionTime(history: ExecutionHistoryEntry[]): number {
    const completed = history.filter(h => h.duration > 0)
    if (completed.length === 0) return 0
    return completed.reduce((sum, h) => sum + h.duration, 0) / completed.length
  }

  private reportMetrics(): void {
    console.log('MCP Performance Metrics:', this.metrics)
    // Send to monitoring service
  }
}
```

## Error Recovery Patterns

Implement robust error recovery:

```typescript
class MCPErrorRecovery {
  constructor(private manager: MCPServerManager, private executor: ToolExecutor) {}

  async executeWithRetry(request: ToolExecutionRequest, maxRetries = 3): Promise<ToolExecutionResult> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.executor.executeTool(request)
      } catch (error) {
        lastError = error as Error

        // Check if server is still available
        const server = this.manager.listServers().find(s => s.id === request.serverId)
        if (!server?.enabled) {
          throw new Error(`Server ${request.serverId} is disabled`)
        }

        // Try to restart server if it's a connection error
        if (this.isConnectionError(error) && attempt < maxRetries) {
          try {
            await this.manager.stopServer(request.serverId)
            await this.manager.startServer(request.serverId)
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1000))
            continue
          } catch (restartError) {
            // Restart failed, throw original error
          }
        }

        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          throw lastError
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }

    throw lastError!
  }

  private isConnectionError(error: Error): boolean {
    const message = error.message.toLowerCase()
    return message.includes('connection') || message.includes('timeout') || message.includes('network')
  }
}
```

## Summary

These examples demonstrate how to integrate `@tars/mcp-hosting` into various environments:

- **CLI Tools**: Simple console-based integration for command-line utilities
- **Web Applications**: DOM-based notifications and status reporting
- **VS Code Extensions**: Integration with VS Code APIs for editor features
- **Docker Containers**: Container-optimized configuration and health monitoring
- **Electron Apps**: Desktop application integration with IPC communication
- **Testing**: Comprehensive testing patterns for reliable integration

Choose the appropriate adapters and configuration for your specific use case, and remember to handle errors gracefully and monitor performance in production environments.