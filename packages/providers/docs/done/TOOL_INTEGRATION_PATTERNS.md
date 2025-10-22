# Tool Integration Patterns Across Providers

## Overview

This document consolidates tool calling patterns from all provider documentation to guide the new streaming architecture implementation.

## Provider Tool Formats Summary

### OpenAI Format
```typescript
{
  type: 'function',
  function: {
    name: string,
    description: string,
    parameters: JSONSchema  // JSON Schema object
  }
}
```
- **Tool choice**: `'auto'` | `'none'` | `{type: 'function', function: {name: string}}`
- **Response field**: `tool_calls` array in message delta
- **Follow-up**: `role: 'tool'`, `tool_call_id`, `content`

### Claude (Anthropic) Format
```typescript
{
  name: string,
  description: string,
  input_schema: JSONSchema  // JSON Schema object
}
```
- **Tool choice**: Automatic
- **Response field**: `content[].type === 'tool_use'`
- **Follow-up**: `role: 'user'`, `content: [{type: 'tool_result', tool_use_id, content}]`

### Ollama Format (OpenAI-Compatible)
```typescript
{
  type: 'function',
  function: {
    name: string,
    description: string,
    parameters: object  // JSON Schema
  }
}
```
- **Tool choice**: Automatic
- **Response field**: `message.tool_calls`
- **Follow-up**: `role: 'tool'`, `content`

### Gemini Format
```typescript
{
  functionDeclaration: {
    name: string,
    description: string,
    parameters: {
      type: 'object',
      properties: object,
      required: string[]
    }
  }
}
```
- **Tool choice**: Auto with `toolConfig.functionCallingConfig.mode`
- **Response field**: `response.functionCalls()`
- **Follow-up**: `{functionResponse: {name, response}}`

---

## Common Patterns

### 1. Tool Definition Structure

All providers use similar concepts:
- **Name**: Tool identifier (regex: `^[a-zA-Z0-9_-]{1,64}$`)
- **Description**: Human-readable purpose
- **Parameters/Schema**: JSON Schema for input validation

### 2. Tool Call Flow

1. **Send request** with tools array
2. **Receive response** with tool call requests
3. **Execute tools** (parallel or sequential)
4. **Send follow-up** with tool results
5. **Receive final response**

### 3. Streaming Tool Calls

All providers support streaming tool calls:
- Tool calls may be chunked/partial
- Need to accumulate tool call data across chunks
- Final tool call sent after stream completes

---

## Integration Strategy for Streaming Architecture

### 1. Provider-Specific CompletionsStream

Each provider's `CompletionsStream` should:

```typescript
// Provider-specific stream (e.g., OpenAICompletionsStream)
class ProviderCompletionsStream extends CompletionsStream {
  async *[Symbol.asyncIterator]() {
    // 1. Convert messages to provider format
    const providerMessages = this.convertMessages(this.messages)
    
    // 2. Add tools if available
    const request = {
      model: this.model,
      messages: providerMessages,
      stream: true
    }
    
    if (this.tools?.length > 0) {
      request.tools = this.convertTools(this.tools)  // Provider-specific
    }
    
    // 3. Stream response
    const stream = await this.client.create(request)
    
    // 4. Accumulate tool calls
    const toolCalls: Map<number, ToolCall> = new Map()
    
    for await (const chunk of stream) {
      // Yield content
      if (chunk.content) {
        yield { type: 'content', data: chunk.content }
      }
      
      // Accumulate tool calls (provider-specific)
      if (chunk.tool_calls) {
        this.accumulateToolCalls(toolCalls, chunk.tool_calls)
      }
    }
    
    // 5. Yield tool calls if any
    if (toolCalls.size > 0) {
      yield {
        type: 'tool_calls',
        data: Array.from(toolCalls.values())
      }
    }
    
    // 6. End stream
    yield { type: 'stream_end', data: null }
  }
  
  // Provider-specific tool conversion
  protected convertTools(tools: ToolDefinition[]) {
    // OpenAI: {type: 'function', function: {...}}
    // Claude: {name, description, input_schema}
    // Gemini: {functionDeclaration: {...}}
  }
}
```

### 2. Tool Format Converters

Create converter utilities:

```typescript
// src/tools/converters.ts

export const toOpenAITools = (tools: ToolDefinition[]) => {
  return tools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }))
}

export const toClaudeTools = (tools: ToolDefinition[]) => {
  return tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters
  }))
}

export const toGeminiTools = (tools: ToolDefinition[]) => {
  return tools.map(tool => ({
    functionDeclaration: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }))
}
```

### 3. Unified Tool Execution

The `ToolManager` already provides unified execution:

```typescript
// Works for all providers
const toolManager = new ToolManager()

toolManager.registerHandler('get_weather', async (toolCall) => {
  const args = JSON.parse(toolCall.function.arguments)
  const result = await fetchWeather(args.location)
  
  return {
    role: 'tool',
    tool_call_id: toolCall.id,
    content: JSON.stringify(result)
  }
})

// Execute tool calls (provider-agnostic)
const responses = await toolManager.executeMany(toolCalls)
```

### 4. Follow-Up Stream Creation

Provider-specific follow-up message formatting:

```typescript
// OpenAI/Ollama: Standard format
messages.push({ role: 'assistant', content: null, tool_calls })
messages.push(...toolResponses)

// Claude: User message with tool_result
messages.push({
  role: 'user',
  content: toolResponses.map(r => ({
    type: 'tool_result',
    tool_use_id: r.tool_call_id,
    content: r.content
  }))
})

// Gemini: Function response format
messages.push(
  toolResponses.map(r => ({
    functionResponse: {
      name: r.tool_name,
      response: JSON.parse(r.content)
    }
  }))
)
```

---

## Implementation Checklist per Provider

### ✅ OpenAI
- [x] Tool format converter (OpenAI format)
- [x] Tool call accumulation in stream
- [x] Follow-up message formatting
- [x] Reference implementation complete

### 🔄 Claude
- [ ] Tool format converter (Claude format)
- [ ] Tool call accumulation (content blocks)
- [ ] Follow-up message formatting (user + tool_result)
- [ ] CompletionsStream implementation

### 🔄 Ollama
- [ ] Tool format converter (OpenAI-compatible)
- [ ] Tool call accumulation
- [ ] Follow-up message formatting
- [ ] CompletionsStream implementation

### 🔄 Gemini
- [ ] Tool format converter (functionDeclaration)
- [ ] Tool call accumulation
- [ ] Follow-up message formatting (functionResponse)
- [ ] CompletionsStream implementation

---

## Code Examples from Provider Docs

### OpenAI Tool Call Accumulation

```typescript
// From openai.md - lines 179-191
const toolCalls: any[] = []
for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta
  if (delta.tool_calls) {
    for (const toolCallChunk of delta.tool_calls) {
      const index = toolCallChunk.index
      toolCalls[index] = toolCalls[index] || {
        id: '', type: 'function', function: { name: '', arguments: '' }
      }
      if (toolCallChunk.function?.name) {
        toolCalls[index].function.name += toolCallChunk.function.name
      }
      if (toolCallChunk.function?.arguments) {
        toolCalls[index].function.arguments += toolCallChunk.function.arguments
      }
    }
  }
}
```

### Claude Tool Call Detection

```typescript
// From claude.md - lines 73-77
if (response.content[0].type === 'tool_use') {
  const toolUse = response.content[0]
  console.log('Claude wants to use tool:', toolUse.name)
  console.log('Tool input:', toolUse.input)
}
```

### Ollama Tool Call Handling

```typescript
// From ollama.md - lines 73-82
if (response.message.tool_calls) {
  for (const toolCall of response.message.tool_calls) {
    console.log('Ollama wants to use tool:', toolCall.function.name)
    console.log('Tool input:', toolCall.function.arguments)
    
    const toolResult = await executeTool(
      toolCall.function.name,
      JSON.parse(toolCall.function.arguments)
    )
  }
}
```

### Gemini Function Call Handling

```typescript
// From gemini.md - lines 69-76
const functionCall = result.response.functionCalls()
if (functionCall) {
  for (const call of functionCall) {
    console.log('Function to call:', call.name)
    console.log('Arguments:', call.args)
    
    const functionResult = await executeFunction(call.name, call.args)
  }
}
```

---

## MCP Integration Status

From provider docs:

| Provider | Status | Integration Type | Tool Format |
|----------|--------|-----------------|-------------|
| OpenAI | ✅ Working | Advanced Path | OpenAI Function Calling |
| Claude | ✅ Working | Advanced Path | Anthropic Tool Use |
| Ollama | ✅ Working | Advanced Path | OpenAI-Compatible |
| Gemini | ❌ Missing | Not Implemented | Google Function Declaration |
| Grok | Status Unknown | - | OpenAI-Compatible |
| Deepseek | Status Unknown | - | OpenAI-Compatible |
| Azure | Status Unknown | - | OpenAI-Compatible |

---

## Recommendations for New Architecture

### 1. Create Tool Format Converters

```typescript
// src/tools/format-converters.ts
export const ToolFormatConverters = {
  openai: toOpenAITools,
  claude: toClaudeTools,
  ollama: toOpenAITools,  // Same as OpenAI
  gemini: toGeminiTools,
  grok: toOpenAITools,    // OpenAI-compatible
  azure: toOpenAITools    // OpenAI-compatible
}
```

### 2. Provider-Specific Tool Call Parsers

```typescript
// Each provider's CompletionsStream implements:
protected parseToolCalls(chunk: ProviderChunk): ToolCall[] | null {
  // Provider-specific parsing logic
}
```

### 3. Unified ToolManager

Keep current `ToolManager` - it's provider-agnostic and works for all.

### 4. Provider-Specific Message Formatters

```typescript
// Each provider implements:
protected formatFollowUpMessages(
  originalMessages: Message[],
  toolCalls: ToolCall[],
  toolResponses: ToolResponse[]
): ProviderMessage[] {
  // Provider-specific formatting
}
```

---

## Testing Strategy

### Unit Tests per Provider

```typescript
describe('OpenAI Tool Integration', () => {
  it('GIVEN: Tools array WHEN: Converting THEN: Should match OpenAI format', () => {
    const tools = [{ name: 'test', description: 'test', parameters: {} }]
    const openaiTools = ToolFormatConverters.openai(tools)
    expect(openaiTools[0]).toHaveProperty('type', 'function')
    expect(openaiTools[0]).toHaveProperty('function')
  })
  
  it('GIVEN: Streaming chunks WHEN: Accumulating tool calls THEN: Should build complete tool call', async () => {
    // Test tool call accumulation logic
  })
})
```

### Integration Tests

```typescript
describe('Tool Calling Flow', () => {
  it('GIVEN: Provider with tools WHEN: Requesting tool use THEN: Should execute and continue', async () => {
    // End-to-end tool calling test
  })
})
```

---

## References

- **openai.md** - Lines 98-164: Modern Tools API with streaming
- **claude.md** - Lines 26-128: Native SDK and streaming examples
- **ollama.md** - Lines 26-169: OpenAI-compatible tool calling
- **gemini.md** - Lines 26-226: Function calling with auto mode

---

*Last updated: October 22, 2025*  
*Based on provider documentation in packages/providers/docs/*
