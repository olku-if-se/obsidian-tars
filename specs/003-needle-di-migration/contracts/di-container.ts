/**
 * DI Container Interface Contracts
 *
 * Defines the core interfaces for the Needle DI migration implementation.
 * These contracts ensure type safety and consistency across the dependency injection system.
 */

// Core DI Types
export interface DIContainer {
  // Container lifecycle
  readonly id: string
  readonly type: 'root' | 'child'
  readonly parent?: DIContainer
  readonly debugMode: boolean

  // Service registration
  bind<T>(token: InjectionToken<T>): void
  bind<T>(provider: ClassProvider<T>): void
  bind<T>(provider: ValueProvider<T>): void
  bind<T>(provider: FactoryProvider<T>): void
  bind<T>(provider: ExistingProvider<T>): void

  // Service resolution
  get<T>(token: InjectionToken<T>): T
  get<T>(token: string | symbol): T
  getAll<T>(token: InjectionToken<T>, options?: { multi?: true }): T[]

  // Container management
  createChild(): DIContainer
  dispose(): void

  // Validation and debugging
  validate(): ValidationResult
  getBindings(): ContainerBinding[]
  getStats(): ContainerStats
}

export interface InjectionToken<T = any> {
  readonly name: string
  readonly type: string
  readonly description?: string
  readonly optional: boolean
  readonly multi: boolean
}

export interface ContainerBinding {
  readonly token: InjectionToken
  readonly type: 'class' | 'value' | 'factory' | 'existing'
  readonly implementation?: any
  readonly factory?: () => any
  readonly scope: 'singleton' | 'transient' | 'scoped'
  readonly lazy: boolean
  readonly dependencies?: InjectionToken[]
  readonly metadata?: Record<string, any>
}

// Provider Types
export interface ClassProvider<T> {
  provide: InjectionToken<T>
  useClass: new (...args: any[]) => T
}

export interface ValueProvider<T> {
  provide: InjectionToken<T>
  useValue: T
}

export interface FactoryProvider<T> {
  provide: InjectionToken<T>
  useFactory: (...args: any[]) => T
  deps?: InjectionToken[]
}

export interface ExistingProvider<T> {
  provide: InjectionToken<T>
  useExisting: InjectionToken<T>
}

// Validation Types
export interface ValidationResult {
  readonly valid: boolean
  readonly errors: ValidationError[]
  readonly warnings: ValidationWarning[]
  readonly metadata: {
    readonly totalBindings: number
    readonly circularDependencies: string[]
    readonly missingDependencies: string[]
    readonly performanceMetrics: PerformanceMetrics
  }
}

export interface ValidationError {
  readonly type: 'circular_dependency' | 'missing_dependency' | 'invalid_binding'
  readonly token: string
  readonly message: string
  readonly severity: 'error' | 'warning'
}

export interface ValidationWarning {
  readonly type: string
  readonly token: string
  readonly message: string
}

export interface PerformanceMetrics {
  readonly resolutionTime: number
  readonly memoryUsage: number
  readonly cacheHitRate: number
}

// Container Statistics
export interface ContainerStats {
  readonly bindingsCount: number
  readonly instancesCount: number
  readonly childContainersCount: number
  readonly resolutionCount: number
  readonly cacheHitRate: number
  readonly avgResolutionTime: number
  readonly memoryFootprint: number
}

// Core Token Definitions
export const TARS_PLUGIN = new InjectionToken<TarsPlugin>('TARS_PLUGIN')
export const OBSIDIAN_APP = new InjectionToken<App>('OBSIDIAN_APP')
export const APP_SETTINGS = new InjectionToken<PluginSettings>('APP_SETTINGS')
export const STATUS_BAR_MANAGER = new InjectionToken<StatusBarManager>('STATUS_BAR_MANAGER')
export const PROVIDER_REGISTRY = new InjectionToken<ProviderRegistry>('PROVIDER_REGISTRY')
export const COMMAND_REGISTRY = new InjectionToken<CommandRegistry>('COMMAND_REGISTRY')
export const SERVICE_REGISTRY = new InjectionToken<ServiceRegistry>('SERVICE_REGISTRY')
export const PLUGIN_INITIALIZER = new InjectionToken<PluginInitializer>('PLUGIN_INITIALIZER')

// Provider Tokens
export const OPENAI_PROVIDER = new InjectionToken<OpenAIProvider>('OPENAI_PROVIDER')
export const CLAUDE_PROVIDER = new InjectionToken<ClaudeProvider>('CLAUDE_PROVIDER')
export const DEEPSEEK_PROVIDER = new InjectionToken<DeepSeekProvider>('DEEPSEEK_PROVIDER')
export const GEMINI_PROVIDER = new InjectionToken<GeminiProvider>('GEMINI_PROVIDER')

// Configuration Tokens
export const SETTINGS_VALIDATOR = new InjectionToken<SettingsValidator>('SETTINGS_VALIDATOR')
export const SETTINGS_CHANGE_NOTIFIER = new InjectionToken<SettingsChangeNotifier>('SETTINGS_CHANGE_NOTIFIER')
export const DI_PERFORMANCE_MONITOR = new InjectionToken<DIPerformanceMonitor>('DI_PERFORMANCE_MONITOR')
export const DI_LOGGER = new InjectionToken<DILogger>('DI_LOGGER')

// Service Facade Tokens
export const PLUGIN_SETTINGS_FACADE = new InjectionToken<PluginSettingsFacade>('PLUGIN_SETTINGS_FACADE')
export const PROVIDER_FACTORY_FACADE = new InjectionToken<ProviderFactoryFacade>('PROVIDER_FACTORY_FACADE')