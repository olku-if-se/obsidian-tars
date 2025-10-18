# Remaining Providers MCP Integration

This document covers the remaining providers that have partial or no MCP integration support.

## Overview

The following providers are grouped together due to similar implementation status and requirements:

- **Qwen** - Alibaba Cloud model with OpenAI-compatible API
- **Kimi** - Moonshot AI model with tool calling capabilities
- **Zhipu** - Chinese AI model with function calling support
- **Doubao** - ByteDance model with limited tool support
- **QianFan** - Baidu AI Cloud model
- **GPT Image** - OpenAI DALL-E integration (no tool calling)

## Common Implementation Pattern

All these providers use the OpenAI-compatible API pattern but require the missing MCPToolInjector implementation:

```typescript
// Common pattern across all remaining providers
let requestParams: Record<string, unknown> = { model, ...remains }
if (mcpToolInjector) {
    try {
        requestParams = await mcpToolInjector.injectTools(requestParams, 'ProviderName')
    } catch (error) {
        logger.warn('failed to inject MCP tools for provider', error)
    }
}
```

## Qwen (Alibaba Cloud)

### MCP Integration Status
⚠️ **Partial Support** - Simple Path with Missing Implementation

### Native SDK Tool Usage

```typescript
import OpenAI from 'openai'

const qwen = new OpenAI({
  apiKey: process.env.QWEN_API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  dangerouslyAllowBrowser: true
})

// Tool calling with Qwen models
const response = await qwen.chat.completions.create({
  model: 'qwen-turbo',
  messages: [
    { role: 'user', content: 'Check the weather in Beijing' }
  ],
  tools: [
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get weather information',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string' }
          },
          required: ['location']
        }
      }
    }
  ]
})
```

### Supported Models
- `qwen-turbo` - Fast, cost-effective
- `qwen-plus` - Enhanced capabilities
- `qwen-max` - Top performance with tool support

## Kimi (Moonshot AI)

### MCP Integration Status
⚠️ **Partial Support** - Simple Path with Missing Implementation

### Native SDK Tool Usage

```typescript
import OpenAI from 'openai'

const kimi = new OpenAI({
  apiKey: process.env.KIMI_API_KEY,
  baseURL: 'https://api.moonshot.cn/v1',
  dangerouslyAllowBrowser: true
})

// Long context with tool calling
const response = await kimi.chat.completions.create({
  model: 'moonshot-v1-8k',
  messages: [
    { role: 'user', content: 'Analyze this document and extract key information' }
  ],
  tools: [
    {
      type: 'function',
      function: {
        name: 'extract_entities',
        description: 'Extract named entities from text',
        parameters: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            entity_types: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['text']
        }
      }
    }
  ]
})
```

### Supported Models
- `moonshot-v1-8k` - 8K context window
- `moonshot-v1-32k` - 32K context window
- `moonshot-v1-128k` - 128K context window

## Zhipu (GLM)

### MCP Integration Status
⚠️ **Partial Support** - Simple Path with Missing Implementation

### Native SDK Tool Usage

```typescript
import OpenAI from 'openai'

const zhipu = new OpenAI({
  apiKey: process.env.ZHIPU_API_KEY,
  baseURL: 'https://open.bigmodel.cn/api/paas/v4',
  dangerouslyAllowBrowser: true
})

// Chinese language model with tools
const response = await zhipu.chat.completions.create({
  model: 'glm-4',
  messages: [
    { role: 'user', content: '帮我查询北京的天气' }
  ],
  tools: [
    {
      type: 'function',
      function: {
        name: '查询天气',
        description: '查询指定城市的天气信息',
        parameters: {
          type: 'object',
          properties: {
            城市: {
              type: 'string',
              description: '城市名称'
            }
          },
          required: ['城市']
        }
      }
    }
  ]
})
```

### Supported Models
- `glm-4` - Latest generation with tool support
- `glm-3-turbo` - Fast, efficient model
- `glm-4v` - Multimodal model with vision

## Doubao (ByteDance)

### MCP Integration Status
⚠️ **Partial Support** - Simple Path with Missing Implementation

### Native SDK Tool Usage

```typescript
import OpenAI from 'openai'

const doubao = new OpenAI({
  apiKey: process.env.DOUBAO_API_KEY,
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  dangerouslyAllowBrowser: true
})

// ByteDance model with tool calling
const response = await doubao.chat.completions.create({
  model: 'doubao-pro-4k',
  messages: [
    { role: 'user', content: 'Search for information about AI trends' }
  ],
  tools: [
    {
      type: 'function',
      function: {
        name: 'web_search',
        description: 'Search the web for information',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            limit: { type: 'number' }
          },
          required: ['query']
        }
      }
    }
  ]
})
```

### Supported Models
- `doubao-pro-4k` - Professional model
- `doubao-pro-32k` - Extended context
- `doubao-pro-128k` - Large context window

## QianFan (Baidu)

### MCP Integration Status
⚠️ **Partial Support** - Simple Path with Missing Implementation

### Native SDK Tool Usage

```typescript
import OpenAI from 'openai'

const qianfan = new OpenAI({
  apiKey: process.env.QIANFAN_API_KEY,
  baseURL: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1',
  dangerouslyAllowBrowser: true
})

// Baidu ERNIE model with tools
const response = await qianfan.chat.completions.create({
  model: 'ernie-3.5-8k',
  messages: [
    { role: 'user', content: '帮我分析这段文本的情感' }
  ],
  tools: [
    {
      type: 'function',
      function: {
        name: '情感分析',
        description: '分析文本的情感倾向',
        parameters: {
          type: 'object',
          properties: {
            文本: {
              type: 'string',
              description: '待分析的文本'
            }
          },
          required: ['文本']
        }
      }
    }
  ]
})
```

### Supported Models
- `ernie-3.5-8k` - ERNIE 3.5 with 8K context
- `ernie-4.0-8k` - Latest ERNIE 4.0
- `ernie-speed-8k` - Fast inference model

## GPT Image (DALL-E)

### MCP Integration Status
❌ **No Support** - Image Generation Only

### Usage Pattern

```typescript
import OpenAI from 'openai'

const gptImage = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1',
  dangerouslyAllowBrowser: true
})

// Image generation (no tool calling)
const response = await gptImage.images.generate({
  model: 'dall-e-3',
  prompt: 'A beautiful sunset over mountains',
  size: '1024x1024',
  quality: 'standard'
})
```

### Supported Models
- `dall-e-3` - Latest DALL-E model
- `dall-e-2` - Previous generation

## Common Implementation Requirements

### Missing MCPToolInjector

All these providers require the same missing implementation:

```typescript
// Required for all remaining providers
export class MCPToolInjectorImpl implements MCPToolInjector {
    constructor(
        private mcpManager: unknown,
        private mcpExecutor: unknown
    ) {}

    async injectTools(parameters: Record<string, unknown>, providerName: string): Promise<Record<string, unknown>> {
        // Convert MCP tools to OpenAI format
        const mcpTools = await this.discoverTools()
        const formattedTools = this.convertToOpenAIFormat(mcpTools)

        return {
            ...parameters,
            tools: formattedTools
        }
    }
}
```

### Tool Format Standardization

All providers use OpenAI-compatible function calling format:

```typescript
{
    type: 'function',
    function: {
        name: string,
        description: string,
        parameters: JSONSchema
    }
}
```

## Development Priorities

### High Priority
1. **Implement MCPToolInjector** - Common requirement for all providers
2. **Tool format validation** - Ensure schema compliance
3. **Error handling** - Consistent error patterns

### Medium Priority
1. **Provider-specific features** - Leverage unique capabilities
2. **Performance optimization** - Model-specific tuning
3. **Testing coverage** - Integration tests for each provider

### Low Priority
1. **Advanced path support** - Tool Calling Coordinator integration
2. **Multimodal features** - Vision and audio capabilities
3. **Specialized tools** - Provider-specific tool formats

## Testing Strategy

### Common Tests
```typescript
// Test tool injection for each provider
const testProviderToolInjection = async (providerName: string, vendor: Vendor) => {
    const mockMCPTools = [
        {
            name: 'test_tool',
            description: 'Test tool for validation',
            inputSchema: {
                type: 'object',
                properties: { param: { type: 'string' } },
                required: ['param']
            }
        }
    ]

    const toolInjector = new MCPToolInjectorImpl(mcpManager, mcpExecutor)
    const params = await toolInjector.injectTools({
        model: vendor.models[0],
        messages: []
    }, providerName)

    console.log(`${providerName} tool injection result:`, params)
}
```

---

*Last updated: 2025-10-18*
*Providers: Qwen, Kimi, Zhipu, Doubao, QianFan, GPT Image*
*Status: Requires MCPToolInjector implementation for tool calling support*