# Ollama MCP Integration

## Overview

Ollama provides tool calling capabilities for local models through its OpenAI-compatible API. The provider supports both advanced tool-aware execution with autonomous coordination and simple tool injection for local model deployments.

## MCP Integration Status

✅ **Full Support** - Advanced Path with Tool Calling Coordinator

- **Integration Type**: Advanced Path
- **Status**: WORKING
- **Tool Format**: OpenAI-Compatible Function Calling
- **Documentation**: [Ollama Tool Calling](https://docs.ollama.com/capabilities/tool-calling)

## Provider Documentation

- **Official Docs**: [https://ollama.com](https://ollama.com)
- **Tool Calling Guide**: [https://docs.ollama.com/capabilities/tool-calling](https://docs.ollama.com/capabilities/tool-calling)
- **API Reference**: [https://github.com/ollama/ollama/blob/main/docs/api.md](https://github.com/ollama/ollama/blob/main/docs/api.md)
- **Tool Support Blog**: [https://ollama.com/blog/tool-support](https://ollama.com/blog/tool-support)

## MCP Tool Registration

### Native SDK Tool Usage

Here's how the Ollama SDK handles tool calling natively:

```typescript
import Ollama from 'ollama'

const ollama = new Ollama({ host: 'http://localhost:11434' })

// Define tools for Ollama
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get weather information for a location',
      parameters: {
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
  }
]

// Send message with tools
const response = await ollama.chat({
  model: 'llama3.1',
  messages: [
    {
      role: 'user',
      content: 'What\'s the weather like in New York?'
    }
  ],
  tools: tools
})

// Handle tool call
if (response.message.tool_calls) {
  for (const toolCall of response.message.tool_calls) {
    console.log('Ollama wants to use tool:', toolCall.function.name)
    console.log('Tool input:', toolCall.function.arguments)

    // Execute tool and send result back
    const toolResult = await executeTool(
      toolCall.function.name,
      JSON.parse(toolCall.function.arguments)
    )

    const finalResponse = await ollama.chat({
      model: 'llama3.1',
      messages: [
        {
          role: 'user',
          content: 'What\'s the weather like in New York?'
        },
        response.message,
        {
          role: 'tool',
          content: JSON.stringify(toolResult)
        }
      ],
      tools: tools
    })

    console.log('Final response:', finalResponse.message.content)
  }
}
```

### Streaming with Tools

```typescript
// Streaming tool usage
const streamResponse = await ollama.chat({
  model: 'llama3.1',
  messages: [
    {
      role: 'user',
      content: 'Check the weather in Tokyo and London'
    }
  ],
  tools: tools,
  stream: true
})

let currentToolCall = null
for await (const chunk of streamResponse) {
  if (chunk.message.tool_calls) {
    for (const toolCall of chunk.message.tool_calls) {
      if (toolCall.function?.name) {
        console.log('Tool call started:', toolCall.function.name)
        currentToolCall = toolCall
      }
      if (toolCall.function?.arguments) {
        console.log('Arguments chunk:', toolCall.function.arguments)
      }
    }
  } else if (chunk.message.content) {
    console.log('Response chunk:', chunk.message.content)
  }
}

// Execute tools and continue conversation
if (currentToolCall) {
  const toolResults = await Promise.all(
    currentToolCall.map(async (toolCall) => {
      return {
        role: 'tool',
        content: await executeTool(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments)
        )
      }
    })
  )

  // Continue with tool results
  const finalStream = await ollama.chat({
    model: 'llama3.1',
    messages: [
      { role: 'user', content: 'Check the weather in Tokyo and London' },
      { role: 'assistant', content: '', tool_calls: currentToolCall },
      ...toolResults
    ],
    stream: true
  })

  for await (const chunk of finalStream) {
    if (chunk.message.content) {
      console.log('Final response:', chunk.message.content)
    }
  }
}
```

### Model-Specific Tool Support

```typescript
// Check if model supports tools
const modelInfo = await ollama.show({ model: 'llama3.1' })
console.log('Model details:', modelInfo.details)

// Pull tool-capable model if needed
if (!modelInfo.details || !modelInfo.details['tool_calls']) {
  console.log('Pulling tool-capable model...')
  await ollama.pull({ model: 'llama3.1:8b' })
}

// List available models with tool support
const models = await ollama.list()
const toolCapableModels = models.models.filter(model =>
  model.name.includes('llama3.1') ||
  model.name.includes('qwen2.5')
)
console.log('Tool-capable models:', toolCapableModels)
```

### Tool Format

Ollama uses OpenAI-compatible function calling format:

```typescript
// Tool definition format for Ollama
{
    type: 'function',
    function: {
        name: string,
        description: string,
        parameters: object
    }
}
```

### Constraints

- **Tool names**: Must follow OpenAI format `^[a-zA-Z0-9_-]{1,64}$`
- **Maximum tools**: Model-specific, typically lower than cloud providers
- **Schema**: JSON Schema for function parameters

## Implementation Files

### Core Provider

- **`packages/providers/src/implementations/ollama.ts`** - Main Ollama provider implementation
  - Lines 25-67: Advanced MCP integration with Tool Calling Coordinator
  - Lines 75-82: Simple MCP tool injection
  - Lines 7-127: Complete sendRequestFunc implementation
  - Lines 129-141: Vendor configuration and capabilities

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
import { ollamaVendor } from '@tars/providers'

// Configure with MCP integration
const ollamaOptions = {
    apiKey: '', // Not required for local Ollama
    baseURL: 'http://127.0.0.1:11434',
    model: 'llama3.1',
    mcpIntegration: {
        toolCallingCoordinator: coordinator,
        providerAdapter: ollamaAdapter
    },
    mcpExecutor: executor,
    documentPath: 'document.md'
}

// Generate response with automatic tool execution
const stream = ollamaVendor.sendRequestFunc(ollamaOptions)
for await (const chunk of stream(messages, abortController)) {
    console.log(chunk)
}
```

### Local Model Setup

```typescript
// Configure for local tool-capable model
const ollamaLocal = {
    ...ollamaOptions,
    model: 'llama3.1:8b', // Tool-capable model
    baseURL: 'http://localhost:11434'
}

// Ensure model supports tool calling
const ollama = new Ollama({ host: 'localhost:11434' })
await ollama.pull({ model: 'llama3.1:8b' })
```

## Supported Models

Tool calling support varies by model:

### Recommended Models
- `llama3.1` - Excellent tool calling support
- `llama3.1:8b` - Balanced performance
- `llama3.1:70b` - Advanced reasoning
- `qwen2.5` - Good tool calling capabilities

### Model Requirements
- **Minimum size**: 8B parameters recommended for reliable tool calling
- **Format**: Must be fine-tuned for tool calling
- **Version**: Use latest tool-capable versions

## Error Handling

The provider implements comprehensive error handling:

1. **Connection errors**: Detects Ollama service unavailability
2. **Tool-aware path failure**: Falls back to simple injection
3. **MCP injection errors**: Logged with warning, continues without tools
4. **Stream interruption**: Clean abort handling with `ollama.abort()`
5. **Model compatibility**: Validates tool calling support

## Configuration

### Required Parameters

- `baseURL`: Ollama server endpoint (default: `http://127.0.0.1:11434`)
- `model`: Local model identifier

### Optional Parameters

- `apiKey`: Not required for local deployments
- `temperature`: Sampling temperature
- `top_p`: Nucleus sampling parameter
- `num_ctx`: Context window size
- `num_predict`: Maximum tokens to predict

### MCP Integration Options

- `mcpIntegration.toolCallingCoordinator`: Advanced tool coordination
- `mcpIntegration.providerAdapter`: Ollama-specific tool adapter
- `mcpToolInjector`: Simple tool injection (legacy)
- `mcpExecutor`: Tool execution engine
- `documentPath`: Document context for session tracking
- `pluginSettings`: Plugin configuration options

## Development Notes

### Architecture

Ollama's MCP integration supports both paths:

#### Advanced Path
1. **Local Tool Discovery**: MCP tools discovered via Tool Discovery Cache
2. **Format Conversion**: Tools converted to Ollama format by provider adapter
3. **Autonomous Execution**: Tool Calling Coordinator manages multi-turn conversations
4. **Local Processing**: All tool execution happens locally

#### Simple Path
1. **Tool Injection**: MCP tools injected directly into request parameters
2. **Native Execution**: Ollama handles tool calling natively
3. **Local Integration**: Simple result handling

### Key Features

- **Local model deployment** with full privacy
- **Dual integration paths** for maximum compatibility
- **Autonomous tool execution** with parallel processing support
- **Document-scoped sessions** for context tracking
- **Graceful fallback** between integration approaches
- **Connection health monitoring** with retry logic

### Model Management

```bash
# Pull tool-capable models
ollama pull llama3.1
ollama pull qwen2.5

# List available models
ollama list

# Check model details
ollama show llama3.1
```

### Debugging

Enable debug logging to trace MCP integration:

```typescript
import { createLogger } from '@tars/logger'
const logger = createLogger('providers:ollama')
logger.level = 'debug'
```

Monitor Ollama service status:

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# View logs
docker logs ollama
```

### Performance Optimization

- **Model selection**: Use appropriately sized models for your hardware
- **Context size**: Adjust `num_ctx` based on available memory
- **Parallel execution**: Enable parallel tool processing for faster results
- **Document caching**: Enable auto document caching to reduce redundant processing

### Troubleshooting

**Common Issues:**

1. **Model doesn't support tools**: Use tool-capable models like `llama3.1`
2. **Connection refused**: Ensure Ollama service is running
3. **Slow responses**: Consider using smaller models or reducing context size
4. **Memory errors**: Reduce `num_ctx` or use smaller model variants

**Health Checks:**

```typescript
// Verify Ollama connectivity
const ollama = new Ollama({ host: 'http://localhost:11434' })
const models = await ollama.list()
console.log('Available models:', models)
```

---

*Last updated: 2025-10-18*
*Provider: Ollama*