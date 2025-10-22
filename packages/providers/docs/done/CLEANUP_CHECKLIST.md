# Provider Refactoring Cleanup Checklist

## Overview

Track cleanup of old implementations as providers are migrated to new streaming architecture.

**Policy**: NO backward compatibility - clean breaks, others must adopt.

---

## Completed Cleanups

### ✅ OpenAI
- [x] Archived `src/implementations/openAI.ts`
- [x] Archived `src/implementations/openai-di.ts`
- [x] Updated `src/implementations/index.ts` to export new provider
- [x] New location: `src/providers/openai/`

### ✅ Grok
- [x] Archived `src/implementations/grok.ts`
- [x] Archived `src/implementations/grok-provider.ts`
- [x] Updated `src/implementations/index.ts` to export new provider
- [x] New location: `src/providers/grok/`

### ✅ Deepseek
- [x] Archived `src/implementations/deepSeek.ts`
- [x] Archived `src/implementations/deepseek-provider.ts`
- [x] Updated `src/implementations/index.ts` to export new provider
- [x] New location: `src/providers/deepseek/`

### ✅ OpenRouter
- [x] Archived `src/implementations/openRouter.ts`
- [x] Archived `src/implementations/openrouter-provider.ts`
- [x] Updated `src/implementations/index.ts` to export new provider
- [x] New location: `src/providers/openrouter/`

### ✅ SiliconFlow
- [x] Archived `src/implementations/siliconflow.ts`
- [x] Archived `src/implementations/siliconflow-provider.ts`
- [x] Updated `src/implementations/index.ts` to export new provider
- [x] New location: `src/providers/siliconflow/`

---

## Pending Cleanups

### High Priority (In Progress)

#### Claude
- [ ] Archive `src/implementations/claude.ts`
- [ ] Archive `src/implementations/claude-di.ts`
- [ ] Update exports
- [ ] New location: `src/providers/claude/` (when migrated)

#### Ollama
- [ ] Archive `src/implementations/ollama.ts`
- [ ] Archive `src/implementations/ollama-di.ts`
- [ ] Update exports
- [ ] New location: `src/providers/ollama/` (when migrated)

### Medium Priority

#### Gemini
- [ ] Archive `src/implementations/gemini.ts`
- [ ] Archive `src/implementations/gemini-provider.ts`
- [ ] Update exports
- [ ] New location: `src/providers/gemini/` (when migrated)

#### Azure
- [ ] Archive `src/implementations/azure.ts`
- [ ] Archive `src/implementations/azure-di.ts`
- [ ] Update exports
- [ ] New location: `src/providers/azure/` (when migrated)

### Standard Providers (OpenAI-Compatible)

#### OpenRouter
- [ ] Archive `src/implementations/openRouter.ts`
- [ ] Archive `src/implementations/openrouter-provider.ts`
- [ ] Update exports
- [ ] New location: `src/providers/openrouter/` (when migrated)

#### SiliconFlow
- [ ] Archive `src/implementations/siliconFlow.ts`
- [ ] Archive `src/implementations/siliconflow-provider.ts`
- [ ] Update exports
- [ ] New location: `src/providers/siliconflow/` (when migrated)

#### Qwen
- [ ] Archive `src/implementations/qwen.ts`
- [ ] Archive `src/implementations/qwen-provider.ts`
- [ ] Update exports
- [ ] New location: `src/providers/qwen/` (when migrated)

#### Zhipu
- [ ] Archive `src/implementations/zhipu.ts`
- [ ] Archive `src/implementations/zhipu-provider.ts`
- [ ] Update exports
- [ ] New location: `src/providers/zhipu/` (when migrated)

#### Doubao
- [ ] Archive `src/implementations/doubao.ts`
- [ ] Archive `src/implementations/doubao-provider.ts`
- [ ] Update exports
- [ ] New location: `src/providers/doubao/` (when migrated)

#### Kimi
- [ ] Archive `src/implementations/kimi.ts`
- [ ] Archive `src/implementations/kimi-provider.ts`
- [ ] Update exports
- [ ] New location: `src/providers/kimi/` (when migrated)

#### QianFan
- [ ] Archive `src/implementations/qianfan.ts`
- [ ] Archive `src/implementations/qianfan-provider.ts`
- [ ] Update exports
- [ ] New location: `src/providers/qianfan/` (when migrated)

---

## Additional Cleanup Tasks

### Code Cleanup
- [ ] Remove unused MCP helper references in old implementations
- [ ] Clean up old vendor exports once all migrated
- [ ] Remove deprecated interfaces from `src/interfaces/base.ts`
- [ ] Clean up `src/utils.ts` - extract to streaming utils

### Documentation Cleanup
- [ ] Update README.md with new import patterns
- [ ] Remove old usage examples from docs
- [ ] Add migration guide to main README
- [ ] Update API documentation

### Test Cleanup
- [ ] Archive old test files from `src/implementations/__tests__/`
- [ ] Ensure new provider tests cover same scenarios
- [ ] Update integration tests to use new providers
- [ ] Remove tests for old vendor pattern

### Build & Export Cleanup
- [ ] Update package.json exports if needed
- [ ] Verify all imports work correctly
- [ ] Run full build and fix any breakages
- [ ] Update tsconfig paths if needed

---

## Cleanup Process per Provider

### Step-by-Step

1. **After Migration Complete**
   ```bash
   # Archive old implementation
   mv src/implementations/{provider}.ts src/implementations/__archived__/
   
   # Archive DI wrapper if exists
   mv src/implementations/{provider}-di.ts src/implementations/__archived__/
   
   # Archive provider wrapper if exists
   mv src/implementations/{provider}-provider.ts src/implementations/__archived__/
   ```

2. **Update Exports**
   - Edit `src/implementations/index.ts`
   - Remove old provider export
   - Add new streaming provider export from `../providers/{provider}`
   - Update `allProviders` array

3. **Verify**
   ```bash
   # Build should pass
   pnpm build
   
   # Tests should pass
   pnpm test
   
   # Linting should pass
   pnpm lint
   ```

4. **Document**
   - Update `MIGRATION_STATUS.md`
   - Update `CLEANUP_CHECKLIST.md` (this file)
   - Add notes to provider-specific docs

---

## Final Cleanup (When All Migrated)

### Remove Completely
- [ ] Delete `src/implementations/__archived__/` directory
- [ ] Remove old vendor pattern from codebase
- [ ] Remove `src/interfaces/base.ts` if no longer needed
- [ ] Clean up `mcp-integration-helper.ts` references

### Update
- [ ] Simplify `src/implementations/index.ts` to just re-export from providers
- [ ] Update all documentation
- [ ] Create v2.0.0 release notes
- [ ] Announce breaking changes

---

## Breaking Changes Communication

### For Plugin Users

**Message Template:**
```markdown
## Breaking Changes in v2.0.0

All providers have been refactored to a new streaming architecture.

**Old Usage:**
```typescript
import { openAIVendor } from '@tars/providers'
const stream = openAIVendor.sendRequestFunc(options)
```

**New Usage:**
```typescript
import { OpenAIStreamingProvider } from '@tars/providers'
const provider = new OpenAIStreamingProvider()
provider.initialize(options)
const stream = provider.stream(messages, config)
```

See migration guide: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
```

### For Contributors

**Message Template:**
```markdown
## For Contributors

Old provider implementations have been archived.

- Do NOT modify files in `src/implementations/__archived__/`
- New providers must follow the streaming architecture
- See `PROVIDER_MIGRATION_PLAN.md` for details
- No backward compatibility - breaking changes expected
```

---

## Progress Tracking

**Cleanup Completed**: 5/13 providers (38%)
- ✅ OpenAI
- ✅ Grok
- ✅ Deepseek
- ✅ OpenRouter
- ✅ SiliconFlow

**Cleanup Remaining**: 8/13 providers (62%)

**Next Up**: Continue OpenAI-compatible batch, then Claude/Ollama (high priority)

---

## Cleanup Verification

### Checklist per Provider

- [ ] Old files archived
- [ ] Exports updated
- [ ] Build passes
- [ ] Tests pass
- [ ] No import errors
- [ ] Documentation updated
- [ ] MIGRATION_STATUS.md updated
- [ ] This checklist updated

---

*Last Updated: October 22, 2025*  
*Status: 3 providers cleaned up, 10 remaining*
