# Provider Migration Plan

## Overview

Systematic migration of all providers to the new streaming architecture based on llm-chat.md + code-rules.md.

---

## Migration Priority

### Tier 1: Reference Implementation (Complete)
- [x] **OpenAI** - Reference implementation for OpenAI-compatible providers

### Tier 2: High Priority (Working MCP Integration)
1. [ ] **Claude** - Advanced path, different tool format
2. [ ] **Ollama** - Advanced path, OpenAI-compatible, local deployment

### Tier 3: Medium Priority (Tool Calling Support)
3. [ ] **Gemini** - Needs tool format implementation
4. [ ] **Grok** - OpenAI-compatible
5. [ ] **Azure** - OpenAI-compatible with special auth

### Tier 4: Standard Providers (OpenAI-Compatible)
6. [ ] **Deepseek** - OpenAI-compatible
7. [ ] **OpenRouter** - OpenAI-compatible
8. [ ] **SiliconFlow** - OpenAI-compatible
9. [ ] **Qwen** - OpenAI-compatible
10. [ ] **Zhipu** - OpenAI-compatible
11. [ ] **Doubao** - OpenAI-compatible
12. [ ] **Kimi** - OpenAI-compatible
13. [ ] **QianFan** - OpenAI-compatible

---

## Migration Template per Provider

### Phase 1: Analysis (30 minutes)
- [ ] Read provider docs in `docs/{provider}.md`
- [ ] Identify tool format (OpenAI/Claude/Gemini/Custom)
- [ ] Document streaming API specifics
- [ ] List current implementation files
- [ ] Note any special features (vision, reasoning, etc.)

### Phase 2: Types & Interfaces (1 hour)
- [ ] Create `src/providers/{provider}/types.ts`
  - Message format types
  - Tool call types
  - Response chunk types
  - Provider-specific options
- [ ] Export types from `src/providers/{provider}/index.ts`

### Phase 3: CompletionsStream (2-3 hours)
- [ ] Create `src/providers/{provider}/{Provider}CompletionsStream.ts`
- [ ] Extend `CompletionsStream` base class
- [ ] Implement message conversion
- [ ] Implement tool format conversion
- [ ] Implement streaming iterator
- [ ] Handle tool call accumulation
- [ ] Add error handling with cause chain

### Phase 4: Provider Class (1-2 hours)
- [ ] Create `src/providers/{provider}/{Provider}StreamingProvider.ts`
- [ ] Extend `StreamingProviderBase`
- [ ] Add `@injectable()` decorator
- [ ] Implement `createCompletionStream()`
- [ ] Add initialization logic
- [ ] Configure models and capabilities
- [ ] Add validation

### Phase 5: Testing (2-3 hours)
- [ ] Create `src/providers/{provider}/__tests__/`
- [ ] Unit tests for CompletionsStream
- [ ] Unit tests for Provider class
- [ ] Integration test with mock responses
- [ ] Test tool calling flow
- [ ] Test error handling
- [ ] Test abort/timeout scenarios

### Phase 6: Documentation (30 minutes)
- [ ] Update provider index exports
- [ ] Add usage examples
- [ ] Document tool calling specifics
- [ ] Add migration notes from old implementation

### Phase 7: Cleanup (30 minutes)
- [ ] Archive old implementation to `__archived__/`
- [ ] Update package exports
- [ ] Run tests and fix issues
- [ ] Update main README

**Total Time per Provider: 8-12 hours**

---

## Provider-Specific Details

### 1. Claude (Anthropic)

**Status**: ✅ MCP Working, 🔄 Needs Migration

**Key Differences:**
- Tool format: `{name, description, input_schema}`
- Response: `content[].type === 'tool_use'`
- Follow-up: User message with `tool_result` content blocks
- Special: Web search, thinking mode

**Files to Create:**
```
src/providers/claude/
  ├── types.ts
  ├── ClaudeCompletionsStream.ts
  ├── ClaudeStreamingProvider.ts
  ├── __tests__/
  │   └── ClaudeStreamingProvider.test.ts
  └── index.ts
```

**Implementation Notes:**
- Use `toClaudeTools()` converter
- Parse `content_block_start` and `content_block_delta` events
- Handle `tool_use` content blocks
- Support `enableWebSearch` and `enableThinking` options

**Estimated Time:** 10 hours

---

### 2. Ollama

**Status**: ✅ MCP Working, 🔄 Needs Migration

**Key Differences:**
- Tool format: OpenAI-compatible
- Local deployment (no API key)
- Connection health monitoring
- Model pull/management

**Files to Create:**
```
src/providers/ollama/
  ├── types.ts
  ├── OllamaCompletionsStream.ts
  ├── OllamaStreamingProvider.ts
  ├── __tests__/
  └── index.ts
```

**Implementation Notes:**
- Use `toOpenAITools()` converter
- Add connection health checks
- Support `ollama.abort()` for cancellation
- Handle model availability checks
- Default to `http://127.0.0.1:11434`

**Estimated Time:** 8 hours

---

### 3. Gemini

**Status**: ❌ No MCP, 🔄 Needs Implementation

**Key Differences:**
- Tool format: `{functionDeclaration: {...}}`
- Response: `response.functionCalls()`
- Follow-up: `{functionResponse: {name, response}}`
- Chat history management

**Files to Create:**
```
src/providers/gemini/
  ├── types.ts
  ├── GeminiCompletionsStream.ts
  ├── GeminiStreamingProvider.ts
  ├── __tests__/
  └── index.ts
```

**Implementation Notes:**
- Use `toGeminiTools()` converter
- Handle chat history with `startChat()`
- Parse function calls from response
- Support `systemInstruction`
- Handle streaming chunks properly

**Estimated Time:** 12 hours (includes tool implementation)

---

### 4. Grok

**Status**: Unknown, 🔄 Needs Migration

**Key Differences:**
- Tool format: OpenAI-compatible
- X.AI specific authentication

**Files to Create:**
```
src/providers/grok/
  ├── types.ts
  ├── GrokCompletionsStream.ts
  ├── GrokStreamingProvider.ts
  ├── __tests__/
  └── index.ts
```

**Implementation Notes:**
- Use `toOpenAITools()` converter
- Similar to OpenAI implementation
- Check X.AI API specifics

**Estimated Time:** 6 hours (very similar to OpenAI)

---

### 5. Azure OpenAI

**Status**: Unknown, 🔄 Needs Migration

**Key Differences:**
- Tool format: OpenAI-compatible
- Azure-specific authentication
- Deployment name instead of model
- Different endpoint structure

**Files to Create:**
```
src/providers/azure/
  ├── types.ts
  ├── AzureCompletionsStream.ts
  ├── AzureStreamingProvider.ts
  ├── __tests__/
  └── index.ts
```

**Implementation Notes:**
- Use `toOpenAITools()` converter
- Handle Azure AD authentication
- Support deployment names
- Handle API version parameter

**Estimated Time:** 10 hours (auth complexity)

---

## OpenAI-Compatible Providers (Tier 4)

All these can use the same pattern as OpenAI:

**Template for OpenAI-Compatible:**
```typescript
import { OpenAICompletionsStream } from '../openai/OpenAICompletionsStream'

class ProviderCompletionsStream extends OpenAICompletionsStream {
  // Inherit most functionality
  // Override only if needed
}
```

**Quick Migration:**
1. Copy OpenAI structure
2. Update naming
3. Adjust endpoint/auth
4. Test

**Estimated Time:** 4-6 hours each

---

## Migration Order Recommendation

### Week 1: Core Providers
1. **Day 1-2**: Claude (10h)
2. **Day 3**: Ollama (8h)

### Week 2: Tool Calling Providers  
3. **Day 1-2**: Gemini (12h)
4. **Day 3**: Grok (6h)
5. **Day 4**: Azure (10h)

### Week 3: Standard Providers
6-9. **Deepseek, OpenRouter, SiliconFlow, Qwen** (4-6h each)

### Week 4: Remaining Providers
10-13. **Zhipu, Doubao, Kimi, QianFan** (4-6h each)

**Total Estimated Time:** 100-120 hours (~3-4 weeks)

---

## Checklist per Provider

### Before Starting
- [ ] Read provider documentation thoroughly
- [ ] Check existing implementation
- [ ] Verify tool calling support
- [ ] Check API documentation

### During Migration
- [ ] Follow GIVEN/WHEN/THEN test pattern
- [ ] Use code-rules.md guidelines
- [ ] Preserve error cause chains
- [ ] Extract complex logic to utils
- [ ] Add error constants

### After Migration
- [ ] All tests passing
- [ ] TypeScript compiles
- [ ] Linting passes
- [ ] Documentation updated
- [ ] Demo works (if applicable)

### Quality Checks
- [ ] Error handling comprehensive
- [ ] Abort signal support
- [ ] Timeout protection
- [ ] Retry logic configured
- [ ] Tool calling tested (if supported)

---

## Common Code Patterns

### 1. Tool Call Accumulation (OpenAI-style)
```typescript
const toolCalls: Map<number, ToolCall> = new Map()

for await (const chunk of stream) {
  if (chunk.tool_calls) {
    for (const tc of chunk.tool_calls) {
      const idx = tc.index
      if (!toolCalls.has(idx)) {
        toolCalls.set(idx, {
          id: tc.id || '',
          type: 'function',
          function: { name: '', arguments: '' }
        })
      }
      const call = toolCalls.get(idx)!
      if (tc.function?.name) call.function.name += tc.function.name
      if (tc.function?.arguments) call.function.arguments += tc.function.arguments
    }
  }
}
```

### 2. Error Handling Pattern
```typescript
try {
  const stream = await this.client.create(request)
  // ... process stream
} catch (error) {
  yield {
    type: 'error',
    data: Object.assign(
      new Error(Errors.stream_failed),
      { cause: error }
    )
  }
}
```

### 3. Provider Initialization
```typescript
initialize(options: ProviderOptions): void {
  if (!options.apiKey) {
    throw new Error('API key is required')
  }
  
  this.options = options
  this.client = new ProviderClient({
    apiKey: options.apiKey,
    baseURL: options.baseURL
  })
  
  this.logger?.info?.('Provider initialized', {
    model: options.model,
    baseURL: options.baseURL
  })
}
```

---

## Testing Strategy

### Unit Tests
```typescript
describe('GIVEN: ProviderStreamingProvider', () => {
  describe('WHEN: Initializing', () => {
    it('THEN: Should validate required options', () => {
      expect(() => provider.initialize({})).toThrow()
    })
  })
  
  describe('WHEN: Streaming with tools', () => {
    it('THEN: Should convert tools to provider format', () => {
      const tools = [mockTool]
      const converted = provider.convertTools(tools)
      expect(converted).toMatchProviderFormat()
    })
  })
})
```

### Integration Tests
```typescript
describe('GIVEN: Tool calling scenario', () => {
  it('WHEN: LLM requests tool THEN: Should execute and continue', async () => {
    const toolManager = new ToolManager()
    toolManager.registerHandler('test_tool', mockHandler)
    
    const config = {
      callbacks: {
        onToolCall: (calls) => toolManager.executeMany(calls)
      },
      providerOptions: { tools: [mockTool] }
    }
    
    const chunks = []
    for await (const chunk of provider.stream(messages, config)) {
      chunks.push(chunk)
    }
    
    expect(chunks.length).toBeGreaterThan(0)
  })
})
```

---

## Success Criteria

### Per Provider
- ✅ All tests passing (100% pass rate)
- ✅ TypeScript compiles with no errors
- ✅ Linting passes (biome)
- ✅ Documentation complete
- ✅ Tool calling working (if supported)
- ✅ Error handling robust
- ✅ Streaming validated

### Overall
- ✅ 13 providers migrated
- ✅ Consistent patterns across all
- ✅ Comprehensive test coverage
- ✅ Documentation complete
- ✅ Demos working
- ✅ Production ready

---

## Support & Resources

### Documentation
- `docs/streaming-architecture.md` - Architecture guide
- `docs/TOOL_INTEGRATION_PATTERNS.md` - Tool patterns
- `docs/{provider}.md` - Provider-specific docs
- `CODE_RULES_COMPLIANCE.md` - Code quality guide

### Examples
- `src/providers/openai/` - Reference implementation
- `src/cli/streaming-demo.ts` - Working demo
- `src/streaming/__tests__/` - Test examples

### Tools
- `src/tools/format-converters.ts` - Tool converters
- `src/streaming/utils.ts` - Pure utilities
- `src/base/StreamingProviderBase.ts` - Base class

---

**Ready to start? Let's begin with Claude!** 🚀
