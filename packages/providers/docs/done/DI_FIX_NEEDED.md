# DI Pattern Fix Needed

## Problem
All 5 migrated providers use **incorrect needle-di pattern**.

## Affected Providers
- ✅ OpenAI
- ✅ Grok  
- ✅ Deepseek
- ✅ OpenRouter
- ✅ SiliconFlow

## Current (Wrong) Pattern
```typescript
constructor(
  @inject(tokens.Logger) loggingService?: ILoggingService,
  @inject(tokens.Notification, { optional: true }) notificationService?: any,
  ...
)
```

## Correct Pattern
```typescript
constructor(
  private loggingService = inject(tokens.Logger),
  private notificationService = inject(tokens.Notification, { optional: true }),
  ...
) {
  super(loggingService, notificationService, settingsService, documentService)
}
```

## Fix Strategy

### Option A: Fix All Now (30min)
Update all 5 providers with correct DI pattern in one go.

### Option B: Fix as We Go
Fix future providers correctly, batch-fix these 5 later.

### Option C: Fix Base Class First
Update `StreamingProviderBase` to show correct pattern, then update all children.

## Impact
- Fixes ALL decorator TypeScript errors
- Makes code compliant with needle-di v1.1.0
- Cleaner, more idiomatic DI usage

## Next Steps
1. Decide on fix strategy
2. Update base class example
3. Fix all 5 providers
4. Document correct pattern for future migrations

**Recommendation**: Option C - Fix base class first to establish pattern, then batch-fix all providers.
