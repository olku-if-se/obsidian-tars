# Quickstart: Needle DI in Tars Plugin

**Feature**: 003-needle-di-migration
**Date**: 2025-10-30
**Audience**: Developers working on Tars Obsidian plugin

## Overview

This quickstart guide helps developers understand and use the Needle DI system in the Tars plugin. You'll learn how to create injectable services, resolve dependencies, write testable code, and add new AI providers.

---

## Prerequisites

- TypeScript 5.7+ with stage-3 decorators
- Needle DI v1.1.0+ (`@needle-di/core`)
- Familiarity with dependency injection concepts
- Basic understanding of Tars plugin architecture

---

## 5-Minute Quick Start

### 1. Inject Settings into a Service

```typescript
import { injectable, inject } from '@needle-di/core';
import { APP_SETTINGS } from '../di/tokens';

@injectable()
export class MyService {
  constructor(private settings = inject(APP_SETTINGS)) {}

  doSomething() {
    const apiKey = this.settings.providers.openai.apiKey;
    // Use the injected settings
  }
}
```

### 2. Resolve Service from Container

```typescript
// In plugin main.ts
const service = this.diContainer.get(MyService);
service.doSomething();
```

### 3. Test with Mocked Dependencies

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from '@needle-di/core';
import { APP_SETTINGS } from '../di/tokens';
import { MyService } from './my-service';

describe('MyService', () => {
  let container: Container;

  beforeEach(() => {
    // GIVEN: A test container with mock settings
    container = new Container();
    container.bind({
      provide: APP_SETTINGS,
      useValue: { providers: { openai: { apiKey: 'test-key' } } }
    });
    container.bind(MyService);
  });

  it('should use injected settings', () => {
    // WHEN: Service is resolved
    const service = container.get(MyService);

    // THEN: Service has access to mock settings
    expect(service).toBeDefined();
  });
});
```

---

## Core Concepts

### Configuration Tokens

**What**: Type-safe identifiers for injectable values

**Why**: Compile-time type checking, refactoring support, clear contracts

**Example**:
```typescript
// Define token with interface
export interface ModelRegistry {
  getModels(vendor: string): string[];
}

export const MODEL_REGISTRY = new InjectionToken<ModelRegistry>('MODEL_REGISTRY');

// Bind value
container.bind({
  provide: MODEL_REGISTRY,
  useValue: myModelRegistry
});

// Inject into service
@injectable()
class Provider {
  constructor(private registry = inject(MODEL_REGISTRY)) {
    // this.registry is typed as ModelRegistry
  }
}
```

### Injectable Services

**What**: Classes with `@injectable()` decorator that declare dependencies

**Why**: Automatic dependency resolution, testable, loosely coupled

**Pattern**:
```typescript
@injectable()
export class AuthService {
  constructor(
    private settings = inject(APP_SETTINGS),
    private logger = inject(LOGGER)
  ) {}

  authenticate() {
    this.logger.info('Authenticating...');
    const key = this.settings.apiKey;
    // ...
  }
}
```

### Child Containers

**What**: Isolated containers inheriting parent bindings, can override specific dependencies

**Why**: Perfect for testing - mock only what you need, inherit the rest

**Pattern**:
```typescript
// Production container
const rootContainer = new Container();
rootContainer.bind({ provide: LOGGER, useValue: console });
rootContainer.bind(AuthService);

// Test container with mocked logger
const testContainer = rootContainer.createChild();
testContainer.bind({ provide: LOGGER, useValue: mockLogger });

// AuthService in testContainer uses mockLogger
const service = testContainer.get(AuthService);
```

---

## Common Tasks

### Task 1: Create an Injectable Service

**Goal**: Make a new service injectable

**Steps**:

1. **Add decorator and inject dependencies**:
```typescript
import { injectable, inject } from '@needle-di/core';
import { APP_SETTINGS } from '../di/tokens';

@injectable()
export class FeatureService {
  constructor(private settings = inject(APP_SETTINGS)) {}

  performAction() {
    // Use this.settings
  }
}
```

2. **Register in DI container** (`src/di/container.ts`):
```typescript
private setupContainer() {
  // ... existing bindings
  this.container.bind(FeatureService);
}
```

3. **Use the service**:
```typescript
const feature = this.diContainer.get(FeatureService);
feature.performAction();
```

---

### Task 2: Convert Provider from Plain Object to Injectable Class

**Goal**: Refactor existing plain object provider exports to injectable classes

**Context**: Current Tars providers are exported as plain objects. The DI migration requires converting them to injectable classes that can receive dependencies via constructor injection.

**Before (Plain Object - Current State)**:

```typescript
// apps/obsidian-plugin/src/providers/openAI.ts
import OpenAI from 'openai';
import type { Vendor, BaseOptions, SendRequest } from './index';

// Standalone function with hardcoded settings access
const sendRequestFunc: Vendor['sendRequestFunc'] = options => {
  return async function* (messages, controller, resolveEmbedAsBinary) {
    const { apiKey, baseURL, model, parameters } = options;
    const client = new OpenAI({ apiKey, baseURL });

    const stream = await client.chat.completions.create({
      model,
      messages,
      stream: true,
      ...parameters
    });

    for await (const chunk of stream) {
      yield chunk.choices[0]?.delta?.content || '';
    }
  };
};

// Plain object export
export const openAIVendor: Vendor = {
  name: 'OpenAI',
  defaultOptions: {
    apiKey: '',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4',
    parameters: {}
  },
  sendRequestFunc,
  models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  websiteToObtainKey: 'https://platform.openai.com/api-keys',
  capabilities: ['Text Generation', 'Image Vision', 'Image Generation']
};
```

**After (Injectable Class - Target State)**:

```typescript
// apps/obsidian-plugin/src/providers/openAI.ts
import { injectable, inject } from '@needle-di/core';
import { APP_SETTINGS } from '../di/tokens';
import { VendorProvider } from './decorator';
import OpenAI from 'openai';
import type { Vendor, BaseOptions, SendRequest, Message, Capability } from './index';

@VendorProvider('OpenAI')
@injectable()
export class OpenAIProvider implements Vendor {
  constructor(private settings = inject(APP_SETTINGS)) {}

  get name(): string {
    return 'OpenAI';
  }

  get apiKey(): string {
    return this.settings.providers?.openai?.apiKey || '';
  }

  get baseURL(): string {
    return this.settings.providers?.openai?.baseURL || 'https://api.openai.com/v1';
  }

  get model(): string {
    return this.settings.providers?.openai?.model || 'gpt-4';
  }

  get parameters(): Record<string, unknown> {
    return this.settings.providers?.openai?.parameters || {};
  }

  get models(): string[] {
    return ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  }

  get websiteToObtainKey(): string {
    return 'https://platform.openai.com/api-keys';
  }

  get capabilities(): Capability[] {
    return ['Text Generation', 'Image Vision', 'Image Generation'];
  }

  get defaultOptions(): BaseOptions {
    return {
      apiKey: this.apiKey,
      baseURL: this.baseURL,
      model: this.model,
      parameters: this.parameters
    };
  }

  get sendRequestFunc() {
    return (options: BaseOptions) => {
      return async function* (
        messages: readonly Message[],
        controller: AbortController,
        resolveEmbedAsBinary: ResolveEmbedAsBinary,
        saveAttachment?: SaveAttachment
      ) {
        const { apiKey, baseURL, model, parameters } = options;
        const client = new OpenAI({ apiKey, baseURL });

        const stream = await client.chat.completions.create({
          model,
          messages,
          stream: true,
          ...parameters
        });

        for await (const chunk of stream) {
          yield chunk.choices[0]?.delta?.content || '';
        }
      };
    };
  }
}

// For backward compatibility during migration
export const openAIVendor = new OpenAIProvider(/* settings passed from container */);
```

**Key Changes**:
1. ✅ Added `@VendorProvider('OpenAI')` and `@injectable()` decorators
2. ✅ Constructor injects `APP_SETTINGS` token instead of importing global settings
3. ✅ Converted properties to getters that access `this.settings`
4. ✅ Class implements `Vendor` interface with all required members
5. ✅ Settings access is now dependency-injected and mockable for testing

**Testing the Converted Provider**:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from '@needle-di/core';
import { APP_SETTINGS } from '../di/tokens';
import { OpenAIProvider } from './openAI';

describe('OpenAI Provider - Injectable', () => {
  let container: Container;

  beforeEach(() => {
    // GIVEN: Test container with mock settings
    container = new Container();
    container.bind({
      provide: APP_SETTINGS,
      useValue: {
        providers: {
          openai: {
            apiKey: 'test-api-key',
            baseURL: 'https://test.openai.com',
            model: 'gpt-4-test',
            parameters: { temperature: 0.7 }
          }
        }
      }
    });
    container.bind(OpenAIProvider);
  });

  it('should be injectable with settings', () => {
    // WHEN: Provider is resolved from container
    const provider = container.get(OpenAIProvider);

    // THEN: Provider uses injected settings
    expect(provider.name).toBe('OpenAI');
    expect(provider.apiKey).toBe('test-api-key');
    expect(provider.baseURL).toBe('https://test.openai.com');
    expect(provider.model).toBe('gpt-4-test');
  });

  it('should provide default values when settings missing', () => {
    // GIVEN: Container with empty settings
    const emptyContainer = new Container();
    emptyContainer.bind({
      provide: APP_SETTINGS,
      useValue: { providers: {} }
    });
    emptyContainer.bind(OpenAIProvider);

    // WHEN: Provider is resolved
    const provider = emptyContainer.get(OpenAIProvider);

    // THEN: Provider uses fallback defaults
    expect(provider.apiKey).toBe('');
    expect(provider.baseURL).toBe('https://api.openai.com/v1');
    expect(provider.model).toBe('gpt-4');
  });

  it('should be testable with mocked settings', () => {
    // GIVEN: Multiple test scenarios with different settings
    const scenarios = [
      { apiKey: 'key1', model: 'gpt-3.5-turbo' },
      { apiKey: 'key2', model: 'gpt-4-turbo' }
    ];

    scenarios.forEach(scenario => {
      // WHEN: Provider created with specific test settings
      const testContainer = new Container();
      testContainer.bind({
        provide: APP_SETTINGS,
        useValue: { providers: { openai: scenario } }
      });
      testContainer.bind(OpenAIProvider);
      const provider = testContainer.get(OpenAIProvider);

      // THEN: Provider reflects test scenario settings
      expect(provider.apiKey).toBe(scenario.apiKey);
      expect(provider.model).toBe(scenario.model);
    });
  });
});
```

---

### Task 3: Replace Direct App Access with OBSIDIAN_APP Token

**Goal**: Replace all `this.app` parameter passing with dependency injection using `OBSIDIAN_APP` token

**Context**: Current code passes `this.app` as constructor/method parameters. The DI migration requires injecting the Obsidian App instance via the `OBSIDIAN_APP` token.

**Before (Parameter Passing - Current State)**:

```typescript
// apps/obsidian-plugin/src/main.ts
import { Plugin } from 'obsidian';
import { StatusBarManager } from './status-bar-manager';
import { selectMsgAtCursorCmd, userTagCmd } from './commands';

export default class TarsPlugin extends Plugin {
  async onload() {
    const statusBarItem = this.addStatusBarItem();

    // Direct app reference passed as parameter
    this.statusBarManager = new StatusBarManager(this.app, statusBarItem);

    // Direct app reference passed to command factories
    this.addCommand(selectMsgAtCursorCmd(this.app, this.settings));
    this.addCommand(userTagCmd(tagCmdMeta, this.app, this.settings));
  }
}

// apps/obsidian-plugin/src/status-bar-manager.ts
import type { App } from 'obsidian';

export class StatusBarManager {
  constructor(
    private app: App,           // Passed as parameter
    private statusBarItem: HTMLElement
  ) {}

  updateStatus(text: string) {
    this.statusBarItem.setText(text);
    // Uses this.app for file operations
    const activeFile = this.app.workspace.getActiveFile();
  }
}

// apps/obsidian-plugin/src/commands/select-msg.ts
import type { App } from 'obsidian';
import type { PluginSettings } from '../settings';

export function selectMsgAtCursorCmd(app: App, settings: PluginSettings) {
  return {
    id: 'select-message',
    name: 'Select message at cursor',
    editorCallback: (editor) => {
      // Uses app parameter
      const file = app.workspace.getActiveFile();
      // ... command logic
    }
  };
}
```

**After (DI Token Injection - Target State)**:

```typescript
// apps/obsidian-plugin/src/main.ts
import { Plugin } from 'obsidian';
import { Container } from '@needle-di/core';
import { OBSIDIAN_APP, APP_SETTINGS } from './di/tokens';
import { StatusBarManager } from './status-bar-manager';
import { SelectMsgCommand, UserTagCommand } from './commands';

export default class TarsPlugin extends Plugin {
  private container!: Container;

  async onload() {
    // Setup DI container with App and Settings tokens
    this.container = new Container();
    this.container.bind({ provide: OBSIDIAN_APP, useValue: this.app });
    this.container.bind({ provide: APP_SETTINGS, useValue: this.settings });

    // Register injectable services
    this.container.bind(StatusBarManager);
    this.container.bind(SelectMsgCommand);
    this.container.bind(UserTagCommand);

    // Resolve services from container (no parameter passing!)
    const statusBarItem = this.addStatusBarItem();
    this.container.bind({
      provide: 'STATUS_BAR_ITEM',
      useValue: statusBarItem
    });

    this.statusBarManager = this.container.get(StatusBarManager);

    // Commands resolve their own dependencies
    this.addCommand(this.container.get(SelectMsgCommand).toObsidianCommand());
    this.addCommand(this.container.get(UserTagCommand).toObsidianCommand());
  }
}

// apps/obsidian-plugin/src/di/tokens.ts
import { InjectionToken } from '@needle-di/core';
import type { App } from 'obsidian';
import type { PluginSettings } from '../settings';

/** Obsidian App instance - replaces passing this.app as parameter */
export const OBSIDIAN_APP = new InjectionToken<App>('OBSIDIAN_APP');

/** Plugin settings - replaces passing this.settings as parameter */
export const APP_SETTINGS = new InjectionToken<PluginSettings>('APP_SETTINGS');

// apps/obsidian-plugin/src/status-bar-manager.ts
import { injectable, inject } from '@needle-di/core';
import { OBSIDIAN_APP } from './di/tokens';
import type { App } from 'obsidian';

@injectable()
export class StatusBarManager {
  constructor(
    private app = inject(OBSIDIAN_APP),        // Injected via DI token!
    private statusBarItem = inject('STATUS_BAR_ITEM')
  ) {}

  updateStatus(text: string) {
    this.statusBarItem.setText(text);
    // Uses injected app instance
    const activeFile = this.app.workspace.getActiveFile();
  }
}

// apps/obsidian-plugin/src/commands/select-msg.ts
import { injectable, inject } from '@needle-di/core';
import { OBSIDIAN_APP, APP_SETTINGS } from '../di/tokens';
import type { App, Command } from 'obsidian';
import type { PluginSettings } from '../settings';

@injectable()
export class SelectMsgCommand {
  constructor(
    private app = inject(OBSIDIAN_APP),        // Injected via token
    private settings = inject(APP_SETTINGS)    // Injected via token
  ) {}

  toObsidianCommand(): Command {
    return {
      id: 'select-message',
      name: 'Select message at cursor',
      editorCallback: (editor) => {
        // Uses injected app instance
        const file = this.app.workspace.getActiveFile();
        // ... command logic using this.settings
      }
    };
  }
}
```

**Key Changes**:
1. ✅ Defined `OBSIDIAN_APP` token in `di/tokens.ts`
2. ✅ Bound `this.app` to `OBSIDIAN_APP` token in container during plugin initialization
3. ✅ Converted services/commands to injectable classes with `@injectable()` decorator
4. ✅ Replaced parameter passing with `inject(OBSIDIAN_APP)` in constructors
5. ✅ Services now resolve dependencies automatically from container

**Testing with Mocked App Instance**:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Container } from '@needle-di/core';
import { OBSIDIAN_APP } from '../di/tokens';
import { StatusBarManager } from './status-bar-manager';
import type { App, Workspace, TFile } from 'obsidian';

describe('StatusBarManager - Injectable with App Token', () => {
  let container: Container;
  let mockApp: App;
  let mockStatusBarItem: HTMLElement;

  beforeEach(() => {
    // GIVEN: Mock Obsidian App instance
    const mockFile: TFile = {
      path: 'test.md',
      name: 'test.md',
      basename: 'test'
    } as TFile;

    const mockWorkspace: Workspace = {
      getActiveFile: vi.fn(() => mockFile)
    } as unknown as Workspace;

    mockApp = {
      workspace: mockWorkspace
    } as App;

    mockStatusBarItem = {
      setText: vi.fn()
    } as unknown as HTMLElement;

    // GIVEN: Container with mocked OBSIDIAN_APP token
    container = new Container();
    container.bind({ provide: OBSIDIAN_APP, useValue: mockApp });
    container.bind({ provide: 'STATUS_BAR_ITEM', useValue: mockStatusBarItem });
    container.bind(StatusBarManager);
  });

  it('should inject Obsidian App via token', () => {
    // WHEN: Service is resolved from container
    const manager = container.get(StatusBarManager);

    // THEN: Service is properly instantiated
    expect(manager).toBeDefined();
  });

  it('should use injected App for workspace operations', () => {
    // WHEN: Service performs operation using App
    const manager = container.get(StatusBarManager);
    manager.updateStatus('Processing...');

    // THEN: App's workspace methods are called
    expect(mockApp.workspace.getActiveFile).toHaveBeenCalled();
    expect(mockStatusBarItem.setText).toHaveBeenCalledWith('Processing...');
  });

  it('should be testable with different App configurations', () => {
    // GIVEN: Different mock app with no active file
    const altWorkspace = {
      getActiveFile: vi.fn(() => null)
    } as unknown as Workspace;

    const altApp = {
      workspace: altWorkspace
    } as App;

    const altContainer = new Container();
    altContainer.bind({ provide: OBSIDIAN_APP, useValue: altApp });
    altContainer.bind({ provide: 'STATUS_BAR_ITEM', useValue: mockStatusBarItem });
    altContainer.bind(StatusBarManager);

    // WHEN: Service is resolved with different app mock
    const manager = altContainer.get(StatusBarManager);
    manager.updateStatus('No file');

    // THEN: Service adapts to different app state
    expect(altWorkspace.getActiveFile).toHaveBeenCalled();
  });
});
```

**Benefits of Token-Based Injection**:
- ✅ **No Parameter Drilling**: Services declare dependencies, no manual passing through layers
- ✅ **Testability**: Easy to mock `App` instance with different workspace states
- ✅ **Type Safety**: `OBSIDIAN_APP` token typed as `InjectionToken<App>`
- ✅ **Decoupling**: Services don't depend on plugin instance, only on App interface
- ✅ **Consistency**: All Obsidian API access goes through same injection mechanism

---

### Task 4: Add a New AI Provider

**Goal**: Integrate a new AI service with DI

**Steps**:

1. **Create provider class**:
```typescript
import { injectable, inject } from '@needle-di/core';
import { APP_SETTINGS } from '../di/tokens';
import { VendorProvider } from './decorator';
import type { Vendor, BaseOptions, SendRequest } from './index';

@VendorProvider('NewAI')
@injectable()
export class NewAIProvider extends BaseVendorOptions implements Vendor {
  constructor(settings = inject(APP_SETTINGS)) {
    super(settings);
  }

  get name(): string {
    return 'NewAI';
  }

  get apiKey(): string {
    return this.settings.providers?.newai?.apiKey || '';
  }

  get baseURL(): string {
    return this.settings.providers?.newai?.baseURL || 'https://api.newai.com';
  }

  get model(): string {
    return this.settings.providers?.newai?.model || 'default-model';
  }

  get parameters(): Record<string, unknown> {
    return this.settings.providers?.newai?.parameters || {};
  }

  get models(): string[] {
    return ['model-a', 'model-b', 'model-c'];
  }

  get websiteToObtainKey(): string {
    return 'https://newai.com/api-keys';
  }

  get capabilities(): Capability[] {
    return ['Text Generation', 'Image Vision'];
  }

  get defaultOptions(): BaseOptions {
    return {
      apiKey: this.apiKey,
      baseURL: this.baseURL,
      model: this.model,
      parameters: this.parameters
    };
  }

  get sendRequestFunc() {
    return (options: BaseOptions) => {
      return async function* (
        messages: readonly Message[],
        controller: AbortController,
        resolveEmbedAsBinary: ResolveEmbedAsBinary,
        saveAttachment?: SaveAttachment
      ) {
        // Implement streaming logic here
        yield 'response token';
      };
    };
  }
}
```

2. **Register provider** (`src/di/container.ts`):
```typescript
registerAIProviders() {
  // ... existing providers
  this.container.bind(NewAIProvider);
}
```

3. **Add to factory** (`src/di/provider-factory.ts`):
```typescript
createProvider(providerName: string) {
  switch (providerName) {
    // ... existing cases
    case 'NewAI':
      return this.container.get(NewAIProvider);
    default:
      return null;
  }
}
```

4. **Write tests**:
```typescript
describe('NewAI Provider', () => {
  let container: Container;

  beforeEach(() => {
    // GIVEN: Test container with mock settings
    container = new Container();
    container.bind({
      provide: APP_SETTINGS,
      useValue: {
        providers: {
          newai: {
            apiKey: 'test-key',
            baseURL: 'https://api.newai.com',
            model: 'model-a',
            parameters: {}
          }
        }
      }
    });
    container.bind(NewAIProvider);
  });

  it('should be injectable', () => {
    // WHEN: Provider is resolved
    const provider = container.get(NewAIProvider);

    // THEN: Provider is correctly initialized
    expect(provider.name).toBe('NewAI');
    expect(provider.apiKey).toBe('test-key');
  });
});
```

---

### Task 5: Write Testable Code with DI

**Goal**: Write unit tests with mocked dependencies

**Pattern**:

```typescript
// Service to test
@injectable()
export class DataService {
  constructor(
    private settings = inject(APP_SETTINGS),
    private logger = inject(LOGGER)
  ) {}

  async fetchData(): Promise<Data> {
    this.logger.info('Fetching data...');
    const url = this.settings.apiEndpoint;
    // ... fetch logic
  }
}

// Test file
describe('DataService', () => {
  let container: Container;
  let mockSettings: PluginSettings;
  let mockLogger: Logger;

  beforeEach(() => {
    // GIVEN: Mock dependencies
    mockSettings = {
      apiEndpoint: 'https://test.api.com'
    };

    mockLogger = {
      info: vi.fn(),
      error: vi.fn()
    };

    // GIVEN: Test container with mocks
    container = new Container();
    container.bind({ provide: APP_SETTINGS, useValue: mockSettings });
    container.bind({ provide: LOGGER, useValue: mockLogger });
    container.bind(DataService);
  });

  it('should fetch data using settings', async () => {
    // WHEN: Service fetches data
    const service = container.get(DataService);
    await service.fetchData();

    // THEN: Logger was called
    expect(mockLogger.info).toHaveBeenCalledWith('Fetching data...');
  });

  it('should handle different settings', async () => {
    // GIVEN: Different mock settings
    const altSettings = { apiEndpoint: 'https://alt.api.com' };
    const altContainer = new Container();
    altContainer.bind({ provide: APP_SETTINGS, useValue: altSettings });
    altContainer.bind({ provide: LOGGER, useValue: mockLogger });
    altContainer.bind(DataService);

    // WHEN: Service is resolved with different settings
    const service = altContainer.get(DataService);

    // THEN: Service uses alternative settings
    expect(service).toBeDefined();
  });
});
```

---

### Task 6: Create a Custom Configuration Token

**Goal**: Add a new injectable configuration value

**Steps**:

1. **Define interface and token** (`src/di/tokens.ts`):
```typescript
export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
}

export const CACHE_CONFIG = new InjectionToken<CacheConfig>('CACHE_CONFIG');
```

2. **Bind value in container** (`src/di/container.ts`):
```typescript
private setupContainer() {
  // ... existing bindings
  this.container.bind({
    provide: CACHE_CONFIG,
    useValue: {
      enabled: true,
      ttl: 3600,
      maxSize: 100
    }
  });
}
```

3. **Inject into service**:
```typescript
@injectable()
export class CacheService {
  constructor(private config = inject(CACHE_CONFIG)) {}

  isCacheEnabled(): boolean {
    return this.config.enabled;
  }
}
```

---

## Best Practices

### 1. Constructor Injection Only

✅ **Good**: Declare all dependencies in constructor
```typescript
@injectable()
class Service {
  constructor(
    private settings = inject(APP_SETTINGS),
    private logger = inject(LOGGER)
  ) {}
}
```

❌ **Bad**: Property injection (mutable, unclear when ready)
```typescript
@injectable()
class Service {
  private settings!: PluginSettings;

  setSettings(settings: PluginSettings) {
    this.settings = settings;
  }
}
```

### 2. Use Interfaces for Tokens

✅ **Good**: Interface defines contract
```typescript
export interface Logger {
  info(message: string): void;
  error(message: string): void;
}

export const LOGGER = new InjectionToken<Logger>('LOGGER');
```

❌ **Bad**: String token without type
```typescript
const LOGGER = 'logger'; // No type safety!
```

### 3. Test with Child Containers

✅ **Good**: Override only what's needed
```typescript
const testContainer = rootContainer.createChild();
testContainer.bind({ provide: LOGGER, useValue: mockLogger });
// Inherits all other bindings from rootContainer
```

❌ **Bad**: Recreate entire container
```typescript
const testContainer = new Container();
testContainer.bind(/* ... repeat all bindings ... */);
testContainer.bind({ provide: LOGGER, useValue: mockLogger });
```

### 4. Given/When/Then Test Comments

✅ **Good**: Business-value focused comments
```typescript
it('should authenticate user with valid credentials', () => {
  // GIVEN: A user with valid credentials
  const user = { username: 'test', password: 'pass123' };

  // WHEN: User attempts to authenticate
  const result = authService.authenticate(user);

  // THEN: Authentication succeeds
  expect(result.success).toBe(true);
});
```

❌ **Bad**: Implementation-focused comments
```typescript
it('should call authenticate method', () => {
  // Setup mock
  const mock = vi.fn();

  // Call method
  service.method(mock);

  // Check mock was called
  expect(mock).toHaveBeenCalled();
});
```

### 5. Minimal Mocking

✅ **Good**: Mock only external dependencies
```typescript
container.bind({ provide: HTTP_CLIENT, useValue: mockClient });
container.bind(RealService); // Real service under test
```

❌ **Bad**: Mock everything including services under test
```typescript
container.bind({ provide: HTTP_CLIENT, useValue: mockClient });
container.bind({ provide: RealService, useValue: mockService }); // Why test?
```

---

## Troubleshooting

### Problem: "Dependency not registered" Error

**Symptom**: `DependencyResolutionError: Dependency not registered: [Token]`

**Solution**: Ensure token is bound before resolving
```typescript
// Bind first
container.bind({ provide: MY_TOKEN, useValue: myValue });

// Then resolve
const service = container.get(MyService); // Uses MY_TOKEN
```

### Problem: Circular Dependency

**Symptom**: `DependencyResolutionError: Circular dependency detected: A → B → A`

**Solution**: Break the cycle using factory or refactoring
```typescript
// Option 1: Use factory
container.bind({
  provide: ServiceA,
  useFactory: () => new ServiceA(inject(ServiceB, { lazy: true }))
});

// Option 2: Refactor to remove circular dependency
// Extract shared logic to a third service
```

### Problem: Tests Interfering with Each Other

**Symptom**: Test A passes alone but fails when run with Test B

**Solution**: Use `beforeEach()` to create fresh containers
```typescript
describe('Service', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container(); // Fresh container for each test
    container.bind(/* ... */);
  });

  it('test A', () => { /* ... */ });
  it('test B', () => { /* ... */ });
});
```

### Problem: Provider Not Found

**Symptom**: `ProviderFactory.createProvider('OpenAI')` returns `null`

**Solution**: Ensure provider is registered in `DIContainer.registerAIProviders()`
```typescript
registerAIProviders() {
  this.container.bind(OpenAIProvider); // Must be registered!
  // ...
}
```

---

## Advanced Topics

### Lazy Injection

**When**: Avoid circular dependencies or defer expensive initialization

```typescript
@injectable()
class ServiceA {
  constructor(private getB = inject(ServiceB, { lazy: true })) {}

  useB() {
    const b = this.getB(); // Resolved only when called
    b.doSomething();
  }
}
```

### Async Providers

**When**: Provider requires async initialization

```typescript
container.bind({
  provide: 'config',
  async: true,
  useFactory: async () => {
    const response = await fetch('/config.json');
    return response.json();
  }
});

const config = await container.getAsync('config');
```

### Multi-Providers

**When**: Multiple implementations of same interface

```typescript
container.bind({ provide: 'plugin', multi: true, useValue: 'A' });
container.bind({ provide: 'plugin', multi: true, useValue: 'B' });

@injectable()
class PluginManager {
  constructor(private plugins = inject('plugin', { multi: true })) {
    // this.plugins === ['A', 'B']
  }
}
```

---

## Reference

### Key Files

- `apps/obsidian-plugin/src/di/container.ts` - Main DI container
- `apps/obsidian-plugin/src/di/tokens.ts` - Configuration tokens
- `apps/obsidian-plugin/src/di/provider-factory.ts` - Provider creation
- `apps/obsidian-plugin/src/facades/settings.facade.ts` - Backward-compatible settings
- `apps/obsidian-plugin/src/providers/` - Injectable AI providers

### Useful Commands

```bash
# Run tests
pnpm --filter @tars/obsidian-plugin test

# Type check
pnpm --filter @tars/obsidian-plugin typecheck

# Build
pnpm --filter @tars/obsidian-plugin build

# Lint
pnpm --filter @tars/obsidian-plugin lint
```

### Further Reading

- [Needle DI Documentation](https://needle-di.io)
- [Dependency Injection Principles](https://en.wikipedia.org/wiki/Dependency_injection)
- [Test-Driven Development](https://en.wikipedia.org/wiki/Test-driven_development)
- [Feature Spec](./spec.md)
- [Research Document](./research.md)
- [Data Model](./data-model.md)

---

## Getting Help

1. Check [research.md](./research.md) for architectural decisions and rationale
2. Review [data-model.md](./data-model.md) for entity relationships
3. See [contracts/](./contracts/) for TypeScript interface definitions
4. Ask team members familiar with DI patterns
5. Consult Needle DI docs for framework-specific questions

---

**Next Steps**: Once comfortable with these patterns, proceed to implementation tasks in `tasks.md` (generated by `/speckit.tasks` command).
