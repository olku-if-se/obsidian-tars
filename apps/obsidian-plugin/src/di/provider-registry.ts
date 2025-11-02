import { injectable } from '@needle-di/core'
import type { BaseOptions, ProviderSettings, Vendor } from '../providers/index'
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
  private readonly settings: PluginSettings

  constructor(settings: PluginSettings) {
    if (!settings) {
      throw new Error('PluginSettings is required')
    }
    this.settings = settings
  }

  // Factory method for DI integration
  static createWithSettings(settings: PluginSettings): ProviderRegistry {
    return new ProviderRegistry(settings)
  }

  /**
   * Get a provider by name/tag
   */
  getProvider(name: string): Vendor | null {
    try {
      const providerSettings = this.settings.providers.find(
        provider => provider.tag === name || provider.vendor.toLowerCase() === name.toLowerCase()
      )

      if (!providerSettings) {
        return null
      }

      // Return the vendor instance from the provider settings
      // In a real implementation, you might want to cache these instances
      return this.createVendorInstance(providerSettings)
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
   * Register a new provider (for dynamic provider addition)
   */
  registerProvider(provider: Vendor, tag?: string): void {
    // This would be used for dynamic provider registration
    // In a full implementation, you would add this to the settings and save
    console.log('Registering provider:', provider.name, 'with tag:', tag || provider.name.toLowerCase())
  }

  /**
   * Factory method for creating instances (useful for testing)
   */
  static create(settings: PluginSettings): ProviderRegistry {
    return new ProviderRegistry(settings)
  }
}
