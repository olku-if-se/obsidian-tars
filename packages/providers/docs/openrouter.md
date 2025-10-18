# OpenRouter MCP Integration

## Overview

OpenRouter provides OpenAI-compatible function calling capabilities through its multi-provider routing service. The provider supports both advanced tool-aware execution with autonomous coordination and simple tool injection for maximum compatibility.

## MCP Integration Status

✅ **Full Support** - Advanced Path with Tool Calling Coordinator

- **Integration Type**: Advanced Path
- **Status**: WORKING
- **Tool Format**: OpenAI Function Calling (Compatible)
- **Documentation**: [OpenRouter Tool Calling](https://openrouter.ai/docs/features/tool-calling)

## Provider Documentation

- **Official Docs**: [https://openrouter.ai/docs](https://openrouter.ai/docs)
- **Tool Calling Guide**: [https://openrouter.ai/docs/features/tool-calling](https://openrouter.ai/docs/features/tool-calling)
- **API Reference**: [https://openrouter.ai/docs/api](https://openrouter.ai/docs/api)
- **Platform**: [https://openrouter.ai](https://openrouter.ai)

## MCP Tool Registration

### Native SDK Tool Usage

Here's how the OpenRouter SDK handles function calling natively (using OpenAI-compatible client):

```typescript
import OpenAI from 'openai'

// Configure OpenRouter client
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  dangerouslyAllowBrowser: true
})

// Define tools for OpenRouter
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

// Send message with tools using different models
const response = await openrouter.chat.completions.create({
  model: 'anthropic/claude-3.5-sonnet',
  messages: [
    {
      role: 'user',
      content: 'What\'s the weather like in New York?'
    }
  ],
  tools: tools,
  tool_choice: 'auto'
})

// Handle tool call
const toolCalls = response.choices[0].message.tool_calls
if (toolCalls) {
  for (const toolCall of toolCalls) {
    console.log('Tool to use:', toolCall.function.name)
    console.log('Arguments:', toolCall.function.arguments)

    // Execute tool and send result back
    const toolResult = await executeTool(
      toolCall.function.name,
      JSON.parse(toolCall.function.arguments)
    )

    const finalResponse = await openrouter.chat.completions.create({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'user', content: 'What\'s the weather like in New York?' },
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

### Multi-Provider Model Selection

```typescript
// Use different models through OpenRouter
const modelOptions = {
  claude: 'anthropic/claude-3.5-sonnet',
  gpt4: 'openai/gpt-4o',
  gemini: 'google/gemini-pro-1.5',
  llama: 'meta-llama/Llama-3.1-70B-Instruct',
  qwen: 'qwen/qwen-2.5-72b-instruct'
}

// Select model based on requirements
const selectModel = (requirements) => {
  if (requirements.advancedReasoning) {
    return modelOptions.claude
  }
  if (requirements.costOptimized) {
    return modelOptions.llama
  }
  if (requirements.multimodal) {
    return modelOptions.gpt4
  }
  return modelOptions.gemini // Default
}

// Use selected model with tools
const flexibleResponse = await openrouter.chat.completions.create({
  model: selectModel({ advancedReasoning: true }),
  messages: [
    { role: 'user', content: 'Analyze this complex data and call tools as needed' }
  ],
  tools: tools,
  tool_choice: 'auto'
})
```

### Streaming with Tools

```typescript
// Streaming tool usage with OpenRouter
const stream = await openrouter.chat.completions.create({
  model: 'openai/gpt-4o',
  messages: [
    { role: 'user', content: 'Check the weather in Tokyo and London' }
  ],
  tools: tools,
  stream: true,
  temperature: 0.7,
  max_tokens: 1000
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

### Provider-Specific Features

```typescript
// Use OpenRouter-specific parameters
const advancedResponse = await openrouter.chat.completions.create({
  model: 'anthropic/claude-3.5-sonnet',
  messages: [
    { role: 'user', content: 'Help me with some calculations' }
  ],
  tools: [
    {
      type: 'function',
      function: {
        name: 'calculator',
        description: 'Perform mathematical calculations',
        parameters: {
          type: 'object',
          properties: {
            expression: { type: 'string', description: 'Mathematical expression' }
          },
          required: ['expression']
        }
      }
    }
  ],
  // OpenRouter-specific parameters
  models: [modelOptions.claude, modelOptions.gpt4], // Fallback models
  route: 'fallback', // Routing strategy
  transforms: ['middle-out'], // Response transformations
  provider: {
    order: ['anthropic', 'openai'], // Provider preference
    allow_fallbacks: true
  }
})
```

### Cost Management and Monitoring

```typescript
// Monitor usage and costs
const costAwareRequest = async (prompt, tools) => {
  const response = await openrouter.chat.completions.create({
    model: 'anthropic/claude-3.5-sonnet',
    messages: [{ role: 'user', content: prompt }],
    tools: tools,
    tool_choice: 'auto',
    // Include usage metadata
    user: 'user-session-123',
    max_tokens: 500, // Limit tokens for cost control
    temperature: 0.1 // Lower temperature for more deterministic responses
  })

  // Extract usage information
  const usage = response.usage
  console.log(`Prompt tokens: ${usage.prompt_tokens}`)
  console.log(`Completion tokens: ${usage.completion_tokens}`)
  console.log(`Total tokens: ${usage.total_tokens}`)

  // Estimate cost (example rates)
  const promptCost = usage.prompt_tokens * 0.000003 // $3 per million
  const completionCost = usage.completion_tokens * 0.000015 // $15 per million
  const totalCost = promptCost + completionCost

  console.log(`Estimated cost: $${totalCost.toFixed(6)}`)

  return {
    response: response.choices[0].message,
    usage: usage,
    cost: totalCost
  }
}
```

### Tool Format

OpenRouter uses OpenAI-compatible function calling format:

```typescript
// Tool definition format for OpenRouter
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
- **Maximum tools**: Varies by underlying model (typically 128)
- **Schema**: JSON Schema for function parameters
- **Provider-specific**: Some models may have different tool calling capabilities

## Implementation Files

### Core Provider

- **`packages/providers/src/implementations/openRouter.ts`** - Main OpenRouter provider implementation
  - Lines 25-70: Advanced MCP integration with Tool Calling Coordinator
  - Lines 72-80: Simple MCP tool injection fallback
  - Lines 9-105: Complete sendRequestFunc implementation
  - Lines 107-120: Vendor configuration and capabilities

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
import { openRouterVendor } from '@tars/providers'

// Configure with MCP integration
const openRouterOptions = {
    apiKey: 'your-openrouter-api-key',
    model: 'anthropic/claude-3.5-sonnet',
    baseURL: 'https://openrouter.ai/api/v1',
    mcpIntegration: {
        toolCallingCoordinator: coordinator,
        providerAdapter: openRouterAdapter
    },
    mcpExecutor: executor,
    documentPath: 'document.md'
}

// Generate response with automatic tool execution
const stream = openRouterVendor.sendRequestFunc(openRouterOptions)
for await (const chunk of stream(messages, abortController)) {
    console.log(chunk)
}
```

### Multi-Provider Routing

```typescript
// Use different models through OpenRouter
const openRouterMulti = {
    ...openRouterOptions,
    model: 'openai/gpt-4o' // Route to OpenAI via OpenRouter
}

// Or use Claude
const openRouterClaude = {
    ...openRouterOptions,
    model: 'anthropic/claude-3.5-sonnet'
}

// Or local models
const openRouterLocal = {
    ...openRouterOptions,
    model: 'meta-llama/llama-3.1-8b-instruct:free'
}
```

## Supported Models

OpenRouter provides access to multiple models with varying tool calling capabilities:

### Recommended Models for Tool Calling
- `anthropic/claude-3.5-sonnet` - Excellent tool calling
- `openai/gpt-4o` - Advanced reasoning with tools
- `google/gemini-pro-1.5` - Google's latest with tool support
- `meta-llama/llama-3.1-70b-instruct` - Open source with tool support

### Model Categories
- **Premium Models**: GPT-4, Claude 3.5, Gemini Pro
- **Open Source**: Llama 3.1, Mistral, Mixtral
- **Specialized**: Code models, reasoning models
- **Free Tier**: Limited access to some models

### Tool Calling Support
- **Full Support**: Most modern models support function calling
- **Variable Limits**: Tool limits depend on underlying model
- **Format Compatibility**: OpenAI-compatible format across providers

## Error Handling

The provider implements comprehensive error handling:

1. **Authentication errors**: Handles OpenRouter API key validation
2. **Model availability**: Detects unavailable or deprecated models
3. **Tool-aware path failure**: Falls back to simple injection
4. **MCP injection errors**: Logged with warning, continues without tools
5. **Provider-specific errors**: Handles differences between underlying models

## Configuration

### Required Parameters

- `apiKey`: OpenRouter API key
- `model`: OpenRouter model identifier (provider/model format)
- `baseURL`: API endpoint (default: `https://openrouter.ai/api/v1`)

### Optional Parameters

- `temperature`: Sampling temperature
- `max_tokens`: Maximum completion tokens
- `top_p`: Nucleus sampling parameter
- `frequency_penalty`: Frequency penalty
- `presence_penalty`: Presence penalty
- `route`: Preferred routing strategy
- `models`: Fallback model options

### OpenRouter-Specific Parameters

- `route`: Routing strategy (fallback, balance, etc.)
- `models`: Array of fallback models
- `provider`: Preference for specific providers
- `transforms`: Response transformation options

### MCP Integration Options

- `mcpIntegration.toolCallingCoordinator`: Advanced tool coordination
- `mcpIntegration.providerAdapter`: OpenRouter-specific tool adapter
- `mcpToolInjector`: Simple tool injection (legacy)
- `mcpExecutor`: Tool execution engine
- `documentPath`: Document context for session tracking
- `pluginSettings`: Plugin configuration options

## Development Notes

### Architecture

OpenRouter's MCP integration provides flexibility across multiple providers:

#### Advanced Path
1. **Provider Discovery**: Route requests to optimal providers
2. **Tool Discovery**: MCP tools discovered via Tool Discovery Cache
3. **Format Conversion**: Tools converted to OpenAI format for compatibility
4. **Autonomous Execution**: Tool Calling Coordinator manages multi-turn conversations
5. **Provider Abstraction**: Transparent switching between underlying providers

#### Simple Path
1. **Tool Injection**: MCP tools injected directly into request parameters
2. **Provider Routing**: OpenRouter handles model selection
3. **Native Execution**: Underlying provider handles tool calling
4. **Unified Interface**: Single API for multiple providers

### Key Features

- **Multi-provider access** through single API
- **Dual integration paths** for maximum compatibility
- **Autonomous tool execution** with parallel processing support
- **Model fallbacks** and routing strategies
- **Document-scoped sessions** for context tracking
- **Graceful fallback** between integration approaches
- **Provider-specific optimizations** and features

### Model Selection Strategy

```typescript
// Optimize model selection for tool calling
const selectOptimalModel = (requirements: ToolRequirements) => {
    if (requirements.advancedReasoning) {
        return 'anthropic/claude-3.5-sonnet'
    }
    if (requirements.costOptimized) {
        return 'meta-llama/llama-3.1-8b-instruct:free'
    }
    return 'openai/gpt-4o' // Default balanced option
}
```

### Debugging

Enable debug logging to trace MCP integration:

```typescript
import { createLogger } from '@tars/logger'
const logger = createLogger('providers:openrouter')
logger.level = 'debug'
```

Monitor OpenRouter usage and routing:

```bash
# Check API usage
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
     https://openrouter.ai/api/v1/models

# View routing decisions
# Enable request_id in responses for debugging
```

### Cost Management

OpenRouter provides detailed cost tracking:

```typescript
// Monitor usage and costs
const costTracking = {
    model: 'anthropic/claude-3.5-sonnet',
    maxCost: 0.10, // $0.10 per request limit
    promptTokens: 1000,
    completionTokens: 500
}
```

### Performance Optimization

- **Model selection**: Choose appropriate models for task complexity
- **Routing strategy**: Use fallback models for reliability
- **Token optimization**: Manage prompt and completion tokens
- **Parallel execution**: Enable for faster tool processing

### Troubleshooting

**Common Issues:**

1. **Model unavailability**: Check OpenRouter status page
2. **Rate limiting**: Implement proper backoff strategies
3. **Tool format mismatches**: Verify underlying model compatibility
4. **Routing issues**: Use specific model identifiers

**Health Checks:**

```typescript
// Verify OpenRouter connectivity and model availability
const checkOpenRouterHealth = async () => {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    })
    const models = await response.json()
    return models.data.filter(m => m.id.includes('claude') || m.id.includes('gpt'))
}
```

---

*Last updated: 2025-10-18*
*Provider: OpenRouter*