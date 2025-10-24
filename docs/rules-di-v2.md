# Complete needle-di v1.1.0 Guide

## Core Setup

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler"
    // NO experimentalDecorators or emitDecoratorMetadata
  }
}
```

### Build Tools
```typescript
// tsup: target: 'es2022'
// Vite: esbuild: { target: 'es2022' }
// esbuild: --target=es2022
```

## Pattern Quick Reference

| Use Case | Pattern | When to Use |
|----------|---------|-------------|
| Simple services | Direct `@injectable()` | Single implementation, no config |
| Multiple implementations | Token-based | Interface with variants |
| External dependencies | Context objects | Framework APIs, global state |
| Legacy functions | Service wrapper | Gradual migration |
| Runtime config | Factory provider | Dynamic instantiation |
| Scoped state | Child containers | Per-request/document isolation |
| Package boundaries | Module functions | Monorepo organization |

## Basic Patterns

### 1. Simple Service Registration
```typescript
import { injectable, inject, Container, InjectionToken } from '@needle-di/core';

// Token for interface
const LOGGER_TOKEN = new InjectionToken<ILogger>('Logger');

// Service with dependencies
@injectable()
class OrderService {
  constructor(
    private logger = inject(LOGGER_TOKEN),
    private db = inject(DATABASE_TOKEN)
  ) {}
}

// Container setup
const container = new Container();
container.bind({ provide: LOGGER_TOKEN, useClass: ConsoleLogger });
container.bind(OrderService); // Auto-registration
```

### 2. Provider Types
```typescript
// Class provider
container.bind({ provide: TOKEN, useClass: Implementation });

// Value provider
container.bind({ provide: CONFIG_TOKEN, useValue: { api: '/api' } });

// Factory provider
container.bind({
  provide: CLIENT_TOKEN,
  useFactory: () => new ApiClient(inject(CONFIG_TOKEN))
});

// Existing provider alias
container.bind({ provide: ALIAS_TOKEN, useExisting: ORIGINAL_TOKEN });
```

### 3. Injection Options
```typescript
@injectable()
class Service {
  constructor(
    // Optional - won't throw if missing
    private cache = inject(CACHE_TOKEN, { optional: true }),
    
    // Lazy - resolved when called
    private getHeavy = inject(HEAVY_TOKEN, { lazy: true }),
    
    // Multi - inject all registered
    private plugins = inject(PLUGIN_TOKEN, { multi: true })
  ) {}
  
  doWork() {
    if (this.cache) { /* use cache */ }
    const heavy = this.getHeavy(); // Resolved here
    this.plugins.forEach(p => p.execute());
  }
}
```

## Advanced Patterns

### 4. Async Providers
```typescript
// Async factory
container.bind({
  provide: DATABASE_TOKEN,
  async: true,
  useFactory: async () => {
    const db = new Database();
    await db.connect();
    return db;
  }
});

// Usage
const db = await container.getAsync(DATABASE_TOKEN);
```

### 5. Child Containers (Scoping)
```typescript
// Create scoped container
function processRequest(request: Request) {
  const requestScope = container.createChild();
  
  // Override or add request-specific bindings
  requestScope.bind({ provide: REQUEST_TOKEN, useValue: request });
  requestScope.bind({ provide: USER_TOKEN, useValue: request.user });
  
  // Services in this scope see request-specific values
  const handler = requestScope.get(REQUEST_HANDLER_TOKEN);
  return handler.process();
}

// Child inherits parent bindings, can override
const parent = new Container();
parent.bind({ provide: LOGGER_TOKEN, useValue: consoleLogger });

const child = parent.createChild();
child.bind({ provide: LOGGER_TOKEN, useValue: fileLogger }); // Override

child.get(LOGGER_TOKEN);   // fileLogger
parent.get(LOGGER_TOKEN);  // consoleLogger
```

### 6. Context Objects Pattern
```typescript
interface AppContext {
  readonly config: Config;
  readonly db: Database;
  readonly cache: Cache;
}

const APP_CONTEXT_TOKEN = new InjectionToken<AppContext>('AppContext');

// Initialize once
container.bind({
  provide: APP_CONTEXT_TOKEN,
  useValue: Object.freeze({
    config: loadConfig(),
    db: connectDb(),
    cache: initCache()
  })
});

// Services access context
@injectable()
class Service {
  constructor(private context = inject(APP_CONTEXT_TOKEN)) {
    // Access context.config, context.db, etc.
  }
}
```

## Lifetime Management

### Instance Lifecycles

needle-di creates singletons by default for classes. Control lifetime through patterns:

```typescript
// Singleton (default) - one instance per container
@injectable()
class SingletonService {}
container.bind(SingletonService); // Shared instance

// Transient - new instance each injection
container.bind({
  provide: TRANSIENT_TOKEN,
  useFactory: () => new TransientService() // Factory creates new
});

// Scoped - one instance per child container
function createScopedService(container: Container) {
  const scoped = container.createChild();
  scoped.bind(SCOPED_SERVICE); // Lives in child scope
  return scoped;
}
```

### Resource Cleanup
```typescript
interface Disposable {
  dispose(): void | Promise<void>;
}

class ResourceManager {
  private resources: Disposable[] = [];
  
  register<T extends Disposable>(resource: T): T {
    this.resources.push(resource);
    return resource;
  }
  
  async dispose() {
    for (const resource of this.resources.reverse()) {
      await resource.dispose();
    }
  }
}

// Usage
@injectable()
class DatabaseConnection implements Disposable {
  async dispose() {
    await this.connection.close();
  }
}

container.bind({ provide: RESOURCE_MANAGER_TOKEN, useClass: ResourceManager });
container.bind({ provide: DB_TOKEN, useClass: DatabaseConnection });

// Cleanup
const manager = container.get(RESOURCE_MANAGER_TOKEN);
await manager.dispose();
```

## Monorepo Patterns

### 7. Package Module Functions
```typescript
// packages/auth/src/auth.module.ts
export function registerAuthModule(container: Container, config?: AuthConfig) {
  container.bind({ provide: AUTH_SERVICE_TOKEN, useClass: JwtAuthService });
  container.bind({ provide: AUTH_CONFIG_TOKEN, useValue: config });
  
  // Auto-registered services
  container.bind(JwtAuthService);
  container.bind(SessionManager);
}

// packages/app/src/bootstrap.ts
const container = new Container();
registerAuthModule(container, config.auth);
registerDatabaseModule(container, config.db);
registerApiModule(container);
```

### 8. Chained Container Composition
```typescript
// Compose multiple package containers
function composeContainers(...factories: Array<(c: Container) => Container>) {
  return factories.reduce((container, factory) => factory(container), new Container());
}

const appContainer = composeContainers(
  createCoreContainer,
  createAuthContainer,
  createApiContainer
);

// Or nested
const final = createApiContainer(
  createAuthContainer(
    createCoreContainer(new Container())
  )
);
```

## Legacy Code Integration

### 9. Function Module Wrapper
```typescript
// Legacy functional module
export function calculateTax(amount, rate) {
  return amount * rate;
}

// DI Wrapper
@injectable()
class TaxService {
  constructor(private config = inject(CONFIG_TOKEN)) {}
  
  calculateTax(amount: number): number {
    return calculateTax(amount, this.config.taxRate);
  }
}
```

### 10. Factory for Function Modules
```typescript
// Legacy factory function
function createApiClient(baseUrl, headers) {
  return { /* api methods */ };
}

// DI Integration
container.bind({
  provide: API_CLIENT_TOKEN,
  useFactory: () => {
    const config = inject(CONFIG_TOKEN);
    const auth = inject(AUTH_TOKEN);
    return createApiClient(config.apiUrl, auth.headers);
  }
});
```

### 11. Global Container Access (Migration Only)
```typescript
// For legacy code that can't be refactored immediately
let globalContainer: Container | null = null;

export function initializeGlobalContainer(container: Container) {
  globalContainer = container;
}

export function getService<T>(token: InjectionToken<T>): T {
  if (!globalContainer) throw new Error('Container not initialized');
  return globalContainer.get(token);
}

// Legacy code
import { getService } from './di/global';
export function legacyFunction(data) {
  const logger = getService(LOGGER_TOKEN);
  logger.log('Processing:', data);
}
```

## Migration Patterns

### 12. Strangler Fig Pattern
```typescript
@injectable()
class ServiceWrapper {
  constructor(
    private newService = inject(NEW_SERVICE_TOKEN),
    private featureFlags = inject(FEATURE_FLAGS_TOKEN)
  ) {}
  
  process(data: any) {
    if (this.featureFlags.useNewService) {
      return this.newService.process(data);
    }
    return legacyProcess(data);
  }
}
```

### 13. Gradual Service Extraction
```typescript
// Step 1: Create interface
interface DataProcessor {
  process(data: any): Result;
}

// Step 2: Wrap legacy
@injectable()
class LegacyAdapter implements DataProcessor {
  constructor(private deps = inject(DEPS_TOKEN)) {}
  
  process(data: any): Result {
    return legacyModule.process(data, this.deps);
  }
}

// Step 3: New implementation
@injectable()
class ModernProcessor implements DataProcessor {
  constructor(private deps = inject(DEPS_TOKEN)) {}
  
  process(data: any): Result {
    // New implementation
  }
}

// Step 4: Switch via config
container.bind({
  provide: PROCESSOR_TOKEN,
  useClass: config.useModern ? ModernProcessor : LegacyAdapter
});
```

## Testing Patterns

### 14. Test Container Setup
```typescript
import { Container } from '@needle-di/core';
import { vi } from 'vitest';

describe('Service Tests', () => {
  let container: Container;
  
  beforeEach(() => {
    container = new Container();
    
    // Mock dependencies
    container.bind({
      provide: LOGGER_TOKEN,
      useValue: { log: vi.fn(), error: vi.fn() }
    });
    
    container.bind({
      provide: DATABASE_TOKEN,
      useValue: { query: vi.fn().mockResolvedValue([]) }
    });
    
    // Service under test
    container.bind(ServiceUnderTest);
  });
  
  it('should work', () => {
    const service = container.get(ServiceUnderTest);
    // test...
  });
});
```

### 15. Integration Testing
```typescript
describe('Container Integration', () => {
  it('resolves all dependencies', () => {
    const container = createAppContainer(mockConfig);
    
    // Critical services should resolve
    expect(() => container.get(AUTH_TOKEN)).not.toThrow();
    expect(() => container.get(API_TOKEN)).not.toThrow();
  });
  
  it('handles async providers', async () => {
    const db = await container.getAsync(DATABASE_TOKEN);
    expect(db.isConnected()).toBe(true);
  });
});
```

## Diagnostics & Debugging

### 16. Dependency Visualization
```typescript
class DependencyTracker {
  private dependencies = new Map<string, Set<string>>();
  
  track(service: string, deps: string[]) {
    this.dependencies.set(service, new Set(deps));
  }
  
  visualize(): string {
    let graph = 'digraph G {\n';
    for (const [service, deps] of this.dependencies) {
      for (const dep of deps) {
        graph += `  "${service}" -> "${dep}";\n`;
      }
    }
    return graph + '}';
  }
  
  detectCycles(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const stack = new Set<string>();
    
    const visit = (node: string, path: string[] = []) => {
      if (stack.has(node)) {
        cycles.push([...path, node]);
        return;
      }
      if (visited.has(node)) return;
      
      visited.add(node);
      stack.add(node);
      
      const deps = this.dependencies.get(node) || new Set();
      for (const dep of deps) {
        visit(dep, [...path, node]);
      }
      
      stack.delete(node);
    };
    
    for (const service of this.dependencies.keys()) {
      visit(service);
    }
    
    return cycles;
  }
}
```

### 17. Container Inspection
```typescript
class ContainerInspector {
  constructor(private container: Container) {}
  
  listBindings(): string[] {
    // Note: needle-di doesn't expose bindings directly
    // Track manually during registration
    return this.trackedBindings;
  }
  
  canResolve(token: any): boolean {
    try {
      this.container.get(token);
      return true;
    } catch {
      return false;
    }
  }
  
  measureResolution<T>(token: any): { result: T; time: number } {
    const start = performance.now();
    const result = this.container.get<T>(token);
    return { result, time: performance.now() - start };
  }
}
```

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "No provider found" | Missing binding | Add `container.bind()` |
| "Circular dependency" | A→B→A | Extract shared service |
| "Cannot read property" | Optional not checked | Use `{ optional: true }` |
| Decorator not working | Wrong TS config | Target ES2022, no legacy decorators |
| Async resolution fails | Wrong method | Use `getAsync()` not `get()` |

## Decision Matrix

### When to Use What

**Direct @injectable()**: Simple services, single implementation
**InjectionToken**: Interfaces, multiple implementations, primitives
**Factory Provider**: Runtime configuration, complex creation
**Child Containers**: Request scoping, testing isolation, multi-tenancy
**Lazy Injection**: Heavy services, circular deps, conditional usage
**Multi Providers**: Plugins, handlers, middleware chains
**Context Pattern**: External deps, framework integration

### Performance Guidelines

- Singletons for stateless services
- Factories for stateful/transient instances  
- Lazy injection for expensive initialization
- Child containers for memory isolation
- Avoid deep container nesting (>3 levels)

## Quick Start Template

```typescript
// 1. Setup tokens
import { InjectionToken } from '@needle-di/core';
export const SERVICE_TOKEN = new InjectionToken<IService>('Service');

// 2. Create services
import { injectable, inject } from '@needle-di/core';
@injectable()
export class ServiceImpl implements IService {
  constructor(private dep = inject(DEP_TOKEN)) {}
}

// 3. Configure container
import { Container } from '@needle-di/core';
const container = new Container();
container.bind({ provide: SERVICE_TOKEN, useClass: ServiceImpl });

// 4. Use
const service = container.get(SERVICE_TOKEN);
```

## Summary

needle-di v1.1.0 provides a minimal, reflection-free DI solution. Key principles:
- Native ES2022 decorators (no reflection)
- Explicit registration over magic
- Singleton by default
- Child containers for scoping
- Factory providers for flexibility

Choose patterns based on your needs: simple services use direct binding, complex scenarios use factories and child containers, legacy code uses wrappers or global access during migration.