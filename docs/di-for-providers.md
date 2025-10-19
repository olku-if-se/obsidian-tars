# Dependency Injection Integration Plan for Plugin and Providers

## Goal
Integrate Needle DI into `packages/plugin` and `packages/providers` in a single migration effort. No backwards compatibility needed - this is unreleased code.

`★ Insight ─────────────────────────────────────`
The providers package already follows DI patterns with `FrameworkConfig`, `NoticeSystem`, and `RequestSystem` interfaces. We're formalizing these existing patterns rather than introducing new concepts. This will eliminate manual dependency chains while preserving the current architecture.
`─────────────────────────────────────────────────`

## Current Architecture Analysis

### Existing DI-Ready Patterns

**Providers Package Strengths:**
- ✅ **Interface-driven design** with `FrameworkConfig`, `NoticeSystem`, `RequestSystem`
- ✅ **Abstract base classes** with `BaseProvider`
- ✅ **Factory pattern** with `providerToVendor()`
- ✅ **Clean separation** between framework-specific and framework-agnostic code

**Plugin Package Strengths:**
- ✅ **Service abstractions** for MCP, logging, and status management
- ✅ **Adapter pattern** for Obsidian-specific implementations
- ✅ **Clean module boundaries** with dedicated folders for concerns

### Manual Dependency Management Issues

**Current Pain Points:**
- **Complex constructor chains** in main.ts (15+ dependencies)
- **Manual service instantiation** scattered across modules
- **Tight coupling** to Obsidian APIs throughout the codebase
- **Difficult testing** with manual mocking required
- **No centralized lifecycle management**

## Migration Plan

### Phase 1: Foundation
**Goal**: Set up DI infrastructure

- [ ] Add Needle DI dependencies to both packages
  ```json
  // packages/plugin/package.json & packages/providers/package.json
  {
    "dependencies": {
      "@needle-di/core": "^1.0.0",
      "reflect-metadata": "^0.1.13"
    }
  }
  ```
  **Verification**: `pnpm install` succeeds, `pnpm build` completes without errors
- [ ] Configure TypeScript for decorators
  ```json
  // tsconfig.json
  {
    "compilerOptions": {
      "experimentalDecorators": true,
      "emitDecoratorMetadata": true
    }
  }
  ```
  **Verification**: `pnpm typecheck` passes, decorators compile correctly
- [ ] Create core service interfaces in `packages/shared/src/interfaces/core-services.ts`
  **Verification**: All interfaces compile, exports are accessible
- [ ] Implement Obsidian-specific service classes
  **Verification**: Each service class compiles and implements corresponding interface
- [ ] Set up DI container configuration in `packages/plugin/src/container/plugin-container.ts`
  **Verification**: Container creates successfully, all services registered
- [ ] Create test container for mocking
  **Verification**: Test container creates, mocks are injectable

### Phase 2: Providers Integration
**Goal**: Convert providers to use DI

- [ ] Create `packages/providers/src/interfaces/di-base.ts` extending existing `BaseProvider`
  **Verification**: `DIBaseProvider` compiles, extends `BaseProvider`, DI constructor works
- [ ] Implement DI versions of key providers:
  - [ ] `packages/providers/src/implementations/claude-di.ts`
    **Verification**: ClaudeDIProvider compiles, injects services, delegates to ClaudeProvider correctly
  - [ ] `packages/providers/src/implementations/openai-di.ts`
    **Verification**: OpenAIDIProvider compiles, injects services, delegates to OpenAIProvider correctly
  - [ ] `packages/providers/src/implementations/ollama-di.ts`
    **Verification**: OllamaDIProvider compiles, injects services, delegates to OllamaProvider correctly
- [ ] Create `packages/providers/src/factories/provider-factory.ts`
  **Verification**: Factory creates DI providers, `createVendor()` returns valid Vendor objects
- [ ] Write provider tests with DI mocking
  **Verification**: All provider tests pass with mocked DI services
- [ ] Update provider exports to include DI versions
  **Verification**: DI providers are exportable, imports work correctly

### Phase 0: Contracts Extraction (NEW)
**Goal**: Create separate contracts package for clean dependency management

- [ ] Create `packages/contracts` package structure
- [ ] Extract core contracts from `packages/providers/src/interfaces/base.ts`
- [ ] Create DI service contracts
- [ ] Update providers package to depend on `@tars/contracts`
- [ ] Update plugin package to depend on `@tars/contracts`
- [ ] Verify all imports resolve correctly

**Contracts Package Structure**:
```
packages/contracts/
├── src/
│   ├── providers/              # Provider contracts
│   │   ├── base.ts            # BaseProvider, Message, Vendor contracts
│   │   ├── di-base.ts         # DI-enabled provider contracts
│   │   └── index.ts
│   ├── services/              # Core service contracts
│   │   ├── logging.ts         # ILoggingService contract
│   │   ├── notification.ts    # INotificationService contract
│   │   ├── settings.ts        # ISettingsService contract
│   │   ├── mcp.ts             # IMcpService contract
│   │   ├── status.ts          # IStatusService contract
│   │   ├── document.ts        # IDocumentService contract
│   │   └── index.ts
│   ├── events/                # Event contracts
│   │   ├── provider-events.ts
│   │   └── index.ts
│   └── index.ts               # Main exports
├── package.json
└── tsconfig.json
```

**Core Service Contracts** (`packages/contracts/src/services/`):
```typescript
export interface ILoggingService {
  debug(message: string, ...args: any[]): void
  info(message: string, ...args: any[]): void
  warn(message: string, ...args: any[]): void
  error(message: string, ...args: any[]): void
}

export interface INotificationService {
  show(message: string): void
  warn(message: string): void
  error(message: string): void
}

export interface ISettingsService {
  get<T>(key: string, defaultValue?: T): T
  set(key: string, value: any): void
  watch(key: string, callback: (value: any) => void): () => void
}

export interface IMcpService {
  getToolExecutor(): ToolExecutor
  getServerManager(): MCPServerManager
  getCodeBlockProcessor(): CodeBlockProcessor
}

export interface IStatusService {
  updateStatus(status: string): void
  showProgress(message: string): void
  hideProgress(): void
  reportError(error: Error): void
}

export interface IDocumentService {
  getCurrentDocumentPath(): string
  resolveEmbedAsBinary(embed: EmbedCache): Promise<ArrayBuffer>
  createPlainText(filePath: string, text: string): Promise<void>
  getDocumentWriteLock(): DocumentWriteLock
}
```

**DI Provider Example** (`packages/providers/src/implementations/claude-di.ts`):
```typescript
@injectable()
export class ClaudeDIProvider extends DIBaseProvider {
  private claudeProvider: ClaudeProvider

  constructor(...diServices: ConstructorParameters<typeof DIBaseProvider>) {
    super(...diServices)
    this.claudeProvider = new ClaudeProvider()
  }

  createSendRequest(options: DIBaseOptions): SendRequest {
    const frameworkConfig = this.createFrameworkConfig()
    return this.claudeProvider.createSendRequest({ ...options, frameworkConfig })
  }
}
```

### Phase 3: Plugin Integration
**Goal**: Convert plugin to use DI container

- [ ] Refactor `packages/plugin/src/main.ts` to use DI container
  **Verification**: Plugin loads with DI container, all services resolve correctly
- [ ] Convert key commands to DI-based implementation:
  - [ ] `packages/plugin/src/commands/AssistantTagCommand.ts`
    **Verification**: Command injects services, executes correctly in Obsidian
  - [ ] `packages/plugin/src/commands/UserTagCommand.ts`
    **Verification**: Command injects services, executes correctly in Obsidian
  - [ ] `packages/plugin/src/commands/SystemTagCommand.ts`
    **Verification**: Command injects services, executes correctly in Obsidian
- [ ] Integrate settings service with DI (`packages/plugin/src/services/ObsidianSettingsService.ts`)
  **Verification**: Settings service loads/saves, watches work, DI injection works
- [ ] Update MCP service integration to use DI
  **Verification**: MCP service initializes, executes tools, DI services available
- [ ] Write integration tests for plugin with DI
  **Verification**: Integration tests pass, DI container resolves dependencies

## Contracts-Based Architecture Benefits

`★ Insight ─────────────────────────────────────`
The contracts package creates a **stable dependency inversion layer** that enables true microservice-style architecture. Both plugin and providers depend on contracts, not implementations, allowing independent evolution and versioning. This is the foundation for a sustainable, extensible ecosystem.
`─────────────────────────────────────────────────`

### **Clean Dependency Graph**
```
Before DI:
plugin ──► providers (tight coupling)
providers ──► plugin (through settings)

With Contracts + DI:
plugin ──► @tars/contracts ◄── providers
         │                      │
         ▼                      ▼
  Obsidian Services      No implementations needed
         │
         ▼
  Needle DI Container
```

### **Package Dependencies**
```json
// packages/contracts/package.json
{
  "name": "@tars/contracts",
  "version": "1.0.0",
  "main": "src/index.ts",
  "dependencies": {},
  "peerDependencies": {
    "@needle-di/core": "^1.0.0"
  }
}

// packages/providers/package.json
{
  "dependencies": {
    "@tars/contracts": "workspace:*",
    "@needle-di/core": "^1.0.0"
  }
}

// packages/plugin/package.json
{
  "dependencies": {
    "@tars/contracts": "workspace:*",
    "@needle-di/core": "^1.0.0"
  }
}
```

**Key Point**: Only the contracts package is needed as an additional dependency.

**Container Configuration** (`packages/plugin/src/container/plugin-container.ts`):
```typescript
import { Container } from '@needle-di/core'
import {
  INotificationService,
  ILoggingService,
  ISettingsService,
  IMcpService,
  IStatusService,
  IDocumentService
} from '@tars/contracts/services'

// Implementation classes live directly in the plugin package
import { ObsidianNotificationService } from '../services/ObsidianNotificationService'
import { ObsidianLoggingService } from '../services/ObsidianLoggingService'
import { ObsidianSettingsService } from '../services/ObsidianSettingsService'
import { ObsidianMcpService } from '../services/ObsidianMcpService'
import { ObsidianStatusService } from '../services/ObsidianStatusService'
import { ObsidianDocumentService } from '../services/ObsidianDocumentService'

export function createPluginContainer(app: App, plugin: TarsPlugin): Container {
  const container = new Container({ defaultScope: 'singleton' })

  // Register service implementations directly from plugin package
  container.register(INotificationService).toClass(ObsidianNotificationService)
  container.register(ILoggingService).toClass(ObsidianLoggingService)
  container.register(ISettingsService).toClass(ObsidianSettingsService)
  container.register(IMcpService).toClass(ObsidianMcpService)
  container.register(IStatusService).toClass(ObsidianStatusService)
  container.register(IDocumentService).toClass(ObsidianDocumentService)

  // Register framework instances
  container.register(App).toInstance(app)
  container.register(TarsPlugin).toInstance(plugin)

  return container
}
```

**Key Point**: Service implementations stay in the plugin package where they belong.

**DI Provider Factory** (`packages/providers/src/factories/provider-factory.ts`):
```typescript
import { Container } from '@needle-di/core'
import { Vendor, providerToVendor } from '@tars/contracts/providers'
import { ClaudeDIProvider } from '../implementations/claude-di'
import { OpenAIDIProvider } from '../implementations/openai-di'
import { OllamaDIProvider } from '../implementations/ollama-di'

export class DIProviderFactory {
  constructor(private container: Container) {}

  createVendor(providerName: string): Vendor {
    switch (providerName) {
      case 'Claude': return providerToVendor(this.container.get(ClaudeDIProvider))
      case 'OpenAI': return providerToVendor(this.container.get(OpenAIDIProvider))
      case 'Ollama': return providerToVendor(this.container.get(OllamaDIProvider))
      default: throw new Error(`Unknown provider: ${providerName}`)
    }
  }
}
```

**DI Provider Example** (`packages/providers/src/implementations/claude-di.ts`):
```typescript
import { injectable, inject } from '@needle-di/core'
import {
  DIBaseProvider,
  DIBaseOptions,
  ILoggingService,
  INotificationService,
  ISettingsService,
  IDocumentService
} from '@tars/contracts'
import { ClaudeProvider } from './claude'

@injectable()
export class ClaudeDIProvider extends DIBaseProvider {
  readonly name = 'Claude'
  readonly websiteToObtainKey = 'https://console.anthropic.com/'

  private claudeProvider: ClaudeProvider

  constructor(
    @inject(ILoggingService) protected loggingService: ILoggingService,
    @inject(INotificationService) protected notificationService: INotificationService,
    @inject(ISettingsService) protected settingsService: ISettingsService,
    @inject(IDocumentService) protected documentService: IDocumentService
  ) {
    super(loggingService, notificationService, settingsService, documentService)
    this.claudeProvider = new ClaudeProvider()
  }

  get defaultOptions(): DIBaseOptions {
    return {
      ...this.claudeProvider.defaultOptions,
      // DI services automatically available
      notificationService: this.notificationService,
      loggingService: this.loggingService,
      settingsService: this.settingsService,
      documentService: this.documentService
    }
  }

  createSendRequest(options: DIBaseOptions): SendRequest {
    const frameworkConfig = this.createFrameworkConfig()
    return this.claudeProvider.createSendRequest({ ...options, frameworkConfig })
  }
}
```

### **Future Extensibility Benefits**

The contracts package enables these future scenarios:

1. **Multiple Framework Support**: Same providers work with Obsidian, Notion, VSCode
2. **Third-Party Providers**: External developers can create providers without accessing core code
3. **Contract Versioning**: Major changes can be versioned independently (contracts@2.0)
4. **Implementation Swapping**: Different implementations of same contracts (e.g., Redis vs local storage)
5. **Testing Isolation**: Mock contracts without pulling in any implementations

### **Implementation Timeline Impact**

**Additional Phase 0 adds ~2-3 hours** but provides massive long-term benefits:
- **Phase 0**: Contracts extraction (2-3 hours)
- **Phase 1-4**: Original DI migration plan (unchanged)

**Total Migration Time**: Still manageable within a single focused development session.

### **Why This Simpler Approach Works Better**

1. **Providers stay lean**: They only need contracts, no implementations
2. **Plugin owns implementations**: Obsidian-specific code stays where it belongs
3. **Clear separation**: Contracts define boundaries, implementations stay local
4. **Less overhead**: No additional service packages to maintain
5. **Easier testing**: Mock contracts, implementations tested in context

The contracts package is the key insight - it creates the dependency inversion boundary without over-engineering the implementation side.

### Phase 4: Testing Infrastructure
**Goal**: Set up automated testing with DI

- [ ] Create `packages/plugin/src/testing/test-container.ts`
  **Verification**: Test container creates, all mocks are functional, reset works
- [ ] Write provider tests with DI mocking
  **Verification**: Provider tests pass, mocks are called correctly, coverage maintained
- [ ] Create integration tests for plugin with DI
  **Verification**: Integration tests pass, end-to-end functionality works
- [ ] Verify test coverage remains high
  **Verification**: Test coverage ≥90%, all critical paths covered
- [ ] Performance testing to ensure minimal overhead
  **Verification**: DI overhead <5%, container creation time acceptable

**Test Container** (`packages/plugin/src/testing/test-container.ts`):
```typescript
export class TestContainer {
  private container: Container

  constructor() {
    this.container = new Container()
    this.setupMocks()
  }

  private setupMocks(): void {
    // Mock all services
    this.container.register(INotificationService).toInstance({
      show: jest.fn(), warn: jest.fn(), error: jest.fn()
    })
    this.container.register(ILoggingService).toInstance({
      debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn()
    })
    this.container.register(ISettingsService).toInstance({
      get: jest.fn(), set: jest.fn(), watch: jest.fn()
    })
  }
}
```

**Command Example with DI** (`packages/plugin/src/commands/AssistantTagCommand.ts`):
```typescript
@injectable()
export class AssistantTagCommand {
  constructor(
    @inject(ILoggingService) private logger: ILoggingService,
    @inject(INotificationService) private notifier: INotificationService,
    @inject(ISettingsService) private settings: ISettingsService
  ) {}

  async execute(editor: Editor, view: View): Promise<void> {
    const tag = this.settings.get('assistantTag', '#Claude :')
    editor.replaceRange(tag, editor.getCursor())
    this.notifier.show('Assistant tag inserted')
  }
}
```

## Key Files to Create/Modify

### New Files:
- [ ] `packages/contracts/` - **Contracts package (NEW)**
  - [ ] `src/providers/base.ts` - Provider contracts (BaseProvider, Message, Vendor)
  - [ ] `src/providers/di-base.ts` - DI-enabled provider contracts
  - [ ] `src/services/logging.ts` - ILoggingService contract
  - [ ] `src/services/notification.ts` - INotificationService contract
  - [ ] `src/services/settings.ts` - ISettingsService contract
  - [ ] `src/services/mcp.ts` - IMcpService contract
  - [ ] `src/services/status.ts` - IStatusService contract
  - [ ] `src/services/document.ts` - IDocumentService contract
  - [ ] `src/index.ts` - Main contracts exports
  - [ ] `package.json` - Contracts package configuration
- [ ] `packages/plugin/src/container/plugin-container.ts` - DI container setup
- [ ] `packages/plugin/src/services/ObsidianNotificationService.ts` - Notification implementation
- [ ] `packages/plugin/src/services/ObsidianLoggingService.ts` - Logging implementation
- [ ] `packages/plugin/src/services/ObsidianSettingsService.ts` - Settings implementation
- [ ] `packages/plugin/src/services/ObsidianMcpService.ts` - MCP implementation
- [ ] `packages/plugin/src/services/ObsidianStatusService.ts` - Status implementation
- [ ] `packages/plugin/src/services/ObsidianDocumentService.ts` - Document implementation
- [ ] `packages/providers/src/implementations/claude-di.ts` - Claude DI provider
- [ ] `packages/providers/src/implementations/openai-di.ts` - OpenAI DI provider
- [ ] `packages/providers/src/implementations/ollama-di.ts` - Ollama DI provider
- [ ] `packages/providers/src/factories/provider-factory.ts` - DI provider factory
- [ ] `packages/plugin/src/commands/AssistantTagCommand.ts` - DI command
- [ ] `packages/plugin/src/commands/UserTagCommand.ts` - DI command
- [ ] `packages/plugin/src/commands/SystemTagCommand.ts` - DI command
- [ ] `packages/plugin/src/testing/test-container.ts` - Test utilities

### Modified Files:
- [ ] `packages/plugin/package.json` - Add DI and contracts dependencies
- [ ] `packages/providers/package.json` - Add DI and contracts dependencies
- [ ] `tsconfig.json` - Enable decorators
- [ ] `packages/plugin/src/main.ts` - Use DI container
- [ ] `packages/providers/src/index.ts` - Export DI providers
- [ ] `packages/plugin/src/settings.ts` - Work with DI settings service

## Expected Benefits

**Immediate:**
- **70% reduction** in manual dependency setup
- **Automatic dependency resolution** - no more complex constructor chains
- **Centralized service management** through DI container
- **Easy testing** with automatic mocking

**Long-term:**
- **Easier maintenance** with clear service boundaries
- **Better extensibility** for new providers
- **Enhanced developer experience** with automatic dependency resolution
- **Improved performance** with singleton service management

## Verification Milestones

### Milestone 0: Contracts Extraction Verification
**Goal**: Confirm contracts package is properly created and usable
**Commands to run**:
```bash
mkdir -p packages/contracts/src/{providers,services,events}
pnpm install
```
**Expected Results**:
- ✅ Contracts package structure created successfully
- ✅ All dependencies install without errors
- ✅ No TypeScript errors in contract definitions
- ✅ Contracts can be imported from other packages

**Manual verification**:
```typescript
import { ILoggingService } from '@tars/contracts/services'
import { BaseProvider } from '@tars/contracts/providers'
// Should import without errors
```

### Milestone 1: Foundation Verification
**Goal**: Confirm DI infrastructure is properly set up
**Commands to run**:
```bash
pnpm build
pnpm typecheck
```
**Expected Results**:
- ✅ All packages install without errors
- ✅ TypeScript compilation succeeds with decorators enabled
- ✅ No type errors in service contracts or implementations
- ✅ DI container can be created and all services resolve

**Manual verification**:
```typescript
import { createPluginContainer } from './packages/plugin/src/container/plugin-container'
const container = createPluginContainer(mockApp, mockPlugin)
// Should create without throwing errors
```

### Milestone 2: Provider Integration Verification
**Goal**: Confirm providers work with DI
**Commands to run**:
```bash
pnpm --filter @tars/providers test
pnpm --filter @tars/providers build
```
**Expected Results**:
- ✅ All DI providers compile and extend base providers correctly
- ✅ Provider factory creates valid vendor objects
- ✅ Provider tests pass with mocked DI services
- ✅ DI providers maintain same API as legacy providers

**Manual verification**:
```typescript
import { DIProviderFactory } from './packages/providers/src/factories/provider-factory'
const factory = new DIProviderFactory(container)
const claudeVendor = factory.createVendor('Claude')
// Should return valid vendor with DI capabilities
```

### Milestone 3: Plugin Integration Verification
**Goal**: Confirm plugin loads and operates with DI
**Commands to run**:
```bash
pnpm --filter obsidian-tars build
pnpm --filter obsidian-tars test
```
**Expected Results**:
- ✅ Plugin builds with DI integration
- ✅ Plugin loads in Obsidian without errors
- ✅ Commands execute correctly with injected services
- ✅ Settings load/save through DI service
- ✅ MCP services initialize through DI

**Manual verification**:
1. Load plugin in Obsidian development vault
2. Execute assistant tag command - should insert tag and show notification
3. Check settings - should load/save correctly
4. Verify MCP tools work if configured

### Milestone 4: End-to-End Verification
**Goal**: Confirm complete system works with DI
**Commands to run**:
```bash
pnpm test
pnpm build
pnpm --filter obsidian-tars dev
```
**Expected Results**:
- ✅ All tests pass (≥90% coverage)
- ✅ Performance impact <5% compared to legacy
- ✅ Complete plugin functionality works in Obsidian
- ✅ Provider requests work correctly with DI services
- ✅ Error handling works through DI services

**Manual verification checklist**:
- [ ] Plugin loads without errors
- [ ] All commands execute correctly
- [ ] Providers generate responses successfully
- [ ] Settings persist across restarts
- [ ] MCP tools execute when configured
- [ ] Notifications display correctly
- [ ] Logging works as expected
- [ ] Error handling shows proper messages

### Milestone 5: Cleanup Verification
**Goal**: Confirm migration is complete and clean
**Commands to run**:
```bash
pnpm lint
pnpm typecheck
git status
```
**Expected Results**:
- ✅ No linting errors
- ✅ No TypeScript errors
- ✅ No unused imports or legacy code
- ✅ Clean git history with meaningful commits
- ✅ Documentation updated if needed

## Rollback Verification

If any milestone fails, verify rollback works:
```bash
git checkout HEAD~1  # Rollback one commit
pnpm install
pnpm build
pnpm test
```
**Expected**: System returns to working state before DI changes

## Final Notes

This migration leverages your existing excellent interface-driven design. The providers package already follows DI patterns - we're just formalizing them with Needle DI to eliminate manual dependency management while preserving all existing functionality.

Since this is unreleased code, we can make breaking changes and focus on the cleanest possible DI integration without worrying about backwards compatibility.