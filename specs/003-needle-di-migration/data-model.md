# Data Model: Needle DI Migration

**Feature**: 003-needle-di-migration
**Date**: 2025-10-30
**Phase**: Phase 1 - Design & Contracts

## Overview

This document defines the core entities, their relationships, and lifecycle management for the Needle DI system in the Tars Obsidian plugin. These entities represent the conceptual model for dependency injection, not database schemas.

---

## Core Entities

### 1. DI Container

**Purpose**: Central registry managing component lifecycles and dependency resolution

**Properties**:
- `container: Container` - Needle DI container instance
- `providers: Map<Token, Provider>` - Registered provider definitions
- `instances: WeakMap<Token, any>` - Resolved singleton instances

**Responsibilities**:
- Register services and configuration tokens
- Resolve dependencies on demand
- Manage component lifecycles (singleton, transient, scoped)
- Create child containers for testing
- Validate dependency graphs at initialization

**Relationships**:
- Contains → Configuration Tokens (1:many)
- Contains → Injectable Services (1:many)
- Creates → Child Containers (1:many)
- Manages → AI Providers (1:many)

**Lifecycle**: Singleton - one instance per plugin, created during `onload()`, destroyed during `onunload()`

---

### 2. Configuration Token

**Purpose**: Type-safe identifier for injectable configuration values

**Properties**:
- `name: string` - Human-readable token identifier
- `type: Type<T>` - TypeScript interface the value must implement

**Token Definitions**:
```typescript
OBSIDIAN_APP: InjectionToken<App>              // Obsidian App instance
APP_SETTINGS: InjectionToken<PluginSettings>   // Plugin settings from encrypted storage
MODEL_REGISTRY: InjectionToken<ModelRegistry>  // AI model capabilities registry
COMMAND_REGISTRY: InjectionToken<CommandRegistry> // Obsidian command mappings
PROVIDER_CONFIGS: InjectionToken<ProviderConfig[]> // Provider configurations
AI_PROVIDERS: InjectionToken<Vendor[]>         // Registered AI provider instances
```

**Responsibilities**:
- Provide compile-time type safety for injected values
- Document expected configuration shape through interfaces
- Enable refactoring support (find all usages)

**Relationships**:
- Bound to → Configuration Values (1:1)
- Injected into → Injectable Services (1:many)
- Stored in → DI Container (many:1)

**Lifecycle**: Constant - created at module load, never destroyed

---

### 3. Injectable Service

**Purpose**: Component with declared dependencies resolved by DI container

**Properties**:
- `@injectable()` - Decorator marking class as injectable
- `constructor(...dependencies)` - Dependencies declared via `inject()`

**Examples**:
- `PluginSettingsFacade` - Backward-compatible settings accessor
- `ProviderFactory` - Creates AI provider instances
- `OpenAIProvider`, `ClaudeProvider`, etc. - AI service integrations

**Responsibilities**:
- Declare dependencies through constructor injection
- Implement business logic using injected dependencies
- Maintain single responsibility principle

**Relationships**:
- Depends on → Configuration Tokens (many:many)
- Depends on → Other Services (many:many)
- Resolved by → DI Container (many:1)
- Extended by → Concrete Implementations (1:many)

**Lifecycle**: Varies by service
- **Singleton**: One instance per container (default)
- **Transient**: New instance per resolution
- **Scoped**: One instance per child container

---

### 4. AI Provider

**Purpose**: Injectable implementation of Vendor interface for AI service integration

**Properties**:
- `name: string` - Provider identifier (e.g., "OpenAI", "Claude")
- `models: string[]` - Available model identifiers
- `capabilities: Capability[]` - Supported features (vision, reasoning, etc.)
- `defaultOptions: BaseOptions` - Configuration for API calls
- `sendRequestFunc: SendRequest` - Async generator for streaming responses

**Injectable Pattern**:
```typescript
@injectable()
export class OpenAIProvider extends BaseVendorOptions implements Vendor {
  constructor(private settings = inject(APP_SETTINGS)) {
    super();
  }

  get apiKey(): string {
    return this.settings.providers?.openai?.apiKey || '';
  }

  // ... other properties
}
```

**Responsibilities**:
- Implement Vendor interface with AI service specifics
- Inject and access provider-specific settings
- Provide streaming request generation
- Handle capability reporting

**Relationships**:
- Implements → Vendor Interface (1:1)
- Extends → BaseVendorOptions (1:1)
- Injects → APP_SETTINGS Token (1:1)
- Registered in → DI Container (many:1)
- Created by → ProviderFactory (many:1)

**Lifecycle**: Lazy singleton - registered at container setup, instantiated on first use, cached for reuse

---

### 5. Provider Factory

**Purpose**: Creates and manages AI provider instances from DI container

**Properties**:
- `container: Container` - DI container reference
- `providerMap: Map<string, Type<Vendor>>` - Name to provider class mapping

**Responsibilities**:
- Resolve provider by name from container
- Return null for unknown providers (graceful handling)
- List all available providers with capabilities
- Cache provider instances (via container's singleton pattern)

**Relationships**:
- Injects → DI Container (1:1)
- Creates → AI Providers (1:many)
- Uses → Provider Tokens (1:many)

**Lifecycle**: Singleton - one factory per container, created during container setup

---

### 6. Service Facade

**Purpose**: Backward-compatible interface delegating to DI-managed implementations

**Properties**:
- `implementation: T` - Injected service instance
- All properties/methods from original interface

**Example**:
```typescript
@injectable()
export class PluginSettingsFacade implements PluginSettings {
  constructor(private settings = inject(APP_SETTINGS)) {}

  get providers() { return this.settings.providers; }
  get tags() { return this.settings.tags; }
  // ... all original properties
}
```

**Responsibilities**:
- Maintain exact original API surface
- Delegate all calls to DI-managed instance
- Enable gradual migration (old code uses facade, new code uses DI)

**Relationships**:
- Implements → Original Interface (1:1)
- Injects → DI-Managed Service (1:1)
- Used by → Legacy Code (many:1)

**Lifecycle**: Singleton - one facade per original service, created during container setup

---

### 7. Child Container

**Purpose**: Isolated container for testing with overridden dependencies

**Properties**:
- `parent: Container` - Parent container reference
- `overrides: Map<Token, Provider>` - Test-specific bindings

**Responsibilities**:
- Inherit parent container bindings
- Override specific bindings for testing
- Isolate test dependencies from production config
- Enable parallel test execution without interference

**Relationships**:
- Created by → Parent Container (many:1)
- Inherits → Parent Bindings (1:many)
- Overrides → Specific Tokens (1:many)

**Lifecycle**: Test-scoped - created in `beforeEach()`, garbage collected after test completes

---

## Entity Relationships Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        TarsPlugin                           │
│                     (Obsidian Plugin)                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ creates during onload()
                           ▼
                  ┌────────────────┐
                  │  DI Container  │◄────────── creates
                  │   (Singleton)  │            for testing
                  └───────┬────────┘
                          │
                          │ contains
         ┌────────────────┼────────────────┬──────────────────┐
         │                │                │                  │
         ▼                ▼                ▼                  ▼
   ┌─────────────┐  ┌───────────┐   ┌────────────┐    ┌─────────────┐
   │Configuration│  │Injectable │   │  Service   │    │   Child     │
   │  Tokens     │  │ Services  │   │  Facades   │    │ Container   │
   └─────┬───────┘  └─────┬─────┘   └─────┬──────┘    └───────┬─────┘
         │                │               │                   │
         │ injected into  │               │ delegates to      │ overrides
         └────────────────┼───────────────┘                   │
                          │                                   │
                          ▼                                   │
                  ┌─────────────┐                             │
                  │AI Providers │                             │
                  │  (Lazy)     │                             │
                  └──────┬──────┘                             │
                         │                                    │
                         │ created by                         │
                         ▼                                    │
                  ┌──────────────┐                            │
                  │  Provider    │                            │
                  │   Factory    │◄───────────────────────────┘
                  └──────────────┘      used in tests
```

---

## Configuration Data Flow

```
User Modifies Settings in Obsidian
         │
         ▼
   PluginSettings
   (Obsidian Encrypted Storage)
         │
         │ bound as
         ▼
   APP_SETTINGS Token
         │
         │ injected into
         ▼
   AI Providers, Services, Facades
         │
         │ accessed by
         ▼
   Plugin Components
   (Commands, Editor, etc.)
```

---

## Dependency Resolution Flow

```
1. Container.get(OpenAIProvider)
         │
         ▼
2. Check if singleton instance exists
         │
         ├─ Yes: Return cached instance
         │
         └─ No: Resolve dependencies
                  │
                  ▼
3. Inject APP_SETTINGS token
         │
         ▼
4. Call OpenAIProvider constructor
         │
         ▼
5. Cache instance (singleton)
         │
         ▼
6. Return OpenAIProvider instance
```

---

## Lifecycle States

### Container Lifecycle

```
UNINITIALIZED
     │
     │ setupContainer()
     ▼
CONFIGURED
     │
     │ registerProviders()
     ▼
READY
     │
     │ plugin.onunload()
     ▼
DISPOSED
```

### Provider Lifecycle

```
REGISTERED
(Class registered in container)
     │
     │ First container.get(Provider)
     ▼
INSTANTIATING
(Constructor called, dependencies injected)
     │
     │ Constructor completes
     ▼
ACTIVE
(Instance cached, ready for use)
     │
     │ container.dispose() or plugin.onunload()
     ▼
DISPOSED
(Cleanup, references cleared)
```

---

## Validation Rules

### Configuration Tokens
1. Token name MUST match TypeScript constant naming (UPPER_SNAKE_CASE)
2. Token type MUST be an interface or class (no primitive types directly)
3. Token MUST be bound before any service using it is resolved
4. Token bindings MUST be type-compatible with their declared type

### Injectable Services
1. Service MUST have `@injectable()` decorator
2. Constructor dependencies MUST use `inject(Token)` pattern
3. Service MUST NOT have circular dependencies
4. Service MUST implement declared interfaces

### AI Providers
1. Provider MUST implement `Vendor` interface
2. Provider MUST extend `BaseVendorOptions` or equivalent
3. Provider MUST inject `APP_SETTINGS` token
4. Provider name MUST be unique across all providers
5. Provider MUST be registered in `ProviderFactory`

### Facades
1. Facade MUST implement original interface exactly
2. Facade MUST use `@injectable()` decorator
3. Facade MUST inject only DI-managed dependencies
4. Facade MUST delegate all methods without transformation

---

## Testing Data Patterns

### Mock Settings
```typescript
const mockSettings: PluginSettings = {
  providers: {
    openai: {
      apiKey: 'test-key',
      baseURL: 'https://api.openai.com/v1',
      model: 'gpt-3.5-turbo',
      parameters: {}
    }
  },
  tags: { user: '#User:', assistant: '#Claude:' },
  enableStatusBar: true
};
```

### Test Container Setup
```typescript
const testContainer = new Container();
testContainer.bind({
  provide: APP_SETTINGS,
  useValue: mockSettings
});
testContainer.bind(OpenAIProvider);

const provider = testContainer.get(OpenAIProvider);
```

### Child Container Override
```typescript
const parent = new Container();
parent.bind({ provide: 'logger', useValue: console });

const child = parent.createChild();
child.bind({ provide: 'logger', useValue: mockLogger });
// child resolves mockLogger, parent resolves console
```

---

## Performance Considerations

### Memory Footprint
- **Configuration Tokens**: Negligible (constant references)
- **Container Metadata**: ~1KB per 100 bindings
- **Singleton Instances**: Same as direct instantiation
- **Lazy Providers**: Zero cost until first use

### Resolution Time
- **First resolution**: ~1ms (create + inject + cache)
- **Subsequent resolutions**: <0.1ms (cache lookup)
- **Child container resolution**: ~0.5ms (parent check + override)

### Bundle Size Impact
- **Needle DI library**: ~2KB minified
- **DI infrastructure code**: ~5KB (tokens, container, factories)
- **Total increase**: ~7KB (~1.5% of current bundle)

---

## Provider Object-to-Class Refactoring

### Current State: Plain Object Exports

```typescript
// apps/obsidian-plugin/src/providers/openAI.ts (BEFORE)
export const openAIVendor: Vendor = {
  name: 'OpenAI',
  defaultOptions: {
    apiKey: '',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4',
    parameters: {}
  },
  sendRequestFunc: (options) => async function* (messages, controller, resolveEmbedAsBinary) {
    // 50+ lines of implementation
    const client = new OpenAI({ apiKey: options.apiKey, baseURL: options.baseURL });
    // ... streaming logic
  },
  models: [],
  websiteToObtainKey: 'https://platform.openai.com/api-keys',
  capabilities: ['Text Generation', 'Image Vision']
};
```

**Problems with Object Export**:
- ❌ No constructor injection - can't inject APP_SETTINGS
- ❌ Can't use `@injectable()` decorator on plain objects
- ❌ Settings passed as `options` parameter, not injected
- ❌ Hard to test in isolation - must create full options object
- ❌ No lifecycle management

### Target State: Injectable Class

```typescript
// apps/obsidian-plugin/src/providers/openAI.ts (AFTER)
import { injectable, inject } from '@needle-di/core';
import { APP_SETTINGS } from '../di/tokens';

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
      return async function* (messages, controller, resolveEmbedAsBinary) {
        // Same 50+ lines of implementation, now as method
        const client = new OpenAI({ apiKey: options.apiKey, baseURL: options.baseURL });
        // ... streaming logic
      };
    };
  }

  get models(): string[] {
    return [];
  }

  get websiteToObtainKey(): string {
    return 'https://platform.openai.com/api-keys';
  }

  get capabilities(): Capability[] {
    return ['Text Generation', 'Image Vision'];
  }
}
```

**Benefits of Class-Based Providers**:
- ✅ Constructor injection of APP_SETTINGS token
- ✅ Compatible with `@injectable()` decorator
- ✅ Settings accessed from injected dependency, not parameters
- ✅ Easy to test - mock APP_SETTINGS in test container
- ✅ DI container manages lifecycle
- ✅ Cleaner separation - configuration vs. behavior

**Refactoring Scope**: 15 providers × ~130 lines each = ~2000 LOC

---

## Application & Settings Access Pattern

### Current Pattern: Direct Passing

```typescript
// In TarsPlugin.onload()
this.addCommand(selectMsgAtCursorCmd(this.app, this.settings));
this.addCommand(userTagCmd(tagCmdMeta, this.app, this.settings));
new StatusBarManager(this.app, statusBarItem);
new TagEditorSuggest(this.app, this.settings, tagLowerCaseMap, statusBarManager, requestController);
```

**Problems**:
- ❌ `this.app` and `this.settings` passed through multiple layers
- ❌ Tight coupling to TarsPlugin instance
- ❌ Hard to test - requires mocking entire plugin
- ❌ Can't swap implementations easily

### Target Pattern: DI Token Injection

```typescript
// Define tokens
export const OBSIDIAN_APP = new InjectionToken<App>('OBSIDIAN_APP');
export const APP_SETTINGS = new InjectionToken<PluginSettings>('APP_SETTINGS');

// Bind in container (TarsPlugin.onload)
this.container.bind({ provide: OBSIDIAN_APP, useValue: this.app });
this.container.bind({ provide: APP_SETTINGS, useValue: this.settings });

// Services inject what they need
@injectable()
export class StatusBarManager {
  constructor(
    private app = inject(OBSIDIAN_APP),
    private statusBarItem: HTMLElement
  ) {}

  updateStatus(text: string) {
    this.statusBarItem.setText(text);
  }
}

@injectable()
export class TagEditorSuggest extends EditorSuggest<TagEntry> {
  constructor(
    private app = inject(OBSIDIAN_APP),
    private settings = inject(APP_SETTINGS),
    private tagLowerCaseMap: Map<string, Omit<TagEntry, 'replacement'>>,
    private statusBarManager = inject(StatusBarManager),
    private requestController = inject(RequestController)
  ) {
    super(app); // Pass to Obsidian's EditorSuggest base class
  }
}

// In TarsPlugin.onload() - resolve from container
const statusBarManager = this.container.get(StatusBarManager);
const tagEditorSuggest = this.container.get(TagEditorSuggest);
```

**Benefits**:
- ✅ No more passing `app` and `settings` through layers
- ✅ Decoupled from TarsPlugin - services only know their dependencies
- ✅ Easy to test - mock OBSIDIAN_APP and APP_SETTINGS in test container
- ✅ Type-safe dependency declaration
- ✅ Clear dependency graph

---

## Migration States

Entities exist in one of three migration states:

1. **Legacy** (Plain Object Exports)
   - Current state before migration
   - Plain object exports with no DI
   - Example: `export const openAIVendor: Vendor = { ... }`

2. **Hybrid** (Coexistence)
   - During migration, supports both patterns
   - Classes with DI decorators, but plugin may still use direct instantiation
   - Example: `@injectable() export class OpenAIProvider implements Vendor { ... }`
   - Facade pattern enables: `new ProviderFacade()` delegates to `container.get(OpenAIProvider)`

3. **DI-Native** (Full Migration)
   - After migration completes
   - Only resolved through DI container
   - Example: `const provider = container.get(OpenAIProvider)`
   - All `this.app` and `this.settings` replaced with injected tokens

---

## Summary

**Core Entities**: 7 (Container, Token, Service, Provider, Factory, Facade, Child Container)
**Relationships**: 15 primary associations
**Lifecycles**: 3 distinct patterns (Singleton, Lazy, Scoped)
**Validation Rules**: 16 constraints ensuring correctness
**Performance Impact**: Minimal (<0.1ms resolution overhead, ~7KB bundle increase)

This data model establishes the foundation for Phase 2 (tasks generation) and implementation phases.
