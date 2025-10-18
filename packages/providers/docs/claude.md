# Claude (Anthropic) MCP Integration

## Overview

Claude provides native tool calling capabilities through Anthropic's Tool Use API. The provider supports both advanced tool-aware execution with autonomous coordination and simple tool injection.

## MCP Integration Status

✅ **Full Support** - Advanced Path with Tool Calling Coordinator

- **Integration Type**: Advanced Path
- **Status**: WORKING
- **Tool Format**: Anthropic Tool Use API
- **Documentation**: [Anthropic Tool Use](https://docs.anthropic.com/claude/docs/tool-use)

## Provider Documentation

- **Official API Docs**: [https://docs.anthropic.com/claude/docs](https://docs.anthropic.com/claude/docs)
- **Tool Use Guide**: [https://docs.anthropic.com/claude/docs/tool-use](https://docs.anthropic.com/claude/docs/tool-use)
- **API Reference**: [https://docs.anthropic.com/api/messages](https://docs.anthropic.com/api/messages)
- **Developer Console**: [https://console.anthropic.com](https://console.anthropic.com)

## MCP Tool Registration

### Native SDK Tool Usage

Here's how the Anthropic SDK handles tool calling natively:

```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Define tools for Claude
const tools = [
  {
    name: 'get_weather',
    description: 'Get weather information for a location',
    input_schema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City name, e.g. "San Francisco, CA"'
        },
        unit: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: 'Temperature unit'
        }
      },
      required: ['location']
    }
  }
]

// Send message with tools
const response = await client.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  tools: tools,
  messages: [
    {
      role: 'user',
      content: 'What\'s the weather like in New York?'
    }
  ]
})

// Handle tool use
if (response.content[0].type === 'tool_use') {
  const toolUse = response.content[0]
  console.log('Claude wants to use tool:', toolUse.name)
  console.log('Tool input:', toolUse.input)

  // Execute tool and send result back
  const toolResult = await executeTool(toolUse.name, toolUse.input)

  const finalResponse = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      ...response.messages,
      {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(toolResult)
          }
        ]
      }
    ]
  })
}
```

### Streaming with Tools

```typescript
// Streaming tool usage
const stream = await client.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  tools: tools,
  stream: true,
  messages: [
    {
      role: 'user',
      content: 'Check the weather in Tokyo and London'
    }
  ]
})

for await (const chunk of stream) {
  if (chunk.type === 'content_block_start' &&
      chunk.content_block.type === 'tool_use') {
    console.log('Tool use started:', chunk.content_block.name)
  }
  if (chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'input_json_delta') {
    console.log('Tool input chunk:', chunk.delta.partial_json)
  }
}
```

### Tool Format

Claude uses the Anthropic Tool Use format:

```typescript
// Tool definition format for Claude
{
    name: string,
    description: string,
    input_schema: JSONSchema
}
```

### Constraints

- **Tool names**: Must match regex `^[a-zA-Z0-9_-]{1,64}$`
- **Maximum tools**: 100 tools per request
- **Schema**: JSON Schema for input parameters

## Implementation Files

### Core Provider

- **`packages/providers/src/implementations/claude.ts`** - Main Claude provider implementation
  - Lines 98-146: Advanced MCP integration with Tool Calling Coordinator
  - Lines 64-234: Complete sendRequestFunc implementation
  - Lines 236-261: Vendor configuration and capabilities

### Testing

- **`packages/providers/tests/unit/basic.test.ts`** - Basic package structure tests
- Integration tests are handled in the main plugin package due to Obsidian dependencies

### MCP Integration Files

- **`packages/providers/src/interfaces/base.ts`** - MCP integration interfaces
  - `MCPToolInjector` interface (line 48)
  - `MCPIntegration` interface (lines 62-68)

## Usage Examples

### Basic Usage with MCP Tools

```typescript
import { claudeVendor } from '@tars/providers'

// Configure with MCP integration
const claudeOptions = {
    apiKey: 'your-anthropic-api-key',
    model: 'claude-3-5-sonnet-latest',
    max_tokens: 8192,
    mcpIntegration: {
        toolCallingCoordinator: coordinator,
        providerAdapter: claudeAdapter
    },
    mcpExecutor: executor,
    documentPath: 'document.md'
}

// Generate response with automatic tool execution
const stream = claudeVendor.sendRequestFunc(claudeOptions)
for await (const chunk of stream(messages, abortController)) {
    console.log(chunk)
}
```

### Web Search Integration

```typescript
// Enable Claude's built-in web search
const claudeWithWebSearch = {
    ...claudeOptions,
    enableWebSearch: true
}

// Tool will be automatically included in request
{
    name: 'web_search',
    type: 'web_search_20250305'
}
```

## Supported Models

All Claude models support tool calling:

- `claude-sonnet-4-0`
- `claude-opus-4-0`
- `claude-3-7-sonnet-latest`
- `claude-3-5-sonnet-latest`
- `claude-3-opus-latest`
- `claude-3-5-haiku-latest`

## Error Handling

The provider implements graceful fallback:

1. **Tool-aware path failure**: Falls back to standard workflow
2. **MCP injection errors**: Logged with warning, continues without tools
3. **API errors**: Proper error propagation with context

## Configuration

### Required Parameters

- `apiKey`: Anthropic API key
- `model`: Claude model identifier
- `max_tokens`: Maximum response tokens

### Optional Parameters

- `baseURL`: Custom API endpoint (default: `https://api.anthropic.com`)
- `enableWebSearch`: Enable built-in web search tool
- `enableThinking`: Enable reasoning mode
- `budget_tokens`: Thinking budget tokens

### MCP Integration Options

- `mcpIntegration.toolCallingCoordinator`: Advanced tool coordination
- `mcpIntegration.providerAdapter`: Claude-specific tool adapter
- `mcpExecutor`: Tool execution engine
- `documentPath`: Document context for session tracking
- `pluginSettings`: Plugin configuration options

## Development Notes

### Architecture

Claude's MCP integration follows the **Advanced Path** pattern:

1. **Tool Discovery**: MCP tools discovered via Tool Discovery Cache
2. **Format Conversion**: Tools converted to Anthropic format by provider adapter
3. **Autonomous Execution**: Tool Calling Coordinator manages multi-turn conversations
4. **Result Integration**: Tool results integrated into conversation context

### Key Features

- **Autonomous tool execution** with parallel processing support
- **Multi-turn conversations** with tool context
- **Document-scoped sessions** for context tracking
- **Graceful fallback** to standard API calls
- **Built-in web search** capability
- **Reasoning mode** for complex problem solving

### Debugging

Enable debug logging to trace MCP integration:

```typescript
import { createLogger } from '@tars/logger'
const logger = createLogger('providers:claude')
logger.level = 'debug'
```

---

*Last updated: 2025-10-18*
*Provider: Claude (Anthropic)*