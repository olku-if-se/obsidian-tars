# Research: Needle DI Migration Architecture

**Date**: 2025-11-02
**Feature**: Needle DI Migration
**Status**: Complete

## Executive Summary

This research document provides the architectural foundation for migrating the Tars Obsidian plugin from direct instantiation to Needle DI dependency injection. The migration will transform the plugin's main.ts file from a manually managed dependency graph to a centralized DI container with facades for zero breaking changes.

## Key Findings

### 1. Current Plugin Architecture Analysis

**Current State (main.ts)**:
- Manual instantiation of StatusBarManager (line 46)
- Direct settings passing throughout command functions
- Tight coupling between plugin class and service dependencies
- No dependency injection or inversion of control

**Migration Target**:
- Centralized DI container initialized in plugin onload()
- All services (StatusBarManager, settings, etc.) injected via constructor
- Facade pattern to maintain existing API compatibility
- Lazy loading for performance optimization

### 2. Needle DI Integration Patterns

**Container Integration**:
```typescript
// Initialize DI container first in plugin onload()
private container!: Container
private diContainer!: IDIContainer

async onload() {
  await this.loadSettings()
  this.initializeDIContainer()  // NEW
  this.setupServicesViaDI()     // NEW
  // Continue with existing initialization
}
```

**Configuration Token Binding**:
- Type-safe tokens for OBSIDIAN_APP, APP_SETTINGS
- Settings validation before provider resolution
- Change notification system for live configuration updates

**Provider Registration**:
- Lazy singleton registration for AI providers
- Factory patterns for complex initialization
- Metadata-driven provider discovery

### 3. Facade Pattern Implementation

**Settings Facade**:
- Maintains existing PluginSettings interface
- Delegates to DI-managed settings instance
- Preserves all existing property access patterns

**Service Facades**:
- StatusBarManagerFacade for backward compatibility
- ProviderFactoryFacade for existing vendor access patterns
- Command facades to maintain existing command signatures

### 4. Performance Optimization

**Initialization Timing**:
- DI container setup measured via runtime logging (SC-004)
- Lazy loading for non-essential providers
- Timeout protection (5s default) with fallback to essential services
- Parallel registration of providers where possible

**Memory Management**:
- Singleton lifecycle for core services
- Child containers for test isolation
- Performance monitoring with memory footprint tracking

### 5. Testing Strategy

**Unit Testing**:
- Child containers per test for isolation
- Mock settings injection without plugin instantiation
- Provider testing with <5 lines of setup code (SC-001)

**Integration Testing**:
- Full plugin testing with real DI container
- Configuration change propagation testing
- Performance regression testing

---

## 1. DI Framework Selection

### Decision: Needle DI (@needle-di/core v1.1.0+)

**Rationale**:
- **Reflection-free**: Uses stage-3 decorators, no `emitDecoratorMetadata` required
- **Lightweight**: ~2KB minified, minimal bundle size impact
- **Modern**: Leverages native TypeScript decorators (ES2022+)
- **Monorepo-friendly**: Works seamlessly with tsup/esbuild in pnpm workspaces
- **Type-safe**: Full TypeScript support with injection tokens
- **Feature-complete**: Supports all required patterns (singleton, transient, scoped, lazy, async, child containers)

**Alternatives Considered**:
1. **TSyringe**
   - ❌ Requires `reflect-metadata` (reflection-based)
   - ❌ Larger bundle size (~15KB + reflect-metadata ~50KB)
   - ❌ Legacy `experimentalDecorators` mode

2. **InversifyJS**
   - ❌ Even larger footprint (~30KB)
   - ❌ More complex API with GUID-based keys
   - ❌ Reflection-based approach

3. **Manual Factory Pattern (No DI)**
   - ❌ Doesn't solve testability issues
   - ❌ Still requires manual dependency wiring
   - ❌ No standardized patterns for configuration injection

**Why Needle DI Won**: Perfect balance of modern TypeScript support, minimal bundle impact, and full feature set for our requirements. No reflection overhead, works with existing build tooling without configuration changes.

---

## 2. DI Architecture Pattern

### Decision: Centralized Container with Facade Pattern

**Rationale**:
- **Single source of truth**: One container in `TarsPlugin` manages all dependencies
- **Zero breaking changes**: Facades maintain existing APIs while delegating to DI-managed instances
- **Gradual migration**: DI and direct instantiation can coexist during transition
- **Testability**: Child containers enable isolated testing with mocked dependencies
- **Performance**: Lazy instantiation ensures providers only created when needed

**Architecture Overview**:
```
TarsPlugin (Obsidian Plugin)
└── DIContainer (Centralized)
    ├── Configuration Tokens
    │   ├── APP_SETTINGS
    │   ├── MODEL_REGISTRY
    │   ├── COMMAND_REGISTRY
    │   └── PROVIDER_CONFIGS
    ├── Core Services
    │   ├── PluginSettingsFacade
    │   ├── StatusBarManager (future)
    │   └── CommandManager (future)
    ├── AI Providers (Injectable)
    │   ├── OpenAIProvider
    │   ├── ClaudeProvider
    │   ├── DeepSeekProvider
    │   ├── GeminiProvider
    │   └── [Other Providers]
    └── Factories
        └── ProviderFactory
```

**Alternatives Considered**:
1. **Decentralized Container Per Domain**
   - ❌ Increases complexity - multiple containers to coordinate
   - ❌ Harder to share configuration across domains
   - ❌ No clear ownership of cross-cutting concerns

2. **Service Locator Pattern**
   - ❌ Runtime errors instead of compile-time errors
   - ❌ Hidden dependencies - unclear what a class needs
   - ❌ Harder to test - requires global state

3. **Constructor Injection Without Container**
   - ❌ Wiring complexity explodes in plugin initialization
   - ❌ No standardized lifecycle management
   - ❌ Configuration changes require manual rewiring

**Why Centralized Container Won**: Single container simplifies initialization, provides clear dependency graph, enables easy testing with child containers, and maintains backward compatibility through facades.

---

## 3. Configuration Token Strategy

### Decision: Type-Safe Injection Tokens with Interface Guards

**Pattern**:
```typescript
// Define token with interface type
export interface ModelRegistry {
  getModels(vendor: string): string[];
  hasCapability(vendor: string, capability: string): boolean;
}

export const MODEL_REGISTRY = new InjectionToken<ModelRegistry>('MODEL_REGISTRY');

// Bind value with type safety
container.bind({
  provide: MODEL_REGISTRY,
  useValue: modelRegistryInstance // TypeScript enforces ModelRegistry interface
});

// Inject with full type information
@injectable()
class Provider {
  constructor(private registry = inject(MODEL_REGISTRY)) {
    // this.registry is typed as ModelRegistry
  }
}
```

**Rationale**:
- **Type safety**: TypeScript catches configuration mismatches at compile time
- **Documentation**: Token interfaces serve as contracts for configuration shape
- **Refactoring**: IDE can find all usages of a token across the codebase
- **Clarity**: Token names match their purpose (APP_SETTINGS, MODEL_REGISTRY)

**Alternatives Considered**:
1. **String-Based Keys**
   - ❌ No compile-time type checking
   - ❌ Typos cause runtime errors
   - ❌ Hard to refactor - string literals everywhere

2. **Class-Based Tokens Only**
   - ❌ Requires creating classes for simple configuration objects
   - ❌ Overkill for primitive values or plain data
   - ❌ Doesn't work well for external configuration (Obsidian settings)

**Why Injection Tokens Won**: Perfect balance - type safety of classes with flexibility of configuration objects. Works seamlessly with Obsidian's settings API.

---

## 4. Provider Migration Strategy

### Decision: Decorator-Based Injectable Providers with Constructor Injection

**Pattern**:
```typescript
// Base class provides injection support
@injectable()
export abstract class BaseVendorOptions {
  constructor(protected settings = inject(APP_SETTINGS)) {}

  abstract get apiKey(): string;
  abstract get baseURL(): string;
  abstract get model(): string;
  abstract get parameters(): Record<string, unknown>;
}

// Providers extend base and add vendor-specific logic
@VendorProvider('OpenAI')
@injectable()
export class OpenAIProvider extends BaseVendorOptions {
  get apiKey(): string {
    return this.settings.providers?.openai?.apiKey || '';
  }

  get models(): string[] {
    return ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  }

  // ... rest of provider implementation
}
```

**Rationale**:
- **Minimal changes**: Existing provider logic unchanged, just add decorators
- **Backward compatible**: Providers still implement `Vendor` interface
- **Testable**: Settings injected, easy to mock in tests
- **Consistent**: All providers follow same pattern

**Migration Phases**:
1. **Phase 1**: OpenAI and Claude (validation of pattern)
2. **Phase 2**: Remaining providers (DeepSeek, Gemini, etc.)
3. **Phase 3**: Remove direct instantiation, full DI

**Alternatives Considered**:
1. **Factory Functions Instead of Classes**
   - ❌ Loses instanceof checks
   - ❌ No inheritance for shared logic
   - ❌ Harder to add lifecycle methods

2. **Property Injection**
   - ❌ Mutable dependencies
   - ❌ Unclear when dependencies are ready
   - ❌ Harder to enforce required dependencies

3. **Manual Wiring in Plugin**
   - ❌ Doesn't solve testing problems
   - ❌ Increases coupling in main plugin
   - ❌ No standardized pattern

**Why Decorator Pattern Won**: Minimal code changes, maximum compatibility, clear dependency declaration, excellent testability.

---

## 5. Backward Compatibility Approach

### Decision: Facade Pattern with Delegation

**Pattern**:
```typescript
// Facade maintains existing interface
@injectable()
export class PluginSettingsFacade implements PluginSettings {
  constructor(private settings = inject(APP_SETTINGS)) {}

  // Delegate all property access
  get providers() { return this.settings.providers; }
  get tags() { return this.settings.tags; }
  get enableStatusBar() { return this.settings.enableStatusBar; }

  // Existing code continues to work:
  // const key = plugin.settings.providers.openai.apiKey
}
```

**Rationale**:
- **Zero breaking changes**: Existing code paths unchanged
- **Gradual adoption**: New code can use DI, old code uses facade
- **Type compatibility**: Facade implements original interface exactly
- **Performance**: Delegation is negligible overhead (property getters)

**Implementation Strategy**:
1. Settings facade first (highest impact)
2. Provider access through factory (gradual)
3. Core services as needed (optional)

**Alternatives Considered**:
1. **Proxy Pattern**
   - ❌ More complex implementation
   - ❌ Runtime overhead for property interception
   - ❌ Harder to debug (proxies hide behavior)

2. **Adapter Pattern**
   - ❌ Requires transformation logic
   - ❌ Creates data copying overhead
   - ❌ Unnecessary when interfaces match

3. **Breaking Changes with Migration Guide**
   - ❌ Violates requirements (zero breaking changes)
   - ❌ User friction during updates
   - ❌ Risk of adoption resistance

**Why Facade Pattern Won**: Simplest pattern for backward compatibility, zero user impact, enables gradual internal migration, perfect for maintaining existing API surface.

---

## 6. Lifecycle Management

### Decision: Singleton Services, Lazy Providers, Scoped Containers for Tests

**Strategy**:
- **Singleton**: Settings, registries, core services (one instance per plugin lifecycle)
- **Lazy**: AI providers (registered but not instantiated until first use)
- **Scoped**: Test containers (child containers with mocked dependencies)

**Pattern**:
```typescript
// Singleton (default in Needle DI)
container.bind(APP_SETTINGS); // One instance

// Lazy provider (not created until first get)
container.bind(OpenAIProvider); // Registration only, no instantiation

// Scoped testing
const testContainer = container.createChild();
testContainer.bind({
  provide: APP_SETTINGS,
  useValue: mockSettings // Override for testing
});
```

**Rationale**:
- **Performance**: Lazy loading prevents unnecessary provider instantiation
- **Memory**: Singletons ensure shared state doesn't duplicate
- **Testing**: Child containers isolate tests without affecting parent

**Alternatives Considered**:
1. **Transient Everything**
   - ❌ Wastes memory creating duplicate instances
   - ❌ Loses shared state for registries
   - ❌ No performance benefit

2. **Manual Lifecycle Management**
   - ❌ Error-prone (forgot to call cleanup)
   - ❌ No standardized patterns
   - ❌ Harder to test (state leaks between tests)

**Why Chosen Strategy Won**: Balances performance (lazy, singleton) with flexibility (scoped for testing). Follows DI best practices.

---

## 7. TypeScript & Build Configuration

### Decision: ES2022 Target with Stage-3 Decorators

**Configuration**:
```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",              // Native decorator support
    "module": "ESNext",              // Modern modules
    "moduleResolution": "Bundler",   // For monorepo resolution
    "experimentalDecorators": false, // Use stage-3, not legacy
    "emitDecoratorMetadata": false,  // No reflection
    "strict": true                   // Maintain strict mode
  }
}

// esbuild.config.mjs
export default {
  target: 'es2022',  // Ensure decorator emission
  format: 'iife',    // Obsidian plugin format
  // ... rest of config
}
```

**Rationale**:
- **Modern**: Stage-3 decorators are the future, legacy decorators are deprecated
- **No reflection**: Smaller bundle, faster runtime, no metadata overhead
- **Compatible**: tsup/esbuild support ES2022 decorator emission
- **Maintainable**: No need for `reflect-metadata` dependency

**Alternatives Considered**:
1. **Legacy Decorators (experimentalDecorators: true)**
   - ❌ Deprecated by TypeScript team
   - ❌ Requires reflect-metadata (bundle bloat)
   - ❌ Not the future of TypeScript

2. **ES5/ES2015 Target**
   - ❌ Doesn't support modern decorators
   - ❌ Larger bundle from transpilation
   - ❌ Obsidian supports ES2022 (modern browsers)

**Why ES2022 Won**: Modern, future-proof, smallest bundle, best tooling support. Aligns with Obsidian's modern browser requirements.

---

## 8. Testing Strategy

### Decision: TDD with Child Containers and Mock Bindings

**Pattern**:
```typescript
describe('OpenAI Provider', () => {
  let container: Container;
  let mockSettings: PluginSettings;

  beforeEach(() => {
    // GIVEN: A test container with mock settings
    mockSettings = {
      providers: {
        openai: {
          apiKey: 'test-key',
          baseURL: 'https://api.openai.com/v1',
          model: 'gpt-3.5-turbo',
          parameters: {}
        }
      }
    };

    container = new Container();
    container.bind({
      provide: APP_SETTINGS,
      useValue: mockSettings
    });
    container.bind(OpenAIProvider);
  });

  it('should receive settings via injection', () => {
    // WHEN: Provider is resolved from container
    const provider = container.get(OpenAIProvider);

    // THEN: Provider has access to mock settings
    expect(provider.apiKey).toBe('test-key');
    expect(provider.model).toBe('gpt-3.5-turbo');
  });
});
```

**Rationale**:
- **Isolation**: Each test creates its own container with specific mocks
- **Speed**: No file I/O, no real API calls, no Obsidian instance
- **Coverage**: Can test all edge cases (missing settings, invalid configs, etc.)
- **TDD-friendly**: Write test first, see it fail, implement, see it pass

**Test Coverage Goals**:
- **85%+ code coverage**: Mandatory per constitution
- **100% provider contract tests**: Every injectable provider tested
- **Given/When/Then comments**: All unit tests document business value

**Alternatives Considered**:
1. **Integration Tests Only**
   - ❌ Slow (requires Obsidian instance)
   - ❌ Flaky (network, file system dependencies)
   - ❌ Can't test edge cases easily

2. **Manual Mocking Without DI**
   - ❌ Brittle (breaks when constructor changes)
   - ❌ Verbose (manual mock wiring)
   - ❌ Doesn't validate DI configuration

**Why Child Containers Won**: Perfect balance - fast, isolated, realistic. Tests verify both business logic AND DI configuration correctness.

---

## 9. Error Handling Strategy

### Decision: Fail-Fast with Settings Validation

**Pattern**:
```typescript
// Settings validation BEFORE DI resolution
export function validateProviderSettings(settings: PluginSettings): ValidationResult {
  const errors: string[] = [];

  for (const [vendor, config] of Object.entries(settings.providers)) {
    if (!config.enabled) continue;

    if (!config.apiKey?.trim()) {
      errors.push(`${vendor}: API key is required`);
    }
    if (!config.model?.trim()) {
      errors.push(`${vendor}: Model must be selected`);
    }
    if (!config.baseURL?.trim()) {
      errors.push(`${vendor}: Base URL is required`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    timestamp: Date.now()
  };
}

// In settings tab: validate BEFORE saving
const validation = validateProviderSettings(newSettings);
if (!validation.valid) {
  new Notice('Configuration errors:\n' + validation.errors.join('\n'));
  return; // Don't save invalid settings
}

// Provider registration - no try/catch, let it fail!
container.bind(OpenAIProvider); // Fails fast if settings invalid

// Resolution with clear error context
try {
  const provider = container.get(OpenAIProvider);
} catch (error) {
  // Show clear, actionable error to user
  new Notice('OpenAI provider failed: ' + error.message + '\nCheck your settings.');
  console.error('Provider initialization failed:', error);
  throw error; // Don't hide the problem
}
```

**Rationale**:
- **Clear Error Signals**: User knows immediately something is wrong
- **No Silent Degradation**: Missing API key = error, not silent failure
- **Obsidian UX**: Users expect clear error messages, not mysterious "provider not available"
- **Debugging**: Stack traces help developers fix issues faster
- **Settings Validation**: Force users to fix config before proceeding
- **Fail-Fast Philosophy**: Errors should be loud and obvious, not hidden

**Alternatives Considered**:
1. **Graceful Degradation (Original Plan)**
   - ❌ Hides real problems from users
   - ❌ Silent failures are confusing
   - ❌ Harder to debug (no clear error signals)
   - ❌ Users don't know why provider is "missing"

2. **Silent Failures**
   - ❌ Worst option - no indication of problem
   - ❌ User confused why provider missing
   - ❌ Violates principle of least surprise

**Why Fail-Fast Won**: Best for Obsidian plugin UX, clear error messages, forces configuration fixes, easier debugging, aligns with "errors should be obvious" philosophy.

---

## 10. Performance Validation

### Decision: Baseline Measurement + Automated Performance Tests

**Metrics**:
1. **Plugin initialization**: Measure with/without DI (target: ≤50ms increase)
2. **Provider resolution**: First access timing (target: <1ms)
3. **Memory footprint**: Compare heap usage (target: ≤10% increase)
4. **Bundle size**: Measure final main.js (target: ~2KB increase)

**Validation Script**:
```typescript
// Performance test
it('should initialize DI container within acceptable time', async () => {
  const startTime = performance.now();
  const plugin = new TarsPlugin(mockApp, mockManifest);
  await plugin.onload();
  const endTime = performance.now();

  const initTime = endTime - startTime;
  expect(initTime).toBeLessThan(1000); // 1 second max
});
```

**Alternatives Considered**:
1. **Manual Testing Only**
   - ❌ Not repeatable
   - ❌ No CI integration
   - ❌ Easy to miss regressions

2. **Production Profiling**
   - ❌ Too late (users already affected)
   - ❌ Hard to isolate DI impact
   - ❌ No proactive prevention

**Why Automated Tests Won**: Continuous validation, regression prevention, CI integration, clear pass/fail criteria.

---

## 11. Major Refactoring Goals: Application & Settings Access

### Decision: Inject Obsidian App and Settings via DI Tokens

**Current Pattern (Direct Passing)**:
```typescript
// In TarsPlugin main.ts - app and settings passed everywhere
this.addCommand(selectMsgAtCursorCmd(this.app, this.settings));
this.addCommand(userTagCmd(tagCmdMeta, this.app, this.settings));
new StatusBarManager(this.app, statusBarItem);
new TagEditorSuggest(this.app, this.settings, tagLowerCaseMap, ...);
```

**DI Pattern (Inject Tokens)**:
```typescript
// Define tokens for Obsidian App and Settings
export const OBSIDIAN_APP = new InjectionToken<App>('OBSIDIAN_APP');
export const APP_SETTINGS = new InjectionToken<PluginSettings>('APP_SETTINGS');

// Bind in container
container.bind({ provide: OBSIDIAN_APP, useValue: this.app });
container.bind({ provide: APP_SETTINGS, useValue: this.settings });

// Services inject what they need
@injectable()
export class StatusBarManager {
  constructor(
    private app = inject(OBSIDIAN_APP),
    private statusBarItem: HTMLElement
  ) {}
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
    super(app);
  }
}
```

**Refactoring Scope**:

1. **Providers (15 files)** - Convert from plain objects to classes
   - Current: `export const openAIVendor: Vendor = { ... }`
   - Target: `@injectable() export class OpenAIProvider implements Vendor { ... }`
   - Estimated: ~2000 lines of code changes

2. **Services Using App**:
   - StatusBarManager (already class, add decorator)
   - TagEditorSuggest (already class, add decorator)
   - Commands (keep as functions, but use injected dependencies)

3. **Settings Access**:
   - All direct `this.settings` access replaced with `inject(APP_SETTINGS)`
   - Settings facade for backward compatibility with legacy code

**Benefits**:
- **Testability**: Mock `OBSIDIAN_APP` and `APP_SETTINGS` in tests without real Obsidian instance
- **Decoupling**: Components don't know about TarsPlugin, only their direct dependencies
- **Flexibility**: Easy to swap implementations (e.g., test settings vs. production settings)
- **Type Safety**: Injection tokens enforce types at compile time
- **Cleaner APIs**: No more passing `app` and `settings` through 5 layers of function calls

**Migration Strategy**:
1. **Phase 1**: Add DI tokens and container setup
2. **Phase 2**: Convert providers from objects to classes
3. **Phase 3**: Migrate StatusBarManager and TagEditorSuggest to inject dependencies
4. **Phase 4**: Update all callsites to use DI-resolved services instead of direct instantiation
5. **Phase 5**: Add facades for backward compatibility where needed

---

## Summary of Decisions

| Decision Area | Chosen Approach | Key Rationale |
|---------------|-----------------|---------------|
| **DI Framework** | Needle DI v1.1.0+ | Lightweight (~2KB), modern decorators, no reflection |
| **Architecture** | Centralized Container + Facades | Single source of truth, zero breaking changes |
| **Configuration** | Injection Tokens | Type-safe, compile-time checked |
| **Provider Migration** | Object → Class Conversion | Enable constructor injection, ~2000 LOC refactor |
| **App/Settings Access** | Inject via DI Tokens | Decouple from TarsPlugin, testable, type-safe |
| **Backward Compatibility** | Facade Pattern | Zero breaking changes, gradual adoption |
| **Lifecycle** | Singleton + Lazy + Scoped | Performance + flexibility |
| **Build Target** | ES2022 with Stage-3 Decorators | Modern, future-proof, smallest bundle |
| **Testing** | TDD with Child Containers | Fast, isolated, high coverage |
| **Error Handling** | Fail-Fast with Validation | Clear errors, force config fixes, debuggable |
| **Performance** | Automated Validation Tests | Continuous monitoring, regression prevention |

---

## Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| Bundle size increases too much | Needle DI is only ~2KB; validated in performance tests |
| Breaking changes for users | Facade pattern maintains 100% API compatibility |
| Performance degradation | Lazy loading + performance tests + baseline measurement |
| Difficult debugging | Fail-fast errors with clear messages + validation before DI resolution |
| Test complexity increases | Child containers simplify testing, reusable test utilities |
| Gradual migration fails | DI and direct instantiation can coexist safely |
| Build configuration issues | ES2022 already works with tsup/esbuild, no changes needed |
| **Provider class conversion scope** | **TDD approach: write tests first, refactor with confidence** |
| **App/Settings injection breaks existing code** | **Facade pattern + gradual migration + comprehensive test coverage** |
| **Settings validation complexity** | **Centralized validation function, reusable across plugin** |

---

## Next Steps

**Phase 1 (Design & Contracts)**:
1. Generate data-model.md - Document DI entities and relationships
2. Generate contracts/ - TypeScript interfaces for tokens, container, providers
3. Generate quickstart.md - Developer guide for using DI system
4. Update agent context - Add DI patterns to Claude Code memory

All unknowns resolved. Ready to proceed with Phase 1 design.
