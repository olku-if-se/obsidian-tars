# E2E Test Auto-Skip Feature ✅

## Overview

E2E tests **automatically skip** when required environment variables are not set, with **helpful console messages** guiding developers on how to configure secrets.

**No more failing tests due to missing API keys!**

---

## How It Works

### Before (Manual Check)

```typescript
describe('OpenAI E2E Tests', () => {
  const API_KEY = process.env.OPENAI_API_KEY
  
  if (!API_KEY) {
    it.skip('Skipping - no API key', () => {
      console.warn('Set OPENAI_API_KEY')
    })
    return
  }
  
  // Tests here...
})
```

**Problems**:
- Boilerplate in every test file
- Manual return statement
- No helpful instructions
- Inconsistent error messages

### After (Auto-Skip with Helper)

```typescript
import { shouldSkipE2ETests } from './helpers/skip-if-no-env'

const shouldSkipE2E = shouldSkipE2ETests({
  envVar: 'OPENAI_API_KEY',
  providerName: 'OpenAI'
})

describe.skipIf(shouldSkipE2E)('OpenAI E2E Tests', () => {
  // Tests here...
})
```

**Benefits**:
- ✅ Cleaner code
- ✅ Automatic skip with Vitest's native `describe.skipIf()`
- ✅ Helpful console messages
- ✅ Consistent across all E2E tests
- ✅ Reusable helper function

---

## Usage

### Basic Usage

```typescript
import { shouldSkipE2ETests } from './helpers/skip-if-no-env'

const shouldSkip = shouldSkipE2ETests({
  envVar: 'OPENAI_API_KEY',
  providerName: 'OpenAI'
})

describe.skipIf(shouldSkip)('OpenAI E2E Tests', () => {
  // All tests auto-skip if OPENAI_API_KEY not set
})
```

### With Custom Instructions

```typescript
const shouldSkip = shouldSkipE2ETests({
  envVar: 'ANTHROPIC_API_KEY',
  providerName: 'Anthropic',
  setupInstructions: [
    'Get API key from https://console.anthropic.com/',
    'Run: mise run secrets-rotate ANTHROPIC_API_KEY sk-ant-...',
    'Run tests: mise run test-e2e'
  ]
})
```

### Multiple Environment Variables

```typescript
import { shouldSkipMultipleE2ETests } from './helpers/skip-if-no-env'

const shouldSkip = shouldSkipMultipleE2ETests([
  { envVar: 'OPENAI_API_KEY', providerName: 'OpenAI' },
  { envVar: 'ANTHROPIC_API_KEY', providerName: 'Anthropic' }
])

describe.skipIf(shouldSkip)('Multi-Provider Tests', () => {
  // Skips if ANY required env var is missing
})
```

---

## Console Output

### When Tests Skip (No API Key)

```
⚠️  OpenAI E2E Tests Skipped: OPENAI_API_KEY not set
💡 To run E2E tests:
   1. Set API key: mise run secrets-init && mise run secrets-edit
   2. Run tests:   mise run test-e2e
   Or directly:    OPENAI_API_KEY=sk-... npm test -- openai-comprehensive-callbacks.e2e.test.ts

 SKIP  tests/e2e/openai-comprehensive-callbacks.e2e.test.ts
   OpenAI Provider E2E - Comprehensive Callbacks (suite skipped)
```

**Developer sees**:
- ✅ Clear reason why tests skipped
- ✅ Step-by-step setup instructions
- ✅ Alternative direct command
- ✅ Non-blocking (tests continue)

### When Tests Run (API Key Set)

```
 RUN  tests/e2e/openai-comprehensive-callbacks.e2e.test.ts

 ✓ tests/e2e/openai-comprehensive-callbacks.e2e.test.ts (7 tests) 12.3s
   OpenAI Provider E2E - Comprehensive Callbacks
     ✓ 1. Basic Streaming > should stream response from OpenAI 2.1s
     ✓ 2. Tool Injection > should inject tools via onToolsRequest 3.4s
     ✓ 3. Message Transformation > should transform messages 1.8s
     ...
```

---

## Helper Functions

### `shouldSkipE2ETests(config)`

Check single environment variable and show helpful message.

```typescript
interface SkipConfig {
  envVar: string                // Environment variable name
  providerName: string          // Provider name for display
  setupInstructions?: string[]  // Optional custom instructions
}

function shouldSkipE2ETests(config: SkipConfig): boolean
```

**Returns**: `true` if env var missing (skip tests), `false` otherwise

**Example**:
```typescript
const shouldSkip = shouldSkipE2ETests({
  envVar: 'OPENAI_API_KEY',
  providerName: 'OpenAI'
})
// Returns: true if OPENAI_API_KEY not set
```

### `shouldSkipMultipleE2ETests(configs)`

Check multiple environment variables.

```typescript
function shouldSkipMultipleE2ETests(configs: SkipConfig[]): boolean
```

**Returns**: `true` if ANY env var missing

**Example**:
```typescript
const shouldSkip = shouldSkipMultipleE2ETests([
  { envVar: 'OPENAI_API_KEY', providerName: 'OpenAI' },
  { envVar: 'ANTHROPIC_API_KEY', providerName: 'Anthropic' }
])
```

### `requireEnvVar(envVar, providerName)`

Get environment variable or throw error.

```typescript
function requireEnvVar(envVar: string, providerName: string): string
```

**Throws**: Error with helpful message if not set

**Example**:
```typescript
const apiKey = requireEnvVar('OPENAI_API_KEY', 'OpenAI')
// Returns: 'sk-proj-...' or throws
```

### `getEnvVar(envVar, defaultValue)`

Get environment variable with default.

```typescript
function getEnvVar(envVar: string, defaultValue: string): string
```

**Example**:
```typescript
const model = getEnvVar('OPENAI_MODEL', 'gpt-5-nano')
// Returns: 'gpt-5-nano' if OPENAI_MODEL not set
```

---

## Integration with CI/CD

### GitHub Actions

Tests auto-skip when secrets not configured:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm test
      # E2E tests auto-skip (no API keys in PR builds)
      # ✅ Tests pass without secrets

  e2e-tests:
    runs-on: ubuntu-latest
    # Only run E2E on main branch with secrets
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Setup secrets
        env:
          SOPS_AGE_KEY: ${{ secrets.SOPS_AGE_KEY }}
        run: |
          mkdir -p .secrets
          echo "$SOPS_AGE_KEY" > .secrets/mise-age.txt
      - run: mise run test-e2e
      # ✅ E2E tests run with real API keys
```

**Benefits**:
- ✅ PR builds work (no secrets needed)
- ✅ Main branch runs E2E (with secrets)
- ✅ No test failures due to missing keys

---

## Creating E2E Tests for New Providers

### 1. Copy Template

```bash
cp tests/e2e/TEMPLATE_PROVIDER.e2e.test.ts \
   tests/e2e/anthropic-comprehensive-callbacks.e2e.test.ts
```

### 2. Update Provider-Specific Code

```typescript
// Replace PROVIDER_NAME with actual provider
const shouldSkipE2E = shouldSkipE2ETests({
  envVar: 'ANTHROPIC_API_KEY',    // ← Update
  providerName: 'Anthropic',       // ← Update
  setupInstructions: [
    'Set API key: mise run secrets-rotate ANTHROPIC_API_KEY sk-ant-...',  // ← Update
    'Run tests:   mise run test-e2e'
  ]
})

const API_KEY = process.env.ANTHROPIC_API_KEY  // ← Update

describe.skipIf(shouldSkipE2E)('Anthropic E2E - Comprehensive Callbacks', () => {  // ← Update
  let provider: AnthropicStreamingProvider  // ← Update

  beforeEach(() => {
    provider = new AnthropicStreamingProvider(mockLoggingService as any, mockSettingsService as any)  // ← Update
    provider.initialize({
      apiKey: API_KEY as string,
      model: 'claude-3-haiku-20240307',  // ← Update to cheapest model
      baseURL: 'https://api.anthropic.com/v1',  // ← Update
      temperature: 0.7
    })
  })
  
  // Tests...
})
```

### 3. Add to Secrets

```bash
# Add to .env.secrets.json
mise run secrets-edit

# Add:
{
  "OPENAI_API_KEY": "sk-proj-...",
  "ANTHROPIC_API_KEY": "sk-ant-...",  ← Add this
  "GROK_API_KEY": "xai-..."
}
```

### 4. Run Tests

```bash
mise run test-e2e
# ✅ All providers with API keys run
# ⏭️  Providers without API keys skip automatically
```

---

## Best Practices

### ✅ DO

- **Use `describe.skipIf()`** for auto-skip behavior
- **Import helper functions** from `./helpers/skip-if-no-env`
- **Provide clear instructions** in setup messages
- **Test locally first** before CI/CD
- **Document required env vars** in test file header

### ❌ DON'T

- **Don't use `it.skip()`** manually (use auto-skip)
- **Don't hardcode API keys** in test files
- **Don't fail tests** when env vars missing
- **Don't duplicate** skip logic across files
- **Don't forget** to add new env vars to secrets template

---

## Migration Guide

### Migrate Existing E2E Test

**Before**:
```typescript
describe('My E2E Tests', () => {
  const API_KEY = process.env.MY_API_KEY
  
  if (!API_KEY) {
    it.skip('No API key', () => {})
    return
  }
  
  // Tests...
})
```

**After**:
```typescript
import { shouldSkipE2ETests } from './helpers/skip-if-no-env'

const shouldSkip = shouldSkipE2ETests({
  envVar: 'MY_API_KEY',
  providerName: 'MyProvider'
})

describe.skipIf(shouldSkip)('My E2E Tests', () => {
  // Tests... (no manual skip check needed!)
})
```

---

## Summary

**Problem**: E2E tests fail when API keys not set, causing confusion

**Solution**: Auto-skip tests with helpful messages

**Implementation**:
```typescript
import { shouldSkipE2ETests } from './helpers/skip-if-no-env'

const shouldSkip = shouldSkipE2ETests({
  envVar: 'API_KEY_NAME',
  providerName: 'ProviderName'
})

describe.skipIf(shouldSkip)('Tests', () => { /* ... */ })
```

**Benefits**:
- ✅ No test failures from missing keys
- ✅ Helpful setup instructions
- ✅ Works in CI/CD
- ✅ Consistent across all providers
- ✅ Clean, maintainable code

**Files**:
- `helpers/skip-if-no-env.ts` - Helper functions
- `TEMPLATE_PROVIDER.e2e.test.ts` - Template for new tests
- `openai-comprehensive-callbacks.e2e.test.ts` - Reference implementation

---

**Status**: ✅ Production ready  
**Pattern**: Reusable across all providers  
**Developer UX**: Friendly skip messages
