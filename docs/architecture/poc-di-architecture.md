# PoC Architecture Diagram with Dependency Injection

## Visual Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Tars Plugin Environment                           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Bootstrap Layer                              │   │
│  │                                                                     │   │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │   │
│  │  │   DI Container  │    │ Configuration   │    │   Environment   │  │   │
│  │  │                 │    │     Service     │    │     Setup       │  │   │
│  │  │ ┌─────────────┐ │    │                 │    │                 │  │   │
│  │  │ │   Service   │ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │  │   │
│  │  │ │ Registries  │ │    │ │   Config    │ │    │ │   Runtime   │ │  │   │
│  │  │ └─────────────┘ │    │ │   Loader    │ │    │ │  Detection  │ │  │   │
│  │  │ ┌─────────────┐ │    │ └─────────────┘ │    │ └─────────────┘ │  │   │
│  │  │ │  Scopes &   │ │    └─────────────────┘    └─────────────────┘  │   │
│  │  │ │ Lifecycle   │ │                                                     │   │
│  │  │ └─────────────┘ │                                                     │   │
│  │  └─────────────────┘                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Core Services Layer                           │   │
│  │                                                                     │   │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │   │
│  │  │ Event Dispatcher│    │ Package Registry│    │ Communication   │  │   │
│  │  │                 │    │                 │    │     Service      │  │   │
│  │  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │  │   │
│  │  │ │   Event Bus │ │    │ │   Package   │ │    │ │   ZeroMQ    │ │  │   │
│  │  │ │   Stream    │ │    │ │   Manager   │ │    │ │   Bridge    │ │  │   │
│  │  │ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │  │   │
│  │  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │  │   │
│  │  │ │ Validation  │ │    │ │   Lifecycle  │ │    │ │ Message     │ │  │   │
│  │  │ │   Engine    │ │    │ │   Manager   │ │    │ │ Routing     │ │  │   │
│  │  │ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │  │   │
│  │  └─────────────────┘    └─────────────────┘    └─────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      PoC Core System                                 │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                        PoCCore                               │   │   │
│  │  │                                                             │   │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐     │   │   │
│  │  │  │   Event     │  │  Package    │  │   Communication  │     │   │   │
│  │  │  │ Dispatcher  │  │ Registry    │  │     Service      │     │   │   │
│  │  │  │ (Injected)  │  │ (Injected)  │  │    (Injected)    │     │   │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────┘     │   │   │
│  │  │                                                             │   │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐     │   │   │
│  │  │  │    Config   │  │   Logger    │  │  Event Stream    │     │   │   │
│  │  │  │  Service    │  │  Service    │  │   Management     │     │   │   │
│  │  │  │ (Injected)  │  │ (Injected)  │  │   (Injected)     │     │   │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────┘     │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Package Runtime Layer                             │   │
│  │                                                                     │   │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │   │
│  │  │  Package A      │    │  Package B      │    │  Remote Bridge  │  │   │
│  │  │ (Local Process) │    │ (Local Process) │    │    Service      │  │   │
│  │  │                 │    │                 │    │                 │  │   │
│  │  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │  │   │
│  │  │ │    DI       │ │    │ │    DI       │ │    │ │   ZeroMQ    │ │  │   │
│  │  │ │   Scope     │ │    │ │   Scope     │ │    │ │   Client    │ │  │   │
│  │  │ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │  │   │
│  │  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │  │   │
│  │  │ │ Package     │ │    │ │ Package     │ │    │ │ Package     │ │  │   │
│  │  │ │ Instance    │ │    │ │ Instance    │ │    │ │ Runner      │ │  │   │
│  │  │ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │  │   │
│  │  └─────────────────┘    └─────────────────┘    └─────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    External Package Host                            │   │
│  │                                                                     │   │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │   │
│  │  │  Package C      │    │  Package D      │    │  Package E      │  │   │
│  │  │ (Remote Docker) │    │ (Remote Docker) │    │ (Remote Docker) │  │   │
│  │  │                 │    │                 │    │                 │  │   │
│  │  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │  │   │
│  │  │ │    DI       │ │    │ │    DI       │ │    │ │    DI       │ │  │   │
│  │  │ │   Scope     │ │    │ │   Scope     │ │    │ │   Scope     │ │  │   │
│  │  │ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │  │   │
│  │  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │  │   │
│  │  │ │ Package     │ │    │ │ Package     │ │    │ │ Package     │ │  │   │
│  │  │ │ Instance    │ │    │ │ Instance    │ │    │ │ Instance    │  │   │
│  │  │ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │  │   │
│  │  └─────────────────┘    └─────────────────┘    └─────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Dependency Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Dependency Injection Flow                            │
│                                                                             │
│  Bootstrap Phase                                                            │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  1. Container Creation                                                      │
│     ┌────────────────────┐                                                  │
│     │ createCoreContainer│───────────┐                                      │
│     └────────────────────┘           │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌──────────────────┐                             │
│     │   DI Container  │    │ Service Registry │                             │
│     │                 │◄───┤ (Auto-discovery) │                             │
│     │ ┌─────────────┐ │    └──────────────────┘                             │
│     │ │  Singleton  │ │                                                     │
│     │ │   Scopes    │ │                                                     │
│     │ └─────────────┘ │                                                     │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌──────────────────┐                              │
│     │  Service        │    │  Configuration   │                              │
│     │  Registration   │◄───┤    Loading       │                              │
│     └─────────────────┘    └──────────────────┘                              │
│                                                                             │
│  2. Core Initialization                                                     │
│     ┌─────────────────┐                                                     │
│     │ PoCCore Request  │                                                     │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌──────────────────┐                              │
│     │   DI Container  │───►│ Dependency       │                              │
│     │   Resolution    │    │    Graph         │                              │
│     └─────────────────┘    └──────────────────┘                              │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│     │ Event Dispatcher│    │ Package Registry│    │ Communication   │        │
│     │ (Injected)      │    │ (Injected)      │    │ Service (Inj.)  │        │
│     └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│                                                                             │
│  Runtime Phase                                                               │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  3. Package Registration                                                     │
│     ┌─────────────────┐                                                     │
│     │  Package Class  │                                                     │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │ DI Container    │────►│ Package Instance│                              │
│     │ (Auto-inject)   │    │ (Created)       │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Package        │    │  Package        │                              │
│     │  Registration   │    │  Activation      │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                                                             │
│  4. Package Communication                                                    │
│     ┌─────────────────┐                                                     │
│     │  Package A      │                                                     │
│     │  (Local)        │                                                     │
│     └─────────────────┘                                                     │
│                 │                                                           │
│                 ▼                                                           │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Event          │    │  Communication   │                              │
│     │  Dispatcher     │────►│  Service         │                              │
│     │  (DI Service)   │    │  (DI Service)    │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                      │                                      │
│            ┌─────────────────────────┼─────────────────────────┐             │
│            ▼                         ▼                         ▼             │
│     ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│     │  Package B      │    │ Remote Bridge   │    │  Package C      │        │
│     │  (Local)        │    │ (Remote Proc)   │    │  (Remote)       │        │
│     └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Service Interface Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Service Interface Hierarchy                            │
│                                                                             │
│  Core Services                                                              │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  IEventDispatcherService                                                    │
│  ├─ dispatch<T>(eventType: string, event: T): Promise<void>               │
│  ├─ on<T>(eventType: string, handler: Function): () => void                │
│  ├─ createStream<T>(eventType: string): Observable<T>                      │
│  └─ validateEvent(eventType: string, event: any): boolean                  │
│                                                                             │
│  IPackageRegistryService                                                    │
│  ├─ registerPackage(pkg: IPackage): Promise<void>                          │
│  ├─ unregisterPackage(name: string): Promise<void>                         │
│  ├─ getPackage(name: string): IPackage | null                              │
│  ├─ activatePackage(name: string): Promise<void>                           │
│  └─ deactivatePackage(name: string): Promise<void>                         │
│                                                                             │
│  ICommunicationService                                                      │
│  ├─ sendMessage(pkg: string, cmd: string, payload: any): Promise<any>     │
│  ├─ receiveMessages(pkg: string): Observable<any>                          │
│  ├─ establishConnection(pkg: string): Promise<void>                        │
│  └─ closeConnection(pkg: string): Promise<void>                            │
│                                                                             │
│  IConfigurationService                                                      │
│  ├─ get<T>(key: string, defaultValue?: T): T                              │
│  ├─ set(key: string, value: any): void                                     │
│  └─ watch(key: string, callback: Function): () => void                     │
│                                                                             │
│  ILoggingService                                                            │
│  ├─ debug(message: string, ...args: any[]): void                           │
│  ├─ info(message: string, ...args: any[]): void                            │
│  ├─ warn(message: string, ...args: any[]): void                            │
│  └─ error(message: string, ...args: any[]): void                           │
│                                                                             │
│  Package Interfaces                                                          │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  IPackage                                                                   │
│  ├─ name: string                                                            │
│  ├─ version: string                                                         │
│  ├─ dependencies: string[]                                                  │
│  ├─ permissions: PackagePermission[]                                       │
│  ├─ initialize(context: IPackageContext): Promise<void>                   │
│  ├─ activate(): Promise<void>                                              │
│  ├─ deactivate(): Promise<void>                                            │
│  └─ dispose(): Promise<void>                                               │
│                                                                             │
│  IPackageContext                                                            │
│  ├─ container: Container (scoped)                                          │
│  ├─ eventDispatcher: IEventDispatcherService                               │
│  ├─ communication: ICommunicationService                                   │
│  ├─ configuration: IConfigurationService                                   │
│  ├─ logger: ILoggingService                                                │
│  └─ packageRegistry: IPackageRegistryService                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Container Configuration Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Container Configuration Flow                             │
│                                                                             │
│  1. Container Creation                                                      │
│     ┌─────────────────┐                                                     │
│     │ new Container() │                                                     │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Container      │    │  Default Scope   │                              │
│     │  Configuration  │◄───┤  'singleton'     │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                                                             │
│  2. Service Registration                                                     │
│     ┌─────────────────┐                                                     │
│     │ container.register│                                                   │
│     │ (ServiceInterface)│                                                   │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Service        │    │  Implementation  │                              │
│     │  Interface      │◄───┤    Class        │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                                                             │
│  3. Conditional Registration                                                 │
│     ┌─────────────────┐                                                     │
│     │ container.use   │                                                     │
│     │ Factory(() => {  │                                                     │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Configuration  │    │  Conditional     │                              │
│     │  Check          │────►│  Implementation  │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                                                             │
│  4. Package Context Creation                                                 │
│     ┌─────────────────┐                                                     │
│     │ container.create │                                                    │
│     │ Scope()          │                                                   │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Package        │    │  Package        │                              │
│     │  Container      │    │  Context        │                              │
│     │  (Child Scope)  │────►│  Object        │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                                                             │
│  5. Service Resolution                                                       │
│     ┌─────────────────┐                                                     │
│     │ container.get   │                                                     │
│     │ (ServiceClass)  │                                                     │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Dependency     │    │  Instance        │                              │
│     │  Resolution     │────►│  Creation        │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Event Flow with DI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Event Flow with Dependency Injection                  │
│                                                                             │
│  Event Dispatch                                                             │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  1. Package Event Generation                                                │
│     ┌─────────────────┐                                                     │
│     │  Package A      │                                                     │
│     │  (DI Scope)     │                                                     │
│     └─────────────────┘                                                     │
│                 │                                                           │
│                 │ context.eventDispatcher.dispatch()                       │
│                 ▼                                                           │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Event          │    │  Event           │                              │
│     │  Validation     │────►│  Dispatch        │                              │
│     │  Service        │    │  Service         │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Event Bus      │    │  Event Stream    │                              │
│     │  (RxJS)         │────►│  Management      │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                                                             │
│  2. Event Reception                                                         │
│            ┌─────────────────────────┬─────────────────────────┐             │
│            ▼                         ▼                         ▼             │
│     ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│     │  Package B      │    │  Package C      │    │  Core System    │        │
│     │  (Local)        │    │  (Remote)       │    │  (PoCCore)      │        │
│     │                 │    │                 │    │                 │        │
│     │ context.event   │    │ remote.bridge   │    │ core.event$     │        │
│     │ .on('event')    │    │ .receive()      │    │ .subscribe()    │        │
│     └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│                                                                             │
│  3. Event Processing                                                         │
│     ┌─────────────────┐                                                     │
│     │  Event Handler  │                                                     │
│     │  Function      │                                                     │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Package Logic  │    │  Secondary       │                              │
│     │  Execution      │────►│  Events         │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                                                             │
│  4. Error Handling                                                           │
│     ┌─────────────────┐                                                     │
│     │  Event Error    │                                                     │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Error          │    │  Error Event     │                              │
│     │  Logging        │────►│  Dispatch        │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Error Recovery │    │  System Status   │                              │
│     │  Handler        │    │  Update          │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Package Lifecycle with DI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   Package Lifecycle with Dependency Injection               │
│                                                                             │
│  1. Package Registration                                                     │
│     ┌─────────────────┐                                                     │
│     │  Package Class  │                                                     │
│     │  @injectable()  │                                                     │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  DI Container   │────►│  Package        │                              │
│     │  Resolution     │    │  Instance        │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Package        │    │  Registry        │                              │
│     │  Context        │────►│  Registration    │                              │
│     │  Creation       │    │  Service         │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                                                             │
│  2. Package Initialization                                                   │
│     ┌─────────────────┐                                                     │
│     │  pkg.initialize() │                                                   │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  DI Dependencies│    │  Package Setup   │                              │
│     │  Auto-Injected  │────►│  (Event Handlers │                              │
│     └─────────────────┘    │   , Commands)     │                              │
│                            └─────────────────┘                              │
│                                                                             │
│  3. Package Activation                                                       │
│     ┌─────────────────┐                                                     │
│     │  pkg.activate() │                                                     │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Command        │    │  Event           │                              │
│     │  Registration   │    │  Subscription    │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                                                             │
│  4. Package Runtime                                                         │
│     ┌─────────────────┐                                                     │
│     │  Active Package │                                                     │
│     └─────────────────┘                                                     │
│                 │                                                           │
│                 ▼                                                           │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Event Handling │    │  Command         │                              │
│     │  & Processing   │────►│  Processing      │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Inter-Package  │    │  Remote          │                              │
│     │  Communication  │────►│  Communication   │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                                                             │
│  5. Package Deactivation                                                     │
│     ┌─────────────────┐                                                     │
│     │  pkg.deactivate()│                                                   │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Command        │    │  Event           │                              │
│     │  Unregistration │    │  Unsubscription   │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                                                             │
│  6. Package Disposal                                                         │
│     ┌─────────────────┐                                                     │
│     │  pkg.dispose()  │                                                     │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Resource       │    │  DI Container    │                              │
│     │  Cleanup        │────►│  Scope Disposal  │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Testing Architecture with DI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Testing Architecture with DI                            │
│                                                                             │
│  1. Test Container Setup                                                     │
│     ┌─────────────────┐                                                     │
│     │  Test Suite     │                                                     │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Test Container │    │  Mock Services   │                              │
│     │  Creation       │────►│  Registration    │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                                                             │
│  2. Mock Service Registration                                                │
│     ┌─────────────────┐                                                     │
│     │  jest.mock()    │                                                     │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Mock Instance  │    │  Container       │                              │
│     │  Creation       │────►│  Binding         │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                                                             │
│  3. System Under Test                                                        │
│     ┌─────────────────┐                                                     │
│     │  container.get()│                                                    │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  SUT Instance   │    │  Mocked          │                              │
│     │  (with DI)      │────►│  Dependencies    │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                                                             │
│  4. Test Execution                                                           │
│     ┌─────────────────┐                                                     │
│     │  Test Action    │                                                     │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Mock           │    │  Assertion       │                              │
│     │  Interactions   │────►│  Verification    │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                                                             │
│  5. Test Cleanup                                                             │
│     ┌─────────────────┐                                                     │
│     │  afterEach()    │                                                     │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Container      │    │  Mock Reset      │                              │
│     │  Disposal       │────►│  (jest.clearAll)│                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Configuration Management with DI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 Configuration Management with DI                             │
│                                                                             │
│  1. Configuration Loading                                                    │
│     ┌─────────────────┐                                                     │
│     │  Bootstrap      │                                                     │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Config Loader  │    │  Environment     │                              │
│     │  Service        │────►│  Detection       │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  File Config    │    │  Runtime Config  │                              │
│     │  (JSON/YAML)    │    │  (Environment)   │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                                                             │
│  2. Configuration Registration                                               │
│     ┌─────────────────┐                                                     │
│     │  Config Merge    │                                                     │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Configuration  │    │  DI Container    │                              │
│     │  Service        │────►│  Registration    │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                                                             │
│  3. Runtime Configuration Access                                             │
│     ┌─────────────────┐                                                     │
│     │  Service Class  │                                                     │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Config Service │    │  Configuration   │                              │
│     │  (DI Injected)  │────►│  Value Access    │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                                                             │
│  4. Configuration Updates                                                     │
│     ┌─────────────────┐                                                     │
│     │  Config Change  │                                                     │
│     └─────────────────┘                                                     │
│                                      │                                      │
│                                      ▼                                      │
│     ┌─────────────────┐    ┌─────────────────┐                              │
│     │  Config Watcher │    │  Service         │                              │
│     │  (Reactive)     │────►│  Reconfiguration │                              │
│     └─────────────────┘    └─────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```