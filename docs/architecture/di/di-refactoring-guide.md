# Dependency Injection Refactoring Guide
**Using @needle-di/core for TypeScript Monorepo Transformation**

> **Analogy**: Think of dependency injection like a restaurant kitchen. Instead of each chef hunting for ingredients (dependencies) throughout the kitchen, all ingredients are prepared and delivered to their station (injected). This creates clear workflows, prevents chaos, and makes it easy to substitute ingredients (mock testing) or change suppliers (swap implementations).

## Quick Start Sample
```typescript
// Before: Tightly coupled legacy code
class OrderService {
  processOrder(orderId: string) {
    const db = new PostgresDatabase(); // Hard dependency
    const logger = console;            // Global state
    const emailer = new SmtpService(); // Another hard dependency
    // ... business logic
  }
}

// After: Dependency injection refactoring
@injectable()
class OrderService {
  constructor(
    private db = inject(DATABASE_TOKEN),
    private logger = inject(LOGGER_TOKEN),
    private emailer = inject(EMAIL_TOKEN)
  ) {}
  
  processOrder(orderId: string) {
    // ... same business logic, but testable and flexible
  }
}
```

## Core Transformation Rules

### Rule 1: Start with Token Creation for Abstractions
**Do this:** Create injection tokens for every interface and abstract type before refactoring classes.

```typescript
// Step 1: Define interfaces for existing functionality
interface Logger {
  log(message: string): void;
  error(message: string, error?: Error): void;
}

// Step 2: Create tokens for these interfaces
export const LOGGER_TOKEN = createToken<Logger>('Logger');
export const DATABASE_TOKEN = createToken<Database>('Database');
export const CONFIG_TOKEN = createToken<AppConfig>('Config');
```

**When you have:** Multiple implementations, external dependencies, or need abstraction boundaries  
**Prevents:** Type erasure, string collisions, runtime casting errors  
**Otherwise:** Tight coupling to concrete implementations, "No provider found" errors

### Rule 2: Apply @injectable() Decorator to Service Classes
**Do this:** Add `@injectable()` to every class that will participate in dependency injection.

```typescript
// Before
class ConversationService {
  constructor() {
    this.logger = new ConsoleLogger();
    this.parser = new MarkdownParser();
  }
}

// After
@injectable()
class ConversationService {
  constructor(
    private logger = inject(LOGGER_TOKEN),
    private parser = inject(PARSER_TOKEN)
  ) {}
}
```

**When you have:** Classes that need dependencies or will be injected into others  
**Prevents:** Manual registration errors, boilerplate code  
**Otherwise:** Runtime resolution failures, maintenance overhead

### Rule 3: Use Constructor Injection Pattern
**Do this:** Always inject dependencies through constructor with default parameters using `inject()`.

```typescript
@injectable()
class DocumentProcessor {
  constructor(
    // Use default parameters for automatic injection
    private validator = inject(VALIDATOR_TOKEN),
    private formatter = inject(FORMATTER_TOKEN),
    // Optional dependencies
    private cache = inject(CACHE_TOKEN, { optional: true })
  ) {}
}
```

**When you have:** Mandatory or optional dependencies  
**Prevents:** Service locator anti-pattern, hidden dependencies  
**Otherwise:** Untestable code, unclear dependency graphs

### Rule 4: Create Context Objects for External Dependencies
**Do this:** Bundle external dependencies (framework objects, app instances, settings) into context objects.

```typescript
// Context interface for Obsidian plugin
interface PluginContext {
  readonly app: App;
  readonly plugin: Plugin;
  readonly settings: PluginSettings;
  readonly vault: Vault;
}

// Context provider service
@injectable()
class ContextProvider {
  private context: PluginContext;
  
  initialize(app: App, plugin: Plugin, settings: PluginSettings) {
    this.context = Object.freeze({
      app,
      plugin, 
      settings,
      vault: app.vault
    });
  }
  
  getContext(): PluginContext {
    return this.context;
  }
}
```

**When you have:** Framework-specific objects that can't be created by DI  
**Prevents:** Parameter drilling, brittle method signatures  
**Otherwise:** Complex dependency chains, difficult migration

### Rule 5: Implement Single Responsibility Services
**Do this:** Split "god objects" into focused, single-purpose services.

```typescript
// ❌ Bad: Multi-responsibility service
class EditorManager {
  parseConversation() { /* ... */ }
  insertText() { /* ... */ }
  formatDocument() { /* ... */ }
  saveToFile() { /* ... */ }
}

// ✅ Good: Single responsibility services
@injectable()
class ConversationParser {
  parse(text: string): Conversation[] { /* ... */ }
}

@injectable()
class TextInserter {
  insert(text: string, position: Position): void { /* ... */ }
}

@injectable()
class DocumentFormatter {
  format(document: Document): FormattedDocument { /* ... */ }
}
```

**When you have:** Classes with multiple responsibilities  
**Prevents:** Testing complexity, refactoring difficulties  
**Otherwise:** Tangled dependencies, maintenance nightmares

### Rule 6: Use Factory Providers for Complex Creation
**Do this:** Create factory providers for objects requiring runtime configuration.

```typescript
// Factory for runtime-configured services
container.bind(MCP_MANAGER_TOKEN).toFactory(
  (container) => (config: McpServerConfig) => {
    const logger = container.get(LOGGER_TOKEN);
    const errorHandler = container.get(ERROR_HANDLER_TOKEN);
    return new McpManager(config, logger, errorHandler);
  }
);

// Usage
const mcpFactory = container.get(MCP_MANAGER_TOKEN);
const mcpManager = mcpFactory(serverConfig);
```

**When you have:** Objects needing runtime parameters or complex initialization  
**Prevents:** Factory method proliferation, configuration coupling  
**Otherwise:** Hard-to-maintain factory methods scattered across codebase

### Rule 7: Create Scoped Containers for Lifecycles
**Do this:** Use child containers for request/document/feature-specific scopes.

```typescript
// Document-scoped container
function processDocument(document: TFile) {
  const documentScope = container.createScope();
  
  // Register document-specific instances
  documentScope.bind(DOCUMENT_TOKEN).toValue(document);
  documentScope.bind(EDITOR_TOKEN).toClass(DocumentEditor);
  
  // Services in this scope share the same document context
  const processor = documentScope.get(DOCUMENT_PROCESSOR_TOKEN);
  return processor.process();
}
```

**When you have:** Stateful services needing isolated contexts  
**Prevents:** Memory leaks, state bleeding between contexts  
**Otherwise:** Unexpected shared state, resource management issues

### Rule 8: Configure Appropriate Service Lifecycles
**Do this:** Choose the right lifecycle for each service based on its nature.

```typescript
// Singleton: Stateless services (shared instance)
container.bind(LOGGER_TOKEN)
  .toClass(ConsoleLogger)
  .inSingletonScope();

// Transient: New instance per injection
container.bind(REQUEST_HANDLER_TOKEN)
  .toClass(RequestHandler)
  .inTransientScope();

// Scoped: Shared within a scope
container.bind(UNIT_OF_WORK_TOKEN)
  .toClass(UnitOfWork)
  .inRequestScope();
```

**When you have:** Different service state requirements  
**Prevents:** Memory waste, state corruption  
**Otherwise:** Performance issues, memory leaks

### Rule 9: Handle Circular Dependencies
**Do this:** Refactor to eliminate circular dependencies through design changes.

```typescript
// ❌ Bad: Circular dependency
@injectable()
class ServiceA {
  constructor(private b: ServiceB) {}
}

@injectable()
class ServiceB {
  constructor(private a: ServiceA) {}
}

// ✅ Good: Extract shared logic
@injectable()
class SharedService {
  // Common functionality
}

@injectable()
class ServiceA {
  constructor(private shared: SharedService) {}
}

@injectable()
class ServiceB {
  constructor(private shared: SharedService) {}
}

// Alternative: Use lazy injection if absolutely necessary
@injectable()
class ServiceA {
  constructor(private b = inject(lazy(() => ServiceB))) {}
}
```

**When you have:** Services that seem to need each other  
**Prevents:** Runtime resolution failures, stack overflows  
**Otherwise:** Application startup failures

### Rule 10: Implement Proper Testing Strategy
**Do this:** Create test containers with mock implementations.

```typescript
// Test setup
describe('OrderService', () => {
  let testContainer: Container;
  let orderService: OrderService;
  
  beforeEach(() => {
    testContainer = new Container();
    
    // Register mocks
    testContainer.bind(DATABASE_TOKEN).toValue({
      query: vi.fn().mockResolvedValue([])
    });
    
    testContainer.bind(LOGGER_TOKEN).toValue({
      log: vi.fn(),
      error: vi.fn()
    });
    
    // Get service under test
    orderService = testContainer.get(OrderService);
  });
  
  it('should process orders', async () => {
    // Test with mocked dependencies
  });
});
```

**When you have:** Services needing unit tests  
**Prevents:** Integration test complexity, external dependencies in tests  
**Otherwise:** Slow, flaky, environment-dependent tests

## Migration Strategy: Three-Phase Approach

### Phase 1: Preparation (No Breaking Changes)
1. **Identify service boundaries** in existing code
2. **Extract interfaces** from concrete classes
3. **Create injection tokens** for all interfaces
4. **Add @injectable() decorators** to classes (backward compatible)

```typescript
// Original class still works
@injectable()
class LegacyService {
  constructor(
    private newDep = inject(TOKEN, { optional: true }),
    private legacyParam?: OldType // Still supports old way
  ) {
    // Handle both patterns during migration
  }
}
```

### Phase 2: Container Setup
1. **Create root container** with proper configuration
2. **Register all services** with appropriate lifecycles
3. **Set up factory providers** for complex objects
4. **Create child containers** for scoped contexts

```typescript
// Container configuration
export function createContainer(app: App, plugin: Plugin) {
  const container = new Container();
  
  // External dependencies
  container.bind(APP_TOKEN).toValue(app);
  container.bind(PLUGIN_TOKEN).toValue(plugin);
  
  // Services
  container.bind(LOGGER_TOKEN).toClass(ConsoleLogger).inSingletonScope();
  container.bind(PARSER_TOKEN).toClass(MarkdownParser);
  
  // Validate all dependencies resolve
  container.validate();
  
  return container;
}
```

### Phase 3: Gradual Replacement
1. **Replace direct instantiation** with container resolution
2. **Remove manual dependency management**
3. **Update tests** to use DI
4. **Remove legacy constructors** after full migration

```typescript
// Before
const service = new OrderService(new Database(), console);

// After
const service = container.get(ORDER_SERVICE_TOKEN);
```

## Performance Optimization

### Lazy Injection for Expensive Services
```typescript
@injectable()
class ReportGenerator {
  constructor(
    // Only instantiate when actually used
    private heavyService = inject(lazy(() => HeavyAnalyticsService))
  ) {}
  
  generateReport() {
    if (this.needsAnalytics()) {
      const analytics = this.heavyService(); // Created here
      return analytics.process();
    }
  }
}
```

### Async Service Resolution
```typescript
// For services with async initialization
container.bind(DATABASE_TOKEN).toFactory(
  async () => {
    const db = new Database();
    await db.connect();
    return db;
  },
  { async: true }
);

// Usage
const db = await container.getAsync(DATABASE_TOKEN);
```

## Common Pitfalls and Solutions

| Pitfall | Solution | Example |
|---------|----------|---------|
| Service locator pattern | Use constructor injection | `inject(TOKEN)` in constructor, not in methods |
| Too many dependencies (>5-6) | Split into smaller services | One service = one responsibility |
| Concrete dependencies | Always use interfaces | `ILogger` not `ConsoleLogger` |
| Global container access | Pass container only to factories | Services shouldn't know about container |
| Missing disposal | Implement cleanup | Add `dispose()` method for resources |

## Validation Checklist

Before deployment, ensure:

- [ ] All services have `@injectable()` decorator
- [ ] Dependencies use interface tokens, not concrete classes
- [ ] No circular dependencies exist
- [ ] Each service has single responsibility
- [ ] Appropriate lifecycles configured (singleton/scoped/transient)
- [ ] External dependencies wrapped in context objects
- [ ] Factory providers for runtime configuration
- [ ] Test containers with mocks created
- [ ] Container validation passes (`container.validate()`)
- [ ] Resource cleanup implemented where needed

## Build Configuration

Ensure your TypeScript configuration supports decorators:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Quick Reference Card

### Essential Imports
```typescript
import { injectable, inject, Container, createToken } from '@needle-di/core';
```

### Token Creation
```typescript
const TOKEN = createToken<Interface>('UniqueIdentifier');
```

### Service Definition
```typescript
@injectable()
class Service {
  constructor(private dep = inject(TOKEN)) {}
}
```

### Container Setup
```typescript
const container = new Container();
container.bind(TOKEN).toClass(Implementation);
container.bind(TOKEN).toValue(instance);
container.bind(TOKEN).toFactory(() => new Instance());
```

### Resolution
```typescript
const service = container.get(TOKEN);
const asyncService = await container.getAsync(ASYNC_TOKEN);
```

## Pros and Cons Summary

### Pros
- **Testability**: Easy mocking and isolation
- **Flexibility**: Swap implementations without code changes
- **Maintainability**: Clear dependency graphs
- **Scalability**: Organized code structure for large projects
- **Type Safety**: Full TypeScript support with interfaces

### Cons
- **Learning Curve**: Team needs to understand DI patterns
- **Initial Setup**: Requires upfront design effort
- **Build Complexity**: Decorator configuration needed
- **Runtime Overhead**: Small performance cost for resolution
- **Debugging**: Indirect instantiation can complicate debugging

## Recommended Action

1. **Start small**: Pick one module for initial refactoring
2. **Extract interfaces first**: Define contracts before implementation
3. **Use incremental migration**: Support both old and new patterns temporarily
4. **Test thoroughly**: Create comprehensive test suites with mocks
5. **Document patterns**: Maintain team guidelines for consistency
6. **Monitor performance**: Profile to ensure acceptable overhead
7. **Train team**: Ensure everyone understands DI principles

## Further Resources

- [Needle DI Documentation](https://needle-di.io/getting-started.html)
- [TypeScript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Dependency Inversion Principle](https://en.wikipedia.org/wiki/Dependency_inversion_principle)