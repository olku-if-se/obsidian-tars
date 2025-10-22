# Multi-Provider E2E Testing

## Overview

E2E tests for multiple AI providers with real API calls, testing comprehensive callback systems across all providers.

## Supported Providers

### ✅ OpenAI (Primary Gold Standard)
- **Tests**: 9 comprehensive callback tests + model verification
- **API Key**: `OPENAI_API_KEY`
- **Status**: ✅ **Fully Working**
- **Cost**: ~$0.003 per test run with gpt-5-nano

### ✅ Grok (xAI)
- **Tests**: 2 basic tests (streaming + lifecycle)
- **API Key**: `GROK_API_KEY`
- **Status**: ⏳ **Ready** (needs API key)
- **Model**: `grok-beta`

### ✅ OpenRouter
- **Tests**: 2 basic tests (streaming + lifecycle)
- **API Key**: `OPENROUTER_API_KEY`
- **Status**: ⏳ **Ready** (needs API key)
- **Model**: `openai/gpt-3.5-turbo` (cheap for testing)

### ✅ Ollama Cloud
- **Tests**: 3 basic tests (streaming + lifecycle + compatibility)
- **API Key**: `OLLAMA_CLOUD_API_KEY`
- **Status**: ✅ **Ready** (needs API key)
- **Model**: `llama3.2:3b` (fast for testing)

---

## Quick Start

### 1. Set Up API Keys

```bash
# OpenAI (Required)
mise run secrets-rotate OPENAI_API_KEY sk-proj-your-key-here

# Grok (Optional)
mise run secrets-rotate GROK_API_KEY xai-your-key-here

# OpenRouter (Optional)
mise run secrets-rotate OPENROUTER_API_KEY sk-or-your-key-here

# Ollama Cloud (Optional, coming soon)
mise run secrets-rotate OLLAMA_CLOUD_API_KEY your-ollama-key-here
```

### 2. Run All E2E Tests

```bash
# Run all provider E2E tests
mise run test-e2e
```

This will:
1. ✅ Verify OpenAI models from API
2. ✅ Test OpenAI comprehensive callbacks (9 tests)
3. ⏩ Test Grok (if key set, auto-skips otherwise)
4. ⏩ Test OpenRouter (if key set, auto-skips otherwise)

---

## Test Structure

### OpenAI Tests (Gold Standard)

**File**: `openai-comprehensive-callbacks.e2e.test.ts`

Tests all 13 comprehensive callback hooks:
1. ✅ Basic Streaming
2. ✅ Tool Injection (`onToolsRequest`)
3. ✅ Message Transformation (`beforeStreamStart`)
4. ✅ Chunk Pre-processing (`beforeChunk`)
5. ✅ Chunk Post-processing (`afterChunk`)
6. ✅ Skip Chunks
7. ✅ Lifecycle Events (`onStreamStart`, `onStreamEnd`)
8. ✅ Stream Cancellation
9. ✅ Complete Integration (all callbacks)

**Cost**: ~$0.003 per run (< 1 cent)

### Grok Tests

**File**: `grok-comprehensive-callbacks.e2e.test.ts`

Basic tests:
1. ✅ Basic Streaming
2. ✅ Lifecycle Event Callbacks

**Model**: `grok-beta`

### OpenRouter Tests

**File**: `openrouter-comprehensive-callbacks.e2e.test.ts`

Basic tests:
1. ✅ Basic Streaming
2. ✅ Lifecycle Event Callbacks

**Model**: `openai/gpt-3.5-turbo` (cheap)

---

## Auto-Skip Behavior

Tests automatically skip when API keys are missing:

```
⚠️  Grok E2E Tests Skipped: GROK_API_KEY not set
💡 To run E2E tests:
   1. Set API key: mise run secrets-rotate GROK_API_KEY xai-...
   2. Run tests: mise run test-e2e
```

**No errors** - just helpful messages! ✅

---

## Adding More Providers

### Template for New Provider E2E Test

1. Create `tests/e2e/{provider}-comprehensive-callbacks.e2e.test.ts`
2. Use `shouldSkipE2ETests` helper for auto-skip
3. Follow OpenAI gold standard pattern
4. Start with basic tests (streaming + lifecycle)
5. Expand to full comprehensive callbacks

### Example Structure

```typescript
import { shouldSkipE2ETests } from './helpers/skip-if-no-env'

const shouldSkipE2E = shouldSkipE2ETests({
	envVar: 'YOUR_PROVIDER_API_KEY',
	providerName: 'YourProvider',
	setupInstructions: [
		'Set API key: mise run secrets-rotate YOUR_PROVIDER_API_KEY ...',
		'Run tests: mise run test-e2e'
	]
})

describe.skipIf(shouldSkipE2E)('YourProvider E2E', () => {
	// Your tests here
})
```

---

## Cost Management

### Tips for Keeping Costs Low

1. **Use cheapest models**:
   - OpenAI: `gpt-5-nano` (~$0.003/run)
   - OpenRouter: `openai/gpt-3.5-turbo`
   - Grok: `grok-beta`

2. **Short prompts**:
   - ✅ "Say 'test' and nothing else"
   - ❌ Long multi-paragraph prompts

3. **Run locally first**:
   - Test locally before CI/CD
   - Only run E2E tests when needed

4. **Monitor usage**:
   - Check provider dashboards regularly
   - Set spending limits

### Current Costs

| Provider | Model | Cost/Run | Tests |
|----------|-------|----------|-------|
| OpenAI | gpt-5-nano | $0.003 | 9 |
| Grok | grok-beta | TBD | 2 |
| OpenRouter | gpt-3.5-turbo | ~$0.001 | 2 |

**Total per run**: ~$0.005 (half a cent!)

---

## Verification

### Check API Keys Are Loaded

```bash
# Check all keys
mise run secrets-show

# Check specific key
mise run secrets-show | grep GROK_API_KEY
```

### Run Single Provider Test

```bash
cd packages/providers

# Just OpenAI
pnpm test -- openai-comprehensive-callbacks.e2e.test.ts

# Just Grok
pnpm test -- grok-comprehensive-callbacks.e2e.test.ts

# Just OpenRouter
pnpm test -- openrouter-comprehensive-callbacks.e2e.test.ts
```

---

## Troubleshooting

### Tests Auto-Skip

**Problem**: All tests skipped
```
⚠️  OpenAI E2E Tests Skipped: OPENAI_API_KEY not set
```

**Solution**:
```bash
mise run secrets-rotate OPENAI_API_KEY sk-proj-your-key
cd /mnt/workspace/obsidian-tars  # Reload mise environment
mise run test-e2e
```

### API Key Not Loading

**Problem**: Key set but still empty
```bash
echo $OPENAI_API_KEY  # Empty
```

**Solution**: Navigate to project root to reload environment
```bash
cd /mnt/workspace/obsidian-tars
echo $OPENAI_API_KEY  # Should show key
```

### Timeout Errors

**Problem**: Test times out after 10 seconds

**Solution**: Already configured in `vitest.config.ts`:
```typescript
test: {
  testTimeout: 10000  // 10 seconds for E2E tests
}
```

If still timing out, increase to 15000 or 20000.

---

## Next Steps

1. ✅ Add API keys for Grok, OpenRouter
2. ✅ Run E2E tests to verify
3. 🔜 Expand Grok/OpenRouter tests to full comprehensive callbacks
4. 🔜 Add Ollama Cloud E2E tests
5. 🔜 Add Deepseek E2E tests (if API available)

---

**Status**: ✅ **Multi-provider E2E infrastructure ready!**

Now you can test callback systems across multiple AI providers with real API calls, all auto-skipping gracefully when keys aren't available.
