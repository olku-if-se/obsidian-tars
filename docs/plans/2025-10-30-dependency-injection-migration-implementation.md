# Dependency Injection Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate Tars Obsidian plugin from direct instantiation to Needle DI while maintaining zero breaking changes.

**Architecture:** Centralized DI container with facade pattern for backward compatibility, gradual migration in 4 phases.

**Tech Stack:** Needle DI (@needle-di/core), TypeScript 5.7+, Obsidian API, Vitest for testing.

---

## Phase 1: Foundation Setup

### Task 1: Install Needle DI Dependency

**Files:**
- Modify: `apps/obsidian-plugin/package.json`

**Step 1: Add Needle DI to dependencies**

```json
{
  "dependencies": {
    "@needle-di/core": "^1.1.0",
    // ... existing dependencies
  }
}
```

**Step 2: Install the dependency**

Run: `pnpm install`
Expected: Successful installation of @needle-di/core

**Step 3: Update TypeScript configuration for decorators**

Modify: `apps/obsidian-plugin/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": false,
    "emitDecoratorMetadata": false,
    // ... existing options
  }
}
```

**Step 4: Commit**

```bash
git add apps/obsidian-plugin/package.json apps/obsidian-plugin/tsconfig.json
git commit -m "feat: add Needle DI dependency and TypeScript decorator support"
```

### Task 2: Create Configuration Tokens

**Files:**
- Create: `apps/obsidian-plugin/src/di/tokens.ts`

**Step 1: Write the tokens file**

```typescript
import { InjectionToken } from '@needle-di/core';
import type { PluginSettings } from '../settings';
import type { Vendor } from '../providers';

export interface ModelRegistry {
  getModels(vendor: string): string[];
  hasCapability(vendor: string, capability: string): boolean;
}

export interface CommandRegistry {
  getCommandIds(): string[];
  registerCommand(id: string, handler: () => void): void;
}

export interface ProviderConfig {
  vendor: string;
  settings: Record<string, unknown>;
}

// Configuration tokens
export const APP_SETTINGS = new InjectionToken<PluginSettings>('APP_SETTINGS');
export const MODEL_REGISTRY = new InjectionToken<ModelRegistry>('MODEL_REGISTRY');
export const COMMAND_REGISTRY = new InjectionToken<CommandRegistry>('COMMAND_REGISTRY');
export const PROVIDER_CONFIGS = new InjectionToken<ProviderConfig[]>('PROVIDER_CONFIGS');
export const AI_PROVIDERS = new InjectionToken<Vendor[]>('AI_PROVIDERS');
```

**Step 2: Run TypeScript check**

Run: `pnpm --filter @tars/obsidian-plugin typecheck`
Expected: PASS with no type errors

**Step 3: Create DI container setup file**

Create: `apps/obsidian-plugin/src/di/container.ts`

```typescript
import { Container, injectable } from '@needle-di/core';
import {
  APP_SETTINGS,
  MODEL_REGISTRY,
  COMMAND_REGISTRY,
  PROVIDER_CONFIGS,
  AI_PROVIDERS
} from './tokens';

@injectable()
export class DIContainer {
  private container: Container;

  constructor() {
    this.container = new Container();
    this.setupContainer();
  }

  private setupContainer() {
    // Configuration bindings will be added in subsequent tasks
    // This is just the container structure
  }

  get<T>(token: any): T {
    return this.container.get(token);
  }

  bind(token: any, implementation: any): void {
    this.container.bind({ provide: token, useClass: implementation });
  }
}
```

**Step 4: Run TypeScript check**

Run: `pnpm --filter @tars/obsidian-plugin typecheck`
Expected: PASS with no type errors

**Step 5: Commit**

```bash
git add apps/obsidian-plugin/src/di/
git commit -m "feat: create DI tokens and container structure"
```

## Phase 2: AI Provider Migration

### Task 3: Convert AI Provider Base Classes to Injectable

**Files:**
- Modify: `apps/obsidian-plugin/src/providers/index.ts`
- Modify: `apps/obsidian-plugin/src/providers/decorator.ts`

**Step 1: Update provider interfaces with injection support**

Modify: `apps/obsidian-plugin/src/providers/index.ts`

```typescript
import { injectable, inject } from '@needle-di/core';
import { APP_SETTINGS } from '../di/tokens';

// Add these imports at the top
import type { EmbedCache } from 'obsidian';

// Keep existing types...
export type MsgRole = 'user' | 'assistant' | 'system'
export type SaveAttachment = (fileName: string, data: ArrayBuffer) => Promise<void>
export type ResolveEmbedAsBinary = (embed: EmbedCache) => Promise<ArrayBuffer>
export type CreatePlainText = (filePath: string, text: string) => Promise<void>

export interface Message {
  readonly role: MsgRole
  readonly content: string
  readonly embeds?: EmbedCache[]
}

export type SendRequest = (
  messages: readonly Message[],
  controller: AbortController,
  resolveEmbedAsBinary: ResolveEmbedAsBinary,
  saveAttachment?: SaveAttachment
) => AsyncGenerator<string, void, unknown>

export type Capability = 'Text Generation' | 'Image Vision' | 'PDF Vision' | 'Image Generation' | 'Image Editing' | 'Web Search' | 'Reasoning'

export interface Vendor {
  readonly name: string
  readonly defaultOptions: BaseOptions
  readonly sendRequestFunc: (options: BaseOptions) => SendRequest
  readonly models: string[]
  readonly websiteToObtainKey: string
  readonly capabilities: Capability[]
}

export interface BaseOptions {
  apiKey: string
  baseURL: string
  model: string
  parameters: Record<string, unknown>
  enableWebSearch?: boolean
}

// Make BaseVendorOptions injectable
@injectable()
export abstract class BaseVendorOptions {
  constructor(protected settings = inject(APP_SETTINGS)) {}

  abstract get apiKey(): string;
  abstract get baseURL(): string;
  abstract get model(): string;
  abstract get parameters(): Record<string, unknown>;
}

export interface ProviderSettings {
  tag: string
  readonly vendor: string
  options: BaseOptions
}

export interface Optional {
  apiSecret: string
  endpoint: string
  apiVersion: string
}
```

**Step 2: Update provider decorator for injection**

Modify: `apps/obsidian-plugin/src/providers/decorator.ts`

```typescript
import { injectable } from '@needle-di/core';

export function VendorProvider(vendorName: string) {
  return function <T extends { new(...args: any[]): {} }>(constructor: T) {
    injectable()(constructor);
    constructor.prototype.vendorName = vendorName;
    return constructor;
  };
}
```

**Step 3: Run TypeScript check**

Run: `pnpm --filter @tars/obsidian-plugin typecheck`
Expected: PASS with no type errors

**Step 4: Commit**

```bash
git add apps/obsidian-plugin/src/providers/index.ts apps/obsidian-plugin/src/providers/decorator.ts
git commit -m "feat: add injection support to provider base classes"
```

### Task 4: Convert OpenAI Provider to Injectable

**Files:**
- Modify: `apps/obsidian-plugin/src/providers/openAI.ts`

**Step 1: Write test for injectable OpenAI provider**

Create: `apps/obsidian-plugin/src/providers/__tests__/openAI.injectable.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from '@needle-di/core';
import { APP_SETTINGS } from '../../di/tokens';
import { OpenAIProvider } from '../openAI';

describe('Injectable OpenAI Provider', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
    container.bind({
      provide: APP_SETTINGS,
      useValue: {
        providers: {
          openai: {
            apiKey: 'test-key',
            baseURL: 'https://api.openai.com/v1',
            model: 'gpt-3.5-turbo',
            parameters: {}
          }
        }
      }
    });
  });

  it('should be injectable', () => {
    expect(() => container.get(OpenAIProvider)).not.toThrow();
  });

  it('should receive settings via injection', () => {
    const provider = container.get(OpenAIProvider);
    expect(provider.name).toBe('OpenAI');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @tars/obsidian-plugin test openAI.injectable.test`
Expected: FAIL - OpenAIProvider is not yet injectable

**Step 3: Convert OpenAI provider to injectable**

Modify: `apps/obsidian-plugin/src/providers/openAI.ts`

```typescript
import { injectable, inject } from '@needle-di/core';
import { APP_SETTINGS } from '../di/tokens';
import type { BaseVendorOptions } from './index';
import { VendorProvider } from './decorator';

@VendorProvider('OpenAI')
@injectable()
export class OpenAIProvider extends BaseVendorOptions {
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
    return this.settings.providers?.openai?.model || 'gpt-3.5-turbo';
  }

  get parameters(): Record<string, unknown> {
    return this.settings.providers?.openai?.parameters || {};
  }

  get models(): string[] {
    return [
      'gpt-4',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k'
    ];
  }

  get websiteToObtainKey(): string {
    return 'https://platform.openai.com/api-keys';
  }

  get capabilities(): string[] {
    return ['Text Generation', 'Image Vision', 'Image Generation'];
  }

  get defaultOptions() {
    return {
      apiKey: this.apiKey,
      baseURL: this.baseURL,
      model: this.model,
      parameters: this.parameters
    };
  }

  // Keep existing sendRequestFunc implementation
  get sendRequestFunc() {
    return (options: BaseVendorOptions) => {
      // Existing implementation...
      return async function*() {
        // Placeholder - keep existing logic
      };
    };
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @tars/obsidian-plugin test openAI.injectable.test`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/obsidian-plugin/src/providers/openAI.ts apps/obsidian-plugin/src/providers/__tests__/openAI.injectable.test.ts
git commit -m "feat: convert OpenAI provider to injectable"
```

### Task 5: Convert Claude Provider to Injectable

**Files:**
- Modify: `apps/obsidian-plugin/src/providers/claude.ts`
- Create: `apps/obsidian-plugin/src/providers/__tests__/claude.injectable.test.ts`

**Step 1: Write test for injectable Claude provider**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from '@needle-di/core';
import { APP_SETTINGS } from '../../di/tokens';
import { ClaudeProvider } from '../claude';

describe('Injectable Claude Provider', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
    container.bind({
      provide: APP_SETTINGS,
      useValue: {
        providers: {
          claude: {
            apiKey: 'test-claude-key',
            baseURL: 'https://api.anthropic.com',
            model: 'claude-3-sonnet-20240229',
            parameters: {}
          }
        }
      }
    });
  });

  it('should be injectable', () => {
    expect(() => container.get(ClaudeProvider)).not.toThrow();
  });

  it('should receive settings via injection', () => {
    const provider = container.get(ClaudeProvider);
    expect(provider.name).toBe('Claude');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @tars/obsidian-plugin test claude.injectable.test`
Expected: FAIL - ClaudeProvider is not yet injectable

**Step 3: Convert Claude provider to injectable**

```typescript
import { injectable, inject } from '@needle-di/core';
import { APP_SETTINGS } from '../di/tokens';
import type { BaseVendorOptions } from './index';
import { VendorProvider } from './decorator';

@VendorProvider('Claude')
@injectable()
export class ClaudeProvider extends BaseVendorOptions {
  get name(): string {
    return 'Claude';
  }

  get apiKey(): string {
    return this.settings.providers?.claude?.apiKey || '';
  }

  get baseURL(): string {
    return this.settings.providers?.claude?.baseURL || 'https://api.anthropic.com';
  }

  get model(): string {
    return this.settings.providers?.claude?.model || 'claude-3-sonnet-20240229';
  }

  get parameters(): Record<string, unknown> {
    return this.settings.providers?.claude?.parameters || {};
  }

  get models(): string[] {
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ];
  }

  get websiteToObtainKey(): string {
    return 'https://console.anthropic.com/';
  }

  get capabilities(): string[] {
    return ['Text Generation', 'Image Vision', 'Reasoning'];
  }

  get defaultOptions() {
    return {
      apiKey: this.apiKey,
      baseURL: this.baseURL,
      model: this.model,
      parameters: this.parameters
    };
  }

  // Keep existing sendRequestFunc implementation
  get sendRequestFunc() {
    return (options: BaseVendorOptions) => {
      // Existing implementation...
      return async function*() {
        // Placeholder - keep existing logic
      };
    };
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @tars/obsidian-plugin test claude.injectable.test`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/obsidian-plugin/src/providers/claude.ts apps/obsidian-plugin/src/providers/__tests__/claude.injectable.test.ts
git commit -m "feat: convert Claude provider to injectable"
```

## Phase 3: Core Services Integration

### Task 6: Create Facade for Plugin Settings

**Files:**
- Create: `apps/obsidian-plugin/src/facades/settings.facade.ts`
- Create: `apps/obsidian-plugin/src/facades/__tests__/settings.facade.test.ts`

**Step 1: Write test for settings facade**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from '@needle-di/core';
import { APP_SETTINGS } from '../../di/tokens';
import { PluginSettingsFacade } from '../settings.facade';

describe('PluginSettings Facade', () => {
  let container: Container;
  let mockSettings: any;

  beforeEach(() => {
    mockSettings = {
      providers: {
        openai: { apiKey: 'test-key' },
        claude: { apiKey: 'claude-key' }
      },
      tags: { user: '#User:', assistant: '#Claude:' },
      enableStatusBar: true
    };

    container = new Container();
    container.bind({
      provide: APP_SETTINGS,
      useValue: mockSettings
    });
  });

  it('should maintain backward compatibility', () => {
    const facade = container.get(PluginSettingsFacade);
    expect(facade.providers).toEqual(mockSettings.providers);
    expect(facade.tags).toEqual(mockSettings.tags);
    expect(facade.enableStatusBar).toBe(true);
  });

  it('should allow property access like original settings', () => {
    const facade = container.get(PluginSettingsFacade);
    expect(facade.providers.openai.apiKey).toBe('test-key');
    expect(facade.providers.claude.apiKey).toBe('claude-key');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @tars/obsidian-plugin test settings.facade.test`
Expected: FAIL - PluginSettingsFacade doesn't exist

**Step 3: Create settings facade**

```typescript
import { injectable, inject } from '@needle-di/core';
import { APP_SETTINGS } from '../di/tokens';
import type { PluginSettings } from '../settings';

@injectable()
export class PluginSettingsFacade implements PluginSettings {
  constructor(private settings = inject(APP_SETTINGS)) {}

  get providers() {
    return this.settings.providers;
  }

  get tags() {
    return this.settings.tags;
  }

  get enableStatusBar() {
    return this.settings.enableStatusBar;
  }

  get maxTriggerLineLength() {
    return this.settings.maxTriggerLineLength;
  }

  get templates() {
    return this.settings.templates;
  }

  get debugMode() {
    return this.settings.debugMode;
  }

  // Maintain all existing PluginSettings interface properties
  // Each property delegates to the injected settings
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @tars/obsidian-plugin test settings.facade.test`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/obsidian-plugin/src/facades/settings.facade.ts apps/obsidian-plugin/src/facades/__tests__/settings.facade.test.ts
git commit -m "feat: create settings facade for backward compatibility"
```

### Task 7: Integrate DI Container into Main Plugin

**Files:**
- Modify: `apps/obsidian-plugin/src/main.ts`

**Step 1: Write integration test**

Create: `apps/obsidian-plugin/src/__tests__/main.di.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TarsPlugin } from '../main';
import { DIContainer } from '../di/container';

describe('TarsPlugin DI Integration', () => {
  let plugin: TarsPlugin;

  beforeEach(() => {
    plugin = new TarsPlugin(app, mockManifest);
  });

  it('should initialize DI container during load', async () => {
    await plugin.onload();
    expect(plugin.diContainer).toBeDefined();
    expect(plugin.diContainer).toBeInstanceOf(DIContainer);
  });

  it('should register core services in container', async () => {
    await plugin.onload();
    // Test that core services are registered
    expect(() => plugin.diContainer.get('APP_SETTINGS')).not.toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @tars/obsidian-plugin test main.di.test`
Expected: FAIL - TarsPlugin doesn't have diContainer

**Step 3: Integrate DI container into main plugin**

```typescript
import { Notice, Plugin } from 'obsidian'
import {
  asstTagCmd,
  exportCmd,
  getMeta,
  getTagCmdIdsFromSettings,
  newChatTagCmd,
  replaceCmd,
  selectMsgAtCursorCmd,
  systemTagCmd,
  userTagCmd,
} from './commands'
import type { RequestController } from './editor'
import { t } from './lang/helper'
import {
  getTitleFromCmdId,
  loadTemplateFileCommand,
  promptTemplateCmd,
  templateToCmdId,
} from './prompt'
import { DEFAULT_SETTINGS, type PluginSettings } from './settings'
import { TarsSettingTab } from './settingTab'
import { StatusBarManager } from './statusBarManager'
import {
  getMaxTriggerLineLength,
  TagEditorSuggest,
  type TagEntry,
} from './suggest'
import { ensureWorkspacePackageUsage } from './workspace-usage'
import { DIContainer } from './di/container'
import { APP_SETTINGS, MODEL_REGISTRY, COMMAND_REGISTRY } from './di/tokens'
import { PluginSettingsFacade } from './facades/settings.facade'

export default class TarsPlugin extends Plugin {
  settings!: PluginSettings
  statusBarManager!: StatusBarManager
  tagCmdIds: string[] = []
  promptCmdIds: string[] = []
  tagLowerCaseMap: Map<string, Omit<TagEntry, 'replacement'>> = new Map()
  aborterInstance: AbortController | null = null
  diContainer!: DIContainer

  async onload() {
    await this.loadSettings()

    console.debug('loading Tars plugin...')
    ensureWorkspacePackageUsage()

    // Initialize DI container first
    this.setupDIContainer()

    const statusBarItem = this.addStatusBarItem()
    this.statusBarManager = new StatusBarManager(this.app, statusBarItem)

    this.buildTagCommands(true)
    this.buildPromptCommands(true)

    // Continue with existing initialization...
    this.registerEvents()
    this.addSettingTab(new TarsSettingTab(this.app, this))
  }

  private setupDIContainer() {
    this.diContainer = new DIContainer()

    // Bind core services
    this.diContainer.bind(APP_SETTINGS, PluginSettingsFacade)

    // Register AI providers (we'll add these as they're converted)
    // this.diContainer.bind(OpenAIProvider)
    // this.diContainer.bind(ClaudeProvider)

    // Bind other core services
    // this.diContainer.bind(StatusBarManager)
    // this.diContainer.bind(TagEditorSuggest)
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }

  onunload() {
    this.aborterInstance?.abort()
    // Clean up DI container if needed
  }

  // ... rest of existing methods remain unchanged
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @tars/obsidian-plugin test main.di.test`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/obsidian-plugin/src/main.ts apps/obsidian-plugin/src/__tests__/main.di.test.ts
git commit -m "feat: integrate DI container into main plugin"
```

## Phase 4: Provider Registration and Configuration

### Task 8: Register AI Providers in DI Container

**Files:**
- Modify: `apps/obsidian-plugin/src/di/container.ts`
- Create: `apps/obsidian-plugin/src/di/__tests__/container.test.ts`

**Step 1: Write test for provider registration**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { DIContainer } from '../container';
import { OpenAIProvider } from '../../providers/openAI';
import { ClaudeProvider } from '../../providers/claude';

describe('DI Container Provider Registration', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = new DIContainer();
  });

  it('should register OpenAI provider', () => {
    container.registerAIProviders();
    const providers = container.getAllProviders();
    expect(providers.some(p => p.name === 'OpenAI')).toBe(true);
  });

  it('should register Claude provider', () => {
    container.registerAIProviders();
    const providers = container.getAllProviders();
    expect(providers.some(p => p.name === 'Claude')).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @tars/obsidian-plugin test container.test`
Expected: FAIL - registerAIProviders method doesn't exist

**Step 3: Add provider registration to container**

Modify: `apps/obsidian-plugin/src/di/container.ts`

```typescript
import { Container, injectable } from '@needle-di/core';
import {
  APP_SETTINGS,
  MODEL_REGISTRY,
  COMMAND_REGISTRY,
  PROVIDER_CONFIGS,
  AI_PROVIDERS
} from './tokens';
import { OpenAIProvider } from '../providers/openAI';
import { ClaudeProvider } from '../providers/claude';

@injectable()
export class DIContainer {
  private container: Container;

  constructor() {
    this.container = new Container();
    this.setupContainer();
  }

  private setupContainer() {
    // Register AI providers
    this.registerAIProviders();

    // Configuration bindings will be added as needed
  }

  registerAIProviders() {
    this.container.bind(OpenAIProvider);
    this.container.bind(ClaudeProvider);

    // Add other providers as they're converted to injectable
    // this.container.bind(DeepSeekProvider);
    // this.container.bind(GeminiProvider);
  }

  getAllProviders() {
    const providers = [];
    try {
      providers.push(this.container.get(OpenAIProvider));
    } catch (e) {
      // Provider not available or settings incomplete
    }

    try {
      providers.push(this.container.get(ClaudeProvider));
    } catch (e) {
      // Provider not available or settings incomplete
    }

    return providers;
  }

  get<T>(token: any): T {
    return this.container.get(token);
  }

  bind(token: any, implementation: any): void {
    this.container.bind({ provide: token, useClass: implementation });
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @tars/obsidian-plugin test container.test`
Expected: PASS

**Step 5: Update main plugin to use provider registration**

Modify: `apps/obsidian-plugin/src/main.ts`

```typescript
private setupDIContainer() {
  this.diContainer = new DIContainer()

  // Bind core services
  this.diContainer.bind(APP_SETTINGS, PluginSettingsFacade)

  // Register AI providers through container
  this.diContainer.registerAIProviders()
}
```

**Step 6: Commit**

```bash
git add apps/obsidian-plugin/src/di/container.ts apps/obsidian-plugin/src/di/__tests__/container.test.ts apps/obsidian-plugin/src/main.ts
git commit -m "feat: register AI providers in DI container"
```

### Task 9: Create Provider Factory

**Files:**
- Create: `apps/obsidian-plugin/src/di/provider-factory.ts`
- Create: `apps/obsidian-plugin/src/di/__tests__/provider-factory.test.ts`

**Step 1: Write test for provider factory**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from '@needle-di/core';
import { ProviderFactory } from '../provider-factory';
import { APP_SETTINGS } from '../tokens';
import { OpenAIProvider } from '../../providers/openAI';

describe('Provider Factory', () => {
  let container: Container;
  let factory: ProviderFactory;

  beforeEach(() => {
    container = new Container();
    container.bind({
      provide: APP_SETTINGS,
      useValue: {
        providers: {
          openai: {
            apiKey: 'test-key',
            baseURL: 'https://api.openai.com/v1',
            model: 'gpt-3.5-turbo',
            parameters: {}
          }
        }
      }
    });

    factory = new ProviderFactory(container);
  });

  it('should create provider by name', () => {
    const provider = factory.createProvider('OpenAI');
    expect(provider).toBeDefined();
    expect(provider.name).toBe('OpenAI');
  });

  it('should return null for unknown provider', () => {
    const provider = factory.createProvider('Unknown');
    expect(provider).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @tars/obsidian-plugin test provider-factory.test`
Expected: FAIL - ProviderFactory doesn't exist

**Step 3: Create provider factory**

```typescript
import { injectable, inject } from '@needle-di/core';
import { Container } from '@needle-di/core';
import { OpenAIProvider } from '../providers/openAI';
import { ClaudeProvider } from '../providers/claude';

@injectable()
export class ProviderFactory {
  constructor(private container = inject(Container)) {}

  createProvider(providerName: string) {
    switch (providerName) {
      case 'OpenAI':
        return this.container.get(OpenAIProvider);
      case 'Claude':
        return this.container.get(ClaudeProvider);
      default:
        return null;
    }
  }

  getAllProviders() {
    return [
      this.createProvider('OpenAI'),
      this.createProvider('Claude'),
    ].filter(provider => provider !== null);
  }

  getAvailableProviders() {
    return this.getAllProviders().map(provider => ({
      name: provider!.name,
      models: provider!.models,
      capabilities: provider!.capabilities
    }));
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @tars/obsidian-plugin test provider-factory.test`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/obsidian-plugin/src/di/provider-factory.ts apps/obsidian-plugin/src/di/__tests__/provider-factory.test.ts
git commit -m "feat: create provider factory for DI-based provider creation"
```

## Phase 5: Testing and Validation

### Task 10: Create Integration Tests

**Files:**
- Create: `apps/obsidian-plugin/src/__tests__/integration/di-integration.test.ts`

**Step 1: Write comprehensive integration test**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TarsPlugin } from '../../main';
import { DIContainer } from '../../di/container';
import { ProviderFactory } from '../../di/provider-factory';

describe('DI Integration Tests', () => {
  let plugin: TarsPlugin;
  let mockApp: any;
  let mockManifest: any;

  beforeEach(() => {
    mockApp = {
      vault: {},
      workspace: {},
      metadataCache: {}
    };

    mockManifest = {
      id: 'tars',
      version: '1.0.0'
    };

    plugin = new TarsPlugin(mockApp, mockManifest);
  });

  it('should initialize complete DI system', async () => {
    await plugin.onload();

    expect(plugin.diContainer).toBeDefined();
    expect(plugin.diContainer).toBeInstanceOf(DIContainer);
  });

  it('should provide working provider factory', async () => {
    await plugin.onload();

    const factory = plugin.diContainer.get(ProviderFactory);
    expect(factory).toBeDefined();

    const providers = factory.getAllProviders();
    expect(providers.length).toBeGreaterThan(0);
  });

  it('should maintain backward compatibility', async () => {
    await plugin.onload();

    // Settings should still work as before
    expect(plugin.settings).toBeDefined();
    expect(typeof plugin.settings.providers).toBe('object');
  });

  it('should handle missing providers gracefully', async () => {
    await plugin.onload();

    const factory = plugin.diContainer.get(ProviderFactory);
    const unknownProvider = factory.createProvider('UnknownProvider');
    expect(unknownProvider).toBeNull();
  });
});
```

**Step 2: Run integration tests**

Run: `pnpm --filter @tars/obsidian-plugin test integration`
Expected: PASS all integration tests

**Step 3: Create end-to-end test for plugin functionality**

Create: `apps/obsidian-plugin/src/__tests__/e2e/plugin-functionality.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TarsPlugin } from '../../main';

describe('Plugin Functionality E2E', () => {
  let plugin: TarsPlugin;

  beforeEach(async () => {
    plugin = new TarsPlugin(mockApp, mockManifest);
    await plugin.loadSettings();
  });

  it('should load and save settings correctly', async () => {
    const originalSettings = plugin.settings;

    // Modify settings
    plugin.settings.enableStatusBar = false;
    await plugin.saveSettings();

    // Reload and verify
    await plugin.loadSettings();
    expect(plugin.settings.enableStatusBar).toBe(false);
  });

  it('should build tag commands with DI providers', async () => {
    await plugin.onload();

    // Verify tag commands are built
    expect(plugin.tagCmdIds.length).toBeGreaterThan(0);
  });
});
```

**Step 4: Run E2E tests**

Run: `pnpm --filter @tars/obsidian-plugin test e2e`
Expected: PASS all E2E tests

**Step 5: Commit**

```bash
git add apps/obsidian-plugin/src/__tests__/integration/ apps/obsidian-plugin/src/__tests__/e2e/
git commit -m "test: add comprehensive integration and E2E tests for DI system"
```

### Task 11: Performance Validation

**Files:**
- Create: `apps/obsidian-plugin/src/__tests__/performance/di-performance.test.ts`

**Step 1: Write performance tests**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { performance } from 'perf_hooks';
import { TarsPlugin } from '../../main';

describe('DI Performance Tests', () => {
  it('should initialize DI container within acceptable time', async () => {
    const plugin = new TarsPlugin(mockApp, mockManifest);

    const startTime = performance.now();
    await plugin.onload();
    const endTime = performance.now();

    const initTime = endTime - startTime;
    expect(initTime).toBeLessThan(1000); // Should initialize within 1 second
  });

  it('should resolve providers quickly', async () => {
    const plugin = new TarsPlugin(mockApp, mockManifest);
    await plugin.onload();

    const startTime = performance.now();
    const factory = plugin.diContainer.get(ProviderFactory);
    const providers = factory.getAllProviders();
    const endTime = performance.now();

    const resolveTime = endTime - startTime;
    expect(resolveTime).toBeLessThan(100); // Should resolve within 100ms
    expect(providers.length).toBeGreaterThan(0);
  });

  it('should not significantly increase bundle size', async () => {
    // This would be tested in build process
    // For now, just verify DI components load without issues
    const plugin = new TarsPlugin(mockApp, mockManifest);
    await plugin.onload();

    expect(plugin.diContainer).toBeDefined();
  });
});
```

**Step 2: Run performance tests**

Run: `pnpm --filter @tars/obsidian-plugin test performance`
Expected: PASS all performance tests

**Step 3: Validate bundle size impact**

Run: `pnpm --filter @tars/obsidian-plugin build`
Expected: Build completes successfully with minimal size increase

**Step 4: Commit**

```bash
git add apps/obsidian-plugin/src/__tests__/performance/
git commit -m "test: add performance validation for DI system"
```

## Phase 6: Documentation and Cleanup

### Task 12: Update Documentation

**Files:**
- Modify: `README.md`
- Create: `docs/dependency-injection.md`

**Step 1: Update main README**

```markdown
# Tars - Obsidian AI Plugin

## Architecture

This plugin uses dependency injection with [Needle DI](https://needle-di.io) for:
- Improved code organization and reduced coupling
- Easier testing with mockable dependencies
- Simplified configuration management
- Better extensibility for new AI providers

### DI Container Structure

- **Core Services:** Settings, StatusBarManager, CommandManager
- **AI Providers:** All vendor implementations (OpenAI, Claude, etc.)
- **Configuration:** Token-based configuration system
- **Factories:** Provider creation and management

## Development

### Adding New AI Providers

1. Create provider class extending `BaseVendorOptions`
2. Add `@VendorProvider('ProviderName')` and `@injectable()` decorators
3. Register in `DIContainer.registerAIProviders()`
4. Add provider to `ProviderFactory.createProvider()`

### Testing

The DI system enables comprehensive unit testing with mocked dependencies:

```typescript
const container = new Container();
container.bind({ provide: APP_SETTINGS, useValue: mockSettings });
const provider = container.get(OpenAIProvider);
```

## Existing README content...
```

**Step 2: Create detailed DI documentation**

Create: `docs/dependency-injection.md`

```markdown
# Dependency Injection in Tars

## Overview

Tars uses Needle DI for dependency injection to improve code organization, testability, and maintainability.

## Architecture

### Container Structure

```
TarsPlugin
└── DIContainer
    ├── Core Services
    │   ├── PluginSettings (facade)
    │   ├── StatusBarManager
    │   └── CommandManager
    ├── AI Providers
    │   ├── OpenAIProvider
    │   ├── ClaudeProvider
    │   └── ...other providers
    └── Configuration
        ├── APP_SETTINGS
        ├── MODEL_REGISTRY
        └── PROVIDER_CONFIGS
```

### Key Patterns

**Facade Pattern:** Maintains backward compatibility while using DI internally
**Factory Pattern:** Creates providers based on configuration
**Token-based Configuration:** Type-safe dependency injection

## Migration Status

✅ **Phase 1:** Foundation setup (Needle DI, tokens, container)
✅ **Phase 2:** AI provider migration (OpenAI, Claude)
✅ **Phase 3:** Core services integration (settings facade)
✅ **Phase 4:** Provider registration and configuration
🔄 **Phase 5:** Testing and validation
⏳ **Phase 6:** Documentation and cleanup

## Adding New Components

### Injectable Service

```typescript
@injectable()
export class MyService {
  constructor(private settings = inject(APP_SETTINGS)) {}

  doSomething() {
    // Use injected dependencies
  }
}
```

### Registration

```typescript
// In DIContainer.setupContainer()
this.container.bind(MyService);
```

### Usage

```typescript
const service = container.get(MyService);
```

## Testing

```typescript
describe('MyService', () => {
  it('should work with mocked dependencies', () => {
    const container = new Container();
    container.bind({
      provide: APP_SETTINGS,
      useValue: mockSettings
    });

    const service = container.get(MyService);
    // Test with mocked dependencies
  });
});
```
```

**Step 3: Commit**

```bash
git add README.md docs/dependency-injection.md
git commit -m "docs: update documentation for DI architecture"
```

### Task 13: Final Cleanup and Validation

**Files:**
- Various cleanup across modified files

**Step 1: Run full test suite**

Run: `pnpm --filter @tars/obsidian-plugin test`
Expected: All tests pass

**Step 2: Run type checking**

Run: `pnpm --filter @tars/obsidian-plugin typecheck`
Expected: No type errors

**Step 3: Run linting**

Run: `pnpm --filter @tars/obsidian-plugin lint`
Expected: No linting errors

**Step 4: Build production version**

Run: `pnpm --filter @tars/obsidian-plugin build`
Expected: Successful build with no errors

**Step 5: Final integration test**

```bash
# Verify plugin loads correctly
node -e "
const plugin = require('./dist/main.js');
console.log('Plugin loaded successfully with DI system');
"
```

**Step 6: Clean up any remaining TODO comments**

```bash
grep -r "TODO" apps/obsidian-plugin/src/ || echo "No TODOs found"
```

**Step 7: Commit final cleanup**

```bash
git add .
git commit -m "feat: complete dependency injection migration

- Migrate to Needle DI with centralized container approach
- Add facades for backward compatibility
- Implement provider factory pattern
- Add comprehensive test coverage
- Maintain zero breaking changes
- Improve code organization and testability"
```

## Validation Checklist

- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Plugin builds successfully
- [ ] Backward compatibility maintained
- [ ] DI system functional
- [ ] Performance acceptable
- [ ] Documentation updated
- [ ] No TODOs remaining

## Migration Complete

The Tars plugin now uses dependency injection with Needle DI while maintaining full backward compatibility. The migration achieves:

- ✅ **Reduced coupling** through DI container
- ✅ **Easier testing** with mockable dependencies
- ✅ **Simplified configuration** via token-based system
- ✅ **Better extensibility** for new providers
- ✅ **Zero breaking changes** through facade pattern
- ✅ **Gradual migration path** for future enhancements