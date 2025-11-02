import { injectable, inject } from '@needle-di/core'
import type { BaseOptions, Message, ResolveEmbedAsBinary, Vendor } from '../providers'
import type { ProviderSettings } from '../settings'
import type { SendRequest } from '../providers'
import { Tokens } from './tokens'
import { getProviderMetadata, DEFAULT_PROVIDER_METADATA } from './provider-metadata'

// Error messages
const Errors = {
  provider_not_found: 'Provider not found',
  invalid_provider_tag: 'Invalid provider tag',
  provider_not_available: 'Provider not available',
  invalid_request_options: 'Invalid request options',
  provider_creation_failed: 'Failed to create provider instance',
  operation_failed: 'Provider operation failed',
} as const

// Custom exceptions
export class ProviderFacadeError extends Error {
  static providerNotFound = (tag: string) =>
    Object.assign(new ProviderFacadeError(`${Errors.provider_not_found}: ${tag}`), {
      code: 'PROVIDER_NOT_FOUND',
      providerTag: tag,
    })

  static invalidProviderTag = (tag: string) =>
    Object.assign(new ProviderFacadeError(`${Errors.invalid_provider_tag}: ${tag}`), {
      code: 'INVALID_PROVIDER_TAG',
      providerTag: tag,
    })

  static providerNotAvailable = (tag: string) =>
    Object.assign(new ProviderFacadeError(`${Errors.provider_not_available}: ${tag}`), {
      code: 'PROVIDER_NOT_AVAILABLE',
      providerTag: tag,
    })

  static invalidRequestOptions = (cause?: unknown) =>
    Object.assign(new ProviderFacadeError(`${Errors.invalid_request_options}: ${cause}`), {
      code: 'INVALID_REQUEST_OPTIONS',
      cause,
    })

  static providerCreationFailed = (tag: string, cause?: unknown) =>
    Object.assign(new ProviderFacadeError(`${Errors.provider_creation_failed}: ${tag}`), {
      code: 'PROVIDER_CREATION_FAILED',
      providerTag: tag,
      cause,
    })

  static operationFailed = (operation: string, cause?: unknown) =>
    Object.assign(new ProviderFacadeError(`${Errors.operation_failed}: ${operation}`), {
      code: 'OPERATION_FAILED',
      operation,
      cause,
    })
}

/**
 * Provider information interface
 */
export interface ProviderInfo {
  tag: string
  vendor: string
  name: string
  models: string[]
  capabilities: string[]
  websiteToObtainKey: string
  isAvailable: boolean
  settings?: ProviderSettings
}

/**
 * Provider Facade provides a simplified API for managing AI providers
 * while maintaining backward compatibility with existing code
 */
@injectable()
export class ProviderFacade {
  private providerInstances: Map<string, Vendor> = new Map()
  private providerCache: Map<string, ProviderInfo> = new Map()

  constructor(private settings = inject(Tokens.AppSettings)) {}

  /**
   * Get all available providers
   */
  getAvailableProviders(): string[] {
    return this.settings.providers?.map(p => p.tag).filter(tag => this.isProviderAvailable(tag)) || []
  }

  /**
   * Get provider information
   */
  getProviderInfo(tag: string): ProviderInfo | null {
    if (!tag || typeof tag !== 'string') {
      throw ProviderFacadeError.invalidProviderTag(tag)
    }

    // Check cache first
    if (this.providerCache.has(tag)) {
      return this.providerCache.get(tag)!
    }

    const providerSettings = this.settings.providers?.find(p => p.tag === tag)
    if (!providerSettings) {
      return null
    }

    const metadata = getProviderMetadata(providerSettings.vendor)
    const providerInstance = this.getProviderInstance(tag)

    const info: ProviderInfo = {
      tag: providerSettings.tag,
      vendor: providerSettings.vendor,
      name: metadata.name,
      models: providerInstance?.models || [],
      capabilities: metadata.capabilities,
      websiteToObtainKey: metadata.websiteToObtainKey,
      isAvailable: this.isProviderAvailable(tag),
      settings: providerSettings,
    }

    // Cache the result
    this.providerCache.set(tag, info)
    return info
  }

  /**
   * Get all provider information
   */
  getAllProviderInfo(): ProviderInfo[] {
    return (this.settings.providers || [])
      .map(provider => this.getProviderInfo(provider.tag))
      .filter((info): info is ProviderInfo => info !== null)
  }

  /**
   * Check if provider is available
   */
  isProviderAvailable(tag: string): boolean {
    if (!tag || typeof tag !== 'string') {
      return false
    }

    const providerSettings = this.settings.providers?.find(p => p.tag === tag)
    if (!providerSettings) {
      return false
    }

    // Basic validation
    if (!providerSettings.options?.apiKey || !providerSettings.options?.baseURL || !providerSettings.options?.model) {
      return false
    }

    try {
      const provider = this.getProviderInstance(tag)
      return provider !== null
    } catch {
      return false
    }
  }

  /**
   * Get provider instance
   */
  getProviderInstance(tag: string): Vendor | null {
    if (!tag || typeof tag !== 'string') {
      throw ProviderFacadeError.invalidProviderTag(tag)
    }

    // Check if already instantiated
    if (this.providerInstances.has(tag)) {
      return this.providerInstances.get(tag)!
    }

    const providerSettings = this.settings.providers?.find(p => p.tag === tag)
    if (!providerSettings) {
      throw ProviderFacadeError.providerNotFound(tag)
    }

    try {
      // Try to get provider from DI container or create dynamically
      const provider = this.createProviderInstance(providerSettings)
      if (provider) {
        this.providerInstances.set(tag, provider)
        // Clear cache when provider is created
        this.providerCache.delete(tag)
        return provider
      }
    } catch (error) {
      throw ProviderFacadeError.providerCreationFailed(tag, error)
    }

    throw ProviderFacadeError.providerNotAvailable(tag)
  }

  /**
   * Get provider's send request function
   */
  getProviderSendRequest(tag: string): SendRequest | null {
    try {
      const provider = this.getProviderInstance(tag)
      return provider?.sendRequestFunc || null
    } catch (error) {
      console.error(`Failed to get send request function for provider ${tag}:`, error)
      return null
    }
  }

  /**
   * Get provider models
   */
  getProviderModels(tag: string): string[] {
    try {
      const provider = this.getProviderInstance(tag)
      return provider?.models || []
    } catch (error) {
      console.error(`Failed to get models for provider ${tag}:`, error)
      return []
    }
  }

  /**
   * Get provider capabilities
   */
  getProviderCapabilities(tag: string): string[] {
    try {
      const provider = this.getProviderInstance(tag)
      return provider?.capabilities || []
    } catch (error) {
      console.error(`Failed to get capabilities for provider ${tag}:`, error)
      return []
    }
  }

  /**
   * Get provider metadata
   */
  getProviderMetadata(tag: string): ReturnType<typeof getProviderMetadata> {
    const providerSettings = this.settings.providers?.find(p => p.tag === tag)
    if (!providerSettings) {
      return DEFAULT_PROVIDER_METADATA
    }

    return getProviderMetadata(providerSettings.vendor)
  }

  /**
   * Refresh provider instance (clear cache and recreate)
   */
  refreshProvider(tag: string): void {
    if (!tag || typeof tag !== 'string') {
      throw ProviderFacadeError.invalidProviderTag(tag)
    }

    // Clear cached instance
    this.providerInstances.delete(tag)
    this.providerCache.delete(tag)

    // Force recreation
    this.getProviderInstance(tag)
  }

  /**
   * Refresh all providers
   */
  refreshAllProviders(): void {
    const providerTags = this.settings.providers?.map(p => p.tag) || []

    for (const tag of providerTags) {
      try {
        this.refreshProvider(tag)
      } catch (error) {
        console.error(`Failed to refresh provider ${tag}:`, error)
      }
    }
  }

  /**
   * Send request to provider
   */
  async sendRequest(
    tag: string,
    messages: readonly Message[],
    options: BaseOptions,
    controller: AbortController,
    resolveEmbedAsBinary: ResolveEmbedAsBinary
  ): Promise<AsyncGenerator<string, void, unknown>> {
    try {
      const sendRequestFunc = this.getProviderSendRequest(tag)
      if (!sendRequestFunc) {
        throw ProviderFacadeError.providerNotAvailable(tag)
      }

      const generator = sendRequestFunc(options)
      return generator(messages, controller, resolveEmbedAsBinary)
    } catch (error) {
      if (error instanceof ProviderFacadeError) {
        throw error
      }
      throw ProviderFacadeError.operationFailed('sendRequest', error)
    }
  }

  /**
   * Validate provider configuration
   */
  validateProvider(tag: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      if (!tag || typeof tag !== 'string') {
        errors.push('Provider tag is required and must be a string')
        return { isValid: false, errors }
      }

      const providerSettings = this.settings.providers?.find(p => p.tag === tag)
      if (!providerSettings) {
        errors.push(`Provider ${tag} not found in settings`)
        return { isValid: false, errors }
      }

      // Validate settings
      if (!providerSettings.options?.apiKey) {
        errors.push('API key is required')
      }

      if (!providerSettings.options?.baseURL) {
        errors.push('Base URL is required')
      }

      if (!providerSettings.options?.model) {
        errors.push('Model is required')
      }

      // Try to create provider instance
      try {
        const provider = this.getProviderInstance(tag)
        if (!provider) {
          errors.push('Failed to create provider instance')
        } else {
          // Validate provider-specific configuration if available
          if (typeof (provider as any).validateConfiguration === 'function') {
            const validation = (provider as any).validateConfiguration()
            if (!validation.isValid) {
              errors.push(...validation.errors)
            }
          }
        }
      } catch (error) {
        errors.push(`Provider instance creation failed: ${error}`)
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
   * Create provider instance (helper method)
   */
  private createProviderInstance(providerSettings: ProviderSettings): Vendor | null {
    // This would typically use the DI container or factory pattern
    // For now, we'll return null and let the actual implementation handle provider creation
    // In a real implementation, this would integrate with the ProviderFactoryRegistry

    // Placeholder for provider creation logic
    // This would be replaced with actual DI container integration
    return null
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.providerInstances.clear()
    this.providerCache.clear()
  }

  /**
   * Get statistics about providers
   */
  getProviderStats(): {
    total: number
    available: number
    unavailable: number
    byVendor: Record<string, number>
  } {
    const providers = this.settings.providers || []
    const available = providers.filter(p => this.isProviderAvailable(p.tag))
    const byVendor: Record<string, number> = {}

    for (const provider of providers) {
      byVendor[provider.vendor] = (byVendor[provider.vendor] || 0) + 1
    }

    return {
      total: providers.length,
      available: available.length,
      unavailable: providers.length - available.length,
      byVendor,
    }
  }

  /**
   * Dispose of the facade
   */
  dispose(): void {
    this.clearCache()
  }

  /**
   * Static factory method for creating instances
   */
  static create(settings?: ProviderSettings[]): ProviderFacade {
    const mockSettings = {
      providers: settings || [],
    } as any

    return new ProviderFacade(mockSettings)
  }
}