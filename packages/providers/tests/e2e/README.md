# OpenAI Provider E2E Tests

## Overview

This directory contains **end-to-end tests** that make **REAL API calls** to OpenAI to validate the comprehensive callback system.

**Auto-Skip Behavior**: Tests automatically skip if required environment variables are not set. No manual intervention needed!

## Test Coverage

The E2E test suite validates:

✅ **1. Basic Streaming** - Real API streaming  
✅ **2. Tool Injection** - `onToolsRequest` callback  
✅ **3. Message Transformation** - `beforeStreamStart` callback  
✅ **4. Chunk Processing** - `beforeChunk` & `afterChunk` callbacks  
✅ **5. Lifecycle Events** - `onStreamStart` & `onStreamEnd` callbacks  
✅ **6. Stream Cancellation** - Cancel via `beforeStreamStart`  
✅ **7. Complete Integration** - All callbacks together  

---

## Setup

### 1. Get OpenAI API Key

Visit: https://platform.openai.com/api-keys

Create a new API key.

### 2. Set Environment Variable

```bash
export OPENAI_API_KEY=sk-proj-...your-key...
```

Or create a `.env` file in the workspace root:

```bash
# .env
OPENAI_API_KEY=sk-proj-...your-key...
```

---

## Running Tests

### Run All E2E Tests

```bash
# Recommended: Use mise (auto-loads encrypted secrets)
mise run test-e2e

# Or manually:
# From workspace root
npm test -- tests/e2e/

# Or from packages/providers
cd packages/providers
npm test -- tests/e2e/
```

**Note**: Tests auto-skip if `OPENAI_API_KEY` not set. This is expected behavior!

### Run Specific Test File

```bash
npm test -- openai-comprehensive-callbacks.e2e.test.ts
```

### Run with Environment Variable

```bash
OPENAI_API_KEY=sk-proj-... npm test -- openai-comprehensive-callbacks.e2e.test.ts
```

### Run Single Test Case

```bash
npm test -- openai-comprehensive-callbacks.e2e.test.ts -t "should stream response"
```

---

## Test Structure

Each test follows **TDD GIVEN/WHEN/THEN** structure:

```typescript
it('should stream response from OpenAI', async () => {
  // GIVEN: Simple message
  const messages: Message[] = [...]

  // WHEN: Streaming without callbacks
  for await (const chunk of provider.stream(messages, {})) {
    fullResponse += chunk
  }

  // THEN: Should receive response
  expect(fullResponse).toContain('Hello')
})
```

---

## Test Details

### 1. Basic Streaming
Tests fundamental streaming without callbacks.

**Expected**: Receives chunks from OpenAI API.

### 2. Tool Injection
Tests `onToolsRequest` callback for providing tools.

**Expected**: 
- Tools requested before stream starts
- Tools provided to OpenAI
- Tool calls executed

### 3. Message Transformation
Tests `beforeStreamStart` callback for modifying messages.

**Expected**:
- Original messages transformed
- System message added
- Modified messages sent to OpenAI

### 4. Chunk Processing
Tests `beforeChunk` and `afterChunk` callbacks.

**Expected**:
- Each chunk pre-processed (transformed to uppercase)
- Each chunk post-processed (metrics tracked)
- Chunks can be skipped

### 5. Lifecycle Events
Tests `onStreamStart` and `onStreamEnd` callbacks.

**Expected**:
- Start event fired before streaming
- End event fired after streaming
- Events in correct order

### 6. Stream Cancellation
Tests cancelling stream via `beforeStreamStart`.

**Expected**:
- Stream cancelled before API call
- No chunks received
- No start event fired

### 7. Complete Integration
Tests all callbacks working together.

**Expected**:
- All callbacks invoked in correct order
- Full callback lifecycle verified
- Response generated successfully

---

## Cost Estimates

Tests use **gpt-5-nano** model (OpenAI's cheapest model).

**Estimated cost per full test run**: ~$0.003 USD (less than 1 cent!)

Models used:
- `gpt-5-nano`: OpenAI's cheapest model (GPT-5 series)
  - Significantly cheaper than gpt-4o-mini
  - Perfect for testing and development
  
**Why gpt-5-nano?**
- ✅ Cheapest OpenAI model available
- ✅ Fast and reliable
- ✅ Part of the GPT-5 series
- ✅ Perfect for testing

---

## Troubleshooting

### Tests Auto-Skipped (No API Key)

```
⚠️  OpenAI E2E Tests Skipped: OPENAI_API_KEY not set
💡 To run E2E tests:
   1. Set API key: mise run secrets-init && mise run secrets-edit
   2. Run tests:   mise run test-e2e
   Or directly:    OPENAI_API_KEY=sk-... npm test -- openai-comprehensive-callbacks.e2e.test.ts
```

**This is normal!** Tests auto-skip when API keys are missing.

**Solution**: Set up encrypted secrets with `mise run secrets-init`

### API Key Invalid

```
Error: Invalid API key
```

**Solution**: Check your API key is correct and has credits.

### Rate Limit Exceeded

```
Error: Rate limit exceeded
```

**Solution**: Wait a moment and retry. Consider using a different API key tier.

### Network Timeout

```
Error: Request timeout
```

**Solution**: Check internet connection. OpenAI API might be slow.

---

## Console Output

Tests produce detailed console output:

```
[DEBUG] Creating OpenAI completion stream
🔧 Tools requested by openai/gpt-5-nano
🚀 Stream started: openai/gpt-5-nano
   Messages: 1, Tools: false, Time: 1729598234567
⬅️  beforeChunk 0: "Hello"
➡️  afterChunk 0: 5 chars total
⬅️  beforeChunk 1: " from"
➡️  afterChunk 1: 10 chars total
✅ Stream ended: openai/gpt-5-nano
   Chunks: 15, Duration: 1234ms, Time: 1729598235801
✅ Received 15 chunks
📝 Response: Hello from E2E test
```

---

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run E2E Tests
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  run: npm test -- tests/e2e/
```

### Add Secret

1. Go to repository Settings
2. Secrets and variables → Actions
3. New repository secret
4. Name: `OPENAI_API_KEY`
5. Value: Your API key

---

## Best Practices

### 1. Use Short Prompts
Keep test prompts brief to minimize tokens/cost.

✅ Good: `"Say 'test' and nothing else"`  
❌ Avoid: Long multi-paragraph prompts

### 2. Use gpt-5-nano
Always use the cheapest model for testing.

✅ `gpt-5-nano` - Cheapest (GPT-5 nano model)  
✅ `gpt-4o-mini` - Also cheap ($0.15/1M input tokens)  
❌ `gpt-4o` - More expensive ($2.50-$5.00/1M tokens)  
❌ `gpt-4` - Very expensive for testing

### 3. Test Locally First
Run tests locally before CI/CD.

### 4. Monitor Costs
Check OpenAI usage dashboard regularly.

### 5. Clean Up
Tests don't persist data, but monitor API usage.

---

## Extending Tests

### Add New Test Case

```typescript
it('should test new callback', async () => {
  // GIVEN: Setup
  const messages: Message[] = [...]
  
  const callbacks: ComprehensiveCallbacks = {
    onNewCallback: async () => {
      // Your callback logic
    }
  }
  
  // WHEN: Stream
  for await (const chunk of provider.stream(messages, { callbacks })) {
    // Process
  }
  
  // THEN: Verify
  expect(...).toBe(...)
})
```

### Test Other Providers

Copy this pattern for other providers:
- `grok-comprehensive-callbacks.e2e.test.ts`
- `deepseek-comprehensive-callbacks.e2e.test.ts`
- etc.

---

## Related Files

- **Test File**: `openai-comprehensive-callbacks.e2e.test.ts`
- **Provider**: `src/providers/openai/OpenAIStreamingProvider.ts`
- **Reference**: `src/providers/openai/OpenAIStreamingProvider.comprehensive.ts`
- **Callbacks**: `src/config/ComprehensiveCallbacks.ts`
- **Examples**: `src/config/COMPREHENSIVE_CALLBACKS_USAGE.md`

---

## Quick Start

```bash
# 1. Set API key
export OPENAI_API_KEY=sk-proj-...

# 2. Run tests
npm test -- openai-comprehensive-callbacks.e2e.test.ts

# 3. Watch output
# Tests will show detailed callback flow
```

---

**Status**: ✅ Ready to run  
**Model**: gpt-5-nano (cheapest available!)  
**Cost**: ~$0.003 per run (< 1 cent!)  
**Duration**: ~10 seconds (fastest!)
