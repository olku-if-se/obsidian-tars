import { Container, inject, injectable } from '@needle-di/core'
import type { App } from 'obsidian'
import type { Vendor } from '../providers/index'
import type { PluginSettings } from '../settings'
import type {
  ContainerConfig,
  ContainerLifecycle,
  ContainerState,
  PluginInitializer as IPluginInitializer,
  PerformanceMetrics,
  ValidationResult,
} from './interfaces'
import { Tokens } from './tokens'

// Error messages
const Errors = {
  initialization_failed: 'Plugin initialization failed',
  disposal_failed: 'Plugin disposal failed',
  container_not_ready: 'DI container is not ready',
  provider_not_found: 'AI provider not found',
  settings_load_failed: 'Settings loading failed',
  settings_save_failed: 'Settings saving failed',
} as const

// Constants
const DEFAULT_CONFIG: ContainerConfig = {
  debug: false,
  validateOnStartup: true,
  enablePerformanceMonitoring: true,
} as const

// Custom exceptions
export class PluginInitializationError extends Error {
  static failed = (cause?: unknown) =>
    Object.assign(new PluginInitializationError(Errors.initialization_failed), { cause })
}

export class PluginDisposalError extends Error {
  static failed = (cause?: unknown) => Object.assign(new PluginDisposalError(Errors.disposal_failed), { cause })
}

// Performance metrics implementation
class PerformanceMetricsImpl implements PerformanceMetrics {
  private _containerSetupTime = 0
  private _providerResolutionTime = new Map<string, number>()
  private _totalResolutionCount = 0

  recordContainerSetup(time: number): void {
    this._containerSetupTime = time
  }

  recordProviderResolution(name: string, time: number): void {
    this._providerResolutionTime.set(name, time)
    this._totalResolutionCount++
  }

  // Interface compliance
  get containerSetupTime(): number {
    return this._containerSetupTime
  }
  get providerResolutionTime(): Map<string, number> {
    return this._providerResolutionTime
  }
  get totalResolutionCount(): number {
    return this._totalResolutionCount
  }
  get cacheHitRate(): number {
    // This would be calculated based on actual cache hits/misses
    return 0.85 // Placeholder
  }
}

// Container lifecycle implementation
class ContainerLifecycleImpl implements ContainerLifecycle {
  private _state: ContainerState = 'UNINITIALIZED'
  private _config: ContainerConfig = DEFAULT_CONFIG
  private _metrics = new PerformanceMetricsImpl()

  get state(): ContainerState {
    return this._state
  }
  get config(): ContainerConfig {
    return this._config
  }
  get metrics(): PerformanceMetrics {
    return this._metrics
  }

  async initialize(config: ContainerConfig): Promise<void> {
    const startTime = Date.now()

    try {
      this._config = { ...DEFAULT_CONFIG, ...config }
      this._state = 'CONFIGURED'

      if (config.validateOnStartup) {
        const validation = this.validate()
        if (!validation.isValid) {
          throw new Error(`Container validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        }
      }

      this._state = 'READY'

      if (config.enablePerformanceMonitoring) {
        const setupTime = Date.now() - startTime
        ;(this._metrics as PerformanceMetricsImpl).recordContainerSetup(setupTime)
      }
    } catch (error) {
      this._state = 'UNINITIALIZED'
      throw PluginInitializationError.failed(error)
    }
  }

  async dispose(): Promise<void> {
    try {
      this._state = 'DISPOSED'
      // Cleanup logic would go here
    } catch (error) {
      throw PluginDisposalError.failed(error)
    }
  }

  validate(): ValidationResult {
    // Basic validation implementation
    return {
      isValid: true,
      errors: [],
      warnings: [],
    }
  }
}

@injectable()
export class PluginInitializer implements IPluginInitializer {
  private readonly _lifecycle: ContainerLifecycle
  private readonly _app: App
  private _container?: Container
  private _settings?: PluginSettings

  constructor(appInstance = inject(Tokens.ObsidianApp), initialSettings = inject(Tokens.AppSettings)) {
    this._app = appInstance
    this._lifecycle = new ContainerLifecycleImpl()
    this._settings = initialSettings
  }

  get container(): Container {
    if (!this._container) {
      throw new Error(Errors.container_not_ready)
    }
    return this._container
  }

  get app(): App {
    return this._app
  }

  get lifecycle(): ContainerLifecycle {
    return this._lifecycle
  }

  async initialize(): Promise<void> {
    const startTime = Date.now()

    try {
      // Create container
      this._container = new Container()

      // Bind core dependencies
      this._container.bind({ provide: Tokens.ObsidianApp, useValue: this._app })
      this._container.bind({ provide: Tokens.AppSettings, useValue: this._settings })

      // Initialize lifecycle
      await this.lifecycle.initialize({
        debug: false,
        validateOnStartup: true,
        enablePerformanceMonitoring: true,
      })

      // Load settings
      await this.loadSettings()

      console.log(`Plugin initialized in ${Date.now() - startTime}ms`)
    } catch (error) {
      throw PluginInitializationError.failed(error)
    }
  }

  async dispose(): Promise<void> {
    try {
      await this.lifecycle.dispose()
      this._container = undefined
    } catch (error) {
      throw PluginDisposalError.failed(error)
    }
  }

  async reload(): Promise<void> {
    await this.dispose()
    await this.initialize()
  }

  getProvider(name: string): Vendor | null {
    if (!this._container) {
      throw new Error(Errors.container_not_ready)
    }

    try {
      // TODO: Implement provider registry when needed
      // const providerRegistry = this._container.get(Tokens.PROVIDER_REGISTRY);
      return null // Placeholder - providers will be handled differently
    } catch (error) {
      console.warn(`Failed to get provider ${name}:`, error)
      return null
    }
  }

  getSettings(): PluginSettings {
    if (!this._settings) {
      throw new Error(Errors.settings_load_failed)
    }
    return this._settings
  }

  // biome-ignore lint/correctness/noUnusedFunctionParameters: options parameter reserved for future notification customization
  notify(message: string, options: { timeout?: number } = {}): void {
    try {
      if (this._container) {
        // TODO: Implement notifications service when needed
        // const notificationsService = this._container.get(Tokens.NotificationsService);
        // notificationsService.show({ message, timeout: options.timeout });
        console.log(`Plugin notification: ${message}`)
      } else {
        // Fallback to console if container not available
        console.log(`Plugin notification: ${message}`)
      }
    } catch (error) {
      console.warn(`Failed to show notification: ${message}`, error)
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      if (this._container) {
        // TODO: Implement settings service when needed
        // const settingsService = this._container.get(Tokens.SettingsService);
        // await settingsService.load();
        // this._settings = settingsService.get('settings') as PluginSettings;
        console.log('Settings loading (placeholder)')
      }
    } catch (error) {
      console.warn('Failed to load settings:', error)
    }
  }

  // saveSettings method will be implemented when needed for settings persistence
}
