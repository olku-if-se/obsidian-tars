# SiliconFlow MCP Integration

## Overview

SiliconFlow provides OpenAI-compatible function calling capabilities through its API. The provider currently supports simple tool injection but requires the missing MCPToolInjector implementation for full functionality.

## MCP Integration Status

⚠️ **Partial Support** - Simple Path with Missing Implementation

- **Integration Type**: Simple Path
- **Status**: BROKEN - Requires MCPToolInjector implementation
- **Tool Format**: OpenAI Function Calling (Compatible)
- **Documentation**: [SiliconFlow Function Calling](https://docs.siliconflow.cn/cn/userguide/guides/function-calling)

## Provider Documentation

- **Official Docs**: [https://docs.siliconflow.cn](https://docs.siliconflow.cn)
- **Function Calling Guide**: [https://docs.siliconflow.cn/cn/userguide/guides/function-calling](https://docs.siliconflow.cn/cn/userguide/guides/function-calling)
- **API Reference**: [https://docs.siliconflow.cn/cn/api-reference](https://docs.siliconflow.cn/cn/api-reference)
- **Platform**: [https://siliconflow.cn](https://siliconflow.cn)

## MCP Tool Registration

### Current Implementation (Incomplete)

The provider uses simple tool injection but lacks the required MCPToolInjector:

```typescript
// File: packages/providers/src/implementations/siliconflow.ts
// Inject MCP tools if available
let requestParams: Record<string, unknown> = { model, ...remains }
if (mcpToolInjector) {
    try {
        requestParams = await mcpToolInjector.injectTools(requestParams, 'SiliconFlow')
    } catch (error) {
        logger.warn('failed to inject MCP tools for siliconflow', error)
    }
}
```

### Required Implementation

To enable MCP integration, the MCPToolInjector interface must be implemented:

```typescript
// Missing implementation in packages/providers/src/interfaces/base.ts
export class MCPToolInjectorImpl implements MCPToolInjector {
    async injectTools(parameters: Record<string, unknown>, providerName: string): Promise<Record<string, unknown>> {
        // Convert MCP tools to provider-specific format
        const mcpTools = await this.discoverMCPTools()
        const formattedTools = this.convertToProviderFormat(mcpTools, providerName)

        return {
            ...parameters,
            tools: formattedTools
        }
    }
}
```

### Tool Format

SiliconFlow uses OpenAI-compatible function calling format:

```typescript
// Tool definition format for SiliconFlow
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
- **Maximum tools**: Similar to OpenAI (typically 128)
- **Schema**: JSON Schema for function parameters

## Implementation Files

### Core Provider

- **`packages/providers/src/implementations/siliconflow.ts`** - Main SiliconFlow provider implementation
  - Lines 20-28: Simple MCP tool injection (requires MCPToolInjector)
  - Lines 13-60: Complete sendRequestFunc implementation
  - Lines 62-75: Vendor configuration and capabilities

### Missing Implementation

- **`packages/providers/src/interfaces/base.ts:48`** - MCPToolInjector interface definition
- **MCPToolInjector concrete class** - Implementation needed for simple path providers

### Testing

- **`packages/providers/tests/unit/basic.test.ts`** - Basic package structure tests
- Integration tests are handled in the main plugin package due to Obsidian dependencies

### MCP Integration Files

- **`packages/providers/src/interfaces/base.ts`** - MCP integration interfaces
  - `MCPToolInjector` interface (line 48) - **Missing implementation**

## Usage Examples

### Current Usage (No MCP Tools)

```typescript
import { siliconflowVendor } from '@tars/providers'

// Configure without MCP integration
const siliconflowOptions = {
    apiKey: 'your-siliconflow-api-key',
    model: 'deepseek-chat',
    baseURL: 'https://api.siliconflow.cn/v1'
}

// Generate response (without tool calling)
const stream = siliconflowVendor.sendRequestFunc(siliconflowOptions)
for await (const chunk of stream(messages, abortController)) {
    console.log(chunk)
}
```

### Intended MCP Integration (Once Fixed)

```typescript
// Proposed usage once MCPToolInjector is implemented
const siliconflowWithMCP = {
    ...siliconflowOptions,
    mcpToolInjector: new MCPToolInjectorImpl() // Missing implementation
}

// Would support automatic tool injection once implemented
```

## Supported Models

SiliconFlow provides access to various models with function calling support:

### Available Models
- `deepseek-chat` - DeepSeek chat model with tool calling
- `Qwen/Qwen2.5-7B-Instruct` - Qwen model with tool support
- `meta-llama/Llama-3.1-8B-Instruct` - Llama model with tool support
- `01-ai/Yi-1.5-9B-Chat-16K` - Yi model with tool support

### Model Categories
- **Chinese Models**: DeepSeek, Qwen, Yi
- **Open Source**: Llama, Mistral variants
- **Specialized**: Code models, instruction-tuned models
- **Cost-Optimized**: Various pricing tiers available

### Tool Calling Support
- **Full Support**: Most modern models support function calling
- **OpenAI Compatible**: Standard function calling format
- **Chinese Language**: Strong support for Chinese tool interactions

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

### Required Implementation Steps

1. **Create MCPToolInjector Implementation**
   ```typescript
   // packages/providers/src/implementations/mcp-tool-injector.ts
   export class MCPToolInjectorImpl implements MCPToolInjector {
       constructor(
           private mcpManager: unknown,
           private mcpExecutor: unknown
       ) {}

       async injectTools(parameters: Record<string, unknown>, providerName: string): Promise<Record<string, unknown>> {
           // Discover MCP tools
           const mcpTools = await this.discoverTools()

           // Convert to provider-specific format
           const formattedTools = this.convertForProvider(mcpTools, providerName)

           // Inject into parameters
           return {
               ...parameters,
               tools: formattedTools
           }
       }
   }
   ```

2. **Update Provider Initialization**
   ```typescript
   // In the plugin package, create and inject MCPToolInjector
   const toolInjector = new MCPToolInjectorImpl(mcpManager, mcpExecutor)
   provider.options.mcpToolInjector = toolInjector
   ```

3. **Add Error Handling**
   - Tool discovery failures
   - Format conversion errors
   - Provider-specific validation

## Error Handling

The current provider has basic error handling:

1. **API key validation**: Checks for required API key
2. **MCP injection errors**: Logs warning when injection fails
3. **Stream errors**: Proper error propagation

### Required Error Handling for MCP

1. **Tool discovery errors**: Handle MCP server unavailability
2. **Format conversion errors**: Validate schema conversion
3. **Injection failures**: Graceful fallback without tools
4. **Provider validation**: Check tool compatibility

## Configuration

### Required Parameters

- `apiKey`: SiliconFlow API key
- `model`: SiliconFlow model identifier
- `baseURL`: API endpoint (default: `https://api.siliconflow.cn/v1`)

### Optional Parameters

- `temperature`: Sampling temperature
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

The SiliconFlow provider has:
- ✅ OpenAI-compatible API integration
- ✅ Streaming response support
- ✅ Multiple model access
- ✅ Tool calling API compatibility
- ❌ **Broken MCP integration** due to missing MCPToolInjector
- ❌ **No advanced path** support

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

### Key Features (Post-Fix)

- **OpenAI-compatible tool calling** with proper format conversion
- **Chinese language model** support with tools
- **Simple injection** for basic MCP integration
- **Streaming responses** with tool execution
- **Cost-effective options** for tool calling
- **Error handling** with graceful fallbacks

### Debugging

Enable debug logging to trace current implementation:

```typescript
import { createLogger } from '@tars/logger'
const logger = createLogger('providers:siliconflow')
logger.level = 'debug'
```

### API Key Setup

```bash
# Get API key from SiliconFlow platform
# 1. Visit https://siliconflow.cn
# 2. Register and create API key
# 3. Copy and store securely
```

### Testing Implementation

```typescript
// Test tool injection once implemented
const testToolInjection = async () => {
    const toolInjector = new MCPToolInjectorImpl(mcpManager, mcpExecutor)
    const params = await toolInjector.injectTools({
        model: 'deepseek-chat',
        messages: []
    }, 'SiliconFlow')

    console.log('Injected parameters:', params)
}
```

### Model Selection

SiliconFlow offers various models optimized for different use cases:

```typescript
// Select models based on requirements
const modelSelection = {
    chineseOptimized: 'deepseek-chat',
    costEffective: 'Qwen/Qwen2.5-7B-Instruct',
    openSource: 'meta-llama/Llama-3.1-8B-Instruct',
    largeContext: '01-ai/Yi-1.5-9B-Chat-16K'
}
```

### Regional Considerations

SiliconFlow is particularly strong for:
- **Chinese language processing**
- **Asian market compliance**
- **Cost-effective inference**
- **Open source model hosting**

---

*Last updated: 2025-10-18*
*Provider: SiliconFlow*
*Status: Requires MCPToolInjector implementation to fix MCP integration*