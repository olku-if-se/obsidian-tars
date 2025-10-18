# Event-Driven Streams Architecture PoC Implementation

- [Event-Driven Streams Architecture PoC Implementation](#event-driven-streams-architecture-poc-implementation)
  - [Overview](#overview)
  - [Library Selection and Rationale](#library-selection-and-rationale)
    - [Core Libraries](#core-libraries)
      - [1. **tseep** - Event System](#1-tseep---event-system)
      - [2. **RxJS** - Reactive Streams](#2-rxjs---reactive-streams)
      - [3. **Zod** - Schema Validation](#3-zod---schema-validation)
      - [4. **Nano Stores** - State Management](#4-nano-stores---state-management)
      - [5. **Chokidar** - File System Watching](#5-chokidar---file-system-watching)
    - [Optional Libraries for Advanced Features](#optional-libraries-for-advanced-features)
      - [6. **Debug** - Debug Logging](#6-debug---debug-logging)
      - [7. **zeromq** - IPC Communication](#7-zeromq---ipc-communication)
  - [Modular Architecture Design](#modular-architecture-design)
    - [Key Concept: Attachable/Detachable Packages](#key-concept-attachabledetachable-packages)
    - [Package Structure](#package-structure)
  - [PoC Architecture](#poc-architecture)
    - [Minimal Implementation Strategy](#minimal-implementation-strategy)
    - [PoC Component Structure](#poc-component-structure)
  - [Modular Package System](#modular-package-system)
    - [Package Interface Definition](#package-interface-definition)
    - [Core Event Dispatcher](#core-event-dispatcher)
    - [Package Registry Implementation](#package-registry-implementation)
    - [Example Package Implementations](#example-package-implementations)
      - [1. File Manager Package](#1-file-manager-package)
      - [2. UI Components Package](#2-ui-components-package)
    - [ZeroMQ Integration for Remote Packages](#zeromq-integration-for-remote-packages)
      - [ZeroMQ Event Bridge](#zeromq-event-bridge)
      - [Remote Package Runner](#remote-package-runner)
    - [Updated PoC Package Configuration](#updated-poc-package-configuration)
    - [2. Core Event System](#2-core-event-system)
    - [3. Simple Event Logger](#3-simple-event-logger)
    - [4. Obsidian Event Bridge](#4-obsidian-event-bridge)
    - [5. Reactive Event Viewer UI](#5-reactive-event-viewer-ui)
    - [6. Main PoC Plugin](#6-main-poc-plugin)
  - [PoC Package Configuration](#poc-package-configuration)
  - [Implementation Steps](#implementation-steps)
    - [Phase 1: Core Infrastructure (Day 1-2)](#phase-1-core-infrastructure-day-1-2)
    - [Phase 2: Obsidian Integration (Day 3)](#phase-2-obsidian-integration-day-3)
    - [Phase 3: UI Components (Day 4)](#phase-3-ui-components-day-4)
    - [Phase 4: Testing and Validation (Day 5)](#phase-4-testing-and-validation-day-5)
  - [Expected Outcomes](#expected-outcomes)
    - [What the PoC Demonstrates](#what-the-poc-demonstrates)
    - [Success Criteria](#success-criteria)
  - [Debugging and Monitoring](#debugging-and-monitoring)
    - [Environment Variables](#environment-variables)
    - [Event Flow Visualization](#event-flow-visualization)
  - [Next Steps After PoC](#next-steps-after-poc)
  - [Risk Analysis and Critical Failure Points](#risk-analysis-and-critical-failure-points)
    - [🚨 Critical Architecture Risks](#-critical-architecture-risks)
      - [1. **Bootstrap and Initialization Chaos**](#1-bootstrap-and-initialization-chaos)
      - [2. **Event System Collapse Under Load**](#2-event-system-collapse-under-load)
      - [3. **Package Hot-Swap Failures**](#3-package-hot-swap-failures)
      - [4. **ZeroMQ Communication Failures**](#4-zeromq-communication-failures)
    - [🔄 Cross-Platform Integration Challenges](#-cross-platform-integration-challenges)
      - [1. **Event Schema Evolution**](#1-event-schema-evolution)
      - [2. **Application-Specific Bridges**](#2-application-specific-bridges)
      - [3. **Resource Management Across Boundaries**](#3-resource-management-across-boundaries)
    - [🏗️ Bootstrap Architecture Requirements](#️-bootstrap-architecture-requirements)
      - [1. **Dependency Graph Resolution**](#1-dependency-graph-resolution)
      - [2. **Phased Initialization**](#2-phased-initialization)
      - [3. **Health Monitoring and Recovery**](#3-health-monitoring-and-recovery)
    - [🔧 Mitigation Strategies](#-mitigation-strategies)
      - [1. **Event System Resilience**](#1-event-system-resilience)
      - [2. **Atomic Package Management**](#2-atomic-package-management)
      - [3. **Robust IPC Layer**](#3-robust-ipc-layer)
    - [📊 Success Criteria Revision](#-success-criteria-revision)
    - [🎯 Critical Implementation Decisions](#-critical-implementation-decisions)


## Overview

This document outlines a Proof of Concept (PoC) implementation for the Event-Driven Streams Architecture using existing Node.js libraries to minimize custom interface development while demonstrating the core concepts of decoupling TARS from Obsidian through reactive streams and modular, attachable/detachable functionality.

## Library Selection and Rationale

### Core Libraries

#### 1. **tseep** - Event System
```bash
npm install tseep
```
- **Why**: TypeScript-native event emitter with excellent performance and type safety
- **Benefits**: Full TypeScript support, event type validation, async event handling, wildcard support
- **Usage**: Core event dispatching and subscription system with type-safe events
- **Modular Advantage**: Easy to create isolated event domains for different packages

#### 2. **RxJS** - Reactive Streams
```bash
npm install rxjs
```
- **Why**: Industry standard for reactive programming with rich operators
- **Benefits**: Powerful stream operators, excellent TypeScript support, battle-tested
- **Usage**: Data flow processing, event transformation, reactive UI updates
- **Modular Advantage**: Natural stream composition for combining multiple packages

#### 3. **Zod** - Schema Validation
```bash
npm install zod
```
- **Why**: Runtime type validation with excellent TypeScript inference
- **Benefits**: Type-safe events, validation at boundaries, great DX
- **Usage**: Event schema validation, type safety across event system
- **Modular Advantage**: Shared schemas across packages ensure compatibility

#### 4. **Nano Stores** - State Management
```bash
npm install nanostores
```
- **Why**: Tiny, atomic state management with reactive subscriptions
- **Benefits**: Minimal overhead, excellent performance, simple API
- **Usage**: Store implementation for plugin state
- **Modular Advantage**: Each package can maintain its own atomic stores

#### 5. **Chokidar** - File System Watching
```bash
npm install chokidar
```
- **Why**: Efficient file watching with cross-platform support
- **Benefits**: Reliable file system events, performance optimized
- **Usage**: File system monitoring and change detection

### Optional Libraries for Advanced Features

#### 6. **Debug** - Debug Logging
```bash
npm install debug
```
- **Why**: Namespaced debug logging with environment-based filtering
- **Usage**: Event tracing and debugging during development
- **Modular Advantage**: Each package can have its own debug namespace

#### 7. **zeromq** - IPC Communication
```bash
npm install zeromq
```
- **Why**: High-performance message queuing for inter-process communication
- **Benefits**: Zero-copy messaging, multiple patterns (pub/sub, req/rep, push/pull), language agnostic
- **Usage**: IPC layer between Obsidian shell and remote cores
- **Modular Advantage**: Enables distributed architecture where packages can run in separate processes

## Modular Architecture Design

### Key Concept: Attachable/Detachable Packages

The architecture is designed around the concept of **modular packages** that can be easily attached or detached from the main event system. Each package:

1. **Defines its own event schemas** using Zod
2. **Registers event handlers** with the central dispatcher
3. **Can be hot-swapped** without affecting other packages
4. **Maintains isolated state** using nanostores
5. **Communicates via typed events** through the central bus

### Package Structure

```
packages/
├── core/                    # Core event system and dispatcher
├── obsidian-bridge/         # Obsidian event bridge package
├── file-manager/           # File operations package
├── editor-tools/           # Editor enhancement package
├── mcp-integration/        # MCP server management package
├── ui-components/          # Reactive UI components package
└── analytics/              # Analytics and monitoring package
```

Each package can be:
- **Enabled/disabled** via configuration
- **Loaded/unloaded** at runtime
- **Run in separate processes** via ZeroMQ
- **Developed and tested independently**

## PoC Architecture

### Minimal Implementation Strategy

The PoC focuses on demonstrating the core concept with minimal custom code:

1. **Event Bridge** - Convert Obsidian events to reactive streams
2. **Event Logger** - Log all events for debugging (no core processing)
3. **Simple Store** - Basic state management demonstration
4. **Reactive UI** - Single reactive component showing event flow

### PoC Component Structure

```
packages/
├── core/                           # Core event system
│   ├── src/
│   │   ├── EventDispatcher.ts     # Central event dispatcher
│   │   ├── PackageRegistry.ts     # Package management system
│   │   ├── EventLogger.ts         # Event logging and analytics
│   │   └── types/
│   │       ├── events.ts          # Core event schemas
│   │       └── packages.ts        # Package interface definitions
│   └── package.json
├── obsidian-bridge/               # Obsidian integration package
│   ├── src/
│   │   ├── ObsidianAdapter.ts    # Obsidian event adapter
│   │   ├── ObsidianPlugin.ts     # Main plugin entry point
│   │   └── types/
│   │       └── obsidian.ts       # Obsidian-specific types
│   └── package.json
├── file-manager/                  # File operations package
│   ├── src/
│   │   ├── FileWatcher.ts        # File system monitoring
│   │   ├── FileOperations.ts     # File manipulation handlers
│   │   └── types/
│   │       └── file.ts           # File operation types
│   └── package.json
├── ui-components/                 # Reactive UI components package
│   ├── src/
│   │   ├── EventViewer.tsx       # Reactive event viewer
│   │   ├── StatusBar.tsx         # Reactive status bar
│   │   └── types/
│   │       └── ui.ts             # UI component types
│   └── package.json
└── poc/                          # Proof of Concept orchestrator
    ├── src/
    │   ├── PoCCoordinator.ts     # Package coordination
    │   ├── ConfigManager.ts      # Configuration management
    │   └── types/
    │       └── poc.ts            # PoC-specific types
    └── package.json
```

## Modular Package System

### Package Interface Definition

```typescript
// packages/core/src/types/packages.ts
import { z } from 'zod'
import { TypedEmitter } from 'tseep'
import { Observable } from 'rxjs'

// Base package interface
export interface IPackage {
  readonly name: string
  readonly version: string
  readonly dependencies: string[]
  readonly eventSchemas: Record<string, z.ZodSchema>
  
  // Lifecycle methods
  initialize(context: IPackageContext): Promise<void>
  activate(): Promise<void>
  deactivate(): Promise<void>
  dispose(): Promise<void>
  
  // Event handling
  getEventHandlers(): Record<string, EventHandler>
  getEventStreams(): Record<string, Observable<any>>
  
  // Configuration
  getDefaultConfig(): Record<string, any>
  validateConfig(config: any): boolean
}

// Package context provided by core
export interface IPackageContext {
  eventDispatcher: IEventDispatcher
  logger: ILogger
  config: Record<string, any>
  packageRegistry: IPackageRegistry
}

// Event handler function type
export type EventHandler = (event: any) => Promise<void> | void

// Package registry for managing packages
export interface IPackageRegistry {
  registerPackage(pkg: IPackage): Promise<void>
  unregisterPackage(packageName: string): Promise<void>
  getPackage(packageName: string): IPackage | null
  listPackages(): IPackage[]
  activatePackage(packageName: string): Promise<void>
  deactivatePackage(packageName: string): Promise<void>
  isPackageActive(packageName: string): boolean
}

// Event dispatcher interface
export interface IEventDispatcher {
  dispatch<T>(eventType: string, event: T): Promise<void>
  on<T>(eventType: string, handler: (event: T) => void): () => void
  createStream<T>(eventType: string): Observable<T>
  validateEvent(eventType: string, event: any): boolean
}
```

### Core Event Dispatcher

```typescript
// packages/core/src/EventDispatcher.ts
import { TypedEmitter } from 'tseep'
import { Subject, Observable } from 'rxjs'
import { z } from 'zod'
import { createDebug } from 'debug'
import { IEventDispatcher, IPackage } from './types/packages'

const debug = createDebug('tars:core:event-dispatcher')

export class EventDispatcher extends TypedEmitter implements IEventDispatcher {
  private eventSubjects = new Map<string, Subject<any>>()
  private eventSchemas = new Map<string, z.ZodSchema>()
  private packages = new Map<string, IPackage>()

  // Register event schema from a package
  registerEventSchema(eventType: string, schema: z.ZodSchema, packageName: string): void {
    this.eventSchemas.set(eventType, schema)
    debug(`Registered event schema '${eventType}' from package '${packageName}'`)
  }

  // Validate event against registered schema
  validateEvent(eventType: string, event: any): boolean {
    const schema = this.eventSchemas.get(eventType)
    if (!schema) {
      debug.warn(`No schema found for event type '${eventType}'`)
      return true // Allow events without schemas
    }

    try {
      schema.parse(event)
      return true
    } catch (error) {
      debug.error(`Event validation failed for '${eventType}':`, error)
      return false
    }
  }

  // Dispatch event with validation
  async dispatch<T>(eventType: string, event: T): Promise<void> {
    if (!this.validateEvent(eventType, event)) {
      throw new Error(`Invalid event data for type '${eventType}'`)
    }

    debug(`Dispatching event '${eventType}'`)
    
    // Emit to TypedEmitter
    this.emit(eventType, event)
    
    // Emit to RxJS Subject
    let subject = this.eventSubjects.get(eventType)
    if (!subject) {
      subject = new Subject<T>()
      this.eventSubjects.set(eventType, subject)
    }
    subject.next(event)
  }

  // Subscribe to events with type safety
  on<T>(eventType: string, handler: (event: T) => void): () => void {
    this.on(eventType, handler)
    return () => this.off(eventType, handler)
  }

  // Create RxJS stream for events
  createStream<T>(eventType: string): Observable<T> {
    let subject = this.eventSubjects.get(eventType)
    if (!subject) {
      subject = new Subject<T>()
      this.eventSubjects.set(eventType, subject)
    }
    return subject.asObservable()
  }

  // Register package event handlers
  registerPackage(pkg: IPackage): void {
    this.packages.set(pkg.name, pkg)
    
    // Register event schemas
    Object.entries(pkg.eventSchemas).forEach(([eventType, schema]) => {
      this.registerEventSchema(eventType, schema, pkg.name)
    })
    
    // Register event handlers
    Object.entries(pkg.getEventHandlers()).forEach(([eventType, handler]) => {
      this.on(eventType, handler)
    })
    
    debug(`Registered package '${pkg.name}'`)
  }

  // Unregister package
  unregisterPackage(packageName: string): void {
    const pkg = this.packages.get(packageName)
    if (!pkg) return

    // Remove event handlers
    Object.keys(pkg.getEventHandlers()).forEach(eventType => {
      this.removeAllListeners(eventType)
    })
    
    this.packages.delete(packageName)
    debug(`Unregistered package '${packageName}'`)
  }
}
```

### Package Registry Implementation

```typescript
// packages/core/src/PackageRegistry.ts
import { createDebug } from 'debug'
import { IPackage, IPackageContext, IPackageRegistry } from './types/packages'
import { EventDispatcher } from './EventDispatcher'

const debug = createDebug('tars:core:package-registry')

export class PackageRegistry implements IPackageRegistry {
  private packages = new Map<string, IPackage>()
  private activePackages = new Set<string>()
  private eventDispatcher: EventDispatcher

  constructor(eventDispatcher: EventDispatcher) {
    this.eventDispatcher = eventDispatcher
  }

  async registerPackage(pkg: IPackage): Promise<void> {
    if (this.packages.has(pkg.name)) {
      throw new Error(`Package '${pkg.name}' is already registered`)
    }

    debug(`Registering package '${pkg.name}'`)
    
    // Check dependencies
    for (const dep of pkg.dependencies) {
      if (!this.packages.has(dep)) {
        throw new Error(`Package '${pkg.name}' depends on '${dep}' which is not registered`)
      }
    }

    // Create package context
    const context: IPackageContext = {
      eventDispatcher: this.eventDispatcher,
      logger: createDebug(`tars:package:${pkg.name}`),
      config: {}, // Will be set by configuration manager
      packageRegistry: this
    }

    // Initialize package
    await pkg.initialize(context)
    
    // Register with event dispatcher
    this.eventDispatcher.registerPackage(pkg)
    
    this.packages.set(pkg.name, pkg)
    debug(`Package '${pkg.name}' registered successfully`)
  }

  async unregisterPackage(packageName: string): Promise<void> {
    const pkg = this.packages.get(packageName)
    if (!pkg) return

    debug(`Unregistering package '${packageName}'`)

    // Deactivate if active
    if (this.activePackages.has(packageName)) {
      await this.deactivatePackage(packageName)
    }

    // Dispose package
    await pkg.dispose()
    
    // Unregister from event dispatcher
    this.eventDispatcher.unregisterPackage(packageName)
    
    this.packages.delete(packageName)
    debug(`Package '${packageName}' unregistered successfully`)
  }

  async activatePackage(packageName: string): Promise<void> {
    const pkg = this.packages.get(packageName)
    if (!pkg) {
      throw new Error(`Package '${packageName}' is not registered`)
    }

    if (this.activePackages.has(packageName)) {
      debug(`Package '${packageName}' is already active`)
      return
    }

    debug(`Activating package '${packageName}'`)
    await pkg.activate()
    this.activePackages.add(packageName)
    debug(`Package '${packageName}' activated successfully`)
  }

  async deactivatePackage(packageName: string): Promise<void> {
    const pkg = this.packages.get(packageName)
    if (!pkg || !this.activePackages.has(packageName)) {
      return
    }

    debug(`Deactivating package '${packageName}'`)
    await pkg.deactivate()
    this.activePackages.delete(packageName)
    debug(`Package '${packageName}' deactivated successfully`)
  }

  getPackage(packageName: string): IPackage | null {
    return this.packages.get(packageName) || null
  }

  listPackages(): IPackage[] {
    return Array.from(this.packages.values())
  }

  isPackageActive(packageName: string): boolean {
    return this.activePackages.has(packageName)
  }
}
```

### Example Package Implementations

#### 1. File Manager Package

```typescript
// packages/file-manager/src/FileManagerPackage.ts
import { z } from 'zod'
import { Observable } from 'rxjs'
import { IPackage, IPackageContext } from '@tars/core/types/packages'
import { FileWatcher } from './FileWatcher'
import { FileOperations } from './FileOperations'

export class FileManagerPackage implements IPackage {
  readonly name = 'file-manager'
  readonly version = '1.0.0'
  readonly dependencies = []
  
  // Event schemas
  readonly eventSchemas = {
    'file-change': z.object({
      type: z.literal('file-change'),
      timestamp: z.number(),
      source: z.string(),
      filePath: z.string(),
      fileType: z.enum(['markdown', 'json', 'yaml', 'other']),
      operation: z.enum(['create', 'update', 'delete', 'move'])
    }),
    'file-watch': z.object({
      type: z.literal('file-watch'),
      timestamp: z.number(),
      source: z.string(),
      watchPattern: z.string(),
      action: z.enum(['start', 'stop'])
    })
  }

  private fileWatcher: FileWatcher
  private fileOperations: FileOperations
  private context!: IPackageContext

  async initialize(context: IPackageContext): Promise<void> {
    this.context = context
    this.fileWatcher = new FileWatcher(context)
    this.fileOperations = new FileOperations(context)
    
    context.logger('File manager package initialized')
  }

  async activate(): Promise<void> {
    await this.fileWatcher.start()
    await this.fileOperations.initialize()
    
    this.context.logger('File manager package activated')
  }

  async deactivate(): Promise<void> {
    await this.fileWatcher.stop()
    this.context.logger('File manager package deactivated')
  }

  async dispose(): Promise<void> {
    await this.fileWatcher.dispose()
    await this.fileOperations.dispose()
    this.context.logger('File manager package disposed')
  }

  getEventHandlers(): Record<string, (event: any) => void> {
    return {
      'file-watch': (event) => this.handleFileWatch(event),
      'system-started': () => this.handleSystemStarted()
    }
  }

  getEventStreams(): Record<string, Observable<any>> {
    return {
      'file-activity': this.fileWatcher.createActivityStream(),
      'file-operations': this.fileOperations.createOperationsStream()
    }
  }

  getDefaultConfig(): Record<string, any> {
    return {
      watchPatterns: ['**/*.md'],
      debounceMs: 1000,
      ignorePatterns: ['**/node_modules/**', '**/.git/**']
    }
  }

  validateConfig(config: any): boolean {
    return typeof config === 'object' && 
           Array.isArray(config.watchPatterns) &&
           typeof config.debounceMs === 'number'
  }

  private async handleFileWatch(event: any): Promise<void> {
    if (event.action === 'start') {
      await this.fileWatcher.addPattern(event.watchPattern)
    } else {
      await this.fileWatcher.removePattern(event.watchPattern)
    }
  }

  private async handleSystemStarted(): Promise<void> {
    // Start default file watching when system starts
    const config = this.context.config
    for (const pattern of config.watchPatterns) {
      await this.fileWatcher.addPattern(pattern)
    }
  }
}
```

#### 2. UI Components Package

```typescript
// packages/ui-components/src/UIComponentsPackage.ts
import { z } from 'zod'
import { Observable } from 'rxjs'
import { IPackage, IPackageContext } from '@tars/core/types/packages'
import { EventViewerComponent } from './EventViewer'
import { StatusBarComponent } from './StatusBar'

export class UIComponentsPackage implements IPackage {
  readonly name = 'ui-components'
  readonly version = '1.0.0'
  readonly dependencies = ['obsidian-bridge']
  
  readonly eventSchemas = {
    'ui-show-event-viewer': z.object({
      type: z.literal('ui-show-event-viewer'),
      timestamp: z.number(),
      source: z.string()
    }),
    'ui-update-status-bar': z.object({
      type: z.literal('ui-update-status-bar'),
      timestamp: z.number(),
      source: z.string(),
      content: z.object({
        text: z.string(),
        tooltip: z.string()
      })
    })
  }

  private eventViewer: EventViewerComponent
  private statusBar: StatusBarComponent
  private context!: IPackageContext

  async initialize(context: IPackageContext): Promise<void> {
    this.context = context
    this.eventViewer = new EventViewerComponent(context)
    this.statusBar = new StatusBarComponent(context)
    
    context.logger('UI components package initialized')
  }

  async activate(): Promise<void> {
    await this.eventViewer.mount()
    await this.statusBar.mount()
    
    this.context.logger('UI components package activated')
  }

  async deactivate(): Promise<void> {
    await this.eventViewer.unmount()
    await this.statusBar.unmount()
    
    this.context.logger('UI components package deactivated')
  }

  async dispose(): Promise<void> {
    await this.eventViewer.dispose()
    await this.statusBar.dispose()
    this.context.logger('UI components package disposed')
  }

  getEventHandlers(): Record<string, (event: any) => void> {
    return {
      'ui-show-event-viewer': () => this.eventViewer.show(),
      'file-change': (event) => this.statusBar.updateFileStatus(event),
      'editor-change': (event) => this.statusBar.updateEditorStatus(event)
    }
  }

  getEventStreams(): Record<string, Observable<any>> {
    return {
      'ui-interactions': this.eventViewer.createInteractionStream(),
      'status-bar-updates': this.statusBar.createUpdateStream()
    }
  }

  getDefaultConfig(): Record<string, any> {
    return {
      showEventViewerRibbon: true,
      statusBarPosition: 'bottom',
      maxEventHistory: 1000
    }
  }

  validateConfig(config: any): boolean {
    return typeof config === 'object' &&
           typeof config.showEventViewerRibbon === 'boolean' &&
           typeof config.maxEventHistory === 'number'
  }
}
```

### ZeroMQ Integration for Remote Packages

#### ZeroMQ Event Bridge

```typescript
// packages/core/src/ZeroMQBridge.ts
import * as zmq from 'zeromq'
import { Observable, Subject } from 'rxjs'
import { createDebug } from 'debug'
import { IEventDispatcher } from './types/packages'

const debug = createDebug('tars:core:zeromq')

export interface ZeroMQConfig {
  publisherPort: number
  subscriberPort: number
  replyPort: number
  host: string
}

export class ZeroMQBridge {
  private publisher: zmq.Socket
  private subscriber: zmq.Socket
  private reply: zmq.Socket
  private eventSubject = new Subject<any>()
  private eventDispatcher: IEventDispatcher
  private config: ZeroMQConfig

  constructor(eventDispatcher: IEventDispatcher, config: ZeroMQConfig) {
    this.eventDispatcher = eventDispatcher
    this.config = config
  }

  async initialize(): Promise<void> {
    debug('Initializing ZeroMQ bridge')

    // Create sockets
    this.publisher = new zmq.Publisher()
    this.subscriber = new zmq.Subscriber()
    this.reply = new zmq.Reply()

    // Bind sockets
    await this.publisher.bind(`tcp://${this.config.host}:${this.config.publisherPort}`)
    await this.subscriber.bind(`tcp://${this.config.host}:${this.config.subscriberPort}`)
    await this.reply.bind(`tcp://${this.config.host}:${this.config.replyPort}`)

    // Subscribe to all events
    this.subscriber.subscribe()

    // Setup message handling
    this.setupMessageHandling()
    
    debug('ZeroMQ bridge initialized')
  }

  async dispose(): Promise<void> {
    debug('Disposing ZeroMQ bridge')
    
    await this.publisher.close()
    await this.subscriber.close()
    await this.reply.close()
    this.eventSubject.complete()
    
    debug('ZeroMQ bridge disposed')
  }

  private setupMessageHandling(): void {
    // Handle incoming messages
    this.handleIncomingMessages()
    
    // Handle request/reply pattern
    this.handleRequests()
    
    // Bridge local events to remote
    this.bridgeLocalEvents()
  }

  private async handleIncomingMessages(): Promise<void> {
    for await (const [msg] of this.subscriber) {
      try {
        const event = JSON.parse(msg.toString())
        this.eventSubject.next(event)
        
        // Dispatch to local event system
        await this.eventDispatcher.dispatch(event.type, event)
      } catch (error) {
        debug.error('Failed to parse incoming message:', error)
      }
    }
  }

  private async handleRequests(): Promise<void> {
    for await (const [msg] of this.reply) {
      try {
        const request = JSON.parse(msg.toString())
        
        // Handle different request types
        let response: any
        switch (request.type) {
          case 'list-packages':
            response = { type: 'packages-list', packages: [] } // Implement actual logic
            break
          case 'package-status':
            response = { type: 'package-status', active: false } // Implement actual logic
            break
          default:
            response = { type: 'error', message: `Unknown request type: ${request.type}` }
        }
        
        await this.reply.send(JSON.stringify(response))
      } catch (error) {
        debug.error('Failed to handle request:', error)
        await this.reply.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid request format' 
        }))
      }
    }
  }

  private bridgeLocalEvents(): void {
    // Subscribe to all local events and forward to remote
    // This would be implemented based on the specific events to bridge
    debug('Local event bridging configured')
  }

  // Publish event to remote subscribers
  async publishEvent(event: any): Promise<void> {
    await this.publisher.send(JSON.stringify(event))
  }

  // Get stream of remote events
  getRemoteEvents(): Observable<any> {
    return this.eventSubject.asObservable()
  }

  // Send request to remote process
  async sendRequest(request: any): Promise<any> {
    const requester = new zmq.Request()
    await requester.connect(`tcp://${this.config.host}:${this.config.replyPort}`)
    
    await requester.send(JSON.stringify(request))
    const [reply] = await requester.receive()
    
    await requester.close()
    return JSON.parse(reply.toString())
  }
}
```

#### Remote Package Runner

```typescript
// packages/core/src/RemotePackageRunner.ts
import { ZeroMQBridge } from './ZeroMQBridge'
import { EventDispatcher } from './EventDispatcher'
import { PackageRegistry } from './PackageRegistry'
import { createDebug } from 'debug'

const debug = createDebug('tars:core:remote-runner')

export class RemotePackageRunner {
  private zeroMQBridge: ZeroMQBridge
  private eventDispatcher: EventDispatcher
  private packageRegistry: PackageRegistry
  private packages: string[] = []

  constructor(
    packages: string[],
    zmqConfig: ZeroMQConfig
  ) {
    this.packages = packages
    this.eventDispatcher = new EventDispatcher()
    this.packageRegistry = new PackageRegistry(this.eventDispatcher)
    this.zeroMQBridge = new ZeroMQBridge(this.eventDispatcher, zmqConfig)
  }

  async initialize(): Promise<void> {
    debug('Initializing remote package runner')

    // Initialize ZeroMQ bridge
    await this.zeroMQBridge.initialize()

    // Load and register packages
    for (const packageName of this.packages) {
      try {
        const PackageClass = await import(packageName)
        const pkg = new PackageClass.default()
        
        await this.packageRegistry.registerPackage(pkg)
        await this.packageRegistry.activatePackage(pkg.name)
        
        debug(`Remote package '${packageName}' loaded and activated`)
      } catch (error) {
        debug.error(`Failed to load package '${packageName}':`, error)
      }
    }

    debug('Remote package runner initialized')
  }

  async start(): Promise<void> {
    debug('Starting remote package runner')
    
    // Keep the process running
    process.on('SIGINT', () => this.shutdown())
    process.on('SIGTERM', () => this.shutdown())
    
    debug('Remote package runner started')
  }

  async shutdown(): Promise<void> {
    debug('Shutting down remote package runner')
    
    // Deactivate all packages
    const packages = this.packageRegistry.listPackages()
    for (const pkg of packages) {
      await this.packageRegistry.deactivatePackage(pkg.name)
    }
    
    // Dispose ZeroMQ bridge
    await this.zeroMQBridge.dispose()
    
    process.exit(0)
  }
}
```

### Updated PoC Package Configuration

```json
// packages/poc/package.json
{
  "name": "@tars/poc",
  "version": "0.1.0",
  "description": "Proof of Concept for Event-Driven Streams Architecture",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "debug": "DEBUG=tars:poc:* npm run dev",
    "start:local": "node dist/local-runner.js",
    "start:remote": "node dist/remote-runner.js"
  },
  "dependencies": {
    "tseep": "^1.1.0",
    "rxjs": "^7.8.1",
    "zod": "^3.22.4",
    "nanostores": "^0.9.3",
    "debug": "^4.3.4",
    "zeromq": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "obsidian": "^1.4.0"
  },
  "peerDependencies": {
    "obsidian": "^1.4.0"
  }
}
```
```

## Detailed Implementation

### 1. Event Schemas with Zod

```typescript
// src/types/events.ts
import { z } from 'zod'

// Base event schema
export const BaseEventSchema = z.object({
  type: z.string(),
  timestamp: z.number(),
  source: z.string(),
  correlationId: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export type BaseEvent = z.infer<typeof BaseEventSchema>

// Specific event schemas
export const FileEventSchema = BaseEventSchema.extend({
  type: z.literal('file-change'),
  filePath: z.string(),
  fileType: z.enum(['markdown', 'json', 'yaml', 'other']),
  operation: z.enum(['create', 'update', 'delete', 'move'])
})

export const EditorEventSchema = BaseEventSchema.extend({
  type: z.literal('editor-change'),
  editorId: z.string(),
  filePath: z.string(),
  position: z.object({
    line: z.number(),
    ch: z.number()
  }).optional(),
  operation: z.enum(['cursor', 'selection', 'content'])
})

export const MCPEventSchema = BaseEventSchema.extend({
  type: z.literal('mcp-action'),
  serverId: z.string(),
  toolName: z.string().optional(),
  operation: z.enum(['start-server', 'stop-server', 'execute-tool'])
})

export type FileEvent = z.infer<typeof FileEventSchema>
export type EditorEvent = z.infer<typeof EditorEventSchema>
export type MCPEvent = z.infer<typeof MCPEventSchema>

// Union of all event types
export const PluginEventSchema = z.discriminatedUnion('type', [
  FileEventSchema,
  EditorEventSchema,
  MCPEventSchema
])

export type PluginEvent = z.infer<typeof PluginEventSchema>
```

### 2. Core Event System

```typescript
// src/core/PoCCore.ts
import { EventEmitter3 } from 'eventemitter3'
import { Subject, merge } from 'rxjs'
import { map, filter, debounce, catchError } from 'rxjs/operators'
import { createDebug } from 'debug'
import { PluginEvent, PluginEventSchema } from '../types/events'

const debug = createDebug('tars:poc:core')

export class PoCCore {
  private eventEmitter = new EventEmitter3()
  private eventSubject = new Subject<PluginEvent>()
  private isInitialized = false

  // Public observable for all events
  public events$ = this.eventSubject.asObservable()

  constructor() {
    this.setupEventProcessing()
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      debug('Core already initialized')
      return
    }

    debug('Initializing PoC Core')
    this.isInitialized = true
    
    // Emit core started event
    this.dispatch({
      type: 'system-started',
      timestamp: Date.now(),
      source: 'poc-core'
    })
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return
    }

    debug('Shutting down PoC Core')
    this.eventSubject.complete()
    this.eventEmitter.removeAllListeners()
    this.isInitialized = false
  }

  // Main event dispatch method
  dispatch<T extends PluginEvent>(event: T): void {
    try {
      // Validate event schema
      const validatedEvent = PluginEventSchema.parse(event)
      
      debug('Dispatching event:', validatedEvent)
      
      // Emit to EventEmitter for legacy listeners
      this.eventEmitter.emit(event.type, validatedEvent)
      
      // Emit to RxJS Subject for reactive streams
      this.eventSubject.next(validatedEvent)
    } catch (error) {
      debug('Event validation failed:', error)
      this.dispatch({
        type: 'system-error',
        timestamp: Date.now(),
        source: 'poc-core',
        metadata: { error, originalEvent: event }
      })
    }
  }

  // Create filtered event streams
  createEventStream<T extends PluginEvent>(eventType: T['type']) {
    return this.events$.pipe(
      filter((event): event is T => event.type === eventType)
    )
  }

  // Setup automatic event processing
  private setupEventProcessing(): void {
    // Example: Log all file events with debouncing
    this.createEventStream('file-change').pipe(
      debounce(1000), // Debounce rapid file changes
      map(event => ({
        ...event,
        metadata: {
          ...event.metadata,
          processed: true,
          processedAt: Date.now()
        }
      }))
    ).subscribe(event => {
      debug('Processed file event:', event)
    })

    // Example: Track editor activity
    const editorActivity$ = merge(
      this.createEventStream('editor-change'),
      this.createEventStream('file-change').pipe(
        filter(event => event.fileType === 'markdown')
      )
    )

    editorActivity$.pipe(
      map(() => ({ timestamp: Date.now() })),
      scan((acc, curr) => [...acc.slice(-9), curr], [] as Array<{ timestamp: number }>)
    ).subscribe(activity => {
      debug('Editor activity (last 10 events):', activity)
    })
  }

  // EventEmitter compatibility
  on(event: string, listener: (...args: any[]) => void): this {
    this.eventEmitter.on(event, listener)
    return this
  }

  off(event: string, listener: (...args: any[]) => void): this {
    this.eventEmitter.off(event, listener)
    return this
  }
}
```

### 3. Simple Event Logger

```typescript
// src/core/EventLogger.ts
import { PluginEvent } from '../types/events'
import { createDebug } from 'debug'

const debug = createDebug('tars:poc:logger')

export class EventLogger {
  private eventLog: Array<{ event: PluginEvent; loggedAt: number }> = []
  private maxLogSize = 1000

  log(event: PluginEvent): void {
    const logEntry = {
      event,
      loggedAt: Date.now()
    }

    this.eventLog.push(logEntry)
    debug('Logged event:', {
      type: event.type,
      timestamp: event.timestamp,
      source: event.source
    })

    // Maintain log size
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize)
    }
  }

  getEvents(limit?: number): Array<{ event: PluginEvent; loggedAt: number }> {
    if (limit) {
      return this.eventLog.slice(-limit)
    }
    return [...this.eventLog]
  }

  getEventsByType(eventType: string, limit?: number): Array<{ event: PluginEvent; loggedAt: number }> {
    const filtered = this.eventLog.filter(entry => entry.event.type === eventType)
    return limit ? filtered.slice(-limit) : filtered
  }

  clear(): void {
    this.eventLog = []
    debug('Event log cleared')
  }

  getStats(): {
    total: number
    byType: Record<string, number>
    latest: number
  } {
    const byType: Record<string, number> = {}
    
    this.eventLog.forEach(entry => {
      byType[entry.event.type] = (byType[entry.event.type] || 0) + 1
    })

    return {
      total: this.eventLog.length,
      byType,
      latest: this.eventLog[this.eventLog.length - 1]?.loggedAt || 0
    }
  }
}
```

### 4. Obsidian Event Bridge

```typescript
// src/shell/ObsidianAdapter.ts
import { App, Editor, TFile } from 'obsidian'
import { PoCCore } from '../core/PoCCore'
import { FileEvent, EditorEvent, MCPEvent } from '../types/events'
import { createDebug } from 'debug'

const debug = createDebug('tars:poc:adapter')

export class ObsidianAdapter {
  private disposables: Array<() => void> = []

  constructor(
    private app: App,
    private core: PoCCore
  ) {}

  initialize(): void {
    debug('Initializing Obsidian adapter')
    this.setupFileEventListeners()
    this.setupEditorEventListeners()
    this.setupWorkspaceEventListeners()
  }

  dispose(): void {
    debug('Disposing Obsidian adapter')
    this.disposables.forEach(dispose => dispose())
    this.disposables = []
  }

  private setupFileEventListeners(): void {
    // File creation/modification
    const fileCreateHandler = (file: TFile) => {
      const event: FileEvent = {
        type: 'file-change',
        timestamp: Date.now(),
        source: 'obsidian-vault',
        filePath: file.path,
        fileType: this.getFileType(file.extension),
        operation: 'create'
      }
      this.core.dispatch(event)
    }

    // File modification
    const fileModifyHandler = (file: TFile) => {
      const event: FileEvent = {
        type: 'file-change',
        timestamp: Date.now(),
        source: 'obsidian-vault',
        filePath: file.path,
        fileType: this.getFileType(file.extension),
        operation: 'update'
      }
      this.core.dispatch(event)
    }

    // File deletion
    const fileDeleteHandler = (file: TFile) => {
      const event: FileEvent = {
        type: 'file-change',
        timestamp: Date.now(),
        source: 'obsidian-vault',
        filePath: file.path,
        fileType: this.getFileType(file.extension),
        operation: 'delete'
      }
      this.core.dispatch(event)
    }

    // Register Obsidian event listeners
    this.app.vault.on('create', fileCreateHandler)
    this.app.vault.on('modify', fileModifyHandler)
    this.app.vault.on('delete', fileDeleteHandler)

    this.disposables.push(
      () => this.app.vault.off('create', fileCreateHandler),
      () => this.app.vault.off('modify', fileModifyHandler),
      () => this.app.vault.off('delete', fileDeleteHandler)
    )
  }

  private setupEditorEventListeners(): void {
    // Track active editor changes
    const activeLeafChangeHandler = () => {
      const activeFile = this.app.workspace.getActiveFile()
      if (activeFile) {
        const event: EditorEvent = {
          type: 'editor-change',
          timestamp: Date.now(),
          source: 'obsidian-workspace',
          editorId: 'active-editor',
          filePath: activeFile.path,
          operation: 'cursor'
        }
        this.core.dispatch(event)
      }
    }

    this.app.workspace.on('active-leaf-change', activeLeafChangeHandler)
    this.disposables.push(
      () => this.app.workspace.off('active-leaf-change', activeLeafChangeHandler)
    )
  }

  private setupWorkspaceEventListeners(): void {
    // This is where you'd hook into other Obsidian events
    // For PoC, we're keeping it simple
  }

  private getFileType(extension: string): FileEvent['fileType'] {
    switch (extension) {
      case 'md':
      case 'markdown':
        return 'markdown'
      case 'json':
        return 'json'
      case 'yaml':
      case 'yml':
        return 'yaml'
      default:
        return 'other'
    }
  }
}
```

### 5. Reactive Event Viewer UI

```typescript
// src/ui/EventViewer.tsx
import React, { useEffect, useState } from 'react'
import { Subscription } from 'rxjs'
import { PoCCore } from '../core/PoCCore'
import { PluginEvent } from '../types/events'

interface EventViewerProps {
  core: PoCCore
}

export const EventViewer: React.FC<EventViewerProps> = ({ core }) => {
  const [events, setEvents] = useState<Array<{ event: PluginEvent; id: string }>>([])
  const [filter, setFilter] = useState<string>('')
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    let subscription: Subscription

    if (!isPaused) {
      subscription = core.events$.subscribe(event => {
        const eventId = `${event.type}-${event.timestamp}-${Math.random().toString(36).substr(2, 5)}`
        setEvents(prev => [
          { event, id: eventId },
          ...prev.slice(0, 99) // Keep last 100 events
        ])
      })
    }

    return () => {
      subscription?.unsubscribe()
    }
  }, [core, isPaused])

  const filteredEvents = events.filter(({ event }) =>
    filter === '' || event.type.includes(filter) || event.source.includes(filter)
  )

  const getEventColor = (eventType: string): string => {
    switch (eventType) {
      case 'file-change': return '#4CAF50'
      case 'editor-change': return '#2196F3'
      case 'mcp-action': return '#FF9800'
      case 'system-started': return '#9C27B0'
      case 'system-error': return '#F44336'
      default: return '#666'
    }
  }

  return (
    <div className="event-viewer" style={{ padding: '16px', fontFamily: 'monospace' }}>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Filter events..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            flex: 1
          }}
        />
        <button
          onClick={() => setIsPaused(!isPaused)}
          style={{
            padding: '8px 16px',
            backgroundColor: isPaused ? '#4CAF50' : '#F44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={() => setEvents([])}
          style={{
            padding: '8px 16px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear
        </button>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '8px' }}>
        Showing {filteredEvents.length} of {events.length} events
      </div>

      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '4px',
          height: '400px',
          overflowY: 'auto',
          backgroundColor: '#f5f5f5'
        }}
      >
        {filteredEvents.map(({ event, id }) => (
          <div
            key={id}
            style={{
              padding: '8px',
              borderBottom: '1px solid #eee',
              backgroundColor: 'white'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: getEventColor(event.type),
                  marginRight: '8px'
                }}
              />
              <strong>{event.type}</strong>
              <span style={{ marginLeft: '8px', color: '#666', fontSize: '11px' }}>
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#666' }}>
              Source: {event.source}
              {event.filePath && <span> | File: {event.filePath}</span>}
            </div>
            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <div style={{ fontSize: '11px', color: '#888' }}>
                Metadata: {JSON.stringify(event.metadata, null, 2)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 6. Main PoC Plugin

```typescript
// src/shell/PoCPlugin.ts
import { Plugin, Notice } from 'obsidian'
import { PoCCore } from '../core/PoCCore'
import { EventLogger } from '../core/EventLogger'
import { ObsidianAdapter } from './ObsidianAdapter'
import { ReactBridge } from '../bridge/ReactBridge'
import { EventViewer } from '../ui/EventViewer'
import { createDebug } from 'debug'

const debug = createDebug('tars:poc:plugin')

export default class PoCPlugin extends Plugin {
  private core: PoCCore
  private eventLogger: EventLogger
  private obsidianAdapter: ObsidianAdapter
  private reactBridge: ReactBridge

  async onload(): Promise<void> {
    debug('Loading PoC Plugin')

    try {
      // Initialize core systems
      this.core = new PoCCore()
      this.eventLogger = new EventLogger()
      this.obsidianAdapter = new ObsidianAdapter(this.app, this.core)
      this.reactBridge = new ReactBridge(this.app)

      // Initialize core
      await this.core.initialize()

      // Setup event logging
      this.core.events$.subscribe(event => {
        this.eventLogger.log(event)
      })

      // Setup Obsidian integration
      this.obsidianAdapter.initialize()

      // Add event viewer as a ribbon icon
      this.addRibbonIcon('activity', 'TARS PoC Event Viewer', (evt) => {
        this.showEventViewer()
      })

      // Add command to open event viewer
      this.addCommand({
        id: 'open-poc-event-viewer',
        name: 'Open PoC Event Viewer',
        callback: () => this.showEventViewer()
      })

      // Add command to show event statistics
      this.addCommand({
        id: 'show-poc-event-stats',
        name: 'Show PoC Event Statistics',
        callback: () => this.showEventStatistics()
      })

      new Notice('TARS PoC Plugin loaded successfully')
      debug('PoC Plugin loaded successfully')

    } catch (error) {
      debug('Failed to load PoC Plugin:', error)
      new Notice(`Failed to load PoC Plugin: ${error}`)
    }
  }

  async onunload(): Promise<void> {
    debug('Unloading PoC Plugin')

    try {
      // Cleanup systems
      this.obsidianAdapter?.dispose()
      this.reactBridge?.unmountAll()
      await this.core?.shutdown()

      new Notice('TARS PoC Plugin unloaded')
      debug('PoC Plugin unloaded successfully')

    } catch (error) {
      debug('Error unloading PoC Plugin:', error)
    }
  }

  private showEventViewer(): void {
    // Create modal with event viewer
    const modal = this.createModal()
    
    // Mount React component
    this.reactBridge.mount(modal.contentEl, EventViewer, {
      core: this.core
    })

    modal.open()
  }

  private showEventStatistics(): void {
    const stats = this.eventLogger.getStats()
    
    const statsContent = `
Event Statistics:
- Total Events: ${stats.total}
- Latest Event: ${new Date(stats.latest).toLocaleString()}
- Events by Type:
${Object.entries(stats.byType)
  .map(([type, count]) => `  - ${type}: ${count}`)
  .join('\n')}
    `.trim()

    console.log(statsContent)
    new Notice('Event statistics logged to console')
  }

  private createModal(): any {
    const { Modal } = require('obsidian')
    
    class EventViewerModal extends Modal {
      constructor(app: any) {
        super(app)
        this.setTitle('TARS PoC Event Viewer')
        this.modalEl.style.width = '800px'
        this.modalEl.style.height = '600px'
      }
    }

    return new EventViewerModal(this.app)
  }
}
```

## PoC Package Configuration

```json
// packages/poc/package.json
{
  "name": "@tars/poc",
  "version": "0.1.0",
  "description": "Proof of Concept for Event-Driven Streams Architecture",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "debug": "DEBUG=tars:poc:* npm run dev"
  },
  "dependencies": {
    "tseep": "^1.1.0",
    "rxjs": "^7.8.1",
    "zod": "^3.22.4",
    "nanostores": "^0.9.3",
    "debug": "^4.3.4",
    "zeromq": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "obsidian": "^1.4.0"
  },
  "peerDependencies": {
    "obsidian": "^1.4.0"
  }
}
```

## Implementation Steps

### Phase 1: Core Infrastructure (Day 1-2)
1. **Set up project structure** with the package.json above
2. **Install dependencies** and configure TypeScript
3. **Implement event schemas** using Zod validation
4. **Create PoCCore** with RxJS integration
5. **Build EventLogger** for debugging

### Phase 2: Obsidian Integration (Day 3)
1. **Implement ObsidianAdapter** for event bridging
2. **Create basic PoCPlugin** as main entry point
3. **Test event flow** from Obsidian to core
4. **Verify event logging** and validation

### Phase 3: UI Components (Day 4)
1. **Implement EventViewer** React component
2. **Create ReactBridge** for Obsidian integration
3. **Add ribbon icon** and commands
4. **Test reactive updates** with event stream

### Phase 4: Testing and Validation (Day 5)
1. **Comprehensive testing** of event flow
2. **Performance measurement** and optimization
3. **Error handling** validation
4. **Documentation** and demo preparation

## Expected Outcomes

### What the PoC Demonstrates
1. **Event Decoupling** - Complete separation of Obsidian events from core logic
2. **Reactive Streams** - Automatic UI updates through RxJS streams
3. **Type Safety** - Runtime validation with Zod schemas
4. **Event Logging** - Comprehensive event tracking for debugging
5. **Extensibility** - Easy addition of new event types and handlers

### Success Criteria
- [ ] All Obsidian events are captured and logged
- [ ] Event validation prevents invalid data
- [ ] Reactive UI updates in real-time
- [ ] Performance is acceptable (< 5ms event processing)
- [ ] Code is well-structured and documented
- [ ] Zero custom interfaces (uses existing libraries)

## Debugging and Monitoring

### Environment Variables
```bash
# Enable all debug logs
DEBUG=tars:poc:*

# Enable specific modules
DEBUG=tars:poc:core,tars:poc:adapter,tars:poc:logger

# Disable debug logs
DEBUG=
```

### Event Flow Visualization
The PoC includes an event viewer that shows:
- Real-time event stream
- Event filtering capabilities
- Event statistics and metrics
- Color-coded event types
- Pause/resume functionality

## Next Steps After PoC

If the PoC is successful, the next steps would be:
1. **Add actual core logic** instead of just logging
2. **Implement MCP integration** with reactive streams
3. **Add persistence layer** for state management
4. **Create remote core** with HTTP communication
5. **Migrate existing TARS features** to new architecture

## Risk Analysis and Critical Failure Points

This section provides a critical analysis of the proposed event-driven streams architecture, identifying potential failure points, weak logic, and implementation challenges that could jeopardize the success of the system.

### 🚨 Critical Architecture Risks

#### 1. **Bootstrap and Initialization Chaos**

**Problem**: The current architecture lacks a robust dependency resolution and initialization ordering system.

**Failure Scenarios**:
- **Circular Dependencies**: Package A depends on B, B depends on C, C depends on A
- **Race Conditions**: Multiple packages initializing simultaneously, accessing shared resources
- **Partial Bootstrap**: System starts with only some packages loaded, leaving inconsistent state
- **Deadlock During Init**: Package A waits for event from Package B, but B hasn't finished initializing

**Weak Logic**: 
```typescript
// Current naive dependency checking
for (const dep of pkg.dependencies) {
  if (!this.packages.has(dep)) {
    throw new Error(`Package '${pkg.name}' depends on '${dep}' which is not registered`)
  }
}
```
This only checks if packages are registered, not if they're successfully initialized or activated.

**Required Solution**: Implement a proper topological sort for dependency resolution and phased initialization:

```typescript
interface IBootstrapManager {
  resolveDependencyOrder(packages: IPackage[]): IPackage[]
  initializePhase(phase: BootstrapPhase, packages: IPackage[]): Promise<void>
  validateBootstrapState(): BootstrapState
}

enum BootstrapPhase {
  CORE = 'core',           // Event system, logging
  PLATFORM = 'platform',   // Obsidian bridge, file system
  SERVICES = 'services',    // MCP, external integrations
  UI = 'ui',              // React components, status bar
  EXTENSIONS = 'extensions' // User-added packages
}
```

#### 2. **Event System Collapse Under Load**

**Problem**: The event dispatcher is a single point of failure with no backpressure handling.

**Failure Scenarios**:
- **Event Storm**: Rapid file changes generate thousands of events per second
- **Memory Leaks**: RxJS Subjects never complete, accumulating subscribers
- **Event Loop Blocking**: Synchronous event handlers block the main thread
- **Schema Validation Overhead**: Zod validation becomes bottleneck with high event volume

**Weak Logic**:
```typescript
// No backpressure or rate limiting
async dispatch<T>(eventType: string, event: T): Promise<void> {
  // This can be called thousands of times per second
  // with no mechanism to slow down producers
  this.emit(eventType, event)
  this.eventSubjects.get(eventType)?.next(event)
}
```

**Required Solution**: Implement event backpressure, batching, and circuit breakers:

```typescript
interface IResilientEventDispatcher extends IEventDispatcher {
  dispatchWithBackpressure<T>(eventType: string, event: T): Promise<void>
  setEventRateLimit(eventType: string, maxPerSecond: number): void
  getCircuitBreaker(eventType: string): ICircuitBreaker
}
```

#### 3. **Package Hot-Swap Failures**

**Problem**: Package unloading/ reloading is not atomic and can leave system in inconsistent state.

**Failure Scenarios**:
- **Stale Event Handlers**: Old package handlers remain registered after unload
- **Memory Retention**: Package holds references to global objects after disposal
- **Event Loss**: Events dispatched during package swap are lost
- **UI State Corruption**: React components unmount while still processing events

**Weak Logic**:
```typescript
// Current unregisterPackage has race conditions
unregisterPackage(packageName: string): void {
  const pkg = this.packages.get(packageName)
  if (!pkg) return

  // This should be atomic, but it's not
  this.eventDispatcher.unregisterPackage(packageName)
  this.packages.delete(packageName)
  // What if an event arrives between these two lines?
}
```

**Required Solution**: Implement atomic package lifecycle with quiescence periods:

```typescript
interface IAtomicPackageRegistry {
  swapPackage(oldName: string, newPkg: IPackage): Promise<void>
  quiescePackage(packageName: string): Promise<void>
  createPackageTransaction(): IPackageTransaction
}
```

#### 4. **ZeroMQ Communication Failures**

**Problem**: Remote process communication has no fault tolerance or recovery mechanisms.

**Failure Scenarios**:
- **Network Partitions**: Remote package runner becomes unreachable
- **Message Loss**: UDP-like behavior under high load
- **Serialization Failures**: Complex objects can't be JSON serialized
- **Process Crashes**: Remote process dies without graceful shutdown

**Weak Logic**:
```typescript
// No error handling or retries
async publishEvent(event: any): Promise<void> {
  await this.publisher.send(JSON.stringify(event))
  // What if this fails? What if the event is too large?
  // What if JSON.stringify throws?
}
```

**Required Solution**: Implement robust IPC with retries, message queues, and health monitoring:

```typescript
interface IResilientZeroMQBridge {
  publishWithRetry(event: any, maxRetries: number): Promise<void>
  checkRemoteHealth(): Promise<HealthStatus>
  serializeEvent(event: any): Promise<SerializedEvent>
}
```

### 🔄 Cross-Platform Integration Challenges

#### 1. **Event Schema Evolution**

**Problem**: No versioning strategy for event schemas across different applications.

**Failure Scenarios**:
- **Schema Mismatch**: Different applications expect different event versions
- **Breaking Changes**: Adding required fields breaks existing consumers
- **Backward Compatibility**: Old packages can't handle new event formats

**Required Solution**: Implement schema versioning and compatibility layers:

```typescript
interface IVersionedEvent {
  type: string
  version: string
  data: any
  compatibility: 'exact' | 'forward' | 'backward'
}

interface ISchemaRegistry {
  registerSchema(eventType: string, version: string, schema: z.ZodSchema): void
  validateEvent(event: IVersionedEvent): ValidationResult
  transformEvent(event: IVersionedEvent, targetVersion: string): IVersionedEvent
}
```

#### 2. **Application-Specific Bridges**

**Problem**: Each application (IDE, console app, web app) requires different bridge implementations.

**Integration Requirements for Different Applications**:

**VS Code Extension**:
```typescript
interface IVSCodeBridge {
  onDocumentChange(callback: (event: DocumentChangeEvent) => void): void
  onActiveEditorChange(callback: (event: EditorChangeEvent) => void)
  showStatusBarMessage(message: string): void
  createWebviewPanel(panelOptions: WebviewOptions): WebviewPanel
}
```

**Console Application**:
```typescript
interface IConsoleBridge {
  onKeyPress(callback: (event: KeyEvent) => void): void
  onFileDrop(callback: (event: FileDropEvent) => void): void
  writeOutput(text: string): void
  clearScreen(): void
}
```

**Web Application**:
```typescript
interface IWebBridge {
  onDOMEvent(callback: (event: DOMEvent) => void): void
  onWebSocketMessage(callback: (event: MessageEvent) => void): void
  updateUI(component: string, props: any): void
  showModal(content: string): Promise<any>
}
```

#### 3. **Resource Management Across Boundaries**

**Problem**: Different applications have different resource constraints and capabilities.

**Failure Scenarios**:
- **Memory Exhaustion**: Console app can't handle large event streams
- **File System Access**: Web app can't access local files directly
- **UI Threading**: Desktop apps have different threading models

**Required Solution**: Application capability detection and resource adaptation:

```typescript
interface IApplicationCapabilities {
  maxEventRate: number
  supportedEventTypes: string[]
  fileSystemAccess: boolean
  uithreadingModel: 'single' | 'multi' | 'worker'
  maxMemoryUsage: number
}

interface ICapabilityAwareBridge {
  getCapabilities(): IApplicationCapabilities
  adaptEventRate(events: Event[]): Event[]
  filterSupportedEvents(events: Event[]): Event[]
}
```

### 🏗️ Bootstrap Architecture Requirements

#### 1. **Dependency Graph Resolution**

```typescript
interface IDependencyGraph {
  addNode(package: IPackage): void
  addEdge(from: string, to: string): void
  topologicalSort(): string[]
  detectCycles(): string[]
  getLoadOrder(): string[]
}
```

#### 2. **Phased Initialization**

```typescript
interface IBootstrapPhases {
  phase1: CoreBootstrapPhase      // Event system, logging, config
  phase2: PlatformBootstrapPhase   // Application bridges
  phase3: ServiceBootstrapPhase    // External services, MCP
  phase4: UIPhase                 // React components, status
  phase5: ExtensionPhase          // User packages
}
```

#### 3. **Health Monitoring and Recovery**

```typescript
interface IBootstrapHealthMonitor {
  checkPhaseHealth(phase: BootstrapPhase): HealthStatus
  detectInitializationFailures(): FailureReport[]
  attemptRecovery(failure: InitializationFailure): Promise<boolean>
  rollbackToLastKnownGoodState(): Promise<void>
}
```

### 🔧 Mitigation Strategies

#### 1. **Event System Resilience**

```typescript
class ResilientEventDispatcher extends EventDispatcher {
  private eventQueues = new Map<string, Queue<any>>()
  private circuitBreakers = new Map<string, CircuitBreaker>()
  private rateLimiters = new Map<string, RateLimiter>()

  async dispatch<T>(eventType: string, event: T): Promise<void> {
    // Check circuit breaker
    const circuitBreaker = this.circuitBreakers.get(eventType)
    if (circuitBreaker?.isOpen()) {
      throw new Error(`Circuit breaker open for ${eventType}`)
    }

    // Apply rate limiting
    const rateLimiter = this.rateLimiters.get(eventType)
    if (rateLimiter && !rateLimiter.canProceed()) {
      await rateLimiter.waitUntilAllowed()
    }

    // Batch events if under high load
    const queue = this.eventQueues.get(eventType)
    if (queue && queue.size() > 1000) {
      await this.processBatch(eventType)
    }

    await super.dispatch(eventType, event)
  }
}
```

#### 2. **Atomic Package Management**

```typescript
class AtomicPackageRegistry extends PackageRegistry {
  async swapPackage(oldName: string, newPkg: IPackage): Promise<void> {
    // Create transaction
    const transaction = this.createTransaction()
    
    try {
      // Quiesce old package
      await this.quiescePackage(oldName)
      
      // Wait for in-flight events to complete
      await this.waitForEventCompletion(oldName)
      
      // Atomic swap
      transaction.unregister(oldName)
      transaction.register(newPkg)
      
      // Commit transaction
      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }
}
```

#### 3. **Robust IPC Layer**

```typescript
class RobustZeroMQBridge extends ZeroMQBridge {
  private messageQueue = new Queue<SerializedEvent>()
  private retryPolicy = new ExponentialBackoff()
  private healthChecker = new HealthChecker()

  async publishEvent(event: any): Promise<void> {
    try {
      const serialized = await this.serializeEvent(event)
      await this.publishWithRetry(serialized)
    } catch (error) {
      // Queue for later retry
      this.messageQueue.enqueue({ event, timestamp: Date.now() })
      this.scheduleRetry()
    }
  }

  private async publishWithRetry(serialized: SerializedEvent): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await this.publisher.send(serialized.data)
        return
      } catch (error) {
        if (attempt === 2) throw error
        await this.retryPolicy.wait(attempt)
      }
    }
  }
}
```

### 📊 Success Criteria Revision

**Technical Success Criteria**:
- [ ] Bootstrap completes successfully with 50+ packages
- [ ] System handles 10,000 events/second without degradation
- [ ] Package hot-swap completes in < 100ms without data loss
- [ ] Remote process communication survives network partitions
- [ ] Memory usage remains stable under continuous load
- [ ] Event validation overhead < 1ms per event
- [ ] System recovers from crashes without data corruption

**Integration Success Criteria**:
- [ ] VS Code integration works with full feature parity
- [ ] Console application handles event streams efficiently
- [ ] Web application works within browser constraints
- [ ] Cross-application event sharing works seamlessly
- [ ] Schema evolution maintains backward compatibility
- [ ] Different UI frameworks can be plugged in

### 🎯 Critical Implementation Decisions

1. **Bootstrap Strategy**: Must implement phased initialization with dependency resolution
2. **Event System**: Requires backpressure, circuit breakers, and batching
3. **Package Management**: Needs atomic operations and quiescence periods
4. **IPC Layer**: Must be fault-tolerant with retry mechanisms
5. **Schema Evolution**: Requires versioning and compatibility layers
6. **Cross-Platform**: Application-specific bridges are unavoidable
7. **Testing**: Must include chaos engineering and failure injection

This risk analysis reveals that while the event-driven architecture is powerful, it requires significant additional engineering to make it production-ready. The PoC should focus on validating the core concepts while implementing these resilience patterns from the beginning.

This PoC provides a solid foundation for validating the event-driven streams approach while minimizing custom interface development through strategic use of existing, battle-tested libraries.