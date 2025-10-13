# @tars/mcp-hosting

[![npm version](https://badge.fury.io/js/@tars/mcp-hosting.svg)](https://badge.fury.io/js/@tars/mcp-hosting)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A standalone MCP (Model Context Protocol) server hosting and execution infrastructure package extracted from the Obsidian TARS plugin. This package provides reusable MCP hosting capabilities for any Node.js application.

## Features

- 🚀 **Server Lifecycle Management**: Start, stop, and monitor MCP servers with automatic retry logic
- ⚡ **Tool Execution**: Execute MCP tools with concurrent limits, session tracking, and caching
- 📦 **Result Caching**: Built-in caching with TTL-based expiration and cache statistics
- 🔄 **Retry Logic**: Exponential backoff with jitter for resilient server connections
- 🎯 **Abstract Interfaces**: Host-agnostic design with pluggable adapters for logging, status reporting, and notifications
- 🧪 **Comprehensive Testing**: Full test coverage with unit, integration, and E2E tests

## Installation

```bash
npm install @tars/mcp-hosting
```

## Quick Start

### Basic Usage

```typescript
import { MCPServerManager, ToolExecutor, ConsoleLogger } from '@tars/mcp-hosting'

// Initialize server manager with console logging
const manager = new MCPServerManager({
  logger: new ConsoleLogger('[MCP]')
})

// Configure servers
await manager.initialize([
  {
    id: 'filesystem',
    name: 'Filesystem',
    configInput: 'npx @modelcontextprotocol/server-filesystem /path/to/files',
    enabled: true,
    failureCount: 0,
    autoDisabled: false
  }
])

// Create execution tracker
const tracker = {
  concurrentLimit: 3,
  sessionLimit: 50,
  activeExecutions: new Set<string>(),
  totalExecuted: 0,
  stopped: false,
  executionHistory: []
}

// Create tool executor
const executor = new ToolExecutor(manager, tracker, {
  logger: new ConsoleLogger('[MCP]'),
  timeout: 30000
})

// Execute a tool
const result = await executor.executeTool({
  serverId: 'filesystem',
  toolName: 'read_file',
  parameters: { path: '/path/to/file.txt' },
  source: 'user-codeblock',
  documentPath: 'document.md'
})

console.log('Tool result:', result)
```

### Using in Obsidian Plugin

```typescript
import { MCPServerManager, ToolExecutor } from '@tars/mcp-hosting'
import { ObsidianLogger, StatusBarReporter, ModalNotifier } from './adapters'

// Create Obsidian-specific adapters
const logger = new ObsidianLogger(this.app)
const statusReporter = new StatusBarReporter(this.statusBarManager)
const notifier = new ModalNotifier(this.app)

// Initialize with adapters
const manager = new MCPServerManager({ logger, statusReporter })
await manager.initialize(this.settings.mcpServers)

const tracker = {
  concurrentLimit: this.settings.mcpConcurrentLimit,
  sessionLimit: this.settings.mcpSessionLimit,
  activeExecutions: new Set<string>(),
  totalExecuted: 0,
  stopped: false,
  executionHistory: []
}

const executor = new ToolExecutor(manager, tracker, {
  logger,
  statusReporter,
  notificationHandler: notifier,
  sessionNotifications: createNoticeSessionNotifications()
})
```

## Architecture

The package is designed with clean separation of concerns:

```
packages/mcp-hosting/
├── src/
│   ├── manager/          # MCPServerManager, health monitoring
│   ├── executor/         # ToolExecutor, session tracking
│   ├── caching/          # ResultCache, ToolDiscoveryCache
│   ├── retry/            # Retry logic, error classification
│   ├── adapters/         # Abstract interfaces (ILogger, etc.)
│   ├── types/            # Core type definitions
│   ├── errors/           # Error classes
│   └── utils/            # Utility functions
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
└── docs/
    ├── API.md            # API reference
    ├── INTEGRATION.md    # Integration guide
    └── EXAMPLES.md       # Usage examples
```

## Abstract Interfaces

The package uses abstract interfaces to decouple from specific host environments:

### ILogger

```typescript
interface ILogger {
  debug(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, error?: Error, context?: Record<string, unknown>): void
}
```

### IStatusReporter

```typescript
interface IStatusReporter {
  reportServerStatus(serverId: string, status: 'connected' | 'disconnected' | 'error' | 'retrying'): void
  reportActiveExecutions(count: number): void
  reportSessionCount(documentPath: string, count: number, limit: number): void
  reportError(type: string, message: string, error: Error, context?: Record<string, unknown>): void
}
```

### INotificationHandler

```typescript
interface INotificationHandler {
  onSessionLimitReached(documentPath: string, limit: number, current: number): Promise<'continue' | 'cancel'>
  onSessionReset(documentPath: string): void
  onServerAutoDisabled(serverId: string, serverName: string, failureCount: number): void
}
```

## Configuration

### Server Configuration

```typescript
interface MCPServerConfig {
  id: string
  name: string
  configInput: string  // URL, command, or JSON format
  enabled: boolean
  failureCount: number
  autoDisabled: boolean
}
```

### Configuration Input Formats

The package supports multiple configuration formats:

#### Command Format
```typescript
{
  configInput: 'npx @modelcontextprotocol/server-filesystem /path/to/files'
}
```

#### JSON Format (Claude Desktop compatible)
```typescript
{
  configInput: JSON.stringify({
    mcpServers: {
      filesystem: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/files']
      }
    }
  })
}
```

#### URL Format (SSE via mcp-remote)
```typescript
{
  configInput: 'https://mcp.example.com'
}
```

## Error Handling

The package provides comprehensive error handling with custom error classes:

```typescript
import {
  MCPError,
  ConnectionError,
  ToolNotFoundError,
  ExecutionLimitError,
  ServerNotAvailableError
} from '@tars/mcp-hosting'

// All errors include timestamp, code, and optional details
try {
  await executor.executeTool(request)
} catch (error) {
  if (error instanceof ExecutionLimitError) {
    console.log('Session limit reached:', error.current, 'of', error.limit)
  }
}
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Development

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Linting

```bash
npm run lint
npm run format
```

## License

MIT © TARS Development Team

## Contributing

This package is extracted from the Obsidian TARS plugin. For contributions, please refer to the main project's contributing guidelines.

## Related Packages

- **Obsidian TARS Plugin**: The main Obsidian plugin that uses this package
- **@tars/streams**: Shared streaming utilities

## Changelog

### v3.5.0
- Initial release as standalone package
- Extracted from Obsidian TARS plugin v3.5.0
- Added abstract interfaces for host integration
- Comprehensive test coverage
- Zero external dependencies beyond MCP SDK
