# Reference Implementation - COMPLETE ✅

## Overview

We've created a **comprehensive reference implementation** using the OpenAI provider that demonstrates all callback hooks and best practices.

**All future providers should follow this pattern!**

---

## Files Created

### 1. Core Implementation
**`OpenAIStreamingProvider.comprehensive.ts`**
- Complete streaming provider with all callback hooks
- Demonstrates proper hook invocation
- Shows clean architecture (no UI coupling)

### 2. Type Definitions
**`ComprehensiveCallbacks.ts`**
- 13 callback hook interfaces
- Full TypeScript support
- Clear input/output types

### 3. Usage Examples
**`COMPREHENSIVE_CALLBACKS_USAGE.md`**
- Examples for each callback
- Real-world use cases
- Integration patterns

**`REFERENCE_IMPLEMENTATION_EXAMPLE.md`**
- Complete working example
- OpenAI provider usage
- Full callback flow

---

## What's Demonstrated

### ✅ 1. Tool Injection
```typescript
onToolsRequest: async ({ provider, model, messages }) => {
  const tools = await mcpManager.getTools()
  return {
    tools,
    executor: (calls) => mcpManager.execute(calls)
  }
}
```

### ✅ 2. Message Transformation
```typescript
beforeStreamStart: async ({ messages, tools }) => {
  return {
    messages: enhanceMessages(messages),
    tools: filterTools(tools),
    cancel: !hasQuota
  }
}
```

### ✅ 3. Chunk Pre-Processing
```typescript
beforeChunk: async ({ chunk }) => {
  return {
    chunk: filterSensitive(chunk),
    skip: isEmpty(chunk)
  }
}
```

### ✅ 4. Chunk Post-Processing
```typescript
afterChunk: async ({ processedChunk, accumulated }) => {
  await document.append(processedChunk)
  await cache.store(accumulated)
}
```

### ✅ 5. Lifecycle Events
```typescript
onStreamStart: async ({ provider, model }) => {
  ui.showLoading(`Starting ${provider}...`)
}

onStreamEnd: async ({ totalChunks, duration }) => {
  ui.showSuccess(`Generated ${totalChunks} chunks in ${duration}ms`)
}
```

### ✅ 6. Error Handling
```typescript
onError: async ({ error, recoverable, attemptNumber }) => {
  return {
    retry: recoverable && attemptNumber < 3,
    retryDelay: 1000 * Math.pow(2, attemptNumber),
    notify: !recoverable
  }
}
```

### ✅ 7. Timeout Management
```typescript
onLongWaiting: async ({ percentage, chunksReceived }) => {
  return {
    showWarning: chunksReceived === 0,
    extendTimeout: chunksReceived > 0 ? 10000 : undefined
  }
}
```

---

## Callback Invocation Flow

```typescript
async *stream(messages, config) {
  const callbacks = config.callbacks
  
  // 1. Request tools
  const tools = await callbacks?.onToolsRequest?.(...)
  
  // 2. Transform setup
  const result = await callbacks?.beforeStreamStart?.({
    messages, tools, providerOptions
  })
  
  // Check cancellation
  if (result?.cancel) return
  
  // Apply modifications
  const finalMessages = result?.messages || messages
  const finalTools = result?.tools || tools
  
  // 3. Stream started
  await callbacks?.onStreamStart?.({ provider, model })
  
  // 4. Process chunks
  for await (const event of completionStream) {
    if (event.type === 'content') {
      // 4a. Pre-process
      const beforeResult = await callbacks?.beforeChunk?.({
        chunk: event.data
      })
      
      if (beforeResult?.skip) continue
      
      const processedChunk = beforeResult?.chunk || event.data
      
      // Yield chunk
      yield processedChunk
      
      // 4b. Post-process
      await callbacks?.afterChunk?.({
        originalChunk: event.data,
        processedChunk,
        accumulated
      })
    }
    
    // Handle tool calls
    if (event.type === 'tool_calls') {
      await callbacks?.onToolCall?.({ toolCalls: event.data })
    }
  }
  
  // 5. Stream ended
  await callbacks?.onStreamEnd?.({ totalChunks, duration })
}
```

---

## Architecture Principles Applied

### Rule: No UI in Providers
```
✅ Settings  - Configuration (injected)
✅ Logging   - Internal debugging (injected)
❌ Notifications - Via callbacks (onError)
❌ Documents - Via callbacks (afterChunk)
❌ Tools - Via callbacks (onToolsRequest)
```

### Clean Separation
- **Provider** = Pure streaming logic
- **Consumer** = Integration via callbacks
- **No coupling** between provider and UI/docs

### Type Safety
- Full TypeScript interfaces
- Clear hook signatures
- IDE autocomplete support

### Testability
- Mock callbacks easily
- Test providers in isolation
- No UI dependencies

---

## How to Apply to Other Providers

### Step 1: Copy Pattern
Use OpenAI provider as template:
```typescript
@injectable()
export class YourProvider extends StreamingProviderBase {
  constructor(
    loggingService = inject(tokens.Logger),
    settingsService = inject(tokens.Settings)
  ) {
    super(loggingService, settingsService)
  }
  
  async *stream(messages, config) {
    const callbacks = config.callbacks as ComprehensiveCallbacks
    
    // 1. onToolsRequest
    // 2. beforeStreamStart
    // 3. onStreamStart
    // 4. beforeChunk / afterChunk
    // 5. onStreamEnd
  }
}
```

### Step 2: Invoke Hooks
```typescript
// Before streaming
if (callbacks?.beforeStreamStart) {
  const result = await callbacks.beforeStreamStart({...})
  if (result.cancel) return
  // Apply modifications
}

// During streaming
if (callbacks?.beforeChunk) {
  const result = await callbacks.beforeChunk({...})
  if (result.skip) continue
  processedChunk = result.chunk || originalChunk
}

if (callbacks?.afterChunk) {
  await callbacks.afterChunk({...})
}
```

### Step 3: Handle Errors
```typescript
catch (error) {
  if (callbacks?.onError) {
    const result = await callbacks.onError({
      error,
      recoverable,
      attemptNumber,
      provider: this.name
    })
    
    if (result.retry) {
      // Implement retry logic
    }
  }
  throw error
}
```

---

## Migration Checklist

For each provider:

- [ ] Copy OpenAI provider structure
- [ ] Inject only 2 services (logging, settings)
- [ ] Implement `stream()` method with callback invocations
- [ ] Add `onToolsRequest` for tool injection
- [ ] Add `beforeStreamStart` for message transformation
- [ ] Add `beforeChunk` for chunk pre-processing
- [ ] Add `afterChunk` for chunk post-processing
- [ ] Add lifecycle events (start, end, error)
- [ ] Add timeout handling (longWaiting, timeout)
- [ ] Test with comprehensive callbacks
- [ ] Document provider-specific behavior

---

## Benefits Summary

### For Providers
- ✅ Clean, testable implementation
- ✅ No UI coupling
- ✅ Reusable across environments

### For Consumers
- ✅ Full control over integration
- ✅ Custom processing pipelines
- ✅ Flexible error handling
- ✅ Tool injection control

### For Architecture
- ✅ Event-driven design
- ✅ Separation of concerns
- ✅ Composable callbacks
- ✅ Type-safe interfaces

---

## Next Steps

### Immediate
1. ✅ Reference implementation complete (OpenAI)
2. ⏳ Apply pattern to 4 other providers (Grok, Deepseek, OpenRouter, SiliconFlow)
3. ⏳ Test comprehensive callbacks with real MCP integration

### Short Term
4. Migrate remaining 8 providers using this pattern
5. Create provider template generator
6. Add integration tests

### Medium Term
7. Performance optimization
8. Error recovery improvements
9. Production deployment

---

## Files Reference

```
packages/providers/src/
├── config/
│   ├── ComprehensiveCallbacks.ts              # Type definitions
│   ├── COMPREHENSIVE_CALLBACKS_USAGE.md       # Usage examples
│   └── COMPREHENSIVE_CALLBACK_SYSTEM.md       # Architecture
├── providers/
│   └── openai/
│       ├── OpenAIStreamingProvider.comprehensive.ts  # Reference implementation
│       └── REFERENCE_IMPLEMENTATION_EXAMPLE.md       # Complete example
└── REFERENCE_IMPLEMENTATION_COMPLETE.md        # This file
```

---

## Status

**✅ Reference Implementation Complete**

- Types defined
- OpenAI provider implemented
- Examples documented
- Ready to apply to other providers

**Next**: Apply pattern to remaining 4 migrated providers, then continue with 8 unmigrated providers.

---

*Completed: October 22, 2025*  
*Reference: OpenAI Streaming Provider*  
*Pattern: Comprehensive Callbacks*
