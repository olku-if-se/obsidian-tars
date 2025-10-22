# Simplified DI Architecture - Clean Separation of Concerns

## Problem Analysis

### Current (Over-Engineered)
```typescript
constructor(
  loggingService = inject(tokens.Logger),          // ✅ Provider needs this
  notificationService = inject(tokens.Notification), // ❌ Should be callback
  settingsService = inject(tokens.Settings),        // ✅ Provider needs this  
  documentService = inject(tokens.Document)         // ❌ Should be callback
)
```

**Issues:**
1. Providers don't need direct access to notifications - they emit events
2. Providers don't need direct document access - consumers handle updates
3. Creates unnecessary coupling between providers and UI/document systems
4. Makes providers harder to test and reuse

---

## Proposed Clean Architecture

### Essential Services (Keep)

**1. Logging Service** ✅
```typescript
loggingService = inject(tokens.Logger)
```
- **Why**: Providers need to log internally (debug, errors, performance)
- **Scope**: Provider-level logging, not user-facing
- **Example**: `this.loggingService.debug('Creating stream...')`

**2. Settings Service** ✅
```typescript
settingsService = inject(tokens.Settings)
```
- **Why**: Providers need config (API keys, models, timeouts)
- **Scope**: Provider configuration, defaults, validation
- **Example**: `this.settingsService.get('apiKey')`

### Move to Callbacks (Remove from DI)

**3. Notification Service** ❌ → ✅ `onError` Callback
```typescript
// OLD (Wrong)
this.notificationService.show('Error occurred')

// NEW (Correct)
config.callbacks.onError?.(error, recoverable)
// Consumer decides: show notification, log, retry, etc.
```

**4. Document Service** ❌ → ✅ `onContent` Callback
```typescript
// OLD (Wrong)  
this.documentService.writeFile(path, content)

// NEW (Correct)
config.callbacks.onContent?.(chunk)
// Consumer decides: write to doc, display in UI, save to buffer, etc.
```

---

## New Constructor Pattern

### Simplified Providers

```typescript
@injectable()
export class OpenAIStreamingProvider extends StreamingProviderBase {
  constructor(
    private loggingService = inject(tokens.Logger),
    private settingsService = inject(tokens.Settings)
  ) {
    super(loggingService, settingsService)
  }
}
```

**Benefits:**
1. ✅ Only 2 dependencies (down from 4)
2. ✅ Clear separation: provider logic vs consumer integration
3. ✅ Easier testing (mock 2 services instead of 4)
4. ✅ Reusable across different environments (CLI, web, Obsidian)

---

## Callback-Driven Integration

### Consumer Responsibility

```typescript
// In Obsidian plugin (consumer code)
const provider = container.get(OpenAIStreamingProvider)

const config: StreamConfig = {
  callbacks: {
    onError: (error, recoverable) => {
      // Consumer handles notifications
      notificationService.error(error.message)
      if (!recoverable) {
        documentService.markFailed()
      }
    },
    
    onContent: (chunk) => {
      // Consumer handles document updates
      documentService.append(chunk)
    },
    
    onToolCall: async (toolCalls) => {
      // Consumer handles tool execution
      return await toolManager.executeMany(toolCalls)
    }
  }
}

// Provider emits events, consumer handles them
for await (const content of provider.stream(messages, config)) {
  // Additional processing if needed
}
```

---

## Updated Base Class

### StreamingProviderBase (Simplified)

```typescript
export abstract class StreamingProviderBase extends BaseProvider {
  protected loggingService: ILoggingService
  protected settingsService: ISettingsService

  constructor(
    loggingService: ILoggingService,
    settingsService: ISettingsService
  ) {
    super()
    this.loggingService = loggingService
    this.settingsService = settingsService
  }
  
  // No notification/document services!
  // These are handled by callbacks in StreamConfig
}
```

---

## Migration Plan

### Phase 1: Update Base Class ✅ Next
1. Simplify `StreamingProviderBase` constructor to 2 params
2. Remove `notificationService`, `documentService` fields
3. Update abstract methods

### Phase 2: Update All Providers (5 providers)
1. OpenAI - Remove 2 service injections
2. Grok - Remove 2 service injections
3. Deepseek - Remove 2 service injections
4. OpenRouter - Remove 2 service injections
5. SiliconFlow - Remove 2 service injections

### Phase 3: Update DIBaseProvider (if needed)
1. Check if DIBaseProvider still needs 4 services
2. Possibly create separate interfaces:
   - `StreamingProvider` - 2 services (new architecture)
   - `DIBaseProvider` - 4 services (legacy compatibility)

### Phase 4: Future Providers
All new providers use simplified 2-service pattern!

---

## Comparison

### Before (4 Services)
```typescript
constructor(
  loggingService,      // Provider internal
  notificationService, // UI concern → callback
  settingsService,     // Provider internal
  documentService      // Data concern → callback
)
```

### After (2 Services)
```typescript
constructor(
  loggingService,   // Provider internal ✅
  settingsService   // Provider internal ✅
)
// All external concerns handled by callbacks
```

---

## Benefits Summary

### For Providers
- ✅ Simpler, clearer responsibilities
- ✅ Easier to test (2 mocks instead of 4)
- ✅ Less coupling to external systems
- ✅ More reusable (CLI, web, desktop)

### For Consumers
- ✅ Full control over notifications
- ✅ Full control over document updates
- ✅ Can implement custom behavior easily
- ✅ Better separation of concerns

### For Architecture
- ✅ Clean event-driven design
- ✅ Follows callback pattern we already have
- ✅ Aligns with llm-chat.md architecture
- ✅ Better testability overall

---

## Example: Error Handling

### Old Way (Tightly Coupled)
```typescript
// Provider directly shows notification
try {
  await doSomething()
} catch (error) {
  this.notificationService.error('Failed!')  // ❌ Provider knows about UI
  this.documentService.markFailed()         // ❌ Provider knows about docs
  throw error
}
```

### New Way (Decoupled)
```typescript
// Provider emits error event
try {
  await doSomething()
} catch (error) {
  await this.invokeCallback(
    config.callbacks?.onError,
    error,
    false // not recoverable
  )
  throw error
}

// Consumer decides what to do
callbacks: {
  onError: (error, recoverable) => {
    notificationService.error(error.message)  // Consumer's choice
    documentService.markFailed()               // Consumer's choice
    analytics.trackError(error)                // Consumer can add anything!
  }
}
```

---

## Decision

**Should we refactor now?**

**Option A**: Refactor now (30-45 min)
- Update base class
- Update all 5 providers
- Clean, correct architecture from the start
- Future providers follow correct pattern

**Option B**: Continue as-is, refactor later
- Keep current 4-service pattern
- More providers migrated quickly
- Bigger refactor needed later

**Recommendation**: Option A
- We have good momentum
- Only 5 providers to update
- Sets correct pattern for remaining 8 providers
- Cleaner architecture is worth 30-45 min

---

*Analysis Date: October 22, 2025*  
*Principle: Clean Separation of Concerns*
