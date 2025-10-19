# Dependency Injection Implementation Plan

## Executive Summary

This document outlines the plan to implement Needle DI (Dependency Injection) in the Obsidian Tars project to replace the current framework configuration approach. This implementation will provide better type safety, testability, and maintainability while maintaining full compatibility with our esbuild-based build system.

## Current Problems

### Framework Configuration Issues
- **Tight Coupling**: Providers require knowledge of specific framework interfaces (`NoticeSystem`, `RequestSystem`, etc.)
- **Complex Configuration**: The `FrameworkConfig` interface is becoming bloated with framework-specific dependencies
- **Hard to Extend**: Adding new services requires updating multiple interfaces and implementations
- **Testing Complexity**: Mocking framework dependencies is difficult and requires complex setup
- **Implementation Specificity**: We're creating Obsidian-specific implementations in the providers package

### Architectural Debt
- **No Discovery Mechanism**: Providers cannot discover what services are available
- **No Lifecycle Management**: Services are created manually without proper DI container management
- **Type Safety Issues**: Runtime type checking instead of compile-time guarantees

## Solution: Needle DI Implementation

### Why Needle DI?

**Perfect esbuild Compatibility:**
- ✅ No reflect-metadata dependency required
- ✅ Uses native ECMAScript decorators (Stage 3 standard)
- ✅ Tree-shaking support with factory functions
- ✅ Works with `target: 'es2022'` in esbuild configuration
- ✅ Zero additional build configuration needed

**Modern Architecture:**
- ✅ ESM-based, suitable for both browser and Node.js environments
- ✅ Smart type inference everywhere
- ✅ Factory functions for auto-binding and tree-shaking
- ✅ Clean, modern API design
- ✅ MIT License, actively maintained

**Perfect for Our Use Case:**
- ✅ Framework-agnostic providers
- ✅ Type-safe service injection
- ✅ Easy testing with mocked services
- ✅ Minimal bundle impact (crucial for Obsidian plugins)
- ✅ No legacy dependencies

## Implementation Architecture

### Core Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Plugin Code   │───▶│ Needle DI        │───▶│ Provider Code   │
│                 │    │ Container        │    │                 │
│ • Register      │    │ • Service        │    │ • Constructor   │
│   Services      │    │   Registration   │    │   Injection     │
│                 │    │ • Type Safety    │    │                 │
│ • Create        │    │ • Lifecycle      │    │ • Framework     │
│   Container     │    │   Management     │    │   Agnostic      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Service Interface Design

We'll define clean, framework-agnostic service interfaces:

```typescript
// Notification Service
interface NotificationService {
  show(message: string, options?: NotificationOptions): void
  warn(message: string, options?: NotificationOptions): void
  error(message: string, options?: NotificationOptions): void
}

// HTTP Service
interface HttpService {
  request(url: string, options?: RequestOptions): Promise<HttpResponse>
  get(url: string, options?: RequestOptions): Promise<HttpResponse>
  post(url: string, data?: any, options?: RequestOptions): Promise<HttpResponse>
  put(url: string, data?: any, options?: RequestOptions): Promise<HttpResponse>
}

// Platform Service
interface PlatformService {
  isDesktop(): boolean
  isMobile(): boolean
  getOS(): 'windows' | 'macos' | 'linux' | 'ios' | 'android'
  getPlatformInfo(): PlatformInfo
}

// File System Service
interface FileSystemService {
  readFile(path: string): Promise<string>
  writeFile(path: string, content: string): Promise<void>
  exists(path: string): Promise<boolean>
  createFolder(path: string): Promise<void>
}
```

## Detailed Implementation Plan

### Phase 1: Foundation Setup

#### 1.1 Add Needle DI Dependency
**File**: `packages/providers/package.json`
```json
{
  "dependencies": {
    "@needle-di/core": "^2.0.0"
  }
}
```

#### 1.2 Configure TypeScript for Modern Decorators
**File**: `packages/providers/tsconfig.json`
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": false
  }
}
```

**Note**: Needle DI doesn't need `emitDecoratorMetadata`, which is perfect for esbuild compatibility.

#### 1.3 Update esbuild Configuration
**File**: `packages/providers/tsup.config.ts`
```typescript
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  target: 'es2022', // Required for modern decorators
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true
})
```

### Phase 2: Service Interface Definition

#### 2.1 Create Service Interfaces
**File**: `packages/providers/src/services/interfaces.ts`
```typescript
export interface NotificationService {
  show(message: string): void
  warn(message: string): void
  error(message: string): void
}

export interface HttpService {
  request(url: string, options?: RequestOptions): Promise<HttpResponse>
  get(url: string, options?: RequestOptions): Promise<HttpResponse>
  post(url: string, data?: any, options?: RequestOptions): Promise<HttpResponse>
}

export interface PlatformService {
  isDesktop(): boolean
  isMobile(): boolean
  getOS(): string
}

export interface FileSystemService {
  readFile(path: string): Promise<string>
  writeFile(path: string, content: string): Promise<void>
  exists(path: string): Promise<boolean>
  createFolder(path: string): Promise<void>
}

export interface LoggingService {
  debug(message: string, context?: any): void
  info(message: string, context?: any): void
  warn(message: string, context?: any): void
  error(message: string, context?: any): void
}
```

#### 2.2 Create Service Types
**File**: `packages/providers/src/services/types.ts`
```typescript
export interface NotificationOptions {
  timeout?: number
  persistent?: boolean
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: string
  timeout?: number
}

export interface HttpResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  text: string
  json?: any
}

export interface PlatformInfo {
  isDesktopApp: boolean
  isMobileApp: boolean
  isMacOS: boolean
  isWindows: boolean
  isLinux: boolean
  isIosApp: boolean
  isAndroidApp: boolean
}
```

### Phase 3: Provider Refactoring

#### 3.1 Update Base Options Interface
**File**: `packages/providers/src/interfaces/base.ts`
```typescript
import { Container } from '@needle-di/core'
import type { NotificationService, HttpService, PlatformService, FileSystemService, LoggingService } from '../services/interfaces'

export interface BaseOptions {
  apiKey: string
  baseURL: string
  model: string
  parameters: Record<string, unknown>
  enableWebSearch?: boolean

  // DI Container instead of framework config
  container?: Container

  // MCP tool integration
  mcpToolInjector?: MCPToolInjector
  mcpIntegration?: MCPIntegration

  // Document context
  documentPath?: string
  statusBarManager?: StatusBarManager
  editor?: Editor
  pluginSettings?: PluginSettings
  documentWriteLock?: DocumentWriteLock
  beforeToolExecution?: () => Promise<void>
}
```

#### 3.2 Refactor Claude Provider Example
**Current Code** (`packages/providers/src/implementations/claude.ts`):
```typescript
const sendRequestFunc = (settings: ClaudeOptions): SendRequest =>
  async function* (messages: Message[], controller: AbortController, resolveEmbedAsBinary: ResolveEmbedAsBinary) {
    const { frameworkConfig, ...otherOptions } = settings

    if (frameworkConfig?.noticeSystem) {
      frameworkConfig.noticeSystem.show(noticeMessage)
    }
    // ... rest of implementation
  }
```

**New Code** with Needle DI:
```typescript
import { injectable, inject } from '@needle-di/core'
import type { NotificationService, HttpService, LoggingService } from '../services/interfaces'

@injectable()
export class ClaudeProvider {
  constructor(
    @inject(NotificationService) private notifications: NotificationService,
    @inject(HttpService) private http: HttpService,
    @inject(LoggingService) private logger: LoggingService
  ) {}

  createSendRequest(options: BaseOptions): SendRequest {
    return async function* (messages: Message[], controller: AbortController, resolveEmbedAsBinary: ResolveEmbedAsBinary) {
      // Clean service access with type safety
      this.notifications.show('Processing Claude request...')
      this.logger.debug('Starting Claude generation', { messageCount: messages.length })

      // ... rest of implementation using injected services
    }
  }
}
```

#### 3.3 Update Vendor Registration
**File**: `packages/providers/src/implementations/claude.ts`
```typescript
export const claudeVendor: Vendor = {
  name: 'Claude',
  defaultOptions: {
    apiKey: '',
    baseURL: 'https://api.anthropic.com',
    model: 'claude-3-5-sonnet-latest',
    parameters: {},
    enableWebSearch: false,
    mcpToolInjector: undefined,
    mcpIntegration: undefined
  },
  models: ['claude-3-5-sonnet-latest', 'claude-3-opus-latest'],
  websiteToObtainKey: 'https://console.anthropic.com/',
  capabilities: ['Text Generation', 'Image Vision', 'PDF Vision', 'Reasoning', 'Tool Calling'],
  sendRequestFunc: (options: BaseOptions) => {
    const provider = new ClaudeProvider()
    return provider.createSendRequest(options)
  }
}
```

### Phase 4: Plugin Integration

#### 4.1 Create Service Implementations
**File**: `packages/plugin/src/services/obsidian/NotificationService.ts`
```typescript
import { Notice } from 'obsidian'
import type { NotificationService } from '@tars/providers'

export class ObsidianNotificationService implements NotificationService {
  show(message: string): void {
    new Notice(message)
  }

  warn(message: string): void {
    new Notice(`⚠️ ${message}`)
  }

  error(message: string): void {
    new Notice(`❌ ${message}`)
  }
}
```

**File**: `packages/plugin/src/services/obsidian/HttpService.ts`
```typescript
import { requestUrl } from 'obsidian'
import type { HttpService, HttpResponse, RequestOptions } from '@tars/providers'

export class ObsidianHttpService implements HttpService {
  async request(url: string, options?: RequestOptions): Promise<HttpResponse> {
    const response = await requestUrl({
      url,
      method: options?.method || 'GET',
      headers: options?.headers,
      body: options?.body,
      throw: true
    })

    return {
      status: response.status,
      statusText: response.status.toString(),
      headers: response.headers || {},
      text: response.text,
      json: response.json
    }
  }

  async get(url: string, options?: RequestOptions): Promise<HttpResponse> {
    return this.request(url, { ...options, method: 'GET' })
  }

  async post(url: string, data?: any, options?: RequestOptions): Promise<HttpResponse> {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: typeof data === 'string' ? data : JSON.stringify(data)
    })
  }
}
```

#### 4.2 Container Setup in Plugin
**File**: `packages/plugin/src/services/container.ts`
```typescript
import { Container } from '@needle-di/core'
import { ObsidianNotificationService } from './obsidian/NotificationService'
import { ObsidianHttpService } from './obsidian/HttpService'
import { ObsidianPlatformService } from './obsidian/PlatformService'
import { ObsidianFileSystemService } from './obsidian/FileSystemService'
import { ObsidianLoggingService } from './obsidian/LoggingService'

export function createDIContainer(): Container {
  const container = new Container()

  // Register framework-specific implementations
  container.register(NotificationService).toClass(ObsidianNotificationService)
  container.register(HttpService).toClass(ObsidianHttpService)
  container.register(PlatformService).toClass(ObsidianPlatformService)
  container.register(FileSystemService).toClass(ObsidianFileSystemService)
  container.register(LoggingService).toClass(ObsidianLoggingService)

  return container
}
```

#### 4.3 Update Provider Options
**File**: `packages/plugin/src/editor.ts`
```typescript
import { createDIContainer } from './services/container'

const createDecoratedSendRequest = async (env: RunEnv, vendor: Vendor, provider: ProviderSettings) => {
  // Create DI container with framework services
  const container = createDIContainer()

  // Add container to provider options instead of framework config
  const optionsWithDI = {
    ...provider.options,
    container
  }

  // ... rest of implementation
}
```

### Phase 5: Testing Implementation

#### 5.1 Mock Services for Testing
**File**: `packages/providers/tests/mocks/MockServices.ts`
```typescript
import type { NotificationService, HttpService, LoggingService } from '../../src/services/interfaces'

export class MockNotificationService implements NotificationService {
  messages: string[] = []

  show(message: string): void {
    this.messages.push(message)
  }

  warn(message: string): void {
    this.messages.push(`WARN: ${message}`)
  }

  error(message: string): void {
    this.messages.push(`ERROR: ${message}`)
  }

  clear(): void {
    this.messages = []
  }
}

export class MockHttpService implements HttpService {
  responses: Map<string, any> = new Map()

  setMockResponse(url: string, response: any): void {
    this.responses.set(url, response)
  }

  async request(url: string): Promise<any> {
    return this.responses.get(url) || { status: 404, text: 'Not found' }
  }

  async get(url: string): Promise<any> {
    return this.request(url)
  }

  async post(url: string, data?: any): Promise<any> {
    return this.request(url)
  }
}
```

#### 5.2 Test Setup
**File**: `packages/providers/tests/setup/di-container.ts`
```typescript
import { Container } from '@needle-di/core'
import { MockNotificationService, MockHttpService } from '../mocks/MockServices'
import type { NotificationService, HttpService } from '../../src/services/interfaces'

export function createTestContainer(): Container {
  const container = new Container()

  container.register(NotificationService).toClass(MockNotificationService)
  container.register(HttpService).toClass(MockHttpService)

  return container
}
```

### Phase 6: Migration Strategy

#### 6.1 Gradual Migration Approach

1. **Parallel Implementation**: Keep existing framework config alongside DI during transition
2. **Provider-by-Provider Migration**: Migrate one provider at a time
3. **Feature Flag**: Use feature flag to switch between old and new implementation
4. **Testing**: Ensure comprehensive test coverage for each migrated provider

#### 6.2 Backward Compatibility

**File**: `packages/providers/src/interfaces/base.ts`
```typescript
export interface BaseOptions {
  // ... existing options

  // New DI container (optional during migration)
  container?: Container

  // Legacy framework config (deprecated, to be removed)
  frameworkConfig?: FrameworkConfig
}
```

#### 6.3 Migration Timeline

- **Week 1**: Foundation setup and service interfaces
- **Week 2**: Implement core services and container setup
- **Week 3**: Migrate 2-3 providers to DI (Claude, OpenAI, DeepSeek)
- **Week 4**: Migrate remaining providers and remove legacy code
- **Week 5**: Testing, documentation, and final cleanup

## Benefits of Implementation

### Immediate Benefits
1. **Cleaner Architecture**: Clear separation between framework and business logic
2. **Better Type Safety**: Compile-time dependency resolution
3. **Easier Testing**: Simple service mocking with clean interfaces
4. **Reduced Bundle Size**: Tree-shaking removes unused service code
5. **Better Developer Experience**: Intellisense and type safety for dependencies

### Long-term Benefits
1. **Framework Agnostic**: Easy to support other frameworks (VSCode, etc.)
2. **Scalability**: Easy to add new services without touching core code
3. **Maintainability**: Clear dependency relationships and interfaces
4. **Testability**: Comprehensive testing with easy mocking
5. **Performance**: Optimized bundle sizes with tree-shaking

## Risk Assessment and Mitigation

### Potential Risks

1. **Build Complexity**: Adding Needle DI might affect build process
   - **Mitigation**: Needle DI is specifically designed for esbuild compatibility

2. **Learning Curve**: Team needs to learn Needle DI patterns
   - **Mitigation**: Comprehensive documentation and examples

3. **Migration Complexity**: Large codebase migration might introduce bugs
   - **Mitigation**: Gradual migration with comprehensive testing

4. **Performance Impact**: DI container overhead
   - **Mitigation**: Needle DI is lightweight with minimal runtime overhead

### Rollback Plan

1. **Feature Flag**: Keep legacy code available during transition
2. **Branch Strategy**: Implement in feature branch with thorough testing
3. **Gradual Rollout**: Migrate providers one at a time
4. **Monitoring**: Watch for performance regressions or build issues

## Success Criteria

### Technical Success
- [ ] All providers use DI instead of framework config
- [ ] Zero reflect-metadata dependency
- [ ] esbuild builds successfully without errors
- [ ] All tests pass with mocked services
- [ ] Bundle size does not increase significantly

### Functional Success
- [ ] All existing functionality preserved
- [ ] No breaking changes to public APIs
- [ ] Improved error handling and logging
- [ ] Better test coverage with easy mocking

### Architectural Success
- [ ] Clear separation between framework and business logic
- [ ] Easy to add new services without modifying core code
- [ ] Framework-agnostic provider implementations
- [ ] Clean, maintainable codebase structure

## Timeline and Resources

### Development Timeline
- **Phase 1 (Week 1)**: Foundation and service interfaces
- **Phase 2 (Week 2)**: Core services and container setup
- **Phase 3 (Week 3)**: Provider refactoring
- **Phase 4 (Week 4)**: Plugin integration and testing
- **Phase 5 (Week 5)**: Migration and cleanup

### Resource Requirements
- **Development**: 1-2 developers for implementation
- **Testing**: Comprehensive test suite development
- **Documentation**: Updated API documentation and examples
- **Review**: Code review and architectural review

## Conclusion

Implementing Needle DI will significantly improve our codebase architecture while maintaining full compatibility with our esbuild-based build system. The transition will provide better type safety, testability, and maintainability, making our providers truly framework-agnostic and easier to extend in the future.

The key advantage is that we can achieve enterprise-level dependency injection patterns without the complexity and build tool issues that typically come with traditional DI frameworks like TSyringe or Inversify.

---

*Last Updated: 2025-10-18*
*Author: Development Team*
*Version: 1.0*