/**
 * Service Interface Contracts for DI Migration
 *
 * Defines the interfaces that services must implement to work with the DI system.
 * These interfaces ensure consistency and enable proper dependency injection.
 */

// Core Plugin Services
export interface PluginInitializer {
  initialize(): Promise<void>
  dispose(): Promise<void>
  getInitializationOrder(): string[]
}

export interface ServiceRegistry {
  register<T>(token: InjectionToken<T>, service: T): void
  get<T>(token: InjectionToken<T>): T
  getAll(): Map<InjectionToken<any>, any>
  dispose(): void
}

export interface ObsidianCommandService {
  registerCommands(): void
  unregisterCommands(): void
  getCommand(id: string): Command | null
  getAllCommands(): Command[]
}

export interface StatusBarService {
  initialize(): void
  updateStatus(text: string): void
  dispose(): void
}

export interface EditorSuggestService {
  register(): void
  unregister(): void
  isActive(): boolean
}

// Settings Management Interfaces
export interface SettingsValidator {
  validate(settings: PluginSettings): ValidationResult
  getValidationErrors(settings: PluginSettings): string[]
}

export interface SettingsChangeNotifier {
  onChange(callback: (settings: PluginSettings) => void): void
  notifyChange(settings: PluginSettings): void
  removeListener(callback: (settings: PluginSettings) => void): void
}

export interface PluginSettingsFacade extends PluginSettings {
  // Maintains exact same interface as PluginSettings
  // but delegates to DI-managed settings instance
}

// Provider Management Interfaces
export interface ProviderRegistry {
  register<T extends Vendor>(token: InjectionToken<T>, metadata?: ProviderMetadata): void
  unregister(token: InjectionToken<Vendor>): void
  getProvider(name: string): Vendor | null
  getAllProviders(): Vendor[]
  getProviderMetadata(name: string): ProviderMetadata | null
  getProvidersByCapability(capability: string): Vendor[]
}

export interface ProviderFactory {
  getProvider(name: string): Vendor | null
  getAllVendors(): Vendor[]
  isProviderAvailable(name: string): boolean
  getProviderCapabilities(name: string): string[]
}

export interface ProviderFactoryFacade {
  getVendor(name: string): Vendor | null
  getAllVendors(): Vendor[]
  isDIMode(): boolean
  setDIMode(enabled: boolean): void
}

export interface ProviderMetadata {
  readonly name: string
  readonly capabilities: string[]
  readonly configSchema: any
  readonly registrationTime: number
  readonly enabled: boolean
}

// Performance Monitoring Interfaces
export interface DIPerformanceMonitor {
  startTiming(operation: string): void
  endTiming(operation: string): void
  getMetrics(): PerformanceReport
  getOperationMetrics(operation: string): PerformanceMetric
  reset(): void
}

export interface PerformanceReport {
  readonly operations: Record<string, PerformanceMetric>
  readonly totalOperations: number
  readonly averageResolutionTime: number
  readonly memoryFootprint: number
  readonly timestamp: number
}

export interface PerformanceMetric {
  readonly count: number
  readonly totalTime: number
  readonly avgTime: number
  readonly minTime: number
  readonly maxTime: number
}

// Logging Interfaces
export interface DILogger {
  debug(message: string, meta?: Record<string, any>): void
  info(message: string, meta?: Record<string, any>): void
  warn(message: string, meta?: Record<string, any>): void
  error(message: string, error?: Error, meta?: Record<string, any>): void
  setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void
}

// Error Handling Interfaces
export interface DIErrorHandler {
  handleResolutionError(token: any, error: Error): never
  handleConfigurationError(token: any, error: Error): never
  handleCircularDependencyError(token: any, error: Error): never
  handleGenericError(token: any, error: Error): never
}

// Configuration Interfaces
export interface ConfigurationBindingService {
  bindSettings(): void
  bindCoreServices(): void
  onSettingsChanged(newSettings: PluginSettings): void
  validateConfiguration(): ValidationResult
}

// Testing Interfaces
export interface TestContainerFactory {
  createTestContainer(overrides?: TestOverrides): DIContainer
  createIsolatedContainer(providerToken: any): DIContainer
  createMockSettings(): PluginSettings
  createMockApp(): App
}

export interface TestOverrides {
  app?: App
  settings?: PluginSettings
  settingsValidator?: SettingsValidator
  providers?: any[]
  services?: Record<string, any>
}

// Container Lifecycle Interfaces
export interface ContainerLifecycleManager {
  initialize(container: DIContainer): Promise<void>
  dispose(container: DIContainer): Promise<void>
  createChild(parent: DIContainer): DIContainer
  validateContainer(container: DIContainer): ValidationResult
}

// Lazy Loading Interfaces
export interface LazyProviderLoader {
  loadProvider(providerName: string): Promise<Vendor>
  isProviderLoaded(providerName: string): boolean
  preloadProviders(providerNames: string[]): Promise<void>
  unloadProvider(providerName: string): void
}

// Debug Mode Interfaces
export interface DIDebugMode {
  enableDebugMode(): void
  disableDebugMode(): void
  isEnabled(): boolean
  getDebugInfo(): DebugInfo
}

export interface DebugInfo {
  readonly bindings: DebugBinding[]
  readonly instances: DebugInstance[]
  readonly resolutions: DebugResolution[]
  readonly performance: PerformanceReport
  readonly timestamp: number
}

export interface DebugBinding {
  readonly token: string
  readonly type: string
  readonly scope: string
  readonly dependencies: string[]
  readonly metadata: Record<string, any>
}

export interface DebugInstance {
  readonly token: string
  readonly createdAt: number
  readonly resolutionCount: number
  readonly memoryUsage: number
}

export interface DebugResolution {
  readonly token: string
  readonly duration: number
  readonly cached: boolean
  readonly timestamp: number
}