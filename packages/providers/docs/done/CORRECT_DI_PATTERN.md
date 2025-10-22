# Correct Needle DI Pattern for Providers

## Issue
We were using parameter decorators (`@inject(...)`) which is NOT the correct pattern for needle-di v1.1.0.

## Correct Pattern

```typescript
import { injectable, inject } from '@needle-di/core'
import { tokens } from '@tars/contracts/tokens'
import type { ILoggingService } from '@tars/contracts'

@injectable()
export class MyStreamingProvider extends StreamingProviderBase {
  constructor(
    private loggingService = inject(tokens.Logger),
    private notificationService = inject(tokens.Notification, { optional: true }),
    private settingsService = inject(tokens.Settings, { optional: true }),
    private documentService = inject(tokens.Document, { optional: true })
  ) {
    super(loggingService, notificationService, settingsService, documentService)
  }
}
```

## Key Points from needle_di_monorepo_guide.md

1. **Use `inject()` as default parameter value**, not as decorator
2. **Stage-3 decorators only** - `@injectable()` on the class
3. **Optional injection**: `inject(Token, { optional: true })`
4. **No reflection** - explicit inject calls required

## References

- `docs/architecture/di/needle_di_monorepo_guide.md` - Section 7 & 14
- Example from guide:
  ```typescript
  @injectable()
  export class BarService {
    constructor(private foo = inject(FooService)) {}
  }
  ```

## Migration Needed

All providers need to be updated:
- OpenAI
- Grok
- Deepseek
- OpenRouter
- SiliconFlow

This will fix all the decorator-related TypeScript errors!
