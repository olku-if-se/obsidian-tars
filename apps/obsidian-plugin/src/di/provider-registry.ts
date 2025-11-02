import { injectable, inject } from '@needle-di/core'
import type { BaseOptions, ProviderSettings, Vendor } from '../providers/index'
import { Tokens } from './tokens'
import type { PluginSettings } from '../settings'

// Error messages
const Errors = {
  provider_not_found: 'Provider not found',
  settings_not_injected: 'PluginSettings not injected',
  invalid_provider_name: 'Invalid provider name specified',
} as const

// Custom exceptions
export class ProviderRegistryError extends Error {
  static providerNotFound = (name: string) =>
    Object.assign(new ProviderRegistryError(`${Errors.provider_not_found}: ${name}`), {
      code: 'PROVIDER_NOT_FOUND',
      name,
    })

  static settingsNotInjected = () =>
    Object.assign(new ProviderRegistryError(Errors.settings_not_injected), { code: 'SETTINGS_NOT_INJECTED' })

  static invalidProviderName = (name: string) =>
    Object.assign(new ProviderRegistryError(`${Errors.invalid_provider_name}: ${name}`), {
      code: 'INVALID_PROVIDER_NAME',
      name,
    })
}

/**
 * Provider registry service for managing AI providers.
 * Provides access to providers through DI with settings injection.
 */
@injectable()
export class ProviderRegistry {
  private settings: PluginSettings
  private providerCache = new Map<string, Vendor>()
  private cacheEnabled = true

  constructor(settings = inject(Tokens.AppSettings)) {
    if (!settings) {
      throw new Error('PluginSettings is required')
    }
    this.settings = settings
  }

  // Factory method for DI integration
  static create(settings: PluginSettings): ProviderRegistry {
    return new ProviderRegistry(settings)
  }

  // Keep backward compatibility
  static createWithSettings(settings: PluginSettings): ProviderRegistry {
    return new ProviderRegistry(settings)
  }

  /**
   * Get a provider by name/tag
   */
  getProvider(name: string): Vendor | null {
    try {
      // Check cache first
      if (this.cacheEnabled && this.providerCache.has(name)) {
        return this.providerCache.get(name)!
      }

      const providerSettings = this.settings.providers.find(
        provider => provider.tag === name || provider.vendor.toLowerCase() === name.toLowerCase()
      )

      if (!providerSettings) {
        return null
      }

      // Create and cache the vendor instance
      const vendor = this.createVendorInstance(providerSettings)
      if (vendor && this.cacheEnabled) {
        this.providerCache.set(name, vendor)
      }

      return vendor
    } catch (error) {
      console.error(`Failed to get provider ${name}:`, error)
      return null
    }
  }

  /**
   * Get all available providers
   */
  getAllProviders(): Vendor[] {
    try {
      return this.settings.providers
        .map(providerSettings => this.createVendorInstance(providerSettings))
        .filter((provider): provider is Vendor => provider !== null)
    } catch (error) {
      console.error('Failed to get all providers:', error)
      return []
    }
  }

  /**
   * Get provider by tag (alias for getProvider)
   */
  getProviderByTag(tag: string): Vendor | null {
    return this.getProvider(tag)
  }

  /**
   * Check if a provider is available
   */
  hasProvider(name: string): boolean {
    return this.getProvider(name) !== null
  }

  /**
   * Get all provider names/tags
   */
  getProviderNames(): string[] {
    return this.settings.providers.map(provider => provider.tag)
  }

  /**
   * Create vendor instance from provider settings
   */
  private createVendorInstance(providerSettings: ProviderSettings): Vendor | null {
    try {
      // For now, create a mock Vendor object to demonstrate the DI pattern
      // In a full implementation, you would use a factory pattern here
      // to create the appropriate vendor instance based on the vendor name
      return {
        name: providerSettings.vendor,
        defaultOptions: providerSettings.options,
        sendRequestFunc: (_options: BaseOptions) =>
          async function* () {
            yield `[Mock Response from ${providerSettings.vendor}]`
          },
        models: ['gpt-3.5-turbo', 'gpt-4'], // Mock model list
        websiteToObtainKey: 'https://example.com', // Mock website
        capabilities: ['Text Generation', 'Reasoning'], // Mock capabilities
      } as Vendor
    } catch (error) {
      console.error(`Failed to create vendor instance for ${providerSettings.vendor}:`, error)
      return null
    }
  }

  /**
   * Validate provider configuration
   */
  validateProvider(name: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      const provider = this.getProvider(name)
      if (!provider) {
        errors.push(`Provider '${name}' not found`)
        return { isValid: false, errors }
      }

      // Basic validation
      if (!provider.name) {
        errors.push('Provider name is missing')
      }

      if (!provider.models || provider.models.length === 0) {
        errors.push('Provider has no models configured')
      }

      if (!provider.websiteToObtainKey) {
        errors.push('Provider website to obtain key is missing')
      }

      if (!provider.capabilities || provider.capabilities.length === 0) {
        errors.push('Provider has no capabilities configured')
      }
    } catch (error) {
      errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate all providers
   */
  validateAllProviders(): { validProviders: string[]; invalidProviders: Array<{ name: string; errors: string[] }> } {
    const validProviders: string[] = []
    const invalidProviders: Array<{ name: string; errors: string[] }> = []

    for (const providerSettings of this.settings.providers) {
      const validation = this.validateProvider(providerSettings.tag)
      if (validation.isValid) {
        validProviders.push(providerSettings.tag)
      } else {
        invalidProviders.push({
          name: providerSettings.tag,
          errors: validation.errors,
        })
      }
    }

    return { validProviders, invalidProviders }
  }

  /**
   * Update the settings reference and clear cache
   */
  updateSettings(newSettings: PluginSettings): void {
    this.settings = newSettings
    this.clearCache()
  }

  /**
   * Update a specific provider
   */
  updateProvider(tag: string): void {
    // Remove from cache to force recreation on next access
    this.providerCache.delete(tag)
  }

  /**
   * Remove a provider
   */
  removeProvider(tag: string): void {
    // Remove from cache
    this.providerCache.delete(tag)

    // Remove from settings (if mutable)
    const index = this.settings.providers.findIndex(p => p.tag === tag)
    if (index !== -1) {
      this.settings.providers.splice(index, 1)
    }
  }

  /**
   * Clear provider cache
   */
  clearCache(): void {
    this.providerCache.clear()
  }

  /**
   * Enable or disable provider caching
   */
  setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled
    if (!enabled) {
      this.clearCache()
    }
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { enabled: boolean; size: number; cachedProviders: string[] } {
    return {
      enabled: this.cacheEnabled,
      size: this.providerCache.size,
      cachedProviders: Array.from(this.providerCache.keys()),
    }
  }

  /**
   * Force refresh of all providers
   */
  refreshAllProviders(): void {
    this.clearCache()
  }

  /**
   * Register a new provider (for dynamic provider addition)
   */
  registerProvider(provider: Vendor, tag?: string): void {
    // This would be used for dynamic provider registration
    // In a full implementation, you would add this to the settings and save
    console.log('Registering provider:', provider.name, 'with tag:', tag || provider.name.toLowerCase())
  }
}
