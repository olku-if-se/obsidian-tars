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
import { SettingsChangeNotifier } from './settings-change-notifier'
import { ConfigBindingService } from './config-binding-service'
import { ProviderRegistry } from './provider-registry'
import type { SettingsChangeEvent } from './types'

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
  private _settingsNotifier?: SettingsChangeNotifier
  private _configBindingService?: ConfigBindingService
  private _providerRegistry?: ProviderRegistry
  private _isSettingsMonitoringEnabled = false

  constructor(
    appInstance = inject(Tokens.ObsidianApp),
    initialSettings = inject(Tokens.AppSettings),
    settingsNotifier = inject(SettingsChangeNotifier),
    configBindingService = inject(ConfigBindingService),
    providerRegistry = inject(ProviderRegistry)
  ) {
    this._app = appInstance
    this._lifecycle = new ContainerLifecycleImpl()
    this._settings = initialSettings
    this._settingsNotifier = settingsNotifier
    this._configBindingService = configBindingService
    this._providerRegistry = providerRegistry
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

  /**
   * Enable settings change monitoring
   */
  enableSettingsMonitoring(): void {
    if (this._isSettingsMonitoringEnabled || !this._settingsNotifier) {
      return
    }

    try {
      // Listen for settings changes
      this._settingsNotifier.on('settingsChanged', this.handleSettingsChange.bind(this))
      this._isSettingsMonitoringEnabled = true

      console.log('Settings change monitoring enabled')
    } catch (error) {
      console.error('Failed to enable settings monitoring:', error)
    }
  }

  /**
   * Disable settings change monitoring
   */
  disableSettingsMonitoring(): void {
    if (!this._isSettingsMonitoringEnabled || !this._settingsNotifier) {
      return
    }

    try {
      this._settingsNotifier.off('settingsChanged', this.handleSettingsChange.bind(this))
      this._isSettingsMonitoringEnabled = false

      console.log('Settings change monitoring disabled')
    } catch (error) {
      console.error('Failed to disable settings monitoring:', error)
    }
  }

  /**
   * Check if settings monitoring is enabled
   */
  isSettingsMonitoringEnabled(): boolean {
    return this._isSettingsMonitoringEnabled
  }

  /**
   * Handle settings change events
   */
  private handleSettingsChange(event: SettingsChangeEvent): void {
    try {
      const startTime = Date.now()

      // Update internal settings reference
      this._settings = event.newSettings

      // Log the change
      console.log(`Settings updated at ${new Date(event.timestamp).toISOString()}`)

      // Log detailed changes in debug mode
      if (this.lifecycle.config.debug) {
        console.log('Settings changes:', event.changes)
      }

      // Update performance metrics
      const duration = Date.now() - startTime
      if (this.lifecycle.config.enablePerformanceMonitoring) {
        ;(this.lifecycle.metrics as PerformanceMetricsImpl).recordProviderResolution('settings-update', duration)
      }

      // Emit custom event for other parts of the system
      this.emit('settingsUpdated', {
        previousSettings: event.previousSettings,
        newSettings: event.newSettings,
        changes: event.changes,
        timestamp: event.timestamp,
        duration,
      })

    } catch (error) {
      console.error('Error handling settings change:', error)
    }
  }

  /**
   * Update settings programmatically
   */
  async updateSettings(newSettings: Partial<PluginSettings>, saveToDisk: boolean = true): Promise<void> {
    if (!this._settings) {
      throw new Error(Errors.settings_load_failed)
    }

    try {
      const previousSettings = { ...this._settings }
      const updatedSettings = { ...this._settings, ...newSettings }

      // Notify settings change
      if (this._settingsNotifier) {
        this._settingsNotifier.notifySettingsChanged(updatedSettings, previousSettings)
      }

      // Save to disk if requested
      if (saveToDisk) {
        await this.saveSettingsToDisk(updatedSettings)
      }

    } catch (error) {
      throw new Error(`${Errors.settings_save_failed}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Save settings to disk
   */
  private async saveSettingsToDisk(settings: PluginSettings): Promise<void> {
    try {
      // This would integrate with Obsidian's settings system
      // For now, this is a placeholder implementation
      if (this._container) {
        // TODO: Implement proper settings persistence
        // const settingsService = this._container.get(Tokens.SettingsService);
        // await settingsService.save(settings);
        console.log('Settings saved to disk (placeholder)')
      }
    } catch (error) {
      console.error('Failed to save settings to disk:', error)
      throw error
    }
  }

  /**
   * Get settings change notifier
   */
  getSettingsNotifier(): SettingsChangeNotifier | undefined {
    return this._settingsNotifier
  }

  /**
   * Get config binding service
   */
  getConfigBindingService(): ConfigBindingService | undefined {
    return this._configBindingService
  }

  /**
   * Get provider registry
   */
  getProviderRegistry(): ProviderRegistry | undefined {
    return this._providerRegistry
  }

  /**
   * Simple event emitter for custom events
   */
  private _eventListeners = new Map<string, Set<Function>>()

  on(event: string, listener: Function): void {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, new Set())
    }
    this._eventListeners.get(event)!.add(listener)
  }

  off(event: string, listener: Function): void {
    const listeners = this._eventListeners.get(event)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  private emit(event: string, data: unknown): void {
    const listeners = this._eventListeners.get(event)
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(data)
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      }
    }
  }

  // saveSettings method will be implemented when needed for settings persistence
}
