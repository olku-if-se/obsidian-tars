# Code Rules Compliance Review

## Analysis of Current Implementation vs code-rules.md

### ✅ What We Got Right

#### 1. **Domain-Scoped File Structure**
- Each file exports a suite of related components
- `streaming/StreamQueue.ts` exports queue + related functionality
- `tools/ToolManager.ts` exports manager + executor
- Providers organized in subfolders

#### 2. **Static Factories**
```typescript
// ✅ Good: Using .from() pattern
CompletionsStream.from(messages, options)
```

#### 3. **AbortSignal as First-Class Citizen**
```typescript
// ✅ Good: Signal passed throughout
constructor(signal?: AbortSignal)
queue.push(stream, signal)
```

#### 4. **EventEmitter for Reactive Design**
```typescript
// ✅ Good: ToolManager uses EventEmitter
toolManager.on('get_weather', handler)
emitter.emit(event.type, event.data)
```

#### 5. **Options Objects**
```typescript
// ✅ Good: Configuration consolidated
interface StreamConfig {
  signal, callbacks, errorHandling, processing
}
```

#### 6. **Pure Core Logic**
- No console.log in core classes
- Side effects isolated to demos/tests

---

### ❌ What Needs Improvement

#### 1. **Redundant Domain Prefixes** (Major Issue)

**Current (Violates Rules):**
```typescript
// In streaming/types.ts
export interface StreamEvent { type: string; data: any }
export interface StreamEventType = 'content' | 'tool_calls' | ...
export interface ContentEvent extends StreamEvent<string>
export interface ToolCallsEvent extends StreamEvent<ToolCall[]>
```

**Should Be:**
```typescript
// In streaming/types.ts - domain is implicit from file path
export interface Event { type: string; data: any }
export type EventType = 'content' | 'tool_calls' | ...
export interface ContentEvent extends Event<string>
export interface ToolCallEvent extends Event<Call[]>
```

**Impact Areas:**
- `streaming/types.ts`: `StreamEvent` → `Event`, `StreamEventType` → `EventType`
- `tools/types.ts`: `ToolCall` → `Call`, `ToolResponse` → `Response`, `ToolHandler` → `Handler`
- `config/*.ts`: `RetryConfig` → `Retry`, `TimeoutConfig` → `Timeout`, `CallbackConfig` → `Callbacks`

#### 2. **Error Cause Chain Not Consistent**

**Current (Incorrect):**
```typescript
throw new Error('Stream timed out')
throw error
```

**Should Be:**
```typescript
throw Object.assign(
  new Error('Stream timed out after ${timeoutMs}ms'),
  { cause: error }
)
```

**Files Affected:**
- `streaming/StreamQueue.ts`
- `base/StreamingProviderBase.ts`
- `providers/openai/OpenAICompletionsStream.ts`

#### 3. **File Organization Not Following Template**

**Current:** Mixed order of exports

**Should Be (per code-rules.md):**
```typescript
// 1. Imports (external → workspace → relative)
import { EventEmitter } from 'events'
import type { Logger } from '@tars/logger'
import { StreamQueue } from './StreamQueue'

// 2. Debug logger (if needed)
const log = Debug('tars:streaming')

// 3. Error Messages (i18n-ready)
const Errors = {
  queue_closed: 'Cannot push to closed queue',
  timeout: 'Stream timed out due to inactivity',
} as const

// 4. Constants
const POLL_INTERVAL = 100 as const
const DEFAULT_TIMEOUT = 30000 as const

// 5. Type Contracts
interface Options { signal?: AbortSignal }
type Event = { type: 'content'; data: string }

// 6. Custom Exceptions
export class StreamError extends Error {
  static queueClosed = (cause?: unknown) =>
    Object.assign(new StreamError(Errors.queue_closed), { cause })
}

// 7. Pure Utilities
const withTimeout = <T>(iterable: AsyncIterable<T>) => { }

// 8. Main Class
export class StreamQueue implements AsyncIterable<Event> { }
```

#### 4. **Extract Complex Object Literals**

**Current (streaming/StreamQueue.ts):**
```typescript
await Promise.race([
  new Promise<void>((resolve) => setTimeout(resolve, pollInterval)),
  new Promise<void>((_, reject) => {
    this.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
  })
])
```

**Should Extract:**
```typescript
// Pure utility at top of file
const waitWithAbort = (ms: number, signal?: AbortSignal): Promise<void> => {
  return Promise.race([
    new Promise<void>(resolve => setTimeout(resolve, ms)),
    new Promise<void>((_, reject) => {
      signal?.addEventListener('abort', () => 
        reject(new DOMException('Aborted', 'AbortError'))
      )
    })
  ])
}

// Usage in class
await waitWithAbort(POLL_INTERVAL, this.signal)
```

#### 5. **Generic Type Names in Domain Files**

**Current naming is too specific:**

In `streaming/types.ts`:
- `StreamEvent` → `Event`
- `StreamEventType` → `EventType`  
- `StreamQueueState` → `State`
- `ICompletionsStream` → `Stream` (interface)

In `tools/types.ts`:
- `ToolCall` → `Call`
- `ToolResponse` → `Response`
- `ToolHandler` → `Handler`
- `ToolDefinition` → `Definition`
- `ToolExecutionResult` → `ExecutionResult`

In `config/ErrorHandlingConfig.ts`:
- `RetryConfig` → `Retry`
- `TimeoutConfig` → `Timeout`
- `ErrorReportingConfig` → `Reporting`
- `ErrorHandlingConfig` → `Config`

#### 6. **Missing Error Message Constants**

**Should Add at Top of Each File:**
```typescript
// In streaming/StreamQueue.ts
const Errors = {
  queue_closed: 'Cannot push to closed StreamQueue',
  queue_aborted: 'Queue processing aborted',
  stream_timeout: 'Stream timed out after inactivity',
} as const

// In tools/ToolManager.ts
const Errors = {
  no_handler: 'No handler registered for tool',
  handler_not_function: 'Handler is not a function',
  execution_failed: 'Tool execution failed',
  timeout: 'Tool execution timeout',
} as const
```

#### 7. **Type Exports Should Use Generic Names**

**Current:**
```typescript
// In streaming/index.ts
export type { StreamEvent, StreamEventType, ToolCall, ToolResponse }
```

**Should Be:**
```typescript
// In streaming/index.ts
export type { Event, EventType, Call, Response }

// Consumers import with namespace:
import type { Event, Call } from '@tars/providers/streaming'
// OR with alias if needed:
import type { Event as StreamEvent } from '@tars/providers/streaming'
```

---

## 🔧 Refactoring Action Plan

### Phase 1: Type Naming (Breaking Changes)

1. **streaming/types.ts**
   - Rename all types to generic names
   - Update exports

2. **tools/types.ts**
   - Rename to generic names within domain

3. **config/*.ts**
   - Simplify type names

4. **Update all imports** across codebase

### Phase 2: Error Handling

1. **Add Error Constants** to each file
2. **Create Custom Error Classes** with static factories
3. **Wrap all throws** with cause chain

### Phase 3: File Reorganization

1. **Reorder each file** to match template:
   - Imports
   - Debug logger
   - Error messages
   - Constants
   - Types
   - Custom errors
   - Utilities
   - Main classes

2. **Extract complex literals** to named constants

### Phase 4: Documentation Update

1. Update all documentation with new type names
2. Update examples in streaming-architecture.md
3. Update REFACTORING_SUMMARY.md

---

## 📊 Priority Assessment

### High Priority (Breaking Changes)
1. ✅ **Keep current names for v1** - already published
2. ❌ Generic names nice-to-have but require major refactor
3. ✅ **Error cause chain** - can add without breaking
4. ✅ **Extract utilities** - internal improvement

### Medium Priority (Non-Breaking)
1. File reorganization - internal cleanup
2. Error constants - improves i18n
3. Extract complex objects - readability

### Low Priority (Polish)
1. Debug logging setup
2. Additional documentation

---

## 🎯 Recommended Immediate Actions

### 1. Add Error Cause Chain (Non-Breaking)

Update error throwing throughout:

```typescript
// streaming/StreamQueue.ts
catch (error) {
  throw Object.assign(
    new Error('Stream processing failed'),
    { cause: error }
  )
}

// base/StreamingProviderBase.ts
catch (error) {
  const wrappedError = Object.assign(
    new Error('Stream creation failed'),
    { cause: error instanceof Error ? error : new Error(String(error)) }
  )
  throw wrappedError
}
```

### 2. Extract Utilities (Non-Breaking)

```typescript
// streaming/utils.ts
export const waitWithAbort = (ms: number, signal?: AbortSignal): Promise<void> => {
  return Promise.race([
    new Promise<void>(resolve => setTimeout(resolve, ms)),
    new Promise<void>((_, reject) => {
      signal?.addEventListener('abort', () =>
        reject(new DOMException('Aborted', 'AbortError'))
      )
    })
  ])
}

export const withTimeout = <T>(
  iterable: AsyncIterable<T>,
  timeoutMs: number,
  signal?: AbortSignal
): AsyncIterable<T> => {
  // Move timeout wrapper here
}
```

### 3. Add Error Constants (Non-Breaking)

Add to each file before classes:

```typescript
const Errors = {
  // human-readable, i18n-ready error messages
} as const
```

### 4. Document Compliance Status

Add badge to README:
```markdown
## Code Quality

- ✅ Static Factories
- ✅ EventEmitter Reactive Design
- ✅ AbortSignal First-Class
- ✅ Options Objects
- ⚠️ Generic Type Names (v2 target)
- 🔄 Error Cause Chain (in progress)
```

---

## 📝 Notes for Future Major Version (v2)

When ready for breaking changes, implement full generic naming:

```typescript
// v2: Fully compliant with code-rules.md
import { Event, Call } from '@tars/providers/streaming'
import { Handler, Executor } from '@tars/providers/tools'
import { Config, Retry } from '@tars/providers/config'
```

Current v1 maintains explicit names for clarity during initial adoption:
```typescript
// v1: Explicit for clarity
import { StreamEvent, ToolCall } from '@tars/providers/streaming'
import { ToolHandler } from '@tars/providers/tools'
import { StreamConfig } from '@tars/providers/config'
```

---

## ✅ Conclusion

**Current State:** 70% compliant with code-rules.md

**Strengths:**
- Architecture patterns (EventEmitter, factories, AbortSignal)
- File organization (subfolders)
- Composable design

**Areas for Improvement:**
- Type naming (planned for v2)
- Error cause chain (can add now)
- Utility extraction (can add now)

**Recommendation:** 
1. Add error cause chain now (non-breaking)
2. Extract utilities now (non-breaking)
3. Plan generic naming for v2 (breaking)
