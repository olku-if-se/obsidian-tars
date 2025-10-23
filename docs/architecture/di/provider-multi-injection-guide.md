# Provider Multi-Injection Migration Guide

## Overview

This guide explains the migration from single provider injection to multi-injection pattern for AI providers using Needle DI. This refactoring enables better modularity, testability, and capability-based provider discovery.

## Architecture Changes

### Before (Single Injection)
```typescript
// Factory pattern with manual registration
class DIProviderFactory {
  createVendor(providerName: string): Vendor {
    switch (providerName) {
      case 'Claude':
        return providerToVendor(this.container.get(ClaudeDIProvider))
      // ... manual cases for each provider
    }
  }
}
```

### After (Multi-Injection)
```typescript
// Automatic multi-injection with capability filtering
@injectable()
class ProviderRegistry implements IProviderRegistry {
  constructor(@injectAll(AIProviderToken) private allProviders: BaseProvider[]) {}

  getProvidersByCapability(capability: Capability): Vendor[] {
    return this.getAllProviders().filter(vendor =>
      vendor.capabilities.includes(capability)
    )
  }
}
```

## Key Components

### 1. Multi-Injection Tokens

```typescript
// Core multi-injection token
export const AIProviderToken = Symbol('AIProvider')

// Individual provider tokens
export const ClaudeProviderToken = Symbol('ClaudeProvider')
export const OpenAIProviderToken = Symbol('OpenAIProvider')
export const OllamaProviderToken = Symbol('OllamaProvider')

// Capability tokens for filtering
export const TextGenerationProviderToken = Symbol('TextGenerationProvider')
export const VisionProviderToken = Symbol('VisionProvider')
export const ToolCallingProviderToken = Symbol('ToolCallingProvider')
export const ReasoningProviderToken = Symbol('ReasoningProvider')
```

### 2. Enhanced Base Provider

```typescript
@injectable()
export abstract class MultiDIProvider extends DIBaseProvider {
  // Provider metadata for registry integration
  protected readonly metadata: {
    id: string
    priority: number
    enabled: boolean
  }

  // Methods for multi-injection support
  abstract getInjectionTokens(): symbol[]
  abstract getCapabilityTokens(): symbol[]
}
```

### 3. Provider Registry

```typescript
export interface IProviderRegistry {
  getAllProviders(): Vendor[]
  getProvidersByCapability(capability: Capability): Vendor[]
  getProvidersByCapabilities(capabilities: Capability[]): Vendor[]
  getProviderByName(name: string): Vendor | undefined
  // ... additional methods for provider management
}
```

## Migration Steps

### Step 1: Update Provider Classes

**Old Implementation:**
```typescript
export class ClaudeDIProvider extends DIBaseProvider {
  constructor(
    loggingService: ILoggingService,
    notificationService: INotificationService,
    settingsService: ISettingsService,
    documentService: IDocumentService
  ) {
    super(loggingService, notificationService, settingsService, documentService)
  }
}
```

**New Implementation:**
```typescript
@injectable()
export class ClaudeMultiProvider extends MultiDIProvider {
  constructor(
    loggingService: ILoggingService,
    notificationService: INotificationService,
    settingsService: ISettingsService,
    documentService: IDocumentService
  ) {
    super(loggingService, notificationService, settingsService, documentService, 'claude', 10)
  }

  getInjectionTokens(): symbol[] {
    return [AIProviderToken, ClaudeProviderToken]
  }

  getCapabilityTokens(): symbol[] {
    return [
      TextGenerationProviderToken,
      VisionProviderToken,
      ToolCallingProviderToken,
      ReasoningProviderToken
    ]
  }
}
```

### Step 2: Update DI Container Configuration

**Add to `createPluginContainer()`:**
```typescript
// Register AI providers with multi-injection support
container.bind({ provide: AIProviderToken, useClass: ClaudeMultiProvider, multi: true })
container.bind({ provide: ClaudeProviderToken, useClass: ClaudeMultiProvider })

container.bind({ provide: AIProviderToken, useClass: OpenAIMultiProvider, multi: true })
container.bind({ provide: OpenAIProviderToken, useClass: OpenAIMultiProvider })

container.bind({ provide: AIProviderToken, useClass: OllamaMultiProvider, multi: true })
container.bind({ provide: OllamaProviderToken, useClass: OllamaMultiProvider })

// Register provider registry and factory
container.bind({ provide: ProviderRegistryToken, useClass: ProviderRegistry })
container.bind({ provide: ProviderFactoryToken, useClass: MultiProviderFactory })
```

### Step 3: Update Provider Usage

**Old Pattern:**
```typescript
const factory = createDIProviderFactory(container)
const claudeVendor = factory.createVendor('Claude')
```

**New Pattern:**
```typescript
const registry = container.get(ProviderRegistryToken)
const claudeVendor = registry.getProviderByName('Claude')

// Or use capability-based selection
const textProviders = registry.getProvidersByCapability('Text Generation')
const toolCallingProviders = registry.getProvidersByCapability('Tool Calling')
```

## Usage Examples

### Basic Provider Access
```typescript
// Get all available providers
const allProviders = registry.getAllProviders()

// Get specific provider
const claude = registry.getProviderByName('Claude')

// Check availability
if (registry.isProviderAvailable('OpenAI')) {
  const openai = registry.getProviderByName('OpenAI')
}
```

### Capability-Based Selection
```typescript
// Get all providers with tool calling capability
const toolProviders = registry.getProvidersByCapability('Tool Calling')

// Get providers with multiple capabilities
const visionToolProviders = registry.getProvidersByCapabilities([
  'Image Vision',
  'Tool Calling'
])

// Get best provider for capability
const factory = container.get(ProviderFactoryToken)
const bestTextProvider = factory.getBestProviderForCapability('Text Generation')
```

### Dynamic Provider Management
```typescript
// Register new provider
registry.registerProvider(customVendor, 15)

// Enable/disable providers
registry.setProviderEnabled('Ollama', false)

// Get provider metadata
const metadata = registry.getProviderMetadata()
const claudeMeta = metadata.find(m => m.name === 'Claude')
console.log(`Claude priority: ${claudeMeta?.priority}`)
```

## Testing Strategies

### Unit Testing with Mock Registry
```typescript
import { Container } from '@needle-di/core'
import { ProviderRegistry } from '@tars/providers'

describe('Provider Usage', () => {
  let container: Container
  let mockRegistry: jest.Mocked<ProviderRegistry>

  beforeEach(() => {
    container = new Container()
    mockRegistry = {
      getProviderByName: jest.fn(),
      getProvidersByCapability: jest.fn(),
      // ... other methods
    } as any

    container.bind({ provide: ProviderRegistryToken, useValue: mockRegistry })
  })

  it('should get Claude provider', () => {
    const mockVendor = createMockVendor('Claude')
    mockRegistry.getProviderByName.mockReturnValue(mockVendor)

    const result = mockRegistry.getProviderByName('Claude')
    expect(result.name).toBe('Claude')
    expect(mockRegistry.getProviderByName).toHaveBeenCalledWith('Claude')
  })
})
```

### Integration Testing
```typescript
it('should register and discover providers correctly', () => {
  const container = createPluginContainer({ plugin: mockPlugin })
  const registry = container.get(ProviderRegistryToken)

  const allProviders = registry.getAllProviders()
  expect(allProviders.length).toBeGreaterThan(0)

  const claudeProvider = registry.getProviderByName('Claude')
  expect(claudeProvider).toBeDefined()
  expect(claudeProvider.capabilities).toContain('Tool Calling')
})
```

## Benefits of Multi-Injection

### 1. **Modularity**
- New providers can be added without modifying factory code
- Providers are self-contained with metadata
- Clear separation of concerns

### 2. **Testability**
- Easy to mock individual providers or entire registry
- Capability-based testing scenarios
- Isolated testing of provider logic

### 3. **Extensibility**
- Runtime provider registration
- Dynamic enable/disable functionality
- Priority-based provider selection

### 4. **Type Safety**
- Full TypeScript support with proper tokens
- Compile-time verification of provider interfaces
- Capability-based type filtering

### 5. **Performance**
- Lazy loading of providers
- Efficient capability filtering
- Cached provider metadata

## Backward Compatibility

The refactoring maintains backward compatibility by:

1. **Preserving existing interfaces** - `DIBaseProvider` still works
2. **Factory pattern support** - `DIProviderFactory` remains functional
3. **Gradual migration** - Providers can be migrated individually
4. **Vendor interface compatibility** - All providers still implement `Vendor`

## Best Practices

### 1. Provider Implementation
- Always extend `MultiDIProvider` for new providers
- Implement both `getInjectionTokens()` and `getCapabilityTokens()`
- Set appropriate priority levels for provider selection
- Include comprehensive validation in `validateOptions()`

### 2. Token Usage
- Use capability tokens for filtering when appropriate
- Register providers with both specific and general tokens
- Avoid over-reliance on provider-specific tokens

### 3. Error Handling
- Handle missing providers gracefully
- Provide fallback mechanisms for critical capabilities
- Log provider registration and discovery issues

### 4. Performance Considerations
- Cache provider metadata when possible
- Use lazy loading for expensive provider initialization
- Consider provider priority for selection algorithms

## Troubleshooting

### Common Issues

**1. Provider Not Found**
```typescript
// Check if provider is registered
if (!registry.isProviderAvailable('CustomProvider')) {
  console.log('Provider not found in registry')
}
```

**2. Capability Filtering Not Working**
```typescript
// Verify provider capabilities
const metadata = registry.getProviderMetadata()
const provider = metadata.find(m => m.name === 'Claude')
console.log('Claude capabilities:', provider?.capabilities)
```

**3. Injection Token Issues**
```typescript
// Ensure tokens are properly registered
container.bind({
  provide: AIProviderToken,
  useClass: ClaudeMultiProvider,
  multi: true  // Important: multi flag for injection
})
```

### Debug Tools

```typescript
// List all registered providers
console.log('All providers:', registry.getAvailableProviderNames())

// Get detailed metadata
console.log('Provider metadata:', registry.getProviderMetadata())

// Check capability coverage
const capabilities = ['Text Generation', 'Tool Calling', 'Image Vision']
capabilities.forEach(cap => {
  const providers = registry.getProvidersByCapability(cap as Capability)
  console.log(`${cap}: ${providers.length} providers`)
})
```

## Future Enhancements

1. **Provider Health Monitoring** - Automatic health checks and failover
2. **Load Balancing** - Distribute requests across multiple providers
3. **Cost Optimization** - Provider selection based on usage costs
4. **Geographic Routing** - Select providers based on user location
5. **A/B Testing** - Provider comparison and performance testing