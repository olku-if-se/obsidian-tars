import { injectable, inject } from '@needle-di/core'
import type { PluginSettings } from '../settings'
import { SettingsChangeNotifier } from './settings-change-notifier'
import { ProviderRegistry } from './provider-registry'
import { ProviderFactoryRegistry } from './provider-factory-impl'
import type { SettingsChangeEvent, ConfigUpdateMetrics, ConfigValidationResult } from './types'
import { Tokens } from './tokens'

// Error messages
const Errors = {
  binding_failed: 'Failed to bind configuration change listener',
  provider_update_failed: 'Failed to update provider configuration',
  validation_failed: 'Configuration validation failed',
  propagation_failed: 'Failed to propagate configuration changes',
} as const

// Custom exceptions
export class ConfigBindingError extends Error {
  static bindingFailed = (cause?: unknown) =>
    Object.assign(new ConfigBindingError(`${Errors.binding_failed}: ${cause}`), {
      code: 'BINDING_FAILED',
      cause,
    })

  static providerUpdateFailed = (providerTag: string, cause?: unknown) =>
    Object.assign(new ConfigBindingError(`${Errors.provider_update_failed}: ${providerTag}`), {
      code: 'PROVIDER_UPDATE_FAILED',
      providerTag,
      cause,
    })

  static validationFailed = (errors: string[]) =>
    Object.assign(new ConfigBindingError(`${Errors.validation_failed}: ${errors.join(', ')}`), {
      code: 'VALIDATION_FAILED',
      errors,
    })

  static propagationFailed = (changeId: string, cause?: unknown) =>
    Object.assign(new ConfigBindingError(`${Errors.propagation_failed}: ${changeId}`), {
      code: 'PROPAGATION_FAILED',
      changeId,
      cause,
    })
}

/**
 * Configuration Binding Service
 * Connects settings change notifications to provider registry updates
 */
@injectable()
export class ConfigBindingService {
  private isBound = false
  private validationEnabled = true
  private updateQueue: Map<string, Promise<void>> = new Map()
  private performanceMetrics: ConfigUpdateMetrics[] = []

  constructor(
    private settingsNotifier = inject(SettingsChangeNotifier),
    private providerRegistry = inject(ProviderRegistry),
    private providerFactoryRegistry = inject(ProviderFactoryRegistry),
    private settings = inject(Tokens.AppSettings)
  ) {}

  /**
   * Bind the configuration services together
   */
  bind(): void {
    if (this.isBound) {
      return
    }

    try {
      // Listen for settings changes
      this.settingsNotifier.on('settingsChanged', this.handleSettingsChange.bind(this))

      this.isBound = true
    } catch (error) {
      throw ConfigBindingError.bindingFailed(error)
    }
  }

  /**
   * Unbind the configuration services
   */
  unbind(): void {
    if (!this.isBound) {
      return
    }

    this.settingsNotifier.off('settingsChanged', this.handleSettingsChange.bind(this))
    this.isBound = false
  }

  /**
   * Handle settings change events
   */
  private async handleSettingsChange(event: SettingsChangeEvent): Promise<void> {
    const changeId = event.changeId
    const startTime = Date.now()

    try {
      // Queue the update to prevent concurrent updates for the same change
      if (this.updateQueue.has(changeId)) {
        return // Already processing this change
      }

      const updatePromise = this.processSettingsChange(event)
      this.updateQueue.set(changeId, updatePromise)

      await updatePromise

      // Clean up queue
      this.updateQueue.delete(changeId)

      // Record performance metrics
      const endTime = Date.now()
      const metrics: ConfigUpdateMetrics = {
        changeId,
        startTime,
        endTime,
        duration: endTime - startTime,
        providersUpdated: this.countUpdatedProviders(event),
        errorsCount: 0,
        validationTime: 0, // Will be set during validation
        propagationTime: 0, // Will be set during propagation
      }

      this.performanceMetrics.push(metrics)
      this.settingsNotifier.emit('propagationComplete', {
        changeId,
        success: true,
        providerCount: metrics.providersUpdated,
      })

    } catch (error) {
      // Clean up queue on error
      this.updateQueue.delete(changeId)

      this.settingsNotifier.emit('propagationError', {
        changeId,
        error: error instanceof Error ? error.message : String(error),
      })

      throw ConfigBindingError.propagationFailed(changeId, error)
    }
  }

  /**
   * Process settings changes and update providers
   */
  private async processSettingsChange(event: SettingsChangeEvent): Promise<void> {
    const { changes, newSettings, previousSettings } = event

    // Validate new settings if validation is enabled
    if (this.validationEnabled) {
      const validation = this.validateConfiguration(newSettings)
      if (!validation.isValid) {
        this.settingsNotifier.emit('validationError', validation)
        throw ConfigBindingError.validationFailed(validation.errors.map(e => e.message))
      }
    }

    // Update provider configurations
    if (changes.providers) {
      await this.updateProviderConfigurations(changes.providers, newSettings, previousSettings)
    }

    // Update registry settings reference
    this.updateRegistrySettings(newSettings)
  }

  /**
   * Validate the new configuration
   */
  private validateConfiguration(settings: PluginSettings): ConfigValidationResult {
    const errors: { path: string; message: string; code: string; severity: 'error' | 'warning' }[] = []
    const warnings: { path: string; message: string; code: string }[] = []

    // Validate providers array
    if (!Array.isArray(settings.providers)) {
      errors.push({
        path: 'providers',
        message: 'Providers must be an array',
        code: 'INVALID_PROVIDERS',
        severity: 'error',
      })
    } else {
      // Validate each provider
      settings.providers.forEach((provider, index) => {
        const prefix = `providers[${index}]`

        if (!provider.tag?.trim()) {
          errors.push({
            path: `${prefix}.tag`,
            message: 'Provider tag is required',
            code: 'MISSING_TAG',
            severity: 'error',
          })
        }

        if (!provider.vendor?.trim()) {
          errors.push({
            path: `${prefix}.vendor`,
            message: 'Provider vendor is required',
            code: 'MISSING_VENDOR',
            severity: 'error',
          })
        }

        if (!provider.options) {
          errors.push({
            path: `${prefix}.options`,
            message: 'Provider options are required',
            code: 'MISSING_OPTIONS',
            severity: 'error',
          })
        } else {
          // Validate options
          if (!provider.options.apiKey?.trim()) {
            warnings.push({
              path: `${prefix}.options.apiKey`,
              message: 'API key is missing or empty',
              code: 'MISSING_API_KEY',
            })
          }

          if (!provider.options.baseURL?.trim()) {
            warnings.push({
              path: `${prefix}.options.baseURL`,
              message: 'Base URL is missing or empty',
              code: 'MISSING_BASE_URL',
            })
          }

          if (!provider.options.model?.trim()) {
            warnings.push({
              path: `${prefix}.options.model`,
              message: 'Model is missing or empty',
              code: 'MISSING_MODEL',
            })
          }
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Update provider configurations based on changes
   */
  private async updateProviderConfigurations(
    providerChanges: any[],
    newSettings: PluginSettings,
    previousSettings: PluginSettings
  ): Promise<void> {
    const previousProviderMap = new Map(
      (previousSettings.providers || []).map(p => [p.tag, p])
    )
    const newProviderMap = new Map(
      (newSettings.providers || []).map(p => [p.tag, p])
    )

    // Process changes in order: removals first, then additions/modifications
    for (const change of providerChanges) {
      switch (change.type) {
        case 'removed':
          await this.handleProviderRemoval(change.path, change.oldValue)
          break

        case 'added':
          await this.handleProviderAddition(change.path, change.newValue, newSettings)
          break

        case 'modified':
          await this.handleProviderModification(change.path, change.oldValue, change.newValue, newSettings)
          break
      }
    }
  }

  /**
   * Handle provider removal
   */
  private async handleProviderRemoval(path: string, provider: any): Promise<void> {
    try {
      // Remove from provider registry
      this.providerRegistry.removeProvider(provider.tag)

      // Remove from factory registry
      this.providerFactoryRegistry.removeFactory(provider.tag)
    } catch (error) {
      throw ConfigBindingError.providerUpdateFailed(provider.tag, error)
    }
  }

  /**
   * Handle provider addition
   */
  private async handleProviderAddition(
    path: string,
    provider: any,
    newSettings: PluginSettings
  ): Promise<void> {
    try {
      // The provider factory should already be registered during setup
      // We just need to ensure the provider registry is aware of the new configuration

      // Update the registry's settings reference to include the new provider
      this.updateRegistrySettings(newSettings)

      // The provider will be created on-demand when requested
    } catch (error) {
      throw ConfigBindingError.providerUpdateFailed(provider.tag, error)
    }
  }

  /**
   * Handle provider modification
   */
  private async handleProviderModification(
    path: string,
    oldProvider: any,
    newProvider: any,
    newSettings: PluginSettings
  ): Promise<void> {
    try {
      // Update the registry's settings reference
      this.updateRegistrySettings(newSettings)

      // Notify the provider registry that a provider has been updated
      // This will trigger recreation of the provider instance on next access
      this.providerRegistry.updateProvider(newProvider.tag)
    } catch (error) {
      throw ConfigBindingError.providerUpdateFailed(newProvider.tag, error)
    }
  }

  /**
   * Update registry settings reference
   */
  private updateRegistrySettings(newSettings: PluginSettings): void {
    // Update the provider registry with the new settings
    this.providerRegistry.updateSettings(newSettings)
  }

  /**
   * Count the number of providers that were updated
   */
  private countUpdatedProviders(event: SettingsChangeEvent): number {
    return event.changes.providers?.length || 0
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): ConfigUpdateMetrics[] {
    return [...this.performanceMetrics]
  }

  /**
   * Clear old performance metrics
   */
  clearPerformanceMetrics(olderThanMs: number = 300000): void { // Default: 5 minutes
    const cutoff = Date.now() - olderThanMs
    this.performanceMetrics = this.performanceMetrics.filter(metric => metric.endTime > cutoff)
  }

  /**
   * Enable or disable validation
   */
  setValidationEnabled(enabled: boolean): void {
    this.validationEnabled = enabled
  }

  /**
   * Check if the service is bound
   */
  isConfigurationBound(): boolean {
    return this.isBound
  }

  /**
   * Get current update queue status
   */
  getUpdateQueueStatus(): { pending: number; processing: string[] } {
    return {
      pending: this.updateQueue.size,
      processing: Array.from(this.updateQueue.keys()),
    }
  }

  /**
   * Dispose of the binding service
   */
  dispose(): void {
    this.unbind()
    this.updateQueue.clear()
    this.performanceMetrics = []
  }

  /**
   * Static factory method
   */
  static create(
    settingsNotifier: SettingsChangeNotifier,
    providerRegistry: ProviderRegistry,
    providerFactoryRegistry: ProviderFactoryRegistry,
    settings: PluginSettings
  ): ConfigBindingService {
    return new ConfigBindingService(settingsNotifier, providerRegistry, providerFactoryRegistry, settings)
  }
}