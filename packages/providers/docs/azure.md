# Azure OpenAI MCP Integration

## Overview

Azure OpenAI provides OpenAI-compatible function calling capabilities through Azure's AI services. The provider supports both advanced tool-aware execution with autonomous coordination and simple tool injection, with additional Azure-specific configuration.

## MCP Integration Status

✅ **Full Support** - Advanced Path with Tool Calling Coordinator

- **Integration Type**: Advanced Path
- **Status**: WORKING
- **Tool Format**: OpenAI Function Calling (Azure-compatible)
- **Documentation**: [Azure Function Calling](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/function-calling)

## Provider Documentation

- **Official Docs**: [https://learn.microsoft.com/en-us/azure/ai-services/openai](https://learn.microsoft.com/en-us/azure/ai-services/openai)
- **Function Calling Guide**: [https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/function-calling](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/function-calling)
- **API Reference**: [https://learn.microsoft.com/en-us/azure/ai-services/openai/reference](https://learn.microsoft.com/en-us/azure/ai-services/openai/reference)
- **Azure Portal**: [https://portal.azure.com](https://portal.azure.com)

## MCP Tool Registration

### Native SDK Tool Usage

Here's how the Azure OpenAI SDK handles function calling natively:

```typescript
import { OpenAI } from 'openai'

// Configure Azure OpenAI client
const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `https://${process.env.AZURE_OPENAI_RESOURCE_NAME}.openai.azure.com`,
  defaultQuery: { 'api-version': '2024-02-15-preview' },
  defaultHeaders: {
    'api-key': process.env.AZURE_OPENAI_API_KEY,
  },
  dangerouslyAllowBrowser: true
})

// Define functions for Azure OpenAI
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

// Send message with functions using deployment name
const response = await openai.chat.completions.create({
  model: 'gpt-4-deployment', // Azure deployment name, not model ID
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
    model: 'gpt-4-deployment',
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

### Modern Tools API with Azure

```typescript
// Using the newer tools API with Azure OpenAI
const response = await openai.chat.completions.create({
  model: 'gpt-4-turbo-deployment', // Azure deployment name
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
    model: 'gpt-4-turbo-deployment',
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
// Streaming with function calling on Azure
const stream = await openai.chat.completions.create({
  model: 'gpt-4-deployment',
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

### Azure-Specific Configuration

```typescript
// Configure for different API versions
const azure2024Client = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `https://${process.env.AZURE_OPENAI_RESOURCE_NAME}.openai.azure.com`,
  defaultQuery: { 'api-version': '2024-02-15-preview' },
  defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY },
})

const azure2023Client = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `https://${process.env.AZURE_OPENAI_RESOURCE_NAME}.openai.azure.com`,
  defaultQuery: { 'api-version': '2023-12-01-preview' },
  defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY },
})

// Use specific deployments
const deploymentConfig = {
  gpt4: 'gpt-4-production-deployment',
  gpt4Turbo: 'gpt-4-turbo-deployment',
  gpt35: 'gpt-35-turbo-deployment'
}

// Switch between deployments based on requirements
const selectDeployment = (requiresLatest: boolean) => {
  return requiresLatest ? deploymentConfig.gpt4Turbo : deploymentConfig.gpt35
}
```

### Tool Format

Azure OpenAI uses OpenAI-compatible function calling format:

```typescript
// Tool definition format for Azure OpenAI
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
- **Deployment**: Must use Azure-specific deployment names

## Implementation Files

### Core Provider

- **`packages/providers/src/implementations/azure.ts`** - Main Azure provider implementation
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
import { azureVendor } from '@tars/providers'

// Configure with MCP integration
const azureOptions = {
    apiKey: 'your-azure-api-key',
    resourceName: 'your-azure-resource',
    deploymentName: 'your-deployment-name',
    apiVersion: '2024-02-15-preview',
    mcpIntegration: {
        toolCallingCoordinator: coordinator,
        providerAdapter: azureAdapter
    },
    mcpExecutor: executor,
    documentPath: 'document.md'
}

// Generate response with automatic tool execution
const stream = azureVendor.sendRequestFunc(azureOptions)
for await (const chunk of stream(messages, abortController)) {
    console.log(chunk)
}
```

### Azure-Specific Configuration

```typescript
// Configure with Azure-specific parameters
const azureConfigured = {
    ...azureOptions,
    resourceName: 'my-openai-resource',
    deploymentName: 'gpt-4-deployment',
    apiVersion: '2024-02-15-preview',
    baseURL: 'https://my-openai-resource.openai.azure.com'
}

// Azure OpenAI client will be configured automatically
const client = new OpenAI({
    baseURL: `${resourceName}.openai.azure.com`,
    defaultQuery: { 'api-version': apiVersion },
    defaultHeaders: { 'api-key': apiKey }
})
```

## Supported Models

Azure OpenAI supports the same models as OpenAI, deployed as Azure resources:

### Recommended Deployments
- `gpt-4` - Advanced reasoning with tool calling
- `gpt-4-turbo` - Enhanced performance
- `gpt-3.5-turbo` - Cost-effective option
- `gpt-35-turbo-16k` - Extended context

### Deployment Names
- **Model mapping**: Use Azure deployment names instead of model IDs
- **Versioning**: Specific API versions required for different features
- **Regional**: Deployed to specific Azure regions

## Error Handling

The provider implements Azure-specific error handling:

1. **Authentication errors**: Handles Azure API key validation
2. **Resource errors**: Detects missing or misconfigured resources
3. **Tool-aware path failure**: Falls back to simple injection
4. **MCP injection errors**: Logged with warning, continues without tools
5. **API version errors**: Validates API version compatibility

## Configuration

### Required Parameters

- `apiKey`: Azure OpenAI API key
- `resourceName`: Azure OpenAI resource name
- `deploymentName`: Azure deployment name (not model ID)
- `apiVersion`: Azure API version (e.g., `2024-02-15-preview`)

### Optional Parameters

- `baseURL`: Custom Azure endpoint (auto-generated if not provided)
- `temperature`: Sampling temperature (0-2)
- `max_tokens`: Maximum completion tokens
- `top_p`: Nucleus sampling parameter
- `frequency_penalty`: Frequency penalty (-2 to 2)
- `presence_penalty`: Presence penalty (-2 to 2)

### MCP Integration Options

- `mcpIntegration.toolCallingCoordinator`: Advanced tool coordination
- `mcpIntegration.providerAdapter`: Azure-specific tool adapter
- `mcpToolInjector`: Simple tool injection (legacy)
- `mcpExecutor`: Tool execution engine
- `documentPath`: Document context for session tracking
- `pluginSettings`: Plugin configuration options

## Development Notes

### Architecture

Azure OpenAI's MCP integration follows OpenAI patterns with Azure-specific configuration:

#### Advanced Path
1. **Azure Authentication**: Uses Azure API keys and resource names
2. **Tool Discovery**: MCP tools discovered via Tool Discovery Cache
3. **Format Conversion**: Tools converted to Azure OpenAI format by provider adapter
4. **Autonomous Execution**: Tool Calling Coordinator manages multi-turn conversations
5. **Result Integration**: Tool results integrated into conversation context

#### Simple Path
1. **Tool Injection**: MCP tools injected directly into request parameters
2. **Native Execution**: Azure OpenAI handles tool calling natively
3. **Azure Integration**: Simple result handling with Azure-specific configuration

### Key Features

- **Azure integration** with enterprise-grade security
- **Dual integration paths** for maximum compatibility
- **Autonomous tool execution** with parallel processing support
- **Multi-turn conversations** with tool context
- **Document-scoped sessions** for context tracking
- **Graceful fallback** between integration approaches
- **Enterprise features** like VNet integration and private endpoints

### Azure Setup

```bash
# Create Azure OpenAI resource
az cognitiveservices account create \
  --name my-openai-resource \
  --resource-group my-resource-group \
  --kind OpenAI \
  --sku S0 \
  --location eastus

# Create model deployment
az cognitiveservices account deployment create \
  --name my-openai-resource \
  --resource-group my-resource-group \
  --deployment-name gpt-4-deployment \
  --model-name gpt-4 \
  --model-version "0613" \
  --model-format OpenAI \
  --scale-settings-scale-type "Standard"
```

### API Version Management

```typescript
// Use specific API versions for different features
const apiVersions = {
    toolCalling: '2024-02-15-preview',
    streaming: '2023-12-01-preview',
    legacy: '2023-05-15'
}
```

### Debugging

Enable debug logging to trace MCP integration:

```typescript
import { createLogger } from '@tars/logger'
const logger = createLogger('providers:azure')
logger.level = 'debug'
```

Monitor Azure resource health:

```bash
# Check resource status
az cognitiveservices account show \
  --name my-openai-resource \
  --resource-group my-resource-group

# View deployment details
az cognitiveservices account deployment list \
  --name my-openai-resource \
  --resource-group my-resource-group
```

### Security Considerations

- **API Keys**: Store Azure API keys securely
- **Network Security**: Use VNet integration for enterprise deployments
- **Identity**: Consider managed identities for Azure resources
- **Logging**: Enable Azure Monitor logging for troubleshooting
- **Compliance**: Azure provides built-in compliance certifications

---

*Last updated: 2025-10-18*
*Provider: Azure OpenAI*