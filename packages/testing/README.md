# @tars/testing

Testing utilities, mocks, and helpers for the Tars ecosystem.

## Overview

This package provides shared testing utilities, mock implementations, test fixtures, and helpers designed specifically for testing Tars packages and the Obsidian plugin.

## Installation

```bash
pnpm add @tars/testing --save-dev
```

## Contents

### Mock Implementations

```typescript
import { MockVendor, MockObsidianApp } from '@tars/testing/mocks';

// Mock AI provider for testing
const mockVendor = new MockVendor({
  responses: {
    'Hello': 'Hi there! How can I help you?',
    'default': 'I am a mock AI response.'
  }
});

// Mock Obsidian app for plugin testing
const mockApp = new MockObsidianApp({
  vault: {
    files: ['test.md', 'notes/test.md']
  },
  workspace: {
    activeLeaf: mockLeaf
  }
});
```

### Test Fixtures

```typescript
import {
  conversationFixtures,
  messageFixtures,
  providerFixtures
} from '@tars/testing/fixtures';

// Use conversation fixtures
const simpleConversation = conversationFixtures.simple();
const complexConversation = conversationFixtures.withImages();

// Use message fixtures
const userMessage = messageFixtures.user('Hello, AI!');
const assistantMessage = messageFixtures.assistant('Hi there!');

// Use provider fixtures
const openaiConfig = providerFixtures.openai();
const claudeConfig = providerFixtures.claude();
```

### Test Helpers

```typescript
import {
  createTestPlugin,
  setupTestEnvironment,
  assertConversationStructure,
  waitForAsync
} from '@tars/testing/helpers';

// Create test plugin instance
const plugin = createTestPlugin({
  app: mockApp,
  settings: testSettings
});

// Set up test environment
const testEnv = setupTestEnvironment({
  tempDir: true,
  mockNetwork: true
});

// Assert conversation structure
assertConversationStructure(conversation, {
  minMessages: 2,
  hasUserMessage: true,
  hasAssistantMessage: true
});

// Wait for async operations
await waitForAsync(() => condition, { timeout: 5000 });
```

### Custom Test Runner

```typescript
import { TestRunner, TestSuite } from '@tars/testing';

const runner = new TestRunner({
  timeout: 10000,
  parallel: true,
  reporter: 'verbose'
});

const suite = new TestSuite('Provider Tests');

suite.test('OpenAI provider', async () => {
  const provider = createTestProvider('openai');
  const response = await provider.sendRequest(testMessage);
  expect(response).toBeDefined();
});

suite.test('Claude provider', async () => {
  const provider = createTestProvider('claude');
  const response = await provider.sendRequest(testMessage);
  expect(response).toBeDefined();
});

await runner.run(suite);
```

## Usage Examples

### Testing AI Providers

```typescript
import { createTestProvider, createMockConversation } from '@tars/testing';

describe('OpenAI Provider', () => {
  let provider: TestVendor;
  let mockConversation: Conversation;

  beforeEach(() => {
    provider = createTestProvider('openai', {
      apiKey: 'test-key',
      mockResponses: true
    });
    mockConversation = createMockConversation();
  });

  test('should send message and receive response', async () => {
    const response = await provider.sendRequest({
      messages: mockConversation.messages
    });

    expect(response).toBeDefined();
    expect(response.content).toBeTruthy();
  });

  test('should handle streaming responses', async () => {
    const stream = await provider.sendRequest({
      messages: mockConversation.messages,
      stream: true
    });

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBeGreaterThan(0);
  });
});
```

### Testing Plugin Functionality

```typescript
import { createTestPlugin, MockObsidianApp } from '@tars/testing';

describe('Tars Plugin', () => {
  let plugin: TarsPlugin;
  let mockApp: MockObsidianApp;

  beforeEach(async () => {
    mockApp = new MockObsidianApp();
    plugin = createTestPlugin(mockApp);
    await plugin.load();
  });

  afterEach(async () => {
    await plugin.unload();
  });

  test('should register commands on load', () => {
    expect(mockApp.commands).toHaveBeenCalledWith('tars:send-message');
    expect(mockApp.commands).toHaveBeenCalledWith('tars:settings');
  });

  test('should handle tag commands', async () => {
    const editor = mockApp.workspace.activeLeaf.view.editor;
    editor.setValue('#User: Hello world');

    await plugin.commands['tars:send-message']();

    expect(editor.getValue()).toContain('#Claude:');
  });
});
```

### Testing with Fixtures

```typescript
import {
  conversationFixtures,
  assertMessageStructure,
  createTestSettings
} from '@tars/testing';

describe('Conversation Processing', () => {
  test('should process simple conversation', () => {
    const conversation = conversationFixtures.simple();

    assertMessageStructure(conversation.messages[0], {
      role: 'user',
      hasContent: true
    });
  });

  test('should handle multimodal content', () => {
    const conversation = conversationFixtures.withImages();

    const imageMessage = conversation.messages.find(m =>
      m.content.type === 'multimodal' && m.content.images
    );

    expect(imageMessage).toBeDefined();
    expect(imageMessage.content.images.length).toBeGreaterThan(0);
  });
});
```

## CLI Tools

```bash
# Run custom test runner
tsx packages/testing/bin/test-runner.ts

# Run specific test suites
tsx packages/testing/bin/test-runner.ts --suite providers
tsx packages/testing/bin/test-runner.ts --suite plugin

# Generate test fixtures
tsx packages/testing/bin/test-runner.ts --generate-fixtures

# Validate test structure
tsx packages/testing/bin/test-runner.ts --validate-tests
```

## Features

### Mock Implementations
- **Mock Vendors**: Simulated AI providers for testing
- **Mock Obsidian API**: Complete Obsidian API mocking
- **Mock File System**: Virtual file system for file operations
- **Network Mocking**: HTTP request/response mocking

### Test Fixtures
- **Conversation Fixtures**: Pre-built conversation examples
- **Message Fixtures**: Various message types and content
- **Provider Fixtures**: Configuration templates for providers
- **Settings Fixtures**: Common plugin settings configurations

### Test Helpers
- **Plugin Setup**: Easy plugin instance creation for testing
- **Environment Setup**: Test environment configuration
- **Assertion Helpers**: Custom assertions for Tars-specific structures
- **Async Utilities**: Helpers for testing asynchronous operations

### Custom Test Runner
- **Parallel Execution**: Run tests in parallel for performance
- **Custom Reporters**: Multiple output formats
- **Test Filtering**: Run specific tests or suites
- **Coverage Integration**: Built-in coverage reporting

## Configuration

### Test Runner Configuration

```typescript
interface TestRunnerConfig {
  timeout?: number;
  parallel?: boolean;
  reporter?: 'verbose' | 'simple' | 'json' | 'junit';
  coverage?: boolean;
  coverageThreshold?: number;
  excludePatterns?: string[];
}
```

### Mock Configuration

```typescript
interface MockVendorConfig {
  responses?: Record<string, string>;
  latency?: number;
  errorRate?: number;
  capabilities?: ProviderCapabilities;
}
```

## Dependencies

- `@tars/types` - Shared TypeScript definitions
- `@tars/shared` - Common utilities
- `vitest` - Testing framework

## Development

This is part of the Tars monorepo. See the [main documentation](../../docs/monorepo-setup.md) for development setup.

### Building

```bash
# From monorepo root
pnpm --filter @tars/testing build
```

### Testing

```bash
# Run tests
pnpm --filter @tars/testing test

# Run custom test runner
pnpm --filter @tars/testing test-runner
```

## Architecture

```
src/
├── index.ts       # Package exports
├── mocks/         # Mock implementations
├── fixtures/      # Test fixtures
├── helpers/       # Test helper functions
├── test-runner.ts # Custom test runner
└── bin/          # CLI executables
```

## Best Practices

1. **Use Mocks**: Always use mock implementations for external dependencies
2. **Fixture Reuse**: Create reusable fixtures for common test scenarios
3. **Async Testing**: Use proper async/await patterns and helper utilities
4. **Isolation**: Ensure tests are isolated and don't share state
5. **Coverage**: Maintain high test coverage for critical paths

## License

MIT License