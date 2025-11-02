import type { BaseOptions, Capability, ProviderSettings, SendRequest, Vendor } from '../providers/index'
import type { PluginSettings } from '../settings'

// Error messages
const Errors = {
  provider_not_found: 'Provider not found in settings',
  api_key_missing: 'API key is required but not configured',
  base_url_missing: 'Base URL is required but not configured',
  model_missing: 'Model is required but not configured',
  invalid_provider_name: 'Invalid provider name specified',
} as const

// Custom exceptions
export class BaseVendorError extends Error {
  static providerNotFound = (provider: string) =>
    Object.assign(new BaseVendorError(`${Errors.provider_not_found}: ${provider}`), {
      code: 'PROVIDER_NOT_FOUND',
      provider,
    })

  static apiKeyMissing = (provider: string) =>
    Object.assign(new BaseVendorError(`${Errors.api_key_missing}: ${provider}`), {
      code: 'API_KEY_MISSING',
      provider,
    })

  static baseURLMissing = (provider: string) =>
    Object.assign(new BaseVendorError(`${Errors.base_url_missing}: ${provider}`), {
      code: 'BASE_URL_MISSING',
      provider,
    })

  static modelMissing = (provider: string) =>
    Object.assign(new BaseVendorError(`${Errors.model_missing}: ${provider}`), {
      code: 'MODEL_MISSING',
      provider,
    })

  static invalidProviderName = (provider: string) =>
    Object.assign(new BaseVendorError(`${Errors.invalid_provider_name}: ${provider}`), {
      code: 'INVALID_PROVIDER_NAME',
      provider,
    })
}

/**
 * Base class for all injectable AI providers.
 * Provides common functionality for settings injection and validation.
 * Works with the existing PluginSettings and ProviderSettings structure.
 */
export abstract class BaseVendorOptions implements Partial<Vendor> {
  protected readonly settings: PluginSettings
  protected readonly providerSettings: ProviderSettings

  constructor(settings?: PluginSettings, providerTag?: string) {
    if (!settings) {
      throw new Error('PluginSettings is required')
    }
    this.settings = settings

    // Find the provider settings by tag or use the first one as fallback
    this.providerSettings = this.findProviderSettings(settings, providerTag)
  }

  /**
   * Find provider settings by tag
   */
  private findProviderSettings(settings: PluginSettings, providerTag?: string): ProviderSettings {
    if (providerTag) {
      const provider = settings.providers.find(p => p.tag === providerTag)
      if (provider) return provider
    }

    // Fallback: find by vendor name matching
    const vendorName = this.getProviderName().toLowerCase()
    const provider = settings.providers.find(
      p => p.vendor.toLowerCase() === vendorName || p.tag.toLowerCase() === vendorName
    )

    if (!provider) {
      throw BaseVendorError.providerNotFound(this.getProviderName())
    }

    return provider
  }

  /**
   * Get the provider name from the subclass
   */
  protected abstract getProviderName(): string

  /**
   * Get API key from settings with validation
   */
  get apiKey(): string {
    const { apiKey } = this.providerSettings.options

    if (!apiKey || apiKey.trim() === '') {
      throw BaseVendorError.apiKeyMissing(this.getProviderName())
    }

    return apiKey
  }

  /**
   * Get base URL from settings with validation
   */
  get baseURL(): string {
    const { baseURL } = this.providerSettings.options

    if (!baseURL || baseURL.trim() === '') {
      throw BaseVendorError.baseURLMissing(this.getProviderName())
    }

    return baseURL
  }

  /**
   * Get model from settings with validation
   */
  get model(): string {
    const { model } = this.providerSettings.options

    if (!model || model.trim() === '') {
      throw BaseVendorError.modelMissing(this.getProviderName())
    }

    return model
  }

  /**
   * Get parameters from settings
   */
  get parameters(): Record<string, unknown> {
    return this.providerSettings.options.parameters || {}
  }

  /**
   * Get default options for the provider
   */
  get defaultOptions(): BaseOptions {
    return this.providerSettings.options
  }

  /**
   * Validate the provider configuration
   */
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      this.providerSettings
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown configuration error')
      return { isValid: false, errors }
    }

    try {
      this.apiKey
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'API key validation failed')
    }

    try {
      this.baseURL
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Base URL validation failed')
    }

    try {
      this.model
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Model validation failed')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  // Abstract methods that concrete providers must implement
  abstract get name(): string
  abstract get models(): string[]
  abstract get websiteToObtainKey(): string
  abstract get capabilities(): Capability[]
  abstract get sendRequestFunc(): (options: BaseOptions) => SendRequest
}
