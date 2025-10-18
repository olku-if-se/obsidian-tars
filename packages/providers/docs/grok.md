# Grok (xAI) MCP Integration

## Overview

Grok provides OpenAI-compatible function calling capabilities through xAI's API. The provider currently supports simple tool injection but requires the missing MCPToolInjector implementation for full functionality.

## MCP Integration Status

⚠️ **Partial Support** - Simple Path with Missing Implementation

- **Integration Type**: Simple Path
- **Status**: BROKEN - Requires MCPToolInjector implementation
- **Tool Format**: OpenAI Function Calling (Compatible)
- **Documentation**: [Grok Function Calling](https://docs.x.ai/docs/guides/function-calling)

## Provider Documentation

- **Official Docs**: [https://docs.x.ai](https://docs.x.ai)
- **Function Calling Guide**: [https://docs.x.ai/docs/guides/function-calling](https://docs.x.ai/docs/guides/function-calling)
- **API Reference**: [https://docs.x.ai/api](https://docs.x.ai/api)
- **Platform**: [https://x.ai](https://x.ai)

## MCP Tool Registration

### Native SDK Tool Usage

Here's how the xAI SDK handles function calling natively (using OpenAI-compatible client):

```typescript
import OpenAI from 'openai'

// Configure Grok client
const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
  dangerouslyAllowBrowser: true
})

// Define tools for Grok
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_current_weather',
      description: 'Get the current weather in a given location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city and state, e.g. San Francisco, CA',
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
          },
        },
        required: ['location'],
      },
    },
  }
]

// Send message with tools
const response = await grok.chat.completions.create({
  model: 'grok-beta',
  messages: [
    {
      role: 'user',
      content: 'What\'s the weather like in Austin?',
    },
  ],
  tools: tools,
  tool_choice: 'auto',
})

// Handle function call
const toolCalls = response.choices[0].message.tool_calls
if (toolCalls) {
  for (const toolCall of toolCalls) {
    console.log('Grok wants to use tool:', toolCall.function.name)
    console.log('Arguments:', toolCall.function.arguments)

    // Execute tool and send result back
    const toolResult = await executeTool(
      toolCall.function.name,
      JSON.parse(toolCall.function.arguments)
    )

    const finalResponse = await grok.chat.completions.create({
      model: 'grok-beta',
      messages: [
        { role: 'user', content: 'What\'s the weather like in Austin?' },
        response.choices[0].message,
        {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult)
        }
      ],
      tools: tools
    })

    console.log('Final response:', finalResponse.choices[0].message.content)
  }
}
```

### Streaming with Tools

```typescript
// Streaming tool usage with Grok
const stream = await grok.chat.completions.create({
  model: 'grok-beta',
  messages: [
    { role: 'user', content: 'Check the weather in Miami and Seattle' }
  ],
  tools: tools,
  stream: true,
  temperature: 0.7
})

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta
  if (delta.tool_calls) {
    for (const toolCall of delta.tool_calls) {
      if (toolCall.function?.name) {
        console.log('Tool call started:', toolCall.function.name)
      }
      if (toolCall.function?.arguments) {
        console.log('Arguments chunk:', toolCall.function.arguments)
      }
    }
  } else if (delta.content) {
    console.log('Response chunk:', delta.content)
  }
}
```

### Grok-Specific Features

```typescript
// Use Grok's real-time data access with tools
const realtimeResponse = await grok.chat.completions.create({
  model: 'grok-beta',
  messages: [
    { role: 'user', content: 'What\'s the latest news about Tesla stock?' }
  ],
  tools: [
    {
      type: 'function',
      function: {
        name: 'get_stock_price',
        description: 'Get current stock price information',
        parameters: {
          type: 'object',
          properties: {
            symbol: { type: 'string', description: 'Stock symbol' }
          },
          required: ['symbol']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'search_news',
        description: 'Search for recent news articles',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            limit: { type: 'number', description: 'Number of results' }
          },
          required: ['query']
        }
      }
    }
  ],
  temperature: 0.3 // Lower temperature for more factual responses
})
```

### Current Implementation (Incomplete)

The provider uses simple tool injection but lacks the required MCPToolInjector:

```typescript
// File: packages/providers/src/implementations/grok.ts
// Inject MCP tools if available
let requestParams: Record<string, unknown> = { model, ...remains }
if (mcpToolInjector) {
    try {
        requestParams = await mcpToolInjector.injectTools(requestParams, 'Grok')
    } catch (error) {
        logger.warn('failed to inject MCP tools for grok', error)
    }
}
```

## Implementation Files

### Core Provider

- **`packages/providers/src/implementations/grok.ts`** - Main Grok provider implementation
  - Lines 20-28: Simple MCP tool injection (requires MCPToolInjector)
  - Lines 13-60: Complete sendRequestFunc implementation
  - Lines 62-75: Vendor configuration and capabilities

### Missing Implementation

- **`packages/providers/src/interfaces/base.ts:48`** - MCPToolInjector interface definition
- **MCPToolInjector concrete class** - Implementation needed for simple path providers

### Testing

- **`packages/providers/tests/unit/basic.test.ts`** - Basic package structure tests
- Integration tests are handled in the main plugin package due to Obsidian dependencies

## Usage Examples

### Current Usage (No MCP Tools)

```typescript
import { grokVendor } from '@tars/providers'

// Configure without MCP integration
const grokOptions = {
    apiKey: 'your-xai-api-key',
    model: 'grok-beta',
    baseURL: 'https://api.x.ai/v1'
}

// Generate response (without tool calling)
const stream = grokVendor.sendRequestFunc(grokOptions)
for await (const chunk of stream(messages, abortController)) {
    console.log(chunk)
}
```

### Intended MCP Integration (Once Fixed)

```typescript
// Proposed usage once MCPToolInjector is implemented
const grokWithMCP = {
    ...grokOptions,
    mcpToolInjector: new MCPToolInjectorImpl() // Missing implementation
}

// Would support automatic tool injection once implemented
```

## Supported Models

Grok models with function calling support:

### Available Models
- `grok-beta` - Latest Grok model with tool calling and real-time data access

### Model Capabilities
- **Function Calling**: OpenAI-compatible function calling
- **Real-time Data**: Access to current information via X platform integration
- **Streaming**: Real-time response streaming
- **Multi-turn**: Conversational context with tool integration

## Missing Implementation

### Critical Issue: MCPToolInjector

The main blocker is the missing concrete implementation of MCPToolInjector:

```typescript
// Interface defined in packages/providers/src/interfaces/base.ts:48
export interface MCPToolInjector {
    injectTools(parameters: Record<string, unknown>, providerName: string): Promise<Record<string, unknown>>
}

// Missing concrete implementation
export class MCPToolInjectorImpl implements MCPToolInjector {
    // Implementation needed
}
```

## Error Handling

The current provider has basic error handling:

1. **API key validation**: Checks for required API key
2. **MCP injection errors**: Logs warning when injection fails
3. **Stream errors**: Proper error propagation

### Required Error Handling for MCP

1. **Tool discovery errors**: Handle MCP server unavailability
2. **Format conversion errors**: Validate schema conversion
3. **Injection failures**: Graceful fallback without tools
4. **Rate limiting**: Handle xAI API rate limits

## Configuration

### Required Parameters

- `apiKey`: xAI API key
- `model`: Grok model identifier
- `baseURL`: API endpoint (default: `https://api.x.ai/v1`)

### Optional Parameters

- `temperature`: Sampling temperature (0-2)
- `max_tokens`: Maximum completion tokens
- `top_p`: Nucleus sampling parameter
- `frequency_penalty`: Frequency penalty
- `presence_penalty`: Presence penalty

### MCP Integration Options (Future)

- `mcpToolInjector`: Simple tool injection (missing implementation)
- `mcpManager`: MCP server manager
- `mcpExecutor`: Tool execution engine

## Development Notes

### Current State

The Grok provider has:
- ✅ OpenAI-compatible API integration
- ✅ Streaming response support
- ✅ Real-time data access capabilities
- ✅ Tool calling API compatibility
- ❌ **Broken MCP integration** due to missing MCPToolInjector
- ❌ **No advanced path** support

### Unique Grok Features

- **Real-time Information**: Access to current events via X platform
- **Unfiltered Responses**: More candid responses compared to other models
- **Multi-modal**: Support for both text and image analysis
- **Context Window**: Large context window for long conversations

### Blockers

1. **Critical**: MCPToolInjector concrete class implementation
2. **Important**: Tool discovery integration
3. **Medium**: Error handling improvements
4. **Low**: Advanced path support (optional)

### Implementation Priority

1. **High Priority**: Implement MCPToolInjector concrete class
2. **High Priority**: Tool discovery and format conversion
3. **Medium Priority**: Error handling and validation
4. **Low Priority**: Advanced path with Tool Calling Coordinator

### Debugging

Enable debug logging to trace current implementation:

```typescript
import { createLogger } from '@tars/logger'
const logger = createLogger('providers:grok')
logger.level = 'debug'
```

### API Key Setup

```bash
# Get API key from xAI platform
# 1. Visit https://console.x.ai
# 2. Sign up and create API key
# 3. Copy and store securely
```

### Real-time Data Integration

```typescript
// Leverage Grok's real-time capabilities with tools
const realtimeTools = {
  web_search: {
    name: 'web_search',
    description: 'Search the web for current information',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' }
      },
      required: ['query']
    }
  },
  get_news: {
    name: 'get_news',
    description: 'Get latest news on a topic',
    parameters: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'News topic' }
      },
      required: ['topic']
    }
  }
}
```

---

*Last updated: 2025-10-18*
*Provider: Grok (xAI)*
*Status: Requires MCPToolInjector implementation to fix MCP integration*