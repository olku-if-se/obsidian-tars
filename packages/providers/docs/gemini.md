# Gemini MCP Integration

## Overview

Google Gemini provides function calling capabilities through its generative AI API. Currently, the provider has basic MCP integration infrastructure but requires implementation of proper format conversion for full tool calling support.

## MCP Integration Status

❌ **No Implementation** - Format Conversion Required

- **Integration Type**: Not Implemented
- **Status**: MISSING IMPLEMENTATION
- **Tool Format**: Google Function Declaration Format
- **Documentation**: [Gemini Function Calling](https://ai.google.dev/gemini-api/docs/function-calling)

## Provider Documentation

- **Official Docs**: [https://ai.google.dev](https://ai.google.dev)
- **Function Calling Guide**: [https://ai.google.dev/gemini-api/docs/function-calling](https://ai.google.dev/gemini-api/docs/function-calling)
- **API Reference**: [https://ai.google.dev/gemini-api/docs/reference](https://ai.google.dev/gemini-api/docs/reference)
- **Google AI Studio**: [https://makersuite.google.com](https://makersuite.google.com)

## MCP Tool Registration

### Native SDK Tool Usage

Here's how the Google Gemini SDK handles function calling natively:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

// Define function declarations for Gemini
const tools = [
  {
    functionDeclaration: {
      name: 'get_current_weather',
      description: 'Get the current weather in a given location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city and state, e.g. San Francisco, CA'
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit']
          }
        },
        required: ['location']
      }
    }
  }
]

// Send message with tools
const chat = model.startChat({
  tools: tools
})

const result = await chat.sendMessage(
  'What is the weather like in New York?'
)

// Handle function call
const functionCall = result.response.functionCalls()
if (functionCall) {
  for (const call of functionCall) {
    console.log('Function to call:', call.name)
    console.log('Arguments:', call.args)

    // Execute function and send result back
    const functionResult = await executeFunction(call.name, call.args)

    const followUpResult = await chat.sendMessage([
      {
        functionResponse: {
          name: call.name,
          response: functionResult
        }
      }
    ])

    console.log('Final response:', followUpResult.response.text())
  }
}
```

### Streaming with Tools

```typescript
// Streaming with function calling
const chatStream = model.startChat({
  tools: tools
})

const resultStream = await chatStream.sendMessageStream(
  'Check the weather in Tokyo and London'
)

let currentFunctionCall = null
for await (const chunk of resultStream.stream) {
  // Check for function calls in the stream
  if (chunk.functionCalls()) {
    for (const call of chunk.functionCalls()) {
      console.log('Function call started:', call.name)
      console.log('Arguments:', call.args)
      currentFunctionCall = call
    }
  } else if (chunk.text()) {
    console.log('Response chunk:', chunk.text())
  }
}

// Execute functions and continue
if (currentFunctionCall) {
  const functionResults = await Promise.all(
    currentFunctionCall.map(async (call) => {
      const result = await executeFunction(call.name, call.args)
      return {
        functionResponse: {
          name: call.name,
          response: result
        }
      }
    })
  )

  // Continue streaming with function results
  const followUpStream = await chatStream.sendMessageStream(functionResults)
  for await (const chunk of followUpStream.stream) {
    if (chunk.text()) {
      console.log('Final response:', chunk.text())
    }
  }
}
```

### Multi-Tool Conversations

```typescript
// Complex multi-tool conversation
const multiToolChat = model.startChat({
  tools: [
    {
      functionDeclaration: {
        name: 'get_weather',
        description: 'Get weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string' },
            unit: { type: 'string', enum: ['celsius', 'fahrenheit'] }
          },
          required: ['location']
        }
      }
    },
    {
      functionDeclaration: {
        name: 'get_time',
        description: 'Get current time for a timezone',
        parameters: {
          type: 'object',
          properties: {
            timezone: { type: 'string' }
          },
          required: ['timezone']
        }
      }
    }
  ]
})

// Send message that may trigger multiple tools
const complexResult = await multiToolChat.sendMessage(
  'Tell me the weather and current time in Paris'
)

// Handle multiple function calls
const calls = complexResult.response.functionCalls()
if (calls && calls.length > 0) {
  console.log(`Processing ${calls.length} function calls...`)

  // Execute all functions in parallel
  const results = await Promise.all(
    calls.map(async (call) => {
      const result = await executeFunction(call.name, call.args)
      return {
        functionResponse: {
          name: call.name,
          response: result
        }
      }
    })
  )

  // Send all results back
  const finalResult = await multiToolChat.sendMessage(results)
  console.log('Final answer:', finalResult.response.text())
}
```

### Auto Function Calling

```typescript
// Configure auto function calling (available in newer models)
const autoChat = model.startChat({
  tools: tools,
  toolConfig: {
    functionCallingConfig: {
      mode: 'AUTO'  // Model decides when to call functions
    }
  }
})

// The model will automatically call functions as needed
const autoResult = await autoChat.sendMessage(
  'I need to know if I should bring an umbrella to San Francisco today'
)

console.log('Auto-response:', autoResult.response.text())
```

### Tool Format

Gemini uses Google's function declaration format:

```typescript
// Tool definition format for Gemini
{
    name: string,
    description: string,
    parameters: {
        type: 'object',
        properties: object,
        required: string[]
    }
}
```

### Constraints

- **Tool names**: Must be valid JavaScript identifiers
- **Maximum tools**: Varies by model (typically 64+)
- **Schema**: JSON Schema for function parameters
- **Format**: Google-specific function declaration format

## Implementation Files

### Core Provider

- **`packages/providers/src/implementations/gemini.ts`** - Main Gemini provider implementation
  - Lines 25-30: TODO for MCP integration implementation
  - Lines 8-42: Complete sendRequestFunc implementation
  - Lines 44-56: Vendor configuration and capabilities

### Testing

- **`packages/providers/tests/unit/basic.test.ts`** - Basic package structure tests
- Integration tests are handled in the main plugin package due to Obsidian dependencies

### MCP Integration Files

- **`packages/providers/src/interfaces/base.ts`** - MCP integration interfaces
  - `MCPToolInjector` interface (line 48)
  - `MCPIntegration` interface (lines 62-68)

## Usage Examples

### Current Usage (No MCP Tools)

```typescript
import { geminiVendor } from '@tars/providers'

// Configure without MCP integration
const geminiOptions = {
    apiKey: 'your-gemini-api-key',
    model: 'gemini-1.5-flash',
    baseURL: 'https://generativelanguage.googleapis.com'
}

// Generate response (without tool calling)
const stream = geminiVendor.sendRequestFunc(geminiOptions)
for await (const chunk of stream(messages, abortController)) {
    console.log(chunk)
}
```

### Proposed MCP Integration

```typescript
// Proposed future implementation with MCP support
const geminiWithMCP = {
    ...geminiOptions,
    mcpIntegration: {
        toolCallingCoordinator: coordinator,
        providerAdapter: geminiAdapter
    },
    mcpExecutor: executor,
    documentPath: 'document.md'
}

// Would support automatic tool execution once implemented
```

## Supported Models

Gemini models with function calling support:

### Recommended Models
- `gemini-1.5-flash` - Fast, efficient tool calling
- `gemini-1.5-pro` - Advanced reasoning with tools
- `gemini-1.0-pro` - Stable model with tool support

### Model Capabilities
- **Function Calling**: Native support in all Gemini models
- **Multi-turn**: Conversational context maintained
- **Parallel Tools**: Can call multiple tools simultaneously
- **Streaming**: Real-time tool execution results

## Implementation Requirements

### Missing Components

1. **Tool Format Converter**: Convert MCP tools to Gemini format
2. **Provider Adapter**: Gemini-specific adapter for Tool Calling Coordinator
3. **Error Handling**: Proper error handling for tool failures
4. **Test Coverage**: Integration tests for tool calling

### Implementation Steps

1. **Create Tool Converter**
   ```typescript
   // packages/providers/src/implementations/gemini-tool-converter.ts
   export const convertMCPToolsToGemini = (tools: MCPTool[]) => {
       // Convert MCP tool format to Gemini function declaration format
   }
   ```

2. **Implement Provider Adapter**
   ```typescript
   // packages/providers/src/implementations/gemini-adapter.ts
   export const geminiAdapter: ProviderAdapter = {
       initialize: async (options) => { /* initialization */ },
       formatTools: (tools) => convertMCPToolsToGemini(tools),
       parseToolResponse: (response) => { /* parse Gemini tool calls */ }
   }
   ```

3. **Update Main Provider**
   - Add MCP integration logic to `gemini.ts`
   - Implement both advanced and simple paths
   - Add proper error handling and fallbacks

## Error Handling

The current provider has basic error handling:

1. **API key validation**: Checks for required API key
2. **Network errors**: Basic error propagation
3. **Missing MCP integration**: Logs debug message

### Required Error Handling for MCP

1. **Tool format conversion errors**: Handle schema conversion failures
2. **Adapter initialization errors**: Proper fallback behavior
3. **Tool execution errors**: Integration with error ring buffer
4. **Model compatibility**: Validate tool calling support

## Configuration

### Required Parameters

- `apiKey`: Google AI API key
- `model`: Gemini model identifier

### Optional Parameters

- `baseURL`: Custom API endpoint (default: `https://generativelanguage.googleapis.com`)
- `systemInstruction`: System prompt for model
- `generationConfig`: Model-specific generation parameters

### Future MCP Integration Options

- `mcpIntegration.toolCallingCoordinator`: Advanced tool coordination
- `mcpIntegration.providerAdapter`: Gemini-specific tool adapter
- `mcpExecutor`: Tool execution engine
- `documentPath`: Document context for session tracking
- `pluginSettings`: Plugin configuration options

## Development Notes

### Current State

The Gemini provider has:
- ✅ Basic streaming functionality
- ✅ Message formatting for Gemini API
- ✅ System instruction support
- ❌ **Missing MCP tool integration**
- ❌ **Missing tool calling support**

### Implementation Priority

1. **High Priority**: Tool format converter implementation
2. **High Priority**: Provider adapter for Tool Calling Coordinator
3. **Medium Priority**: Simple tool injection path
4. **Low Priority**: Advanced optimization features

### Key Features to Implement

- **Google function calling** with proper format conversion
- **Autonomous tool execution** with parallel processing support
- **Multi-turn conversations** with tool context
- **Document-scoped sessions** for context tracking
- **Graceful fallback** between integration approaches
- **Google-specific features** like grounding and search

### Debugging

Enable debug logging to trace current implementation:

```typescript
import { createLogger } from '@tars/logger'
const logger = createLogger('providers:gemini')
logger.level = 'debug'
```

### API Key Setup

```bash
# Get API key from Google AI Studio
# 1. Visit https://makersuite.google.com/app/apikey
# 2. Create new API key
# 3. Copy and store securely
```

### Testing Implementation

```typescript
// Test tool format conversion
const testToolConversion = () => {
    const mcpTools = [{
        name: 'test_tool',
        description: 'Test tool',
        inputSchema: {
            type: 'object',
            properties: { param: { type: 'string' } },
            required: ['param']
        }
    }]

    const geminiTools = convertMCPToolsToGemini(mcpTools)
    console.log('Gemini tools:', geminiTools)
}
```

---

*Last updated: 2025-10-18*
*Provider: Gemini*
*Status: MCP integration implementation required*