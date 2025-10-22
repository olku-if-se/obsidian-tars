# Archived Provider Implementations

## Purpose

This directory contains the **old provider implementations** that have been migrated to the new streaming architecture.

## Migration Status

These providers have been **fully migrated** to the new architecture in `src/providers/`:

### ✅ Migrated Providers

1. **OpenAI** → `src/providers/openai/`
   - Old: `openAI.ts`, `openai-di.ts`
   - New: `OpenAIStreamingProvider`, `OpenAICompletionsStream`
   - Date: October 22, 2025

2. **Grok** → `src/providers/grok/`
   - Old: `grok.ts`, `grok-provider.ts`
   - New: `GrokStreamingProvider`, `GrokCompletionsStream`
   - Date: October 22, 2025

3. **Deepseek** → `src/providers/deepseek/`
   - Old: `deepSeek.ts`, `deepseek-provider.ts`
   - New: `DeepseekStreamingProvider`, `DeepseekCompletionsStream`
   - Date: October 22, 2025

## Breaking Changes

**NO BACKWARD COMPATIBILITY** - These old implementations are archived for reference only.

### What Changed

**Old Architecture:**
```typescript
// Old pattern
const sendRequestFunc = (settings: BaseOptions): SendRequest =>
  async function* (messages, controller, resolve) {
    // Direct implementation
  }

export const vendor: Vendor = {
  name: 'Provider',
  sendRequestFunc,
  // ...
}
```

**New Architecture:**
```typescript
// New pattern
@injectable()
class ProviderStreamingProvider extends StreamingProviderBase {
  protected createCompletionStream(messages, config) {
    return new ProviderCompletionsStream(messages, config, this.client)
  }
}
```

### Migration Benefits

1. **StreamQueue** - Multi-stream management for tool calling
2. **ToolManager** - EventEmitter-based tool execution
3. **Unified Config** - Error handling, retries, timeouts
4. **Code Quality** - Follows code-rules.md patterns
5. **DI Integration** - Full needle-di support
6. **Provider Subfolders** - Better organization

## For Other Developers

### Do NOT Use These Files

- These are **archived for reference only**
- **No maintenance** will be done on these files
- **Import from new locations** in `src/providers/`

### Migration Guide

If you're maintaining code that uses these old providers:

**Old Import:**
```typescript
import { openAIVendor } from '@tars/providers/implementations'
```

**New Import:**
```typescript
import { OpenAIStreamingProvider } from '@tars/providers'

// Initialize
const provider = new OpenAIStreamingProvider()
provider.initialize({ apiKey, model, baseURL })

// Use
for await (const chunk of provider.stream(messages, config)) {
  console.log(chunk)
}
```

### See Documentation

- `docs/streaming-architecture.md` - New architecture guide
- `PROVIDER_MIGRATION_PLAN.md` - Migration roadmap
- `MIGRATION_STATUS.md` - Current progress

## Files in This Directory

- `openAI.ts` - Old OpenAI implementation
- `openai-di.ts` - Old OpenAI DI wrapper
- `grok.ts` - Old Grok implementation  
- `grok-provider.ts` - Old Grok provider wrapper
- `deepSeek.ts` - Old Deepseek implementation
- `deepseek-provider.ts` - Old Deepseek provider wrapper

## Timeline

- **October 22, 2025**: Migrated OpenAI, Grok, Deepseek
- **Remaining**: 10 providers to migrate (Claude, Ollama, Gemini, Azure, etc.)

---

**Note**: These files will remain here for reference during the migration period. Once all providers are migrated, this directory may be removed entirely.

*Last Updated: October 22, 2025*
