# Dependency Injection Migration Design
**Date:** 2025-10-30
**Feature:** Migration to Needle DI for Tars Obsidian Plugin
**Approach:** Centralized Container with Facade Pattern

## Overview

This document outlines the migration of the Tars Obsidian plugin from direct instantiation to dependency injection using Needle DI. The migration focuses on code organization, zero breaking changes, gradual migration capability, and Obsidian compatibility while achieving reduced coupling, easier testing, simplified configuration, and better extensibility.

## Current Architecture

### Existing Structure
- **Main Plugin:** `TarsPlugin` class with direct instantiation
- **AI Providers:** Individual vendor classes in `src/providers/`
- **Settings:** Direct property access on plugin settings object
- **Commands:** Direct function calls with inline provider selection
- **Configuration:** JSON settings stored in Obsidian's encrypted storage

### Pain Points
- Tight coupling between providers and settings
- Difficulty mocking for unit tests
- Configuration scattered across multiple locations
- Adding new providers requires code changes in multiple places

## Target Architecture

### Centralized DI Container

**Core Components:**
```typescript
// Main container in TarsPlugin
class TarsPlugin extends Plugin {
  private container: Container;

  async onload() {
    this.container = new Container();
    this.setupContainer();
    // ... rest of initialization
  }
}
```

**Service Categories:**
1. **Core Services:** Settings, StatusBarManager, CommandManager, EditorService
2. **AI Providers:** All vendor implementations (OpenAI, Claude, DeepSeek, etc.)
3. **Configuration:** API configurations, model mappings, capability definitions
4. **Utilities:** File resolvers, attachment handlers, embed processors

### Configuration Tokens

**Token Definitions:**
```typescript
export const APP_SETTINGS = new InjectionToken<AppSettings>('APP_SETTINGS');
export const PROVIDER_CONFIGS = new InjectionToken<ProviderConfig[]>('PROVIDER_CONFIGS');
export const MODEL_REGISTRY = new InjectionToken<ModelRegistry>('MODEL_REGISTRY');
export const COMMAND_REGISTRY = new InjectionToken<CommandRegistry>('COMMAND_REGISTRY');
```

**Configuration Binding:**
```typescript
// Container setup during plugin load
container.bind({ provide: APP_SETTINGS, useValue: loadedSettings });
container.bind({ provide: MODEL_REGISTRY, useValue: modelRegistry });
container.bind(OpenAIProvider);
container.bind(ClaudeProvider);
container.bind(DeepSeekProvider);
// ... other providers
```

### Facade Pattern for Backward Compatibility

**Settings Facade:**
```typescript
export class PluginSettingsFacade implements PluginSettings {
  constructor(private settings = inject(APP_SETTINGS)) {}

  get apiKey(): string { return this.settings.apiKey; }
  set apiKey(value: string) {
    this.settings.apiKey = value;
    this.updateContainer();
  }
  // ... other properties with delegation
}
```

**Provider Facade:**
```typescript
export class VendorFacade implements Vendor {
  constructor(private provider = inject(OpenAIProvider)) {}

  get name(): string { return this.provider.name; }
  get sendRequestFunc(): SendRequest { return this.provider.sendRequestFunc; }
  // ... other vendor interface methods
}
```

## Service Lifecycle Management

### Lifetime Strategies
- **Singleton:** Settings, StatusBarManager, ModelRegistry (persist for plugin lifetime)
- **Transient:** AI providers (new instance per request for isolation)
- **Scoped:** Conversation contexts, request controllers (per-request lifecycle)

### Container Hierarchy
```typescript
// Production container
const rootContainer = new Container();
rootContainer.bind(APP_SETTINGS);

// Testing container with overrides
const testContainer = rootContainer.createChild();
testContainer.bind({
  provide: APP_SETTINGS,
  useValue: mockSettings
});
```

## Migration Strategy

### Phase 1: AI Provider Migration
1. Add Needle DI to `apps/obsidian-plugin/package.json`
2. Create provider interfaces with `@injectable()` decorators
3. Register providers in container while maintaining existing instantiation
4. Add facades to maintain existing APIs

### Phase 2: Core Services Migration
1. Convert `StatusBarManager`, `CommandManager`, `EditorService` to injectable services
2. Update `TarsPlugin` to resolve dependencies from container
3. Maintain existing public APIs through facades

### Phase 3: Configuration Management
1. Create configuration tokens for all settings
2. Update settings loading to populate container bindings
3. Implement dynamic binding updates when settings change

### Phase 4: Complete Integration
1. Remove all direct instantiation code
2. Update all components to use container-resolved dependencies
3. Optimize container configuration and performance

## Integration Points

### Obsidian Plugin Lifecycle
```typescript
export default class TarsPlugin extends Plugin {
  private container: Container;
  settings!: PluginSettings; // Maintained for compatibility

  async onload() {
    await this.setupContainer();
    await this.loadSettings();
    this.registerCommands();
    this.setupStatusBar();
  }

  private async setupContainer() {
    this.container = new Container();
    this.registerCoreServices();
    this.registerAIProviders();
    this.registerConfiguration();
  }
}
```

### Settings Management
- Existing `PluginSettings` interface maintained
- Settings updates trigger container binding refreshes
- Backward compatibility with existing Obsidian settings API
- Configuration validation through DI tokens

### Command and Provider Registration
- Dynamic tag commands built from container-resolved providers
- Provider capabilities queried through DI to enable/disable features
- Template system uses container to access provider configurations

## Testing Strategy

### Unit Testing with DI
```typescript
describe('OpenAI Provider', () => {
  it('should handle requests correctly', () => {
    const container = new Container();
    container.bind({
      provide: APP_SETTINGS,
      useValue: mockSettings
    });
    container.bind(OpenAIProvider);

    const provider = container.get(OpenAIProvider);
    // Test with mocked dependencies
  });
});
```

### Integration Testing
- Child containers with test-specific bindings
- Mock providers for testing plugin logic without API calls
- Configuration testing with various settings combinations

## Error Handling and Resilience

### Container-Level Error Handling
```typescript
container.bind({
  provide: OpenAIProvider,
  useFactory: () => {
    try {
      return new OpenAIProvider(inject(APP_SETTINGS));
    } catch (error) {
      console.warn('OpenAI provider failed to initialize:', error);
      return new FallbackProvider();
    }
  }
});
```

### Graceful Degradation
- Fallback providers when primary services unavailable
- Default configurations for missing settings
- Error boundaries for provider-specific failures

## Performance Considerations

### Lazy Loading
- AI providers registered but instantiated only when needed
- Configuration tokens resolved on first access
- Scoped containers for memory-efficient request handling

### Bundle Size Impact
- Needle DI is small (~2KB minified)
- Tree-shaking removes unused DI features
- No significant impact on plugin load time

## Benefits Achieved

### Reduced Coupling
- Providers depend on configuration tokens, not concrete settings
- Services communicate through interfaces, not direct references
- Easy to substitute implementations for testing or new features

### Easier Testing
- All dependencies can be mocked through container bindings
- Isolated testing of individual components
- Integration testing with realistic dependency graphs

### Simplified Configuration
- Centralized token-based configuration
- Type-safe configuration access through injection
- Dynamic updates without restart

### Better Extensibility
- New providers registered through container
- Configuration tokens for new features
- Plugin architecture supports future enhancements

## Success Metrics

### Quantitative
- Reduce unit test setup time by 50%
- Decrease code duplication in provider initialization by 70%
- Enable 100% test coverage for provider logic

### Qualitative
- New provider addition requires < 50 lines of code
- Configuration changes work without plugin restart
- Clear separation of concerns across all components

## Conclusion

The centralized container approach with facade pattern provides the ideal balance of modern dependency injection benefits while maintaining zero breaking changes. The gradual migration path allows the team to adopt DI incrementally, ensuring stability and continuous delivery of features.

This design positions the Tars plugin for future growth while addressing current architectural pain points around coupling, testing, and configuration management.