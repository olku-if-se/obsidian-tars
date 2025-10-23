# Provider Multi-Injection Quick Reference

## Core Concepts

### Multi-Injection Tokens
```typescript
// General provider injection
@injectAll(AIProviderToken) providers: BaseProvider[]

// Specific provider injection
@Inject(ClaudeProviderToken) claude: ClaudeMultiProvider

// Capability-based injection
@Inject(ToolCallingProviderToken) toolProviders: BaseProvider[]
```

### Provider Registration
```typescript
// Multi-injection registration
container.bind({
  provide: AIProviderToken,
  useClass: ClaudeMultiProvider,
  multi: true  // Key flag for multi-injection
})

// Individual provider registration
container.bind({
  provide: ClaudeProviderToken,
  useClass: ClaudeMultiProvider
})
```

## Common Patterns

### 1. Get All Providers
```typescript
const registry = container.get(ProviderRegistryToken)
const allProviders = registry.getAllProviders()
```

### 2. Filter by Capability
```typescript
const textProviders = registry.getProvidersByCapability('Text Generation')
const toolProviders = registry.getProvidersByCapability('Tool Calling')
const visionProviders = registry.getProvidersByCapability('Image Vision')
```

### 3. Filter by Multiple Capabilities
```typescript
const advancedProviders = registry.getProvidersByCapabilities([
  'Tool Calling',
  'Reasoning'
])
```

### 4. Get Specific Provider
```typescript
const claude = registry.getProviderByName('Claude')
const openai = registry.getProviderByName('OpenAI')
```

### 5. Best Provider Selection
```typescript
const factory = container.get(ProviderFactoryToken)
const bestTextProvider = factory.getBestProviderForCapability('Text Generation')
```

### 6. Provider Availability Check
```typescript
if (registry.isProviderAvailable('Claude')) {
  const claude = registry.getProviderByName('Claude')
}
```

### 7. Provider with Fallback
```typescript
const vendor = factory.createVendorWithFallback(
  'PreferredProvider',
  'Text Generation'  // Fallback capability
)
```

### 8. Dynamic Provider Management
```typescript
// Register new provider
registry.registerProvider(customVendor, 10)

// Enable/disable provider
registry.setProviderEnabled('Ollama', false)

// Remove provider
registry.unregisterProvider('OldProvider')
```

## Provider Implementation Template

```typescript
@injectable()
export class CustomMultiProvider extends MultiDIProvider {
  readonly name = 'CustomProvider'
  readonly websiteToObtainKey = 'https://example.com/'
  readonly capabilities: Capability[] = ['Text Generation', 'Tool Calling']

  constructor(
    loggingService: ILoggingService,
    notificationService: INotificationService,
    settingsService: ISettingsService,
    documentService: IDocumentService
  ) {
    super(loggingService, notificationService, settingsService, documentService, 'custom', 5)
  }

  getInjectionTokens(): symbol[] {
    return [AIProviderToken, CustomProviderToken]
  }

  getCapabilityTokens(): symbol[] {
    return [TextGenerationProviderToken, ToolCallingProviderToken]
  }

  get defaultOptions(): DIBaseOptions {
    return {
      apiKey: '',
      baseURL: 'https://api.example.com',
      model: 'custom-model',
      parameters: {},
      // DI services inherited
    }
  }

  get models(): string[] {
    return ['custom-model', 'custom-model-v2']
  }

  createSendRequest(options: DIBaseOptions): SendRequest {
    const frameworkConfig = this.createFrameworkConfig()
    const baseOptions: BaseOptions = { ...options, frameworkConfig }
    return this.customSendRequestFunc(baseOptions)
  }
}
```

## Migration Checklist

### For New Providers
- [ ] Extend `MultiDIProvider` instead of `DIBaseProvider`
- [ ] Add `@injectable()` decorator
- [ ] Implement `getInjectionTokens()` method
- [ ] Implement `getCapabilityTokens()` method
- [ ] Register with `multi: true` flag
- [ ] Add to container configuration

### For Existing Code
- [ ] Replace factory usage with registry usage
- [ ] Update provider creation calls
- [ ] Add capability-based filtering
- [ ] Implement fallback mechanisms
- [ ] Update test cases

### Testing
- [ ] Test provider discovery
- [ ] Test capability filtering
- [ ] Test provider availability
- [ ] Test dynamic registration
- [ ] Test error handling

## Common Pitfalls

### 1. Missing `multi: true` Flag
```typescript
// ❌ Wrong - single injection
container.bind({ provide: AIProviderToken, useClass: ClaudeMultiProvider })

// ✅ Correct - multi injection
container.bind({ provide: AIProviderToken, useClass: ClaudeMultiProvider, multi: true })
```

### 2. Not Implementing Required Methods
```typescript
// ❌ Missing methods
class CustomProvider extends MultiDIProvider {
  // Missing getInjectionTokens()
  // Missing getCapabilityTokens()
}

// ✅ Complete implementation
class CustomProvider extends MultiDIProvider {
  getInjectionTokens(): symbol[] { /* ... */ }
  getCapabilityTokens(): symbol[] { /* ... */ }
}
```

### 3. Assuming Provider Exists
```typescript
// ❌ Could throw error
const provider = registry.getProviderByName('NonExistent')

// ✅ Safe access
const provider = registry.getProviderByName('NonExistent')
if (!provider) {
  throw new Error('Provider not available')
}

// ✅ Or use availability check
if (!registry.isProviderAvailable('NonExistent')) {
  throw new Error('Provider not available')
}
```

## Performance Tips

1. **Cache Registry Access**
```typescript
// Cache the registry instance
const registry = container.get(ProviderRegistryToken)
const allProviders = registry.getAllProviders() // Cache if called frequently
```

2. **Use Capability Filtering**
```typescript
// More efficient than manual filtering
const toolProviders = registry.getProvidersByCapability('Tool Calling')
```

3. **Implement Provider Priority**
```typescript
// Set appropriate priorities for selection
super(services, 'provider-id', 10) // Higher priority = preferred
```

## Debug Commands

```typescript
// List all providers
console.log('Available providers:', registry.getAvailableProviderNames())

// Check provider details
const metadata = registry.getProviderMetadata()
console.table(metadata)

// Verify capabilities
const capabilities = ['Text Generation', 'Tool Calling']
capabilities.forEach(cap => {
  const providers = registry.getProvidersByCapability(cap as Capability)
  console.log(`${cap}: ${providers.map(p => p.name).join(', ')}`)
})
```

## Emergency Procedures

### Provider Not Responding
```typescript
// Check if provider is registered and enabled
if (!registry.isProviderAvailable('Claude')) {
  // Fallback to alternative provider
  const fallback = factory.createVendorWithFallback('Claude', 'Text Generation')
}
```

### Registry Empty
```typescript
const providers = registry.getAllProviders()
if (providers.length === 0) {
  console.error('No providers registered in registry')
  // Check container configuration
}
```

### Capability Missing
```typescript
const providers = registry.getProvidersByCapability('RequiredCapability')
if (providers.length === 0) {
  console.warn('No providers support RequiredCapability')
  // Consider registering alternative providers
}
```