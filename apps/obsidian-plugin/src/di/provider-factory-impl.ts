import { injectable } from '@needle-di/core'
import type { Vendor } from '../providers/index'
import type { PluginSettings } from '../settings'
import {
  type IProviderFactory,
  type IProviderFactoryRegistry,
  type ProviderClassFactory,
  ProviderFactoryError,
  type ProviderFactoryFunction,
  validateProviderSettings,
  type ProviderMetadata,
  type ProviderRegistrationOptions,
} from './provider-factory'

/**
 * Implementation of the provider factory registry
 */
@injectable()
export class ProviderFactoryRegistry implements IProviderFactoryRegistry {
  private readonly factories = new Map<string, IProviderFactory | ProviderClassFactory | ProviderFactoryFunction>()
  private readonly metadata = new Map<string, ProviderMetadata>()

  /**
   * Register a provider factory
   */
  registerFactory(
    tag: string,
    factory: IProviderFactory | ProviderClassFactory | ProviderFactoryFunction,
    options: ProviderRegistrationOptions = {}
  ): void {
    if (this.factories.has(tag) && !options.override) {
      throw ProviderFactoryError.factoryAlreadyRegistered(tag)
    }

    // Store the factory
    this.factories.set(tag, factory)

    // Extract metadata from factory if available
    let metadata: ProviderMetadata

    if ('getMetadata' in factory && typeof factory.getMetadata === 'function') {
      metadata = factory.getMetadata()
    } else if ('prototype' in factory) {
      // For class constructors, try to infer metadata
      metadata = {
        id: tag,
        name: tag,
        tag,
        vendor: tag,
        capabilities: ['Text Generation'],
        models: [],
        websiteToObtainKey: 'https://example.com',
        enabled: true,
      }
    } else {
      // For function factories, create minimal metadata
      metadata = {
        id: tag,
        name: tag,
        tag,
        vendor: tag,
        capabilities: ['Text Generation'],
        models: [],
        websiteToObtainKey: 'https://example.com',
        enabled: true,
      }
    }

    this.metadata.set(tag, metadata)
  }

  /**
   * Get a provider factory by tag
   */
  getFactory(tag: string): IProviderFactory | ProviderClassFactory | ProviderFactoryFunction | null {
    return this.factories.get(tag) || null
  }

  /**
   * Check if a factory is registered
   */
  hasFactory(tag: string): boolean {
    return this.factories.has(tag)
  }

  /**
   * Remove a provider factory
   */
  removeFactory(tag: string): boolean {
    const removed = this.factories.delete(tag)
    this.metadata.delete(tag)
    return removed
  }

  /**
   * Get all registered factory tags
   */
  getRegisteredTags(): string[] {
    return Array.from(this.factories.keys())
  }

  /**
   * Create a provider using the appropriate factory
   */
  createProvider(tag: string, settings: PluginSettings, options: ProviderRegistrationOptions = {}): Vendor | null {
    const factory = this.getFactory(tag)
    if (!factory) {
      if (options.validate !== false) {
        throw ProviderFactoryError.factoryNotFound(tag)
      }
      return null
    }

    try {
      const metadata = this.getMetadataOrThrow(tag)
      const provider = this.createProviderFromFactory(tag, settings, factory, metadata)

      this.validateProviderIfRequired(tag, settings, options)
      return provider
    } catch (error) {
      if (error instanceof ProviderFactoryError) {
        throw error
      }
      throw ProviderFactoryError.providerCreationFailed(tag, error)
    }
  }

  /**
   * Get metadata or throw if not found
   */
  private getMetadataOrThrow(tag: string): ProviderMetadata {
    const metadata = this.metadata.get(tag)
    if (!metadata) {
      throw ProviderFactoryError.factoryNotFound(tag)
    }
    return metadata
  }

  /**
   * Create provider from factory based on factory type
   */
  private createProviderFromFactory(
    tag: string,
    settings: PluginSettings,
    factory: IProviderFactory | ProviderClassFactory | ProviderFactoryFunction,
    metadata: ProviderMetadata
  ): Vendor {
    // Handle different factory types
    if ('createProvider' in factory && typeof factory.createProvider === 'function') {
      // IProviderFactory instance
      return (factory as IProviderFactory).createProvider(settings, metadata)
    }

    if (typeof factory === 'function') {
      return this.createProviderFromFunction(tag, settings, factory)
    }

    throw ProviderFactoryError.invalidFactory(tag)
  }

  /**
   * Create provider from function (class constructor or factory function)
   */
  private createProviderFromFunction(
    tag: string,
    settings: PluginSettings,
    factory: ProviderClassFactory | ProviderFactoryFunction
  ): Vendor {
      if ('prototype' in factory) {
        // Class constructor
        const ProviderClass = factory as ProviderClassFactory
        return new ProviderClass(settings, tag)
      } else {
        // Factory function
        const factoryFunction = factory as ProviderFactoryFunction
        return factoryFunction(settings, tag)
      }
  }

  /**
   * Validate provider if validation is required
   */
  private validateProviderIfRequired(
    tag: string,
    settings: PluginSettings,
    options: ProviderRegistrationOptions
  ): void {
    if (options.validate !== false) {
      const validation = this.validateProvider(tag, settings)
      if (!validation.isValid) {
        throw ProviderFactoryError.validationFailed(tag, validation.errors)
      }
    }
  }

  /**
   * Validate a provider configuration
   */
  validateProvider(tag: string, settings: PluginSettings): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check if settings exist
    if (!settings) {
      errors.push('Settings object is required')
      return { isValid: false, errors }
    }

    // Check if providers array exists
    if (!Array.isArray(settings.providers)) {
      errors.push('Settings.providers must be an array')
      return { isValid: false, errors }
    }

    // Find provider configuration
    const providerSettings = settings.providers.find(p => p.tag === tag)
    if (!providerSettings) {
      errors.push(`Provider configuration not found for tag: ${tag}`)
      return { isValid: false, errors }
    }

    // Validate provider settings structure
    const providerValidation = validateProviderSettings(providerSettings)
    if (!providerValidation.isValid) {
      errors.push(...providerValidation.errors)
    }

    // Check if factory is registered
    if (!this.hasFactory(tag)) {
      errors.push(`No factory registered for provider: ${tag}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get provider metadata for all registered factories
   */
  getAllMetadata(): ProviderMetadata[] {
    return Array.from(this.metadata.values())
  }

  /**
   * Get metadata for a specific provider
   */
  getMetadata(tag: string): ProviderMetadata | null {
    return this.metadata.get(tag) || null
  }

  /**
   * Register multiple factories from a configuration object
   */
  registerFactories(config: Record<string, IProviderFactory | ProviderClassFactory | ProviderFactoryFunction>): void {
    for (const [tag, factory] of Object.entries(config)) {
      this.registerFactory(tag, factory, { override: true })
    }
  }

  /**
   * Clear all registered factories
   */
  clear(): void {
    this.factories.clear()
    this.metadata.clear()
  }

  /**
   * Get the number of registered factories
   */
  size(): number {
    return this.factories.size
  }

  /**
   * Check if the registry is empty
   */
  isEmpty(): boolean {
    return this.factories.size === 0
  }

  /**
   * List all registered providers with their status
   */
  listProviders(): Array<{ tag: string; registered: boolean; metadata?: ProviderMetadata }> {
    return this.getRegisteredTags().map(tag => ({
      tag,
      registered: this.hasFactory(tag),
      metadata: this.getMetadata(tag) || undefined,
    }))
  }
}

/**
 * Factory function for creating provider factory instances
 */
export function createProviderFactoryRegistry(): ProviderFactoryRegistry {
  return new ProviderFactoryRegistry()
}

/**
 * Helper function to create a simple provider factory from a class constructor
 */
export function createClassFactory<T extends Vendor>(
  tag: string,
  providerClass: new (settings: PluginSettings, tag?: string) => T,
  metadata?: Partial<ProviderMetadata>
): IProviderFactory {
  const fullMetadata: ProviderMetadata = {
    id: tag,
    name: tag,
    tag,
    vendor: tag,
    capabilities: ['Text Generation'],
    models: [],
    websiteToObtainKey: 'https://example.com',
    enabled: true,
    ...metadata,
  }

  return {
    createProvider(settings: PluginSettings): T {
      return new providerClass(settings, tag)
    },

    validateSettings(settings: PluginSettings): { isValid: boolean; errors: string[] } {
      return new ProviderFactoryRegistry().validateProvider(tag, settings)
    },

    getMetadata(): ProviderMetadata {
      return fullMetadata
    },
  }
}

/**
 * Helper function to create a provider factory from a function
 */
export function createFunctionFactory<T extends Vendor>(
  tag: string,
  factoryFn: (settings: PluginSettings, tag?: string) => T,
  metadata?: Partial<ProviderMetadata>
): IProviderFactory {
  const fullMetadata: ProviderMetadata = {
    id: tag,
    name: tag,
    tag,
    vendor: tag,
    capabilities: ['Text Generation'],
    models: [],
    websiteToObtainKey: 'https://example.com',
    enabled: true,
    ...metadata,
  }

  return {
    createProvider(settings: PluginSettings): T {
      return factoryFn(settings, tag)
    },

    validateSettings(settings: PluginSettings): { isValid: boolean; errors: string[] } {
      return new ProviderFactoryRegistry().validateProvider(tag, settings)
    },

    getMetadata(): ProviderMetadata {
      return fullMetadata
    },
  }
}
