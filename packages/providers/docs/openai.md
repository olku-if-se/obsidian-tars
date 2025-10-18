# OpenAI MCP Integration

## Overview

OpenAI provides native function calling capabilities through its Chat Completions API. The provider supports both advanced tool-aware execution with autonomous coordination and simple tool injection for backward compatibility.

## MCP Integration Status

✅ **Full Support** - Advanced Path with Tool Calling Coordinator

- **Integration Type**: Advanced Path
- **Status**: WORKING
- **Tool Format**: OpenAI Function Calling API
- **Documentation**: [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)

## Provider Documentation

- **Official API Docs**: [https://platform.openai.com/docs](https://platform.openai.com/docs)
- **Function Calling Guide**: [https://platform.openai.com/docs/guides/function-calling](https://platform.openai.com/docs/guides/function-calling)
- **API Reference**: [https://platform.openai.com/docs/api-reference](https://platform.openai.com/docs/api-reference)
- **Developer Platform**: [https://platform.openai.com](https://platform.openai.com)

## MCP Tool Registration

### Native SDK Tool Usage

Here's how the OpenAI SDK handles function calling natively:

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Define functions for OpenAI
const functions = [
  {
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
  }
]

// Send message with functions
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    {
      role: 'user',
      content: 'What\'s the weather like in Boston?',
    },
  ],
  functions: functions,
  function_call: 'auto',
})

// Handle function call
const message = response.choices[0].message
if (message.function_call) {
  console.log('Function to call:', message.function_call.name)
  console.log('Arguments:', message.function_call.arguments)

  // Execute function and send result back
  const functionResult = await executeFunction(
    message.function_call.name,
    JSON.parse(message.function_call.arguments)
  )

  const secondResponse = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'user', content: 'What\'s the weather like in Boston?' },
      message,
      {
        role: 'function',
        name: message.function_call.name,
        content: JSON.stringify(functionResult),
      },
    ],
  })
}
```

### Modern Tools API (Recommended)

```typescript
// Using the newer tools API (parallel function calling)
const response = await openai.chat.completions.create({
  model: 'gpt-4-turbo',
  messages: [
    {
      role: 'user',
      content: 'What\'s the weather like in Tokyo and Paris?',
    },
  ],
  tools: [
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
            unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
          },
          required: ['location'],
        },
      },
    },
  ],
  tool_choice: 'auto',
})

// Handle parallel tool calls
const toolCalls = response.choices[0].message.tool_calls
if (toolCalls) {
  // Execute all tools in parallel
  const toolResults = await Promise.all(
    toolCalls.map(async (toolCall) => {
      const result = await executeFunction(
        toolCall.function.name,
        JSON.parse(toolCall.function.arguments)
      )
      return {
        tool_call_id: toolCall.id,
        output: JSON.stringify(result),
      }
    })
  )

  // Send results back
  const finalResponse = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      { role: 'user', content: 'What\'s the weather like in Tokyo and Paris?' },
      response.choices[0].message,
      ...toolResults.map(result => ({
        role: 'tool',
        tool_call_id: result.tool_call_id,
        content: result.output,
      })),
    ],
  })
}
```

### Streaming with Tools

```typescript
// Streaming with function calling
const stream = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'Check the weather in London' }
  ],
  tools: tools,
  stream: true,
})

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta
  if (delta.tool_calls) {
    for (const toolCall of delta.tool_calls) {
      if (toolCall.function?.name) {
        console.log('Tool call:', toolCall.function.name)
      }
      if (toolCall.function?.arguments) {
        console.log('Arguments chunk:', toolCall.function.arguments)
      }
    }
  }
}
```

### Tool Format

OpenAI uses the Function Calling format:

```typescript
// Tool definition format for OpenAI
{
    type: 'function',
    function: {
        name: string,
        description: string,
        parameters: JSONSchema
    }
}
```

### Constraints

- **Tool names**: Must match regex `^[a-zA-Z0-9_-]{1,64}$`
- **Maximum tools**: 128 tools per request
- **Schema**: JSON Schema for function parameters

## Implementation Files

### Core Provider

- **`packages/providers/src/implementations/openAI.ts`** - Main OpenAI provider implementation
  - Lines 27-69: Advanced MCP integration with Tool Calling Coordinator
  - Lines 72-79: Simple MCP tool injection fallback
  - Lines 9-102: Complete sendRequestFunc implementation
  - Lines 142-154: Vendor configuration and capabilities

### Message Formatting

- **`formatMsg()`** (lines 113-128): Formats messages with embeds for OpenAI API
- **`formatMsgForCoordinator()`** (lines 133-140): Simplified format for tool coordinator

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
import { openAIVendor } from '@tars/providers'

// Configure with MCP integration
const openaiOptions = {
    apiKey: 'your-openai-api-key',
    model: 'gpt-4',
    baseURL: 'https://api.openai.com/v1',
    mcpIntegration: {
        toolCallingCoordinator: coordinator,
        providerAdapter: openaiAdapter
    },
    mcpExecutor: executor,
    documentPath: 'document.md'
}

// Generate response with automatic tool execution
const stream = openAIVendor.sendRequestFunc(openaiOptions)
for await (const chunk of stream(messages, abortController)) {
    console.log(chunk)
}
```

### Simple Tool Injection

```typescript
// Legacy approach for basic tool injection
const openaiSimple = {
    ...openaiOptions,
    mcpToolInjector: simpleInjector
}

// Tools will be injected into request parameters
const requestParams = await mcpToolInjector.injectTools({
    model: 'gpt-4',
    messages: formattedMessages
}, 'OpenAI')
```

## Supported Models

Most OpenAI models support function calling:

- `gpt-4.1`
- `gpt-4`
- `gpt-4-turbo`
- `gpt-3.5-turbo`
- `o1-preview`
- `o1-mini`

## Error Handling

The provider implements robust error handling:

1. **Tool-aware path failure**: Falls back to simple injection
2. **MCP injection errors**: Logged with warning, continues without tools
3. **API errors**: Proper error propagation with context
4. **Stream interruption**: Clean abort handling

## Configuration

### Required Parameters

- `apiKey`: OpenAI API key
- `model`: OpenAI model identifier
- `baseURL`: API endpoint (default: `https://api.openai.com/v1`)

### Optional Parameters

- `temperature`: Sampling temperature (0-2)
- `max_tokens`: Maximum completion tokens
- `top_p`: Nucleus sampling parameter
- `frequency_penalty`: Frequency penalty (-2 to 2)
- `presence_penalty`: Presence penalty (-2 to 2)

### MCP Integration Options

- `mcpIntegration.toolCallingCoordinator`: Advanced tool coordination
- `mcpIntegration.providerAdapter`: OpenAI-specific tool adapter
- `mcpToolInjector`: Simple tool injection (legacy)
- `mcpExecutor`: Tool execution engine
- `documentPath`: Document context for session tracking
- `pluginSettings`: Plugin configuration options

## Development Notes

### Architecture

OpenAI's MCP integration supports both paths:

#### Advanced Path
1. **Tool Discovery**: MCP tools discovered via Tool Discovery Cache
2. **Format Conversion**: Tools converted to OpenAI function format by provider adapter
3. **Autonomous Execution**: Tool Calling Coordinator manages multi-turn conversations
4. **Result Integration**: Tool results integrated into conversation context

#### Simple Path
1. **Tool Injection**: MCP tools injected directly into request parameters
2. **Native Execution**: OpenAI handles tool calling natively
3. **Basic Integration**: Simple result handling

### Key Features

- **Dual integration paths** for maximum compatibility
- **Autonomous tool execution** with parallel processing support
- **Multi-turn conversations** with tool context
- **Document-scoped sessions** for context tracking
- **Graceful fallback** between integration approaches
- **Vision support** for image processing with tools

### Debugging

Enable debug logging to trace MCP integration:

```typescript
import { createLogger } from '@tars/logger'
const logger = createLogger('providers:openai')
logger.level = 'debug'
```

### Migration Notes

- **Legacy code** using `mcpToolInjector` will continue to work
- **New implementations** should use the advanced path with `mcpIntegration`
- **Both approaches** can coexist for gradual migration

---

*Last updated: 2025-10-18*
*Provider: OpenAI*