import { EventEmitter } from 'node:events'
import { injectable, inject } from '@needle-di/core'
import type { PluginSettings, ProviderSettings } from '../settings'
import type {
  SettingsChangeEvent,
  SettingsSubscription,
  UnsubscribeFunction,
  ValidationError,
} from './types'
import { Tokens } from './tokens'
import { getProviderMetadata, DEFAULT_PROVIDER_METADATA } from './provider-metadata'

// Error messages
const Errors = {
  invalid_settings: 'Invalid settings provided',
  provider_not_found: 'Provider not found',
  invalid_provider_data: 'Invalid provider data provided',
  validation_failed: 'Settings validation failed',
  operation_failed: 'Settings operation failed',
} as const

// Custom exceptions
export class SettingsFacadeError extends Error {
  static invalidSettings = (cause?: unknown) =>
    Object.assign(new SettingsFacadeError(`${Errors.invalid_settings}: ${cause}`), {
      code: 'INVALID_SETTINGS',
      cause,
    })

  static providerNotFound = (tag: string) =>
    Object.assign(new SettingsFacadeError(`${Errors.provider_not_found}: ${tag}`), {
      code: 'PROVIDER_NOT_FOUND',
      providerTag: tag,
    })

  static invalidProviderData = (cause?: unknown) =>
    Object.assign(new SettingsFacadeError(`${Errors.invalid_provider_data}: ${cause}`), {
      code: 'INVALID_PROVIDER_DATA',
      cause,
    })

  static validationFailed = (errors: string[]) =>
    Object.assign(new SettingsFacadeError(`${Errors.validation_failed}: ${errors.join(', ')}`), {
      code: 'VALIDATION_FAILED',
      errors,
    })

  static operationFailed = (operation: string, cause?: unknown) =>
    Object.assign(new SettingsFacadeError(`${Errors.operation_failed}: ${operation}`), {
      code: 'OPERATION_FAILED',
      operation,
      cause,
    })
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Settings Facade provides a simplified API for managing plugin settings
 * while maintaining backward compatibility with existing code
 */
@injectable()
export class SettingsFacade extends EventEmitter {
  private currentSettings: PluginSettings

  constructor(private settings = inject(Tokens.AppSettings)) {
    super()
    this.currentSettings = { ...settings }
    this.setMaxListeners(100) // Allow many listeners
  }

  /**
   * Get current settings snapshot
   */
  getSettings(): PluginSettings {
    return { ...this.currentSettings }
  }

  /**
   * Get all providers
   */
  getProviders(): ProviderSettings[] {
    return [...(this.currentSettings.providers || [])]
  }

  /**
   * Get provider by tag
   */
  getProvider(tag: string): ProviderSettings | undefined {
    return this.currentSettings.providers?.find(p => p.tag === tag)
  }

  /**
   * Check if provider exists
   */
  hasProvider(tag: string): boolean {
    return this.currentSettings.providers?.some(p => p.tag === tag) ?? false
  }

  /**
   * Add new provider
   */
  addProvider(provider: ProviderSettings): void {
    try {
      if (!provider || !provider.tag) {
        throw SettingsFacadeError.invalidProviderData('Provider data is required')
      }

      if (this.hasProvider(provider.tag)) {
        throw SettingsFacadeError.operationFailed(`Provider ${provider.tag} already exists`)
      }

      const previousSettings = this.getSettings()
      this.currentSettings.providers = [...(this.currentSettings.providers || []), provider]
      this.emitSettingsChange(previousSettings)
    } catch (error) {
      if (error instanceof SettingsFacadeError) {
        throw error
      }
      throw SettingsFacadeError.operationFailed('addProvider', error)
    }
  }

  /**
   * Update existing provider
   */
  updateProvider(tag: string, provider: ProviderSettings): void {
    try {
      if (!provider || provider.tag !== tag) {
        throw SettingsFacadeError.invalidProviderData('Provider tag must match')
      }

      if (!this.hasProvider(tag)) {
        throw SettingsFacadeError.providerNotFound(tag)
      }

      const previousSettings = this.getSettings()
      this.currentSettings.providers = this.currentSettings.providers?.map(p =>
        p.tag === tag ? provider : p
      ) || []
      this.emitSettingsChange(previousSettings)
    } catch (error) {
      if (error instanceof SettingsFacadeError) {
        throw error
      }
      throw SettingsFacadeError.operationFailed('updateProvider', error)
    }
  }

  /**
   * Remove provider
   */
  removeProvider(tag: string): void {
    try {
      if (!this.hasProvider(tag)) {
        return // Graceful handling of non-existent provider
      }

      const previousSettings = this.getSettings()
      this.currentSettings.providers = this.currentSettings.providers?.filter(p => p.tag !== tag) || []
      this.emitSettingsChange(previousSettings)
    } catch (error) {
      if (error instanceof SettingsFacadeError) {
        throw error
      }
      throw SettingsFacadeError.operationFailed('removeProvider', error)
    }
  }

  /**
   * Set all providers (bulk operation)
   */
  setProviders(providers: ProviderSettings[]): void {
    try {
      if (!Array.isArray(providers)) {
        throw SettingsFacadeError.invalidProviderData('Providers must be an array')
      }

      const previousSettings = this.getSettings()
      this.currentSettings.providers = [...providers]
      this.emitSettingsChange(previousSettings)
    } catch (error) {
      if (error instanceof SettingsFacadeError) {
        throw error
      }
      throw SettingsFacadeError.operationFailed('setProviders', error)
    }
  }

  /**
   * Update editor status
   */
  setEditorStatus(status: boolean): void {
    const previousSettings = this.getSettings()
    this.currentSettings.editorStatus = status
    this.emitSettingsChange(previousSettings)
  }

  /**
   * Update system tags
   */
  setSystemTags(tags: string[]): void {
    const previousSettings = this.getSettings()
    this.currentSettings.systemTags = [...tags]
    this.emitSettingsChange(previousSettings)
  }

  /**
   * Update user tags
   */
  setUserTags(tags: string[]): void {
    const previousSettings = this.getSettings()
    this.currentSettings.userTags = [...tags]
    this.emitSettingsChange(previousSettings)
  }

  /**
   * Update default system message
   */
  setDefaultSystemMsg(message: string): void {
    const previousSettings = this.getSettings()
    this.currentSettings.defaultSystemMsg = message
    this.emitSettingsChange(previousSettings)
  }

  /**
   * Reset settings to provided values
   */
  resetSettings(settings: PluginSettings): void {
    try {
      if (!settings) {
        throw SettingsFacadeError.invalidSettings('Settings are required')
      }

      const previousSettings = this.getSettings()
      this.currentSettings = { ...settings }
      this.emitSettingsChange(previousSettings)
    } catch (error) {
      if (error instanceof SettingsFacadeError) {
        throw error
      }
      throw SettingsFacadeError.operationFailed('resetSettings', error)
    }
  }

  /**
   * Validate settings
   */
  validateSettings(settings: PluginSettings): ValidationResult {
    const errors: string[] = []

    try {
      if (!settings) {
        errors.push('Settings object is required')
        return { isValid: false, errors }
      }

      // Validate providers
      if (!Array.isArray(settings.providers)) {
        errors.push('Providers must be an array')
      } else {
        settings.providers.forEach((provider, index) => {
          const providerValidation = this.validateProvider(provider)
          if (!providerValidation.isValid) {
            errors.push(...providerValidation.errors.map(e => `Provider ${index}: ${e}`))
          }
        })
      }

      // Validate basic structure
      if (typeof settings.editorStatus !== 'boolean') {
        errors.push('editorStatus must be a boolean')
      }

      if (!Array.isArray(settings.systemTags)) {
        errors.push('systemTags must be an array')
      }

      if (!Array.isArray(settings.userTags)) {
        errors.push('userTags must be an array')
      }

      return {
        isValid: errors.length === 0,
        errors,
      }
    } catch (error) {
      errors.push(`Validation error: ${error}`)
      return { isValid: false, errors }
    }
  }

  /**
   * Validate individual provider
   */
  validateProvider(provider: ProviderSettings | undefined): ValidationResult {
    const errors: string[] = []

    try {
      if (!provider) {
        errors.push('Provider is required')
        return { isValid: false, errors }
      }

      if (!provider.tag || typeof provider.tag !== 'string') {
        errors.push('Provider tag is required and must be a string')
      }

      if (!provider.vendor || typeof provider.vendor !== 'string') {
        errors.push('Provider vendor is required and must be a string')
      }

      if (!provider.options) {
        errors.push('Provider options are required')
      } else {
        if (!provider.options.apiKey || typeof provider.options.apiKey !== 'string') {
          errors.push('API key is required and must be a string')
        }

        if (!provider.options.baseURL || typeof provider.options.baseURL !== 'string') {
          errors.push('Base URL is required and must be a string')
        }

        if (!provider.options.model || typeof provider.options.model !== 'string') {
          errors.push('Model is required and must be a string')
        }

        if (typeof provider.options.enableWebSearch !== 'boolean') {
          errors.push('enableWebSearch must be a boolean')
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
      }
    } catch (error) {
      errors.push(`Provider validation error: ${error}`)
      return { isValid: false, errors }
    }
  }

  /**
   * Get provider metadata
   */
  getProviderMetadata(tag: string): ReturnType<typeof getProviderMetadata> {
    const provider = this.getProvider(tag)
    if (!provider) {
      return DEFAULT_PROVIDER_METADATA
    }

    return getProviderMetadata(provider.vendor)
  }

  /**
   * Subscribe to settings changes
   */
  onSettingsChanged(callback: SettingsSubscription): UnsubscribeFunction {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function')
    }

    const wrapper = (event: SettingsChangeEvent) => {
      try {
        callback(event)
      } catch (error) {
        console.error('Error in settings change callback:', error)
      }
    }

    this.on('settingsChanged', wrapper)

    return () => {
      this.off('settingsChanged', wrapper)
    }
  }

  /**
   * Emit settings change event
   */
  private emitSettingsChange(previousSettings: PluginSettings): void {
    try {
      const changes = this.detectChanges(this.currentSettings, previousSettings)
      const timestamp = Date.now()

      const event: SettingsChangeEvent = {
        newSettings: this.currentSettings,
        previousSettings,
        changes,
        timestamp,
        changeId: `change-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      }

      this.emit('settingsChanged', event)
    } catch (error) {
      console.error('Error emitting settings change:', error)
    }
  }

  /**
   * Detect changes between settings objects
   */
  private detectChanges(newSettings: PluginSettings, previousSettings: PluginSettings) {
    const changes: any = {}

    // Detect provider changes
    const providerChanges = this.detectProviderChanges(
      newSettings.providers || [],
      previousSettings.providers || []
    )
    if (providerChanges.length > 0) {
      changes.providers = providerChanges
    }

    // Detect general setting changes
    const generalChanges = this.detectGeneralChanges(newSettings, previousSettings)
    if (generalChanges.length > 0) {
      changes.general = generalChanges
    }

    return changes
  }

  /**
   * Detect provider changes
   */
  private detectProviderChanges(
    newProviders: ProviderSettings[],
    previousProviders: ProviderSettings[]
  ): any[] {
    const changes: any[] = []

    const previousMap = new Map(previousProviders.map(p => [p.tag, p]))
    const newMap = new Map(newProviders.map(p => [p.tag, p]))

    // Find added providers
    for (const [tag, provider] of newMap) {
      if (!previousMap.has(tag)) {
        changes.push({
          type: 'added',
          path: `providers[${newProviders.indexOf(provider)}]`,
          newValue: provider,
        })
      }
    }

    // Find removed providers
    for (const [tag, provider] of previousMap) {
      if (!newMap.has(tag)) {
        changes.push({
          type: 'removed',
          path: `providers[${previousProviders.indexOf(provider)}]`,
          oldValue: provider,
        })
      }
    }

    // Find modified providers
    for (const [tag, newProvider] of newMap) {
      const previousProvider = previousMap.get(tag)
      if (previousProvider && JSON.stringify(newProvider) !== JSON.stringify(previousProvider)) {
        changes.push({
          type: 'modified',
          path: `providers[${newProviders.indexOf(newProvider)}]`,
          oldValue: previousProvider,
          newValue: newProvider,
        })
      }
    }

    return changes
  }

  /**
   * Detect general setting changes
   */
  private detectGeneralChanges(newSettings: PluginSettings, previousSettings: PluginSettings): any[] {
    const changes: any[] = []

    const generalFields: (keyof PluginSettings)[] = [
      'editorStatus',
      'systemTags',
      'userTags',
      'defaultSystemMsg',
    ]

    for (const field of generalFields) {
      const newValue = newSettings[field]
      const oldValue = previousSettings[field]

      if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
        changes.push({
          type: 'modified',
          path: field,
          oldValue,
          newValue,
        })
      }
    }

    return changes
  }

  /**
   * Dispose of the facade
   */
  dispose(): void {
    this.removeAllListeners()
    this.currentSettings = {} as PluginSettings
  }

  /**
   * Static factory method for creating instances
   */
  static create(settings?: PluginSettings): SettingsFacade {
    return new SettingsFacade(settings)
  }
}