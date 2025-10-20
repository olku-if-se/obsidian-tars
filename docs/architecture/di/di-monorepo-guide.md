# Monorepo Dependency Injection Patterns
**Cross-Package DI Strategy with @needle-di/core**

> **Analogy**: Think of a monorepo DI setup like a multinational corporation. Each country office (package) has its own local services, but they share global services (shared packages) and can communicate through well-defined interfaces (tokens). The headquarters (root container) coordinates everything, while regional offices (package containers) handle local concerns.

## Quick Sample: Monorepo Structure

```
monorepo/
├── packages/
│   ├── core/              # Shared interfaces & tokens
│   ├── logger/             # Logging implementation
│   ├── database/           # Database services
│   ├── auth/               # Authentication services
│   ├── api/                # API layer
│   └── app/                # Main application
└── package.json
```

## Pattern 1: Token-Based Package Boundaries (Recommended)

**Do this:** Define tokens in shared packages, implement in feature packages, compose in app package.

```typescript
// packages/core/src/tokens.ts
export const LOGGER_TOKEN = createToken<ILogger>('Logger');
export const DATABASE_TOKEN = createToken<IDatabase>('Database');
export const AUTH_TOKEN = createToken<IAuthService>('Auth');

// packages/core/src/interfaces.ts
export interface ILogger {
  log(message: string): void;
  error(message: string, error?: Error): void;
}

export interface IDatabase {
  query<T>(sql: string, params?: any[]): Promise<T[]>;
  transaction<T>(fn: () => Promise<T>): Promise<T>;
}
```

```typescript
// packages/logger/src/ConsoleLogger.ts
import { injectable } from '@needle-di/core';
import { ILogger } from '@company/core';

@injectable()
export class ConsoleLogger implements ILogger {
  log(message: string): void {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
  
  error(message: string, error?: Error): void {
    console.error(`[ERROR] ${message}`, error);
  }
}
```

```typescript
// packages/database/src/PostgresDatabase.ts
import { injectable, inject } from '@needle-di/core';
import { IDatabase, ILogger, LOGGER_TOKEN } from '@company/core';

@injectable()
export class PostgresDatabase implements IDatabase {
  constructor(
    private logger = inject(LOGGER_TOKEN)
  ) {}
  
  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    this.logger.log(`Executing query: ${sql}`);
    // Implementation
    return [];
  }
  
  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    // Implementation
    return fn();
  }
}
```

### **Pros:**
- Clear package boundaries
- Type-safe across packages
- Easy to mock for testing
- No circular package dependencies

### **Cons:**
- Requires shared core package
- Manual registration needed
- Token management overhead

## Pattern 2: Auto-Discovery with Package Modules (Hybrid Approach)

**Do this:** Each package exports a DI module that auto-registers its providers.

```typescript
// packages/logger/src/logger.module.ts
import { ContainerModule, interfaces } from '@needle-di/core';
import { LOGGER_TOKEN } from '@company/core';
import { ConsoleLogger } from './ConsoleLogger';
import { FileLogger } from './FileLogger';

export class LoggerModule extends ContainerModule {
  constructor() {
    super((bind: interfaces.Bind) => {
      // Auto-wire all providers in this package
      bind(LOGGER_TOKEN).to(ConsoleLogger).inSingletonScope();
      bind(FileLogger).toSelf().inSingletonScope();
    });
  }
}

// Export for auto-discovery
export const MODULE = new LoggerModule();
```

```typescript
// packages/database/src/database.module.ts
import { ContainerModule, interfaces } from '@needle-di/core';
import { DATABASE_TOKEN, MIGRATION_TOKEN } from '@company/core';
import { PostgresDatabase } from './PostgresDatabase';
import { MigrationRunner } from './MigrationRunner';

export class DatabaseModule extends ContainerModule {
  constructor(private config?: DatabaseConfig) {
    super((bind: interfaces.Bind) => {
      bind(DATABASE_TOKEN)
        .to(PostgresDatabase)
        .inSingletonScope();
      
      bind(MIGRATION_TOKEN)
        .to(MigrationRunner)
        .inSingletonScope();
        
      if (config) {
        bind(DATABASE_CONFIG_TOKEN).toConstantValue(config);
      }
    });
  }
}
```

```typescript
// packages/app/src/container.setup.ts
import { Container } from '@needle-di/core';
import { LoggerModule } from '@company/logger';
import { DatabaseModule } from '@company/database';
import { AuthModule } from '@company/auth';

export function createAppContainer(config: AppConfig): Container {
  const container = new Container();
  
  // Load all package modules
  container.load(
    new LoggerModule(),
    new DatabaseModule(config.database),
    new AuthModule(config.auth)
  );
  
  // App-specific bindings
  container.bind(APP_CONFIG_TOKEN).toConstantValue(config);
  
  return container;
}
```

### **Pros:**
- Encapsulated package configuration
- Easy to add/remove packages
- Supports conditional loading
- Clean separation of concerns

### **Cons:**
- Still requires some manual module loading
- Potential for registration conflicts
- Module dependency ordering matters

## Pattern 3: Full Auto-Wire with Decorators (Convention over Configuration)

**Do this:** Use decorator metadata for automatic discovery and registration across packages.

```typescript
// packages/core/src/decorators.ts
export function Provider(token?: InjectionToken) {
  return function(target: any) {
    Reflect.defineMetadata('provider:token', token || target, target);
    Reflect.defineMetadata('provider:auto', true, target);
    return injectable()(target);
  };
}

export function Module(metadata: ModuleMetadata) {
  return function(target: any) {
    Reflect.defineMetadata('module:providers', metadata.providers || [], target);
    Reflect.defineMetadata('module:imports', metadata.imports || [], target);
    Reflect.defineMetadata('module:exports', metadata.exports || [], target);
    return target;
  };
}
```

```typescript
// packages/logger/src/providers/ConsoleLogger.ts
import { Provider } from '@company/core';
import { LOGGER_TOKEN } from '@company/core/tokens';

@Provider(LOGGER_TOKEN)
export class ConsoleLogger implements ILogger {
  log(message: string): void {
    console.log(message);
  }
}
```

```typescript
// packages/database/src/database.module.ts
import { Module } from '@company/core';
import { PostgresDatabase } from './providers/PostgresDatabase';
import { MigrationRunner } from './providers/MigrationRunner';
import { LoggerModule } from '@company/logger';

@Module({
  imports: [LoggerModule],  // Dependencies on other modules
  providers: [
    PostgresDatabase,
    MigrationRunner
  ],
  exports: [PostgresDatabase]  // What this module exposes
})
export class DatabaseModule {}
```

```typescript
// packages/app/src/bootstrap.ts
import { ContainerBuilder } from '@company/core';
import { DatabaseModule } from '@company/database';
import { AuthModule } from '@company/auth';
import { ApiModule } from '@company/api';

export async function bootstrap() {
  const builder = new ContainerBuilder();
  
  // Auto-discover and wire all modules
  await builder.scanPackages([
    '@company/logger',
    '@company/database',
    '@company/auth',
    '@company/api'
  ]);
  
  // Or explicitly add modules
  builder.addModules([
    DatabaseModule,
    AuthModule,
    ApiModule
  ]);
  
  const container = builder.build();
  return container;
}
```

### **Pros:**
- True auto-discovery
- Minimal boilerplate
- Angular-like module system
- Easy to onboard new packages

### **Cons:**
- Magic behavior (less explicit)
- Harder to debug issues
- Requires reflection/metadata
- Build complexity increases

## Pattern 4: Composite Container Pattern (For Large Monorepos)

**Do this:** Create hierarchical containers where each package has its own container.

```typescript
// packages/core/src/container.factory.ts
export class PackageContainer {
  private container: Container;
  private parent?: PackageContainer;
  
  constructor(
    public readonly packageName: string,
    parent?: PackageContainer
  ) {
    this.parent = parent;
    this.container = parent 
      ? parent.container.createChild()
      : new Container();
  }
  
  register(token: InjectionToken, provider: any): void {
    this.container.bind(token).to(provider);
  }
  
  resolve<T>(token: InjectionToken<T>): T {
    return this.container.get(token);
  }
  
  createChild(packageName: string): PackageContainer {
    return new PackageContainer(packageName, this);
  }
}
```

```typescript
// packages/logger/src/container.ts
import { PackageContainer } from '@company/core';
import { ConsoleLogger } from './ConsoleLogger';
import { LOGGER_TOKEN } from '@company/core/tokens';

export function createLoggerContainer(parent?: PackageContainer) {
  const container = parent?.createChild('logger') 
    || new PackageContainer('logger');
  
  container.register(LOGGER_TOKEN, ConsoleLogger);
  
  return container;
}
```

```typescript
// packages/app/src/bootstrap.ts
import { PackageContainer } from '@company/core';
import { createLoggerContainer } from '@company/logger';
import { createDatabaseContainer } from '@company/database';
import { createAuthContainer } from '@company/auth';

export function bootstrapApplication() {
  // Root container
  const rootContainer = new PackageContainer('root');
  
  // Package containers (order matters for dependencies)
  const loggerContainer = createLoggerContainer(rootContainer);
  const databaseContainer = createDatabaseContainer(loggerContainer);
  const authContainer = createAuthContainer(databaseContainer);
  
  // App container
  const appContainer = authContainer.createChild('app');
  
  return appContainer;
}
```

### **Pros:**
- Clear package hierarchy
- Isolated package scopes
- Override providers per package
- Natural dependency flow

### **Cons:**
- Complex container management
- Order-dependent setup
- Harder to understand resolution
- Potential for scope leakage

## Recommendation Decision Matrix

| Scenario | Recommended Pattern | Why |
|----------|-------------------|-----|
| **Small monorepo (< 10 packages)** | Pattern 1 (Token-Based) | Simple, explicit, easy to understand |
| **Medium monorepo (10-30 packages)** | Pattern 2 (Package Modules) | Good balance of auto/manual |
| **Large monorepo (> 30 packages)** | Pattern 3 (Auto-Wire) | Reduces boilerplate at scale |
| **Microservices in monorepo** | Pattern 4 (Composite) | Isolation between services |
| **Gradual migration** | Pattern 1 → Pattern 2 | Start simple, evolve as needed |
| **Team with DI experience** | Pattern 3 (Auto-Wire) | Familiar with conventions |
| **Team new to DI** | Pattern 1 (Token-Based) | Explicit is better than implicit |

## Best Practices for Monorepo DI

### 1. Package Structure
```typescript
// Each package should have:
package/
├── src/
│   ├── index.ts           // Public API exports
│   ├── tokens.ts           // Package-specific tokens
│   ├── interfaces.ts       // Public interfaces
│   ├── providers/          // Injectable services
│   └── module.ts           // DI module definition
├── tests/
│   └── container.spec.ts   // Container tests
└── package.json
```

### 2. Token Management
```typescript
// packages/core/src/tokens/index.ts
// Centralize all tokens in core package
export * from './logger.tokens';
export * from './database.tokens';
export * from './auth.tokens';

// packages/core/src/tokens/logger.tokens.ts
export const LOGGER_TOKEN = createToken<ILogger>('Logger');
export const LOG_LEVEL_TOKEN = createToken<LogLevel>('LogLevel');
export const LOG_FORMATTER_TOKEN = createToken<ILogFormatter>('LogFormatter');
```

### 3. Interface Segregation
```typescript
// packages/core/src/interfaces/database.ts
// Split interfaces by capability
export interface DatabaseReader {
  query<T>(sql: string): Promise<T[]>;
}

export interface DatabaseWriter {
  execute(sql: string): Promise<void>;
}

export interface Database extends DatabaseReader, DatabaseWriter {
  transaction<T>(fn: () => Promise<T>): Promise<T>;
}
```

### 4. Package Exports
```typescript
// packages/database/src/index.ts
// Only export what other packages need
export { DatabaseModule } from './database.module';
export type { DatabaseConfig } from './config';
// Don't export implementation details
// ❌ export { PostgresDatabase } from './providers/PostgresDatabase';
```

### 5. Testing Strategy
```typescript
// packages/database/tests/container.spec.ts
describe('DatabaseModule', () => {
  let container: Container;
  
  beforeEach(() => {
    container = new Container();
    
    // Mock cross-package dependencies
    container.bind(LOGGER_TOKEN).toConstantValue({
      log: vi.fn(),
      error: vi.fn()
    });
    
    // Load module under test
    container.load(new DatabaseModule());
  });
  
  it('should provide database service', () => {
    const db = container.get(DATABASE_TOKEN);
    expect(db).toBeDefined();
  });
  
  it('should resolve all dependencies', () => {
    expect(() => container.get(DATABASE_TOKEN)).not.toThrow();
  });
});
```

### 6. Build Configuration
```json
// packages/database/package.json
{
  "name": "@company/database",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "@company/core": "workspace:*",
    "@needle-di/core": "^1.0.0"
  },
  "peerDependencies": {
    "@company/logger": "workspace:*"
  }
}
```

```typescript
// tsconfig.json (monorepo root)
{
  "compilerOptions": {
    "paths": {
      "@company/*": ["packages/*/src"]
    },
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Migration Path

### Step 1: Start with Manual Registration
```typescript
// Simple and explicit
const container = new Container();
container.bind(LOGGER_TOKEN).to(ConsoleLogger);
container.bind(DATABASE_TOKEN).to(PostgresDatabase);
```

### Step 2: Introduce Package Modules
```typescript
// Organize by package
container.load(new LoggerModule());
container.load(new DatabaseModule());
```

### Step 3: Add Auto-Discovery (if needed)
```typescript
// Only when scale demands it
const builder = new ContainerBuilder();
await builder.scanPackages(['@company/*']);
```

## Performance Considerations

| Approach | Startup Time | Runtime Performance | Memory Usage |
|----------|-------------|-------------------|--------------|
| Manual Registration | Fast | Excellent | Low |
| Package Modules | Good | Excellent | Low-Medium |
| Auto-Wire Scan | Slow | Excellent | Medium |
| Composite Containers | Medium | Good | Medium-High |

## Recommended Action

1. **Start with Pattern 1** (Token-Based) for initial setup
2. **Define all tokens** in a shared core package
3. **Keep interfaces** separate from implementations
4. **Export modules** not implementation classes
5. **Test each package** with mocked dependencies
6. **Use manual registration** until auto-wire is truly needed
7. **Document token usage** for team clarity

## Summary

**For most monorepos:** Use **Pattern 2 (Package Modules)** with manual registration. It provides the best balance of:
- Explicit dependency declaration
- Package encapsulation  
- Type safety
- Testability
- Performance

**Only use auto-wire** when you have 30+ packages and the manual registration becomes a maintenance burden. The explicit nature of manual registration is usually worth the extra code for the clarity it provides.