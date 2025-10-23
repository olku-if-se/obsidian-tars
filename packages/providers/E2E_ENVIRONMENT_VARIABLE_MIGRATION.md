# E2E Environment Variable Migration

## Overview
All E2E test environment variables have been renamed with an `E2E_` prefix to avoid conflicts with other OS configurations.

## Changes Made

### 1. Test Files Updated
All E2E test files now use `E2E_` prefixed environment variables:

- `ANTHROPIC_API_KEY` → `E2E_ANTHROPIC_API_KEY`
- `OPENAI_API_KEY` → `E2E_OPENAI_API_KEY`
- `GROK_API_KEY` → `E2E_GROK_API_KEY`
- `GEMINI_API_KEY` → `E2E_GEMINI_API_KEY`
- `OPENROUTER_API_KEY` → `E2E_OPENROUTER_API_KEY`
- `OLLAMA_CLOUD_API_KEY` → `E2E_OLLAMA_CLOUD_API_KEY`

### 2. Configuration Files Updated

#### mise.toml
Updated the secrets template to include all E2E variables:
```json
{
  "E2E_OPENAI_API_KEY": "sk-proj-REPLACE_WITH_YOUR_KEY",
  "E2E_ANTHROPIC_API_KEY": "sk-ant-REPLACE_WITH_YOUR_KEY",
  "E2E_GROK_API_KEY": "xai-REPLACE_WITH_YOUR_KEY",
  "E2E_GEMINI_API_KEY": "REPLACE_WITH_YOUR_KEY",
  "E2E_OPENROUTER_API_KEY": "sk-or-REPLACE_WITH_YOUR_KEY",
  "E2E_OLLAMA_CLOUD_API_KEY": "REPLACE_WITH_YOUR_KEY"
}
```

#### scripts/secrets-rotate.sh
Updated examples to use new variable names:
```bash
mise run secrets-rotate E2E_OPENAI_API_KEY sk-proj-new-key-here
mise run secrets-rotate E2E_ANTHROPIC_API_KEY sk-ant-new-key-here
mise run secrets-rotate E2E_GROK_API_KEY xai-new-key-here
```

#### Documentation Files
- Updated `TEST_FAILURE_ANALYSIS.md`
- Updated helper documentation in `skip-if-no-env.ts`
- Updated template in `TEMPLATE_PROVIDER.e2e.test.ts`

## Migration Guide

### For New Setups
1. Initialize secrets:
   ```bash
   mise run secrets-init
   ```

2. Edit secrets with new variable names:
   ```bash
   mise run secrets-edit
   ```

3. Add your API keys with `E2E_` prefix:
   ```json
   {
     "E2E_OPENAI_API_KEY": "sk-proj-your-key-here",
     "E2E_ANTHROPIC_API_KEY": "sk-ant-your-key-here",
     "E2E_GROK_API_KEY": "xai-your-key-here"
   }
   ```

### For Existing Setups
If you already have secrets configured, you need to rotate your keys to use the new names:

1. **Option 1: Rotate individual keys**
   ```bash
   mise run secrets-rotate E2E_OPENAI_API_KEY sk-proj-your-new-key
   mise run secrets-rotate E2E_ANTHROPIC_API_KEY sk-ant-your-new-key
   mise run secrets-rotate E2E_GROK_API_KEY xai-your-new-key
   ```

2. **Option 2: Edit manually**
   ```bash
   mise run secrets-edit
   # Add new E2E_ prefixed keys and optionally remove old ones
   ```

### Running Tests
After migration, run tests as before:
```bash
# Run all E2E tests
mise run test-e2e

# Or run specific provider tests
pnpm --filter @tars/providers test -- tests/e2e/claude-comprehensive-callbacks.e2e.test.ts
```

## Benefits

1. **No Conflicts**: E2E test variables won't conflict with other tools or OS configurations
2. **Clear Namespace**: `E2E_` prefix makes it obvious these variables are for end-to-end testing
3. **Consistency**: All E2E tests follow the same naming convention
4. **Backward Compatibility**: Old variable names can coexist during migration

## Files Modified

### Test Files
- `tests/e2e/claude-comprehensive-callbacks.e2e.test.ts`
- `tests/e2e/openai-comprehensive-callbacks.e2e.test.ts`
- `tests/e2e/openai-models-verification.e2e.test.ts`
- `tests/e2e/grok-comprehensive-callbacks.e2e.test.ts`
- `tests/e2e/gemini-comprehensive-callbacks.e2e.test.ts`
- `tests/e2e/openrouter-comprehensive-callbacks.e2e.test.ts`
- `tests/e2e/ollama-cloud-comprehensive-callbacks.e2e.test.ts`
- `tests/e2e/TEMPLATE_PROVIDER.e2e.test.ts`

### Configuration Files
- `mise.toml` - Updated secrets template
- `scripts/secrets-rotate.sh` - Updated examples

### Documentation
- `tests/e2e/helpers/skip-if-no-env.ts` - Updated examples
- `TEST_FAILURE_ANALYSIS.md` - Updated variable references
- `E2E_ENVIRONMENT_VARIABLE_MIGRATION.md` - This document

## Testing the Migration

After updating your secrets, verify the migration works:

```bash
# Check that secrets are loaded correctly
mise run secrets-show | grep E2E_

# Run a quick test to ensure variables are accessible
pnpm --filter @tars/providers test -- tests/e2e/TEMPLATE_PROVIDER.e2e.test.ts
```

The tests should now properly skip with helpful messages if the E2E variables are not set, and run successfully when they are configured.