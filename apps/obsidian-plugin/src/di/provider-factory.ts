import type { Vendor } from '../providers/index'
import type { PluginSettings, ProviderSettings } from '../settings'

/**
 * Provider metadata interface for factory registration
 */
export interface ProviderMetadata {
  /** Unique identifier for the provider */
  readonly id: string
  /** Human-readable name */
  readonly name: string
  /** Provider tag used in settings */
  readonly tag: string
  /** Provider vendor name */
  readonly vendor: string
  /** Capabilities supported by the provider */
  readonly capabilities: string[]
  /** Available models for the provider */
  readonly models: string[]
  /** URL to obtain API keys */
  readonly websiteToObtainKey: string
  /** Whether the provider is enabled */
  readonly enabled?: boolean
  /** Additional metadata */
  readonly metadata?: Record<string, unknown>
}

/**
 * Provider factory interface for creating providers dynamically
 */
export interface IProviderFactory {
  /**
   * Create a provider instance from settings and metadata
   */
  createProvider(settings: PluginSettings, metadata: ProviderMetadata): Vendor

  /**
   * Validate provider configuration
   */
  validateSettings(settings: PluginSettings): { isValid: boolean; errors: string[] }

  /**
   * Get provider metadata
   */
  getMetadata(): ProviderMetadata
}

/**
 * Generic provider class factory
 */
export interface ProviderClassFactory {
  new (settings: PluginSettings, tag?: string): Vendor
}

/**
 * Provider factory function type
 */
export type ProviderFactoryFunction = (settings: PluginSettings, tag?: string) => Vendor

/**
 * Provider registration options
 */
export interface ProviderRegistrationOptions {
  /** Whether to override existing provider with same tag */
  override?: boolean
  /** Whether to validate the provider configuration */
  validate?: boolean
  /** Additional configuration for the provider */
  config?: Record<string, unknown>
}

/**
 * Provider factory registry for managing factory registrations
 */
export interface IProviderFactoryRegistry {
  /**
   * Register a provider factory
   */
  registerFactory(
    tag: string,
    factory: IProviderFactory | ProviderClassFactory | ProviderFactoryFunction,
    options?: ProviderRegistrationOptions
  ): void

  /**
   * Get a provider factory by tag
   */
  getFactory(tag: string): IProviderFactory | ProviderClassFactory | ProviderFactoryFunction | null

  /**
   * Check if a factory is registered
   */
  hasFactory(tag: string): boolean

  /**
   * Remove a provider factory
   */
  removeFactory(tag: string): boolean

  /**
   * Get all registered factory tags
   */
  getRegisteredTags(): string[]

  /**
   * Create a provider using the appropriate factory
   */
  createProvider(tag: string, settings: PluginSettings, options?: ProviderRegistrationOptions): Vendor | null

  /**
   * Validate a provider configuration
   */
  validateProvider(tag: string, settings: PluginSettings): { isValid: boolean; errors: string[] }

  /**
   * Get provider metadata for all registered factories
   */
  getAllMetadata(): ProviderMetadata[]
}

/**
 * Error types for provider factory operations
 */
export class ProviderFactoryError extends Error {
  static factoryNotFound = (tag: string) =>
    Object.assign(new ProviderFactoryError(`Factory not found for provider: ${tag}`), {
      code: 'FACTORY_NOT_FOUND',
      tag,
    })

  static factoryAlreadyRegistered = (tag: string) =>
    Object.assign(new ProviderFactoryError(`Factory already registered for provider: ${tag}`), {
      code: 'FACTORY_ALREADY_REGISTERED',
      tag,
    })

  static invalidFactory = (tag: string, cause?: unknown) =>
    Object.assign(new ProviderFactoryError(`Invalid factory for provider: ${tag}`), {
      code: 'INVALID_FACTORY',
      tag,
      cause,
    })

  static providerCreationFailed = (tag: string, cause?: unknown) =>
    Object.assign(new ProviderFactoryError(`Failed to create provider: ${tag}`), {
      code: 'PROVIDER_CREATION_FAILED',
      tag,
      cause,
    })

  static validationFailed = (tag: string, errors: string[]) =>
    Object.assign(new ProviderFactoryError(`Validation failed for provider: ${tag}: ${errors.join(', ')}`), {
      code: 'VALIDATION_FAILED',
      tag,
      errors,
    })
}

/**
 * Create metadata from provider settings
 */
export function createMetadataFromSettings(tag: string, settings: ProviderSettings): ProviderMetadata {
  return {
    id: `${tag}-${settings.vendor.toLowerCase()}`,
    name: settings.vendor,
    tag,
    vendor: settings.vendor,
    capabilities: ['Text Generation'], // Default capability
    models: [settings.options.model],
    websiteToObtainKey: 'https://example.com/api-keys', // Default - should be overridden
    enabled: true,
  }
}

/**
 * Validate provider settings structure
 */
export function validateProviderSettings(settings: ProviderSettings): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!settings.tag?.trim()) {
    errors.push('Provider tag is required')
  }

  if (!settings.vendor?.trim()) {
    errors.push('Provider vendor is required')
  }

  if (!settings.options?.apiKey?.trim()) {
    errors.push('API key is required')
  }

  if (!settings.options?.baseURL?.trim()) {
    errors.push('Base URL is required')
  }

  if (!settings.options?.model?.trim()) {
    errors.push('Model is required')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Merge provider options with defaults
 */
export function mergeOptions(
  baseOptions: Record<string, unknown>,
  overrideOptions: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...baseOptions,
    ...overrideOptions,
    parameters: {
      ...(baseOptions.parameters || {}),
      ...(overrideOptions.parameters || {}),
    },
  }
}
