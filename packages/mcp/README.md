# @tars/mcp

Model Context Protocol (MCP) server integration for the Tars ecosystem.

## Overview

This package provides MCP server integration, allowing Tars to connect to and interact with MCP servers for enhanced capabilities like file system access, web browsing, database queries, and more.

## Installation

```bash
pnpm add @tars/mcp
```

## What is MCP?

The Model Context Protocol (MCP) enables AI models to securely interact with external tools and data sources through standardized server implementations.

## Features

- **Server Management**: Connect to multiple MCP servers simultaneously
- **Tool Discovery**: Automatically discover available tools from connected servers
- **Resource Access**: Access files, databases, APIs through MCP servers
- **Standardized Interface**: Unified API for different MCP servers
- **Error Handling**: Robust error handling and connection management
- **Configuration**: Flexible server configuration and management

## Usage

### Basic Server Connection

```typescript
import { MCPClient, MCPServerConfig } from '@tars/mcp';

// Configure MCP server
const serverConfig: MCPServerConfig = {
  id: 'filesystem',
  name: 'File System Server',
  command: 'npx',
  args: ['@modelcontextprotocol/server-filesystem', '/path/to/files'],
  env: {
    NODE_ENV: 'production'
  }
};

// Create client and connect
const client = new MCPClient();
await client.connect(serverConfig);

// List available tools
const tools = await client.listTools();
console.log('Available tools:', tools);
```

### Tool Execution

```typescript
import { MCPClient } from '@tars/mcp';

const client = new MCPClient();
await client.connect(serverConfig);

// Execute a tool
const result = await client.callTool('read_file', {
  path: '/path/to/file.txt'
});

if (result.success) {
  console.log('File content:', result.result);
} else {
  console.error('Error:', result.error);
}
```

### Server Registry

```typescript
import { ServerRegistry } from '@tars/mcp';

const registry = new ServerRegistry();

// Register servers
registry.register({
  id: 'filesystem',
  name: 'File System Access',
  command: 'npx',
  args: ['@modelcontextprotocol/server-filesystem', './docs']
});

registry.register({
  id: 'web-search',
  name: 'Web Search',
  command: 'npx',
  args: ['@modelcontextprotocol/server-web-search']
});

// Get all servers
const servers = registry.getAll();

// Connect to all servers
for (const server of servers) {
  await client.connect(server);
}
```

### Integration with AI Providers

```typescript
import { MCPClient, createVendor } from '@tars/mcp';
import { createVendor as createAIVendor } from '@tars/providers';

// Set up MCP client
const mcpClient = new MCPClient();
await mcpClient.connect(filesystemServer);

// Create AI provider with MCP tools
const aiProvider = createAIVendor('openai', {
  apiKey: 'your-key',
  tools: await mcpClient.getToolsForAI()
});

// Use AI with MCP tools
const response = await aiProvider.sendRequest({
  messages: [
    {
      role: 'user',
      content: 'Read the README.md file and summarize it'
    }
  ],
  tools: await mcpClient.getToolsForAI()
});
```

## Available MCP Servers

### File System Server
```typescript
{
  id: 'filesystem',
  name: 'File System Access',
  command: 'npx',
  args: ['@modelcontextprotocol/server-filesystem', '/allowed/path']
}
```

### Web Search Server
```typescript
{
  id: 'web-search',
  name: 'Web Search',
  command: 'npx',
  args: ['@modelcontextprotocol/server-web-search']
}
```

### Database Server
```typescript
{
  id: 'database',
  name: 'Database Access',
  command: 'npx',
  args: ['@modelcontextprotocol/server-postgres', 'postgresql://...']
}
```

### GitHub Server
```typescript
{
  id: 'github',
  name: 'GitHub Integration',
  command: 'npx',
  args: ['@modelcontextprotocol/server-github'],
  env: {
    GITHUB_TOKEN: 'your-github-token'
  }
}
```

## CLI Tools

```bash
# List available MCP servers
tsx packages/mcp/bin/mcp-cli.ts --list-servers

# Connect to a server
tsx packages/mcp/bin/mcp-cli.ts --connect filesystem

# List tools from a server
tsx packages/mcp/bin/mcp-cli.ts --list-tools filesystem

# Execute a tool
tsx packages/mcp/bin/mcp-cli.ts --call-tool read_file --path "./README.md"

# Test server connection
tsx packages/mcp/bin/mcp-cli.ts --test filesystem
```

## Advanced Usage

### Custom Server Implementation

```typescript
import { BaseMCPServer } from '@tars/mcp';

class CustomMCPServer extends BaseMCPServer {
  id = 'custom';
  name = 'Custom Server';
  version = '1.0.0';

  async initialize() {
    // Initialize your server
  }

  getCapabilities() {
    return {
      tools: true,
      resources: true,
      prompts: false
    };
  }

  async callTool(name: string, args: any) {
    // Implement tool logic
    switch (name) {
      case 'custom_tool':
        return this.executeCustomTool(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}
```

### Resource Management

```typescript
import { MCPClient } from '@tars/mcp';

const client = new MCPClient();
await client.connect(serverConfig);

// List available resources
const resources = await client.listResources();

// Read a resource
const content = await client.readResource('file:///path/to/file.txt');

// Subscribe to resource changes
await client.subscribeToResource('file:///path/to/file.txt', (change) => {
  console.log('File changed:', change);
});
```

### Error Handling

```typescript
import { MCPClient, MCPError } from '@tars/mcp';

const client = new MCPClient();

try {
  await client.connect(serverConfig);
  const result = await client.callTool('invalid_tool', {});
} catch (error) {
  if (error instanceof MCPError) {
    console.error('MCP Error:', error.code, error.message);
    console.error('Details:', error.details);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Configuration

### Server Configuration

```typescript
interface MCPServerConfig {
  id: string;
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  timeout?: number;
  retries?: number;
}
```

### Client Configuration

```typescript
interface MCPClientConfig {
  timeout?: number;
  retries?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  maxConcurrentRequests?: number;
}
```

## Dependencies

- `@tars/types` - Shared TypeScript definitions
- `@tars/shared` - Common utilities

## Development

This is part of the Tars monorepo. See the [main documentation](../../docs/monorepo-setup.md) for development setup.

### Building

```bash
# From monorepo root
pnpm --filter @tars/mcp build
```

### Testing

```bash
# Run tests
pnpm --filter @tars/mcp test

# Test MCP servers
pnpm --filter @tars/mcp test-servers
```

## Architecture

```
src/
├── index.ts         # Package exports
├── client.ts        # MCP client implementation
├── server.ts        # Base server interface
├── registry.ts      # Server registry
├── servers/         # Server implementations
└── cli/            # CLI tools
```

## License

MIT License