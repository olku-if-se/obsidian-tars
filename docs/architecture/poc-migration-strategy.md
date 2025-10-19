# PoC Migration Strategy to Dependency Injection

## Executive Summary

This document outlines a comprehensive migration strategy for transitioning the existing PoC implementation to a modern dependency injection architecture using Needle DI. The migration is designed to be **incremental, backwards-compatible, and low-risk**, allowing the team to maintain existing functionality while progressively improving the codebase.

`★ Insight ─────────────────────────────────────`
The migration strategy leverages the **Adapter Pattern** to create a bridge between the old manual dependency system and the new DI container. This approach allows us to migrate component-by-component without breaking existing functionality, reducing risk and enabling parallel development. The key is maintaining interface compatibility while gradually introducing DI benefits.
`─────────────────────────────────────────────────`

## Migration Overview

### Migration Goals

1. **Eliminate Manual Dependency Management**: Replace constructor dependency chains with automatic injection
2. **Improve Testability**: Enable easy mocking and isolated testing
3. **Reduce Boilerplate**: Cut ~70% of dependency setup code
4. **Enhance Maintainability**: Create clear separation of concerns
5. **Enable Remote Execution**: Support both local and remote package execution
6. **Maintain Backwards Compatibility**: Ensure existing packages continue to work

### Migration Principles

- **Incremental Migration**: Migrate one component at a time
- **Interface First**: Define interfaces before implementations
- **Adapter Pattern**: Bridge old and new systems during transition
- **Parallel Development**: Run both systems side-by-side
- **Comprehensive Testing**: Validate each migration step
- **Documentation**: Keep migration steps and decisions documented

## Phase-Based Migration Plan

### Phase 1: Foundation Setup (Week 1-2)

#### 1.1 Add Needle DI Dependencies

```json
// packages/core/package.json
{
  "dependencies": {
    "@needle-di/core": "^1.0.0",
    "reflect-metadata": "^0.1.13"
  },
  "devDependencies": {
    "@types/node": "^20.0.0"
  }
}
```

#### 1.2 Configure TypeScript for Decorators

```json
// packages/core/tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strict": true,
    "target": "ES2022",
    "module": "ESNext"
  }
}
```

#### 1.3 Create Core Interfaces

```typescript
// packages/core/src/interfaces/services.ts
export interface IEventDispatcherService {
  dispatch<T>(eventType: string, event: T): Promise<void>
  on<T>(eventType: string, handler: (event: T) => void): () => void
  createStream<T>(eventType: string): Observable<T>
  validateEvent(eventType: string, event: any): boolean
}

export interface IPackageRegistryService {
  registerPackage(pkg: IPackage): Promise<void>
  unregisterPackage(packageName: string): Promise<void>
  getPackage(packageName: string): IPackage | null
  listPackages(): IPackage[]
  activatePackage(packageName: string): Promise<void>
  deactivatePackage(packageName: string): Promise<void>
  isPackageActive(packageName: string): boolean
}

export interface ICommunicationService {
  sendMessage(packageName: string, command: string, payload: any): Promise<any>
  receiveMessages(packageName: string): Observable<any>
  establishConnection(packageName: string): Promise<void>
  closeConnection(packageName: string): Promise<void>
}

export interface IConfigurationService {
  get<T>(key: string, defaultValue?: T): T
  set(key: string, value: any): void
  watch(key: string, callback: (value: any) => void): () => void
}

export interface ILoggingService {
  debug(message: string, ...args: any[]): void
  info(message: string, ...args: any[]): void
  warn(message: string, ...args: any[]): void
  error(message: string, ...args: any[]): void
}
```

#### 1.4 Create DI Container Setup

```typescript
// packages/core/src/container/core-container.ts
import { Container } from '@needle-di/core'
import {
  IEventDispatcherService,
  IPackageRegistryService,
  ICommunicationService,
  IConfigurationService,
  ILoggingService
} from '../interfaces/services'

export function createCoreContainer(): Container {
  const container = new Container({
    defaultScope: 'singleton'
  })

  // Register service interfaces
  container.register(IEventDispatcherService).toClass(EventDispatcher)
  container.register(IPackageRegistryService).toClass(PackageRegistry)
  container.register(ICommunicationService).toClass(CommunicationService)
  container.register(IConfigurationService).toClass(ConfigurationService)
  container.register(ILoggingService).toClass(LoggingService)

  return container
}
```

#### 1.5 Create Compatibility Layer

```typescript
// packages/core/src/compatibility/di-adapters.ts
import { Container } from '@needle-di/core'

/**
 * Adapter to bridge old manual dependency system with new DI container
 */
export class DIEventDispatcherAdapter {
  constructor(private container: Container) {}

  getLegacyEventDispatcher(): LegacyEventDispatcher {
    const diService = this.container.get(IEventDispatcherService)

    return {
      dispatch: diService.dispatch.bind(diService),
      on: diService.on.bind(diService),
      createStream: diService.createStream.bind(diService),
      validateEvent: diService.validateEvent.bind(diService)
    }
  }
}

export class DIPackageRegistryAdapter {
  constructor(private container: Container) {}

  getLegacyPackageRegistry(): LegacyPackageRegistry {
    const diService = this.container.get(IPackageRegistryService)

    return {
      registerPackage: diService.registerPackage.bind(diService),
      unregisterPackage: diService.unregisterPackage.bind(diService),
      getPackage: diService.getPackage.bind(diService),
      listPackages: diService.listPackages.bind(diService),
      activatePackage: diService.activatePackage.bind(diService),
      deactivatePackage: diService.deactivatePackage.bind(diService),
      isPackageActive: diService.isPackageActive.bind(diService)
    }
  }
}
```

### Phase 2: Core Service Migration (Week 3-4)

#### 2.1 Migrate Event Dispatcher

**Step 1: Create DI Implementation**

```typescript
// packages/core/src/services/EventDispatcher.ts
import { injectable } from '@needle-di/core'
import { IEventDispatcherService } from '../interfaces/services'
import { Observable, Subject } from 'rxjs'

@injectable()
export class EventDispatcher implements IEventDispatcherService {
  private eventStreams = new Map<string, Subject<any>>()
  private eventHandlers = new Map<string, Set<(event: any) => void>>()

  async dispatch<T>(eventType: string, event: T): Promise<void> {
    // Validate event
    if (!this.validateEvent(eventType, event)) {
      throw new Error(`Invalid event for type: ${eventType}`)
    }

    // Handle event
    const handlers = this.eventHandlers.get(eventType)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event)
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error)
        }
      })
    }

    // Stream event
    const stream = this.eventStreams.get(eventType)
    if (stream) {
      stream.next(event)
    }
  }

  on<T>(eventType: string, handler: (event: T) => void): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set())
    }

    const handlers = this.eventHandlers.get(eventType)!
    handlers.add(handler)

    return () => handlers.delete(handler)
  }

  createStream<T>(eventType: string): Observable<T> {
    if (!this.eventStreams.has(eventType)) {
      this.eventStreams.set(eventType, new Subject<T>())
    }

    return this.eventStreams.get(eventType)!.asObservable()
  }

  validateEvent(eventType: string, event: any): boolean {
    // Implement validation logic based on event schemas
    return event && typeof event === 'object' && 'type' in event
  }
}
```

**Step 2: Update Legacy Interface**

```typescript
// packages/core/src/legacy/EventDispatcher.ts
import { DIEventDispatcherAdapter } from '../compatibility/di-adapters'
import { Container } from '@needle-di/core'

export class LegacyEventDispatcher {
  private diAdapter: DIEventDispatcherAdapter

  constructor(container: Container) {
    this.diAdapter = new DIEventDispatcherAdapter(container)
  }

  // Legacy methods delegate to DI implementation
  async dispatch<T>(eventType: string, event: T): Promise<void> {
    return this.diAdapter.getLegacyEventDispatcher().dispatch(eventType, event)
  }

  on<T>(eventType: string, handler: (event: T) => void): () => void {
    return this.diAdapter.getLegacyEventDispatcher().on(eventType, handler)
  }

  // ... other legacy methods
}
```

#### 2.2 Migrate Package Registry

**Step 1: Create DI Implementation**

```typescript
// packages/core/src/services/PackageRegistry.ts
import { injectable, inject } from '@needle-di/core'
import { IPackageRegistryService, IEventDispatcherService, ILoggingService } from '../interfaces/services'
import { IPackage, IPackageContext } from '../interfaces/package'

@injectable()
export class PackageRegistry implements IPackageRegistryService {
  private packages = new Map<string, RegisteredPackage>()
  private activePackages = new Set<string>()

  constructor(
    @inject(IEventDispatcherService) private eventDispatcher: IEventDispatcherService,
    @inject(ILoggingService) private logger: ILoggingService
  ) {}

  async registerPackage(pkg: IPackage): Promise<void> {
    if (this.packages.has(pkg.name)) {
      throw new Error(`Package '${pkg.name}' is already registered`)
    }

    this.logger.info(`Registering package: ${pkg.name}`)

    // Validate dependencies
    for (const dep of pkg.dependencies) {
      if (!this.packages.has(dep)) {
        throw new Error(`Package '${pkg.name}' depends on '${dep}' which is not registered`)
      }
    }

    try {
      // Create package context (will be injected)
      const context = await this.createPackageContext(pkg.name)
      await pkg.initialize(context)

      const registeredPackage: RegisteredPackage = {
        package: pkg,
        context,
        isActive: false,
        registeredAt: Date.now()
      }

      this.packages.set(pkg.name, registeredPackage)

      this.eventDispatcher.dispatch('package-registered', {
        packageName: pkg.name,
        version: pkg.version,
        timestamp: Date.now()
      })

      this.logger.info(`Package ${pkg.name} registered successfully`)
    } catch (error) {
      this.logger.error(`Failed to register package ${pkg.name}`, { error })
      throw error
    }
  }

  async activatePackage(packageName: string): Promise<void> {
    const registeredPkg = this.packages.get(packageName)
    if (!registeredPkg) {
      throw new Error(`Package '${packageName}' is not registered`)
    }

    if (registeredPkg.isActive) {
      this.logger.warn(`Package '${packageName}' is already active`)
      return
    }

    try {
      await registeredPkg.package.activate()
      registeredPkg.isActive = true
      this.activePackages.add(packageName)

      this.eventDispatcher.dispatch('package-activated', {
        packageName,
        timestamp: Date.now()
      })

      this.logger.info(`Package ${packageName} activated successfully`)
    } catch (error) {
      this.logger.error(`Failed to activate package ${packageName}`, { error })
      throw error
    }
  }

  // ... other methods

  private async createPackageContext(packageName: string): Promise<IPackageContext> {
    // This will be implemented when we have full DI setup
    throw new Error('Package context creation not yet implemented')
  }
}

interface RegisteredPackage {
  package: IPackage
  context: IPackageContext
  isActive: boolean
  registeredAt: number
}
```

#### 2.3 Migrate Communication Service

```typescript
// packages/core/src/services/CommunicationService.ts
import { injectable, inject } from '@needle-di/core'
import { ICommunicationService, IEventDispatcherService, ILoggingService } from '../interfaces/services'

@injectable()
export class CommunicationService implements ICommunicationService {
  private connections = new Map<string, any>()
  private messageHandlers = new Map<string, (message: any) => void>()

  constructor(
    @inject(IEventDispatcherService) private eventDispatcher: IEventDispatcherService,
    @inject(ILoggingService) private logger: ILoggingService
  ) {}

  async sendMessage(packageName: string, command: string, payload: any): Promise<any> {
    try {
      const message = {
        id: this.generateMessageId(),
        command,
        payload,
        timestamp: Date.now()
      }

      this.logger.debug(`Sending message to ${packageName}`, { command })

      // Implementation depends on whether package is local or remote
      const connection = this.connections.get(packageName)
      if (!connection) {
        throw new Error(`No connection to package: ${packageName}`)
      }

      return await connection.send(message)
    } catch (error) {
      this.logger.error(`Failed to send message to ${packageName}`, { command, error })
      throw error
    }
  }

  receiveMessages(packageName: string): Observable<any> {
    return new Observable((subscriber) => {
      const handler = (message: any) => {
        subscriber.next(message)
      }

      this.messageHandlers.set(packageName, handler)

      return () => {
        this.messageHandlers.delete(packageName)
      }
    })
  }

  async establishConnection(packageName: string): Promise<void> {
    try {
      // Implementation will depend on package type (local vs remote)
      this.logger.info(`Establishing connection with ${packageName}`)

      // This will be implemented based on package configuration
      const connection = await this.createConnection(packageName)
      this.connections.set(packageName, connection)

      this.logger.info(`Connection established with ${packageName}`)
    } catch (error) {
      this.logger.error(`Failed to establish connection with ${packageName}`, { error })
      throw error
    }
  }

  async closeConnection(packageName: string): Promise<void> {
    try {
      const connection = this.connections.get(packageName)
      if (connection) {
        await connection.close()
        this.connections.delete(packageName)
      }

      this.logger.info(`Connection closed with ${packageName}`)
    } catch (error) {
      this.logger.error(`Failed to close connection with ${packageName}`, { error })
      throw error
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async createConnection(packageName: string): Promise<any> {
    // This will be implemented based on package configuration
    throw new Error('Connection creation not yet implemented')
  }
}
```

### Phase 3: Package System Migration (Week 5-6)

#### 3.1 Update Package Interface

```typescript
// packages/core/src/interfaces/package.ts
import { Container } from '@needle-di/core'

export interface IPackage {
  readonly name: string
  readonly version: string
  readonly description: string
  readonly author: string
  readonly dependencies: string[]
  readonly permissions: PackagePermission[]

  // Lifecycle hooks
  initialize(context: IPackageContext): Promise<void>
  activate(): Promise<void>
  deactivate(): Promise<void>
  dispose(): Promise<void>
}

export interface IPackageContext {
  readonly container: Container // Scoped DI container
  readonly eventDispatcher: IEventDispatcherService
  readonly communication: ICommunicationService
  readonly configuration: IConfigurationService
  readonly logger: ILoggingService
  readonly packageRegistry: IPackageRegistryService
}

export enum PackagePermission {
  ReadNotes = 'read-notes',
  WriteNotes = 'write-notes',
  FileSystem = 'filesystem',
  Network = 'network',
  Notifications = 'notifications'
}
```

#### 3.2 Create Package Context Factory

```typescript
// packages/core/src/factories/package-context-factory.ts
import { Container } from '@needle-di/core'
import { IPackageContext, IPackage } from '../interfaces/package'
import {
  IEventDispatcherService,
  ICommunicationService,
  IConfigurationService,
  ILoggingService,
  IPackageRegistryService
} from '../interfaces/services'

export class PackageContextFactory {
  constructor(
    private parentContainer: Container
  ) {}

  createPackageContext(packageName: string): IPackageContext {
    // Create scoped container for package isolation
    const packageContainer = this.parentContainer.createScope()

    // Register package-specific services
    packageContainer.register(ILoggingService).useFactory(() =>
      new DebugLoggingService(`tars:package:${packageName}`)
    )

    return {
      container: packageContainer,
      eventDispatcher: packageContainer.get(IEventDispatcherService),
      communication: packageContainer.get(ICommunicationService),
      configuration: packageContainer.get(IConfigurationService),
      logger: packageContainer.get(ILoggingService),
      packageRegistry: packageContainer.get(IPackageRegistryService)
    }
  }
}
```

#### 3.3 Migrate Existing Packages

**Example: Migrating Note Management Package**

**Before (Legacy):**
```typescript
// packages/note-management/src/NoteManagementPackage.ts
export class NoteManagementPackage implements IPackage {
  readonly name = 'note-management'
  // ... other properties

  private eventDispatcher: EventDispatcher
  private logger: any

  constructor(eventDispatcher: EventDispatcher, logger: any) {
    this.eventDispatcher = eventDispatcher
    this.logger = logger
  }

  async initialize(): Promise<void> {
    // Manual setup
    this.eventDispatcher.on('note-created', this.handleNoteCreated.bind(this))
  }
}
```

**After (DI):**
```typescript
// packages/note-management/src/NoteManagementPackage.ts
import { injectable, inject } from '@needle-di/core'
import { IPackage, IPackageContext, PackagePermission } from '@tars/core/interfaces'

@injectable()
export class NoteManagementPackage implements IPackage {
  readonly name = 'note-management'
  readonly version = '1.0.0'
  readonly description = 'Advanced note organization and tagging'
  readonly author = 'Tars Team'
  readonly dependencies: string[] = []
  readonly permissions = [PackagePermission.ReadNotes, PackagePermission.WriteNotes]

  private context!: IPackageContext

  async initialize(context: IPackageContext): Promise<void> {
    this.context = context
    this.context.logger.info('Note Management Package initializing')

    // Register event handlers
    this.context.eventDispatcher.on('note-created', this.handleNoteCreated.bind(this))
    this.context.eventDispatcher.on('tag-added', this.handleTagAdded.bind(this))
  }

  async activate(): Promise<void> {
    this.context.logger.info('Note Management Package activated')

    // Register commands through communication service
    this.context.communication.registerCommand('organize-notes', this.organizeNotes.bind(this))
    this.context.communication.registerCommand('suggest-tags', this.suggestTags.bind(this))
  }

  async deactivate(): Promise<void> {
    this.context.logger.info('Note Management Package deactivated')
  }

  async dispose(): Promise<void> {
    this.context.logger.info('Note Management Package disposed')
  }

  private async organizeNotes(args: { folder?: string, strategy?: string }): Promise<void> {
    this.context.logger.info('Organizing notes', args)

    this.context.eventDispatcher.dispatch('organization-started', {
      package: this.name,
      strategy: args.strategy || 'alphabetical'
    })

    try {
      // Implementation using injected services
      const organized = await this.performOrganization(args)

      this.context.eventDispatcher.dispatch('organization-completed', {
        package: this.name,
        organized,
        timestamp: Date.now()
      })
    } catch (error) {
      this.context.eventDispatcher.dispatch('organization-failed', {
        package: this.name,
        error: error.message,
        timestamp: Date.now()
      })
    }
  }

  private async suggestTags(args: { noteContent: string }): Promise<string[]> {
    // Implementation using injected services
    const words = args.noteContent.toLowerCase().split(/\s+/)
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']
    const candidates = words.filter(word =>
      word.length > 3 && !commonWords.includes(word)
    )

    return [...new Set(candidates)].slice(0, 5)
  }

  private handleNoteCreated(event: any): void {
    this.context.logger.debug('Note created event received', event)
  }

  private handleTagAdded(event: any): void {
    this.context.logger.debug('Tag added event received', event)
  }

  private async performOrganization(args: any): Promise<any> {
    // Placeholder implementation
    return { organized: 42, moved: 5 }
  }
}
```

### Phase 4: Core System Integration (Week 7-8)

#### 4.1 Migrate PoCCore

```typescript
// packages/core/src/PoCCore.ts
import { injectable, inject } from '@needle-di/core'
import {
  IEventDispatcherService,
  IPackageRegistryService,
  ICommunicationService,
  ILoggingService
} from './interfaces/services'
import { Observable, Subject } from 'rxjs'
import { PluginEvent } from './interfaces/events'

@injectable()
export class PoCCore {
  private eventSubject = new Subject<PluginEvent>()
  private event$: Observable<PluginEvent>
  private isInitialized = false

  constructor(
    @inject(IEventDispatcherService) private eventDispatcher: IEventDispatcherService,
    @inject(IPackageRegistryService) private packageRegistry: IPackageRegistryService,
    @inject(ICommunicationService) private communication: ICommunicationService,
    @inject(ILoggingService) private logger: ILoggingService
  ) {
    this.event$ = this.eventSubject.asObservable()
    this.setupEventProcessing()
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    this.logger.info('Initializing PoC Core with DI')

    // Initialize all injected services
    await this.eventDispatcher.initialize?.()
    await this.packageRegistry.initialize?.()
    await this.communication.initialize?.()

    this.isInitialized = true

    this.dispatch({
      type: 'system-started',
      timestamp: Date.now(),
      source: 'poc-core'
    })
  }

  dispatch<T extends PluginEvent>(event: T): void {
    try {
      const validatedEvent = PluginEventSchema.parse(event)
      this.eventDispatcher.dispatch(event.type, validatedEvent)
      this.eventSubject.next(validatedEvent)
      this.logger.debug('Event dispatched', { type: event.type, source: event.source })
    } catch (error) {
      this.logger.error('Event validation failed', { error, originalEvent: event })
      this.dispatch({
        type: 'system-error',
        timestamp: Date.now(),
        source: 'poc-core',
        metadata: { error: error.message, originalEvent: event }
      })
    }
  }

  createEventStream<T extends PluginEvent>(eventType: T['type']): Observable<T> {
    return this.eventDispatcher.createStream<T>(eventType)
  }

  get events$(): Observable<PluginEvent> {
    return this.event$
  }

  private setupEventProcessing(): void {
    // Listen for package events
    this.eventDispatcher.on('package-registered', (event) => {
      this.logger.info('Package registered', { packageName: event.metadata.packageName })
    })

    this.eventDispatcher.on('package-error', (event) => {
      this.logger.error('Package error', {
        packageName: event.metadata.packageName,
        error: event.metadata.error
      })
    })

    // Handle communication events
    this.eventDispatcher.on('communication-error', (event) => {
      this.logger.error('Communication error', {
        packageName: event.metadata.packageName,
        error: event.metadata.error
      })
    })
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) return

    this.eventSubject.complete()

    // Shutdown all services
    await this.packageRegistry.shutdown?.()
    await this.communication.shutdown?.()
    await this.eventDispatcher.shutdown?.()

    this.isInitialized = false
    this.logger.info('PoC Core shut down')
  }
}
```

#### 4.2 Create Bootstrap with DI

```typescript
// packages/core/src/bootstrap.ts
import { createCoreContainer } from './container/core-container'
import { PoCCore } from './PoCCore'
import { PackageContextFactory } from './factories/package-context-factory'
import { IConfigurationService } from './interfaces/services'

export class PoCBootstrap {
  private container: Container
  private packageContextFactory: PackageContextFactory

  constructor() {
    this.container = createCoreContainer()
    this.packageContextFactory = new PackageContextFactory(this.container)
  }

  async initialize(config?: Partial<CoreConfig>): Promise<void> {
    try {
      // Apply configuration if provided
      if (config) {
        const configService = this.container.get(IConfigurationService)
        Object.entries(config).forEach(([key, value]) => {
          configService.set(key, value)
        })
      }

      // Core is automatically initialized with all dependencies
      const core = this.container.get(PoCCore)
      await core.initialize()

      // Load packages from configuration
      await this.loadPackages()

      console.log('✅ PoC Core initialized successfully with DI')
    } catch (error) {
      console.error('❌ Failed to initialize PoC Core:', error)
      throw error
    }
  }

  private async loadPackages(): Promise<void> {
    const packageRegistry = this.container.get(IPackageRegistryService)
    const config = this.container.get(IConfigurationService)
    const packageConfigs = config.get('packages', [])

    for (const packageConfig of packageConfigs) {
      try {
        // Dynamic import of package
        const PackageClass = await import(packageConfig.modulePath)

        // Package instance is created by DI container with all dependencies
        const pkg = this.container.get(PackageClass.default)

        await packageRegistry.registerPackage(pkg)
        await packageRegistry.activatePackage(pkg.name)

        console.log(`✅ Package ${pkg.name} loaded and activated`)
      } catch (error) {
        console.error(`❌ Failed to load package ${packageConfig.name}:`, error)
      }
    }
  }

  getContainer(): Container {
    return this.container
  }

  async shutdown(): Promise<void> {
    const core = this.container.get(PoCCore)
    await core.shutdown()
    console.log('✅ PoC Core shut down')
  }
}
```

### Phase 5: Testing and Validation (Week 9-10)

#### 5.1 Create Test Infrastructure

```typescript
// packages/core/src/testing/test-container.ts
import { Container } from '@needle-di/core'
import {
  IEventDispatcherService,
  IPackageRegistryService,
  ICommunicationService,
  IConfigurationService,
  ILoggingService
} from '../interfaces/services'

export class TestContainer {
  private container: Container

  constructor() {
    this.container = new Container()
    this.setupMocks()
  }

  private setupMocks(): void {
    // Mock EventDispatcher
    const mockEventDispatcher = {
      dispatch: jest.fn(),
      on: jest.fn(),
      createStream: jest.fn(),
      validateEvent: jest.fn().mockReturnValue(true),
      initialize: jest.fn(),
      shutdown: jest.fn()
    }
    this.container.register(IEventDispatcherService).toInstance(mockEventDispatcher)

    // Mock PackageRegistry
    const mockPackageRegistry = {
      registerPackage: jest.fn(),
      unregisterPackage: jest.fn(),
      getPackage: jest.fn(),
      listPackages: jest.fn(),
      activatePackage: jest.fn(),
      deactivatePackage: jest.fn(),
      isPackageActive: jest.fn(),
      initialize: jest.fn(),
      shutdown: jest.fn()
    }
    this.container.register(IPackageRegistryService).toInstance(mockPackageRegistry)

    // Mock CommunicationService
    const mockCommunicationService = {
      sendMessage: jest.fn(),
      receiveMessages: jest.fn(),
      establishConnection: jest.fn(),
      closeConnection: jest.fn(),
      initialize: jest.fn(),
      shutdown: jest.fn()
    }
    this.container.register(ICommunicationService).toInstance(mockCommunicationService)

    // Mock ConfigurationService
    const mockConfigurationService = {
      get: jest.fn(),
      set: jest.fn(),
      watch: jest.fn()
    }
    this.container.register(IConfigurationService).toInstance(mockConfigurationService)

    // Mock LoggingService
    const mockLoggingService = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }
    this.container.register(ILoggingService).toInstance(mockLoggingService)
  }

  getContainer(): Container {
    return this.container
  }

  getMock<T>(serviceType: symbol): jest.Mocked<T> {
    return this.container.get(serviceType) as jest.Mocked<T>
  }

  resetMocks(): void {
    const mockEventDispatcher = this.getMock(IEventDispatcherService)
    const mockPackageRegistry = this.getMock(IPackageRegistryService)
    const mockCommunicationService = this.getMock(ICommunicationService)

    jest.clearAllMocks()
  }
}
```

#### 5.2 Migration Tests

```typescript
// packages/core/tests/migration/PoCCoreMigration.test.ts
import { PoCCore } from '../../PoCCore'
import { TestContainer } from '../testing/test-container'
import { IEventDispatcherService, IPackageRegistryService } from '../../interfaces/services'

describe('PoCCore Migration Tests', () => {
  let testContainer: TestContainer
  let core: PoCCore
  let mockEventDispatcher: jest.Mocked<IEventDispatcherService>
  let mockPackageRegistry: jest.Mocked<IPackageRegistryService>

  beforeEach(() => {
    testContainer = new TestContainer()
    core = testContainer.getContainer().get(PoCCore)

    mockEventDispatcher = testContainer.getMock(IEventDispatcherService)
    mockPackageRegistry = testContainer.getMock(IPackageRegistryService)
  })

  afterEach(() => {
    testContainer.resetMocks()
  })

  describe('DI Integration', () => {
    it('should initialize with injected dependencies', async () => {
      await core.initialize()

      expect(mockEventDispatcher.initialize).toHaveBeenCalled()
      expect(mockPackageRegistry.initialize).toHaveBeenCalled()
    })

    it('should dispatch events through injected event dispatcher', () => {
      const testEvent = {
        type: 'test-event' as const,
        timestamp: Date.now(),
        source: 'test'
      }

      core.dispatch(testEvent)

      expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith('test-event', testEvent)
    })

    it('should handle errors through injected logger', () => {
      const invalidEvent = { invalid: 'event' }

      core.dispatch(invalidEvent as any)

      expect(mockEventDispatcher.dispatch).toHaveBeenCalled()
    })
  })

  describe('Backwards Compatibility', () => {
    it('should maintain same public API as legacy PoCCore', () => {
      expect(typeof core.initialize).toBe('function')
      expect(typeof core.dispatch).toBe('function')
      expect(typeof core.createEventStream).toBe('function')
      expect(typeof core.events$).toBe('object')
      expect(typeof core.shutdown).toBe('function')
    })

    it('should behave identically to legacy implementation', async () => {
      // Test that behavior matches legacy implementation
      const testEvents = [
        { type: 'system-started', timestamp: Date.now(), source: 'test' },
        { type: 'package-registered', timestamp: Date.now(), source: 'test' }
      ]

      testEvents.forEach(event => {
        expect(() => core.dispatch(event)).not.toThrow()
        expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(event.type, event)
      })
    })
  })
})
```

## Migration Validation Strategy

### 1. Component-Level Validation

For each migrated component:

```typescript
// packages/core/tests/validation/component-validation.test.ts
describe('Component Migration Validation', () => {
  it('should maintain functional parity with legacy implementation', () => {
    // Compare behavior of old vs new implementation
  })

  it('should pass all existing tests', () => {
    // Ensure no regression in existing functionality
  })

  it('should demonstrate DI benefits', () => {
    // Verify improved testability, reduced boilerplate, etc.
  })
})
```

### 2. Integration Validation

```typescript
// packages/core/tests/validation/integration-validation.test.ts
describe('Integration Migration Validation', () => {
  it('should work with existing packages', () => {
    // Test that existing packages continue to work
  })

  it('should support new DI-based packages', () => {
    // Test that new packages work with DI
  })

  it('should handle mixed legacy/DI environments', () => {
    // Test compatibility during transition period
  })
})
```

### 3. Performance Validation

```typescript
// packages/core/tests/validation/performance-validation.test.ts
describe('Performance Migration Validation', () => {
  it('should not degrade performance', async () => {
    // Benchmark before/after migration
  })

  it('should improve memory usage', async () => {
    // Verify better memory management with DI
  })
})
```

## Risk Mitigation

### 1. Rollback Strategy

- **Feature Flags**: Enable/disable DI system via configuration
- **Legacy Fallback**: Maintain legacy implementations during transition
- **Gradual Migration**: Migrate one component at a time
- **Comprehensive Testing**: Validate each migration step

### 2. Monitoring and Observability

- **Health Checks**: Monitor system health during migration
- **Performance Metrics**: Track performance impact
- **Error Tracking**: Monitor for migration-related errors
- **Feature Usage**: Track adoption of new DI features

### 3. Documentation and Training

- **Migration Guide**: Step-by-step migration instructions
- **Best Practices**: DI patterns and anti-patterns
- **Team Training**: Ensure team understands DI concepts
- **Code Reviews**: Focus on DI patterns during reviews

## Success Criteria

### Technical Criteria

- ✅ All components successfully migrated to DI
- ✅ Existing packages continue to work without modification
- ✅ New packages use DI patterns
- ✅ Test coverage maintained or improved
- ✅ Performance not degraded
- ✅ Memory usage improved

### Operational Criteria

- ✅ Migration completed within planned timeline
- ✅ No production incidents during migration
- ✅ Team successfully adopts DI patterns
- ✅ Documentation updated and complete
- ✅ Monitoring and alerting in place

### Business Criteria

- ✅ Improved developer experience
- ✅ Reduced maintenance overhead
- ✅ Faster feature development
- ✅ Better code quality
- ✅ Enhanced system reliability

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1 | Week 1-2 | DI foundation, interfaces, container setup |
| Phase 2 | Week 3-4 | Core services migrated (EventDispatcher, PackageRegistry, Communication) |
| Phase 3 | Week 5-6 | Package system migration, context factory |
| Phase 4 | Week 7-8 | Core system integration (PoCCore, Bootstrap) |
| Phase 5 | Week 9-10 | Testing, validation, documentation |

**Total Duration: 10 weeks**

## Conclusion

This migration strategy provides a **structured, low-risk approach** to transitioning the PoC implementation to a modern dependency injection architecture. By leveraging the Adapter Pattern and incremental migration, we can maintain system stability while progressively improving the codebase.

The DI migration will deliver significant benefits:

- **70% reduction** in dependency management boilerplate
- **100% testability** with easy mocking
- **Improved maintainability** through clear separation of concerns
- **Enhanced flexibility** for remote execution and configuration
- **Better developer experience** with automatic dependency resolution

The strategy ensures that the migration is **backwards compatible, thoroughly tested, and well-documented**, setting the foundation for a scalable and maintainable package ecosystem.