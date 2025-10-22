# Comprehensive Callback System - Architecture Design

## Design Goals Achieved

### ✅ 1. Tool Injection
```typescript
onToolsRequest: async ({ provider, model }) => {
  return {
    tools: await toolRegistry.getTools(),
    executor: async (calls) => toolManager.execute(calls)
  }
}
```

### ✅ 2. Message Transformation (Before/After)
```typescript
beforeStreamStart: async ({ messages }) => {
  return {
    messages: enhanceMessages(messages),
    tools: filterTools(tools),
    providerOptions: customizeOptions()
  }
}
```

### ✅ 3. Chunk Pre/Post Processing
```typescript
beforeChunk: async ({ chunk }) => {
  return { chunk: transform(chunk), skip: shouldSkip(chunk) }
}

afterChunk: async ({ processedChunk, accumulated }) => {
  await document.update(processedChunk)
  await analytics.track(accumulated)
}
```

### ✅ 4. Utility Events
```typescript
onStreamStart: async () => { /* start */ }
onStreamEnd: async () => { /* complete */ }
onError: async ({ error, recoverable }) => { 
  return { retry, notify, retryDelay }
}
onBeforeRetry: async ({ attemptNumber }) => { /* retry */ }
onLongWaiting: async ({ percentage }) => { 
  return { extendTimeout, showWarning }
}
onTimeout: async () => { /* timeout */ }
```

---

## Callback Hooks by Category

### Lifecycle Hooks
1. **beforeStreamStart** - Modify messages/tools before streaming
2. **onStreamStart** - Stream started successfully
3. **onStreamEnd** - Stream completed successfully

### Chunk Hooks
4. **beforeChunk** - Pre-process each chunk (transform/skip)
5. **afterChunk** - Post-process each chunk (side effects)

### Tool Hooks
6. **onToolsRequest** - Inject tools into provider
7. **onToolCall** - Execute tools when LLM requests

### Error Hooks
8. **onError** - Handle errors (retry/notify)
9. **onBeforeRetry** - Before retry attempt
10. **onRetrySuccess** - After successful retry

### Performance Hooks
11. **onLongWaiting** - 75% timeout warning (extend/warn)
12. **onTimeout** - Timeout occurred

### Generic Hook
13. **onStreamEvent** - Low-level event stream

---

## Key Features

### 1. Full Control
- ✅ Modify messages before sending
- ✅ Transform chunks before display
- ✅ Control retry behavior
- ✅ Extend timeouts dynamically
- ✅ Cancel streaming conditionally

### 2. Type-Safe
- ✅ Full TypeScript interfaces
- ✅ Clear input/output types
- ✅ IDE autocomplete support
- ✅ Compile-time validation

### 3. Composable
- ✅ Mix and match callbacks
- ✅ Add/remove as needed
- ✅ Chain multiple processors
- ✅ No coupling between hooks

### 4. Clean Architecture
- ✅ Provider = Pure logic (no UI)
- ✅ Consumer = Integration (via callbacks)
- ✅ Separation of concerns
- ✅ Testable in isolation

---

## Implementation Strategy

### Phase 1: Core Interfaces ✅
- [x] Define ComprehensiveCallbacks interface
- [x] Define all hook types
- [x] Create usage documentation

### Phase 2: Integrate with StreamConfig (Next)
- [ ] Add ComprehensiveCallbacks to StreamConfig
- [ ] Update StreamingProviderBase to invoke hooks
- [ ] Implement hook execution logic

### Phase 3: Update Providers
- [ ] Update all 5 providers to support hooks
- [ ] Add tool injection points
- [ ] Add chunk transformation points

### Phase 4: Testing & Examples
- [ ] Create test suite for callbacks
- [ ] Add examples for each hook
- [ ] Document real-world use cases

---

## Usage Example

```typescript
// Complete example with all hooks
const config: StreamConfig = {
  callbacks: {
    // Tool injection
    onToolsRequest: async () => ({
      tools: await mcpManager.getTools(),
      executor: (calls) => mcpManager.execute(calls)
    }),
    
    // Message enhancement
    beforeStreamStart: async ({ messages }) => ({
      messages: [{ role: 'system', content: context }, ...messages]
    }),
    
    // Chunk transformation
    beforeChunk: async ({ chunk }) => ({
      chunk: filterSensitive(chunk)
    }),
    
    // Document updates
    afterChunk: async ({ processedChunk }) => {
      await document.append(processedChunk)
    }),
    
    // Error handling
    onError: async ({ error, recoverable, attemptNumber }) => ({
      retry: recoverable && attemptNumber < 3,
      retryDelay: 1000 * Math.pow(2, attemptNumber),
      notify: !recoverable
    }),
    
    // Timeout warning
    onLongWaiting: async ({ percentage }) => ({
      showWarning: true,
      warningMessage: 'Still processing...'
    })
  }
}

// Stream with comprehensive callbacks
for await (const content of provider.stream(messages, config)) {
  // Content already processed by callbacks
}
```

---

## Benefits Over Simple Callbacks

### Simple Callbacks (Old)
```typescript
{
  onContent: (chunk) => append(chunk),
  onError: (error) => show(error)
}
```
- ❌ No message transformation
- ❌ No tool injection control
- ❌ No chunk pre-processing
- ❌ Limited error control
- ❌ No timeout handling

### Comprehensive Callbacks (New)
```typescript
{
  beforeStreamStart: modify messages/tools,
  beforeChunk: transform chunk,
  afterChunk: update document,
  onToolsRequest: inject tools,
  onError: control retry/notify,
  onLongWaiting: extend timeout
}
```
- ✅ Full message control
- ✅ Tool injection
- ✅ Chunk transformation
- ✅ Advanced error handling
- ✅ Timeout management
- ✅ Performance monitoring

---

## Architecture Alignment

### Rule: No UI in Providers
```
✅ Settings  - Configuration
✅ Logging   - Internal debugging
❌ Notifications - Via onError callback
❌ Documents - Via afterChunk callback
❌ Tools - Via onToolsRequest callback
```

**Everything external goes through callbacks!**

---

## Next Steps

### Immediate (This Session)
1. ✅ Define comprehensive callback interfaces
2. ✅ Create usage documentation
3. ⏳ Integrate into StreamConfig
4. ⏳ Update StreamingProviderBase

### Short Term
5. Update all 5 providers to support hooks
6. Add tool injection examples
7. Test with MCP integration

### Medium Term
8. Migrate remaining 8 providers
9. Create real-world examples
10. Performance testing

---

## Decision Point

**Should we integrate these comprehensive callbacks now?**

**Option A**: Integrate now (~1-2 hours)
- Update StreamConfig
- Update StreamingProviderBase hook execution
- Test with 1 provider

**Option B**: Continue migrations, integrate later
- Keep current simple callbacks
- Migrate more providers
- Batch-integrate later

**Recommendation**: Option A
- Architecture is correct
- Clean integration point
- Future providers benefit immediately

---

*Design Date: October 22, 2025*  
*Status: Interfaces defined, ready for integration*  
*Files Created:*
- `ComprehensiveCallbacks.ts` - Type definitions
- `COMPREHENSIVE_CALLBACKS_USAGE.md` - Examples
- `COMPREHENSIVE_CALLBACK_SYSTEM.md` - Architecture (this file)
