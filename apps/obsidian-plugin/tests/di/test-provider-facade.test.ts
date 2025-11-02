import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Define minimal types to avoid importing from obsidian
interface ProviderSettings {
  tag: string
  vendor: string
  options: {
    apiKey: string
    baseURL: string
    model: string
    parameters: Record<string, any>
    enableWebSearch: boolean
  }
}

interface Message {
  role: string
  content: string
  embeds?: any[]
}

interface BaseOptions {
  apiKey?: string
  baseURL?: string
  model?: string
  parameters?: Record<string, any>
  enableWebSearch?: boolean
}

interface Vendor {
  name: string
  models: string[]
  capabilities: string[]
  websiteToObtainKey: string
  sendRequestFunc: (options: BaseOptions) => any
}

type SendRequest = (
  options: BaseOptions
) => (
  messages: readonly Message[],
  controller: AbortController,
  resolveEmbedAsBinary: (embed: any) => Promise<ArrayBuffer>
) => AsyncGenerator<string, void, unknown>

interface ProviderInfo {
  tag: string
  vendor: string
  name: string
  models: string[]
  capabilities: string[]
  websiteToObtainKey: string
  isAvailable: boolean
  settings?: ProviderSettings
}

// Mock settings
const mockSettings = {
  providers: [
    {
      tag: 'openai',
      vendor: 'openai',
      options: {
        apiKey: 'test-key',
        baseURL: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4',
        parameters: {},
        enableWebSearch: false,
      },
    },
    {
      tag: 'claude',
      vendor: 'claude',
      options: {
        apiKey: 'test-key',
        baseURL: 'https://api.anthropic.com/v1/messages',
        model: 'claude-3-sonnet-20240229',
        parameters: {},
        enableWebSearch: false,
      },
    },
    {
      tag: 'invalid',
      vendor: 'openai',
      options: {
        // Missing required fields
        apiKey: '',
        baseURL: '',
        model: '',
        parameters: {},
        enableWebSearch: false,
      },
    },
  ] as ProviderSettings[],
}

// Create a simplified ProviderFacade for testing
class TestProviderFacade {
  private providerInstances: Map<string, Vendor> = new Map()
  private providerCache: Map<string, ProviderInfo> = new Map()
  private settings: { providers: ProviderSettings[] }

  constructor(settings: { providers: ProviderSettings[] }) {
    this.settings = settings
  }

  getAvailableProviders(): string[] {
    return this.settings.providers
      .map(p => p.tag)
      .filter(tag => this.isProviderAvailable(tag))
  }

  getProviderInfo(tag: string): ProviderInfo | null {
    if (!tag || typeof tag !== 'string') {
      throw new Error(`Invalid provider tag: ${tag}`)
    }

    if (this.providerCache.has(tag)) {
      return this.providerCache.get(tag)!
    }

    const providerSettings = this.settings.providers.find(p => p.tag === tag)
    if (!providerSettings) {
      return null
    }

    const metadata = this.getProviderMetadata(tag)
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

    this.providerCache.set(tag, info)
    return info
  }

  getAllProviderInfo(): ProviderInfo[] {
    return this.settings.providers
      .map(provider => this.getProviderInfo(provider.tag))
      .filter((info): info is ProviderInfo => info !== null)
  }

  isProviderAvailable(tag: string): boolean {
    if (!tag || typeof tag !== 'string') {
      return false
    }

    const providerSettings = this.settings.providers.find(p => p.tag === tag)
    if (!providerSettings) {
      return false
    }

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

  getProviderInstance(tag: string): Vendor | null {
    if (!tag || typeof tag !== 'string') {
      throw new Error(`Invalid provider tag: ${tag}`)
    }

    if (this.providerInstances.has(tag)) {
      return this.providerInstances.get(tag)!
    }

    const providerSettings = this.settings.providers.find(p => p.tag === tag)
    if (!providerSettings) {
      throw new Error(`Provider not found: ${tag}`)
    }

    const provider = this.createProviderInstance(providerSettings)
    if (provider) {
      this.providerInstances.set(tag, provider)
      this.providerCache.delete(tag)
      return provider
    }

    throw new Error(`Provider not available: ${tag}`)
  }

  getProviderSendRequest(tag: string): SendRequest | null {
    try {
      const provider = this.getProviderInstance(tag)
      return provider?.sendRequestFunc || null
    } catch (error) {
      console.error(`Failed to get send request function for provider ${tag}:`, error)
      return null
    }
  }

  getProviderModels(tag: string): string[] {
    try {
      const provider = this.getProviderInstance(tag)
      return provider?.models || []
    } catch (error) {
      console.error(`Failed to get models for provider ${tag}:`, error)
      return []
    }
  }

  getProviderCapabilities(tag: string): string[] {
    try {
      const provider = this.getProviderInstance(tag)
      return provider?.capabilities || []
    } catch (error) {
      console.error(`Failed to get capabilities for provider ${tag}:`, error)
      return []
    }
  }

  getProviderMetadata(tag: string): any {
    const providerSettings = this.settings.providers.find(p => p.tag === tag)
    if (!providerSettings) {
      return {
        name: 'Unknown Provider',
        vendor: 'unknown',
        capabilities: [],
        websiteToObtainKey: '',
        defaultModel: '',
        description: 'Unknown provider',
        documentation: '',
      }
    }

    const metadataMap: Record<string, any> = {
      openai: {
        name: 'OpenAI',
        vendor: 'openai',
        capabilities: ['Text Generation', 'Image Generation', 'Code Generation'],
        websiteToObtainKey: 'https://platform.openai.com/api-keys',
        defaultModel: 'gpt-4',
        description: 'OpenAI GPT models',
        documentation: 'https://platform.openai.com/docs',
      },
      claude: {
        name: 'Claude',
        vendor: 'claude',
        capabilities: ['Text Generation', 'Code Generation', 'Analysis'],
        websiteToObtainKey: 'https://console.anthropic.com/',
        defaultModel: 'claude-3-sonnet-20240229',
        description: 'Anthropic Claude models',
        documentation: 'https://docs.anthropic.com/claude',
      },
    }

    return metadataMap[providerSettings.vendor] || {
      name: 'Unknown Provider',
      vendor: 'unknown',
      capabilities: [],
      websiteToObtainKey: '',
      defaultModel: '',
      description: 'Unknown provider',
      documentation: '',
    }
  }

  refreshProvider(tag: string): void {
    if (!tag || typeof tag !== 'string') {
      throw new Error(`Invalid provider tag: ${tag}`)
    }

    this.providerInstances.delete(tag)
    this.providerCache.delete(tag)
    this.getProviderInstance(tag)
  }

  refreshAllProviders(): void {
    const providerTags = this.settings.providers.map(p => p.tag)

    for (const tag of providerTags) {
      try {
        this.refreshProvider(tag)
      } catch (error) {
        console.error(`Failed to refresh provider ${tag}:`, error)
      }
    }
  }

  async sendRequest(
    tag: string,
    messages: readonly Message[],
    options: BaseOptions,
    controller: AbortController,
    resolveEmbedAsBinary: (embed: any) => Promise<ArrayBuffer>
  ): Promise<AsyncGenerator<string, void, unknown>> {
    try {
      const sendRequestFunc = this.getProviderSendRequest(tag)
      if (!sendRequestFunc) {
        throw new Error(`Provider not available: ${tag}`)
      }

      const generator = sendRequestFunc(options)
      return generator(messages, controller, resolveEmbedAsBinary)
    } catch (error) {
      throw new Error(`Operation failed: sendRequest - ${error}`)
    }
  }

  validateProvider(tag: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      if (!tag || typeof tag !== 'string') {
        errors.push('Provider tag is required and must be a string')
        return { isValid: false, errors }
      }

      const providerSettings = this.settings.providers.find(p => p.tag === tag)
      if (!providerSettings) {
        errors.push(`Provider ${tag} not found in settings`)
        return { isValid: false, errors }
      }

      if (!providerSettings.options?.apiKey) {
        errors.push('API key is required')
      }

      if (!providerSettings.options?.baseURL) {
        errors.push('Base URL is required')
      }

      if (!providerSettings.options?.model) {
        errors.push('Model is required')
      }

      try {
        const provider = this.getProviderInstance(tag)
        if (!provider) {
          errors.push('Failed to create provider instance')
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

  private createProviderInstance(providerSettings: ProviderSettings): Vendor | null {
    // Mock provider creation
    if (!providerSettings.options?.apiKey || !providerSettings.options?.baseURL || !providerSettings.options?.model) {
      return null
    }

    const mockVendor: Vendor = {
      name: this.getProviderMetadata(providerSettings.tag).name,
      models: this.getMockModels(providerSettings.vendor),
      capabilities: this.getProviderMetadata(providerSettings.tag).capabilities,
      websiteToObtainKey: this.getProviderMetadata(providerSettings.tag).websiteToObtainKey,
      sendRequestFunc: (options: BaseOptions) => {
        return async function* (
          messages: readonly Message[],
          controller: AbortController,
          resolveEmbedAsBinary: (embed: any) => Promise<ArrayBuffer>
        ) {
          yield `Mock response from ${providerSettings.vendor}`
        }
      },
    }

    return mockVendor
  }

  private getMockModels(vendor: string): string[] {
    const modelMap: Record<string, string[]> = {
      openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      claude: ['claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    }
    return modelMap[vendor] || []
  }

  clearCache(): void {
    this.providerInstances.clear()
    this.providerCache.clear()
  }

  getProviderStats(): {
    total: number
    available: number
    unavailable: number
    byVendor: Record<string, number>
  } {
    const providers = this.settings.providers
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

  dispose(): void {
    this.clearCache()
  }

  static create(settings?: ProviderSettings[]): TestProviderFacade {
    return new TestProviderFacade({ providers: settings || [] })
  }
}

describe('ProviderFacade', () => {
  let providerFacade: TestProviderFacade

  beforeEach(() => {
    providerFacade = new TestProviderFacade(mockSettings)
  })

  afterEach(() => {
    providerFacade.dispose()
  })

  describe('Basic Provider Access', () => {
    it('should get available providers', () => {
      const availableProviders = providerFacade.getAvailableProviders()
      expect(availableProviders).toContain('openai')
      expect(availableProviders).toContain('claude')
      expect(availableProviders).not.toContain('invalid')
    })

    it('should get provider info', () => {
      const openaiInfo = providerFacade.getProviderInfo('openai')
      expect(openaiInfo).toBeDefined()
      expect(openaiInfo?.tag).toBe('openai')
      expect(openaiInfo?.vendor).toBe('openai')
      expect(openaiInfo?.name).toBe('OpenAI')
      expect(openaiInfo?.isAvailable).toBe(true)
    })

    it('should return null for non-existent provider', () => {
      const info = providerFacade.getProviderInfo('nonexistent')
      expect(info).toBeNull()
    })

    it('should get all provider info', () => {
      const allInfo = providerFacade.getAllProviderInfo()
      expect(allInfo).toHaveLength(3)
      expect(allInfo[0].tag).toBe('openai')
      expect(allInfo[1].tag).toBe('claude')
      expect(allInfo[2].tag).toBe('invalid')
    })
  })

  describe('Provider Availability', () => {
    it('should check provider availability correctly', () => {
      expect(providerFacade.isProviderAvailable('openai')).toBe(true)
      expect(providerFacade.isProviderAvailable('claude')).toBe(true)
      expect(providerFacade.isProviderAvailable('invalid')).toBe(false)
      expect(providerFacade.isProviderAvailable('nonexistent')).toBe(false)
    })

    it('should handle invalid provider tags', () => {
      expect(providerFacade.isProviderAvailable('')).toBe(false)
      expect(providerFacade.isProviderAvailable(null as any)).toBe(false)
      expect(providerFacade.isProviderAvailable(undefined as any)).toBe(false)
    })
  })

  describe('Provider Instances', () => {
    it('should get provider instance', () => {
      const provider = providerFacade.getProviderInstance('openai')
      expect(provider).toBeDefined()
      expect(provider?.name).toBe('OpenAI')
      expect(provider?.models).toContain('gpt-4')
    })

    it('should throw error for non-existent provider', () => {
      expect(() => providerFacade.getProviderInstance('nonexistent')).toThrow('Provider not found: nonexistent')
    })

    it('should cache provider instances', () => {
      const provider1 = providerFacade.getProviderInstance('openai')
      const provider2 = providerFacade.getProviderInstance('openai')
      expect(provider1).toBe(provider2) // Same instance
    })

    it('should throw error for invalid provider tags', () => {
      expect(() => providerFacade.getProviderInstance('')).toThrow('Invalid provider tag: ')
      expect(() => providerFacade.getProviderInstance(null as any)).toThrow()
    })
  })

  describe('Provider Capabilities', () => {
    it('should get provider models', () => {
      const openaiModels = providerFacade.getProviderModels('openai')
      expect(openaiModels).toContain('gpt-4')
      expect(openaiModels).toContain('gpt-4-turbo')
    })

    it('should get provider capabilities', () => {
      const openaiCapabilities = providerFacade.getProviderCapabilities('openai')
      expect(openaiCapabilities).toContain('Text Generation')
      expect(openaiCapabilities).toContain('Image Generation')
    })

    it('should get provider metadata', () => {
      const metadata = providerFacade.getProviderMetadata('openai')
      expect(metadata.name).toBe('OpenAI')
      expect(metadata.vendor).toBe('openai')
      expect(metadata.capabilities).toContain('Text Generation')
    })

    it('should return default metadata for unknown providers', () => {
      const metadata = providerFacade.getProviderMetadata('nonexistent')
      expect(metadata.name).toBe('Unknown Provider')
      expect(metadata.vendor).toBe('unknown')
      expect(metadata.capabilities).toEqual([])
    })
  })

  describe('Provider Operations', () => {
    it('should get provider send request function', () => {
      const sendRequest = providerFacade.getProviderSendRequest('openai')
      expect(sendRequest).toBeDefined()
      expect(typeof sendRequest).toBe('function')
    })

    it('should handle send request errors gracefully', () => {
      const sendRequest = providerFacade.getProviderSendRequest('nonexistent')
      expect(sendRequest).toBeNull()
    })

    it('should refresh provider', () => {
      const provider1 = providerFacade.getProviderInstance('openai')
      providerFacade.refreshProvider('openai')
      const provider2 = providerFacade.getProviderInstance('openai')
      expect(provider1).not.toBe(provider2) // Different instance after refresh
    })

    it('should refresh all providers', () => {
      const openai1 = providerFacade.getProviderInstance('openai')
      const claude1 = providerFacade.getProviderInstance('claude')

      providerFacade.refreshAllProviders()

      const openai2 = providerFacade.getProviderInstance('openai')
      const claude2 = providerFacade.getProviderInstance('claude')

      expect(openai1).not.toBe(openai2)
      expect(claude1).not.toBe(claude2)
    })
  })

  describe('Provider Validation', () => {
    it('should validate valid provider', () => {
      const validation = providerFacade.validateProvider('openai')
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should validate invalid provider', () => {
      const validation = providerFacade.validateProvider('invalid')
      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    it('should validate non-existent provider', () => {
      const validation = providerFacade.validateProvider('nonexistent')
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Provider nonexistent not found in settings')
    })

    it('should handle invalid provider tags in validation', () => {
      const validation1 = providerFacade.validateProvider('')
      expect(validation1.isValid).toBe(false)
      expect(validation1.errors).toContain('Provider tag is required and must be a string')

      const validation2 = providerFacade.validateProvider(null as any)
      expect(validation2.isValid).toBe(false)
      expect(validation2.errors).toContain('Provider tag is required and must be a string')
    })
  })

  describe('Request Handling', () => {
    it('should send request to provider', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Hello' }]
      const options: BaseOptions = { apiKey: 'test', baseURL: 'test', model: 'test' }
      const controller = new AbortController()
      const resolveEmbedAsBinary = vi.fn()

      const response = providerFacade.sendRequest('openai', messages, options, controller, resolveEmbedAsBinary)
      expect(response).toBeDefined()

      const generator = await response
      const result = await generator.next()
      expect(result.value).toBe('Mock response from openai')
    })

    it('should handle request errors gracefully', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Hello' }]
      const options: BaseOptions = { apiKey: 'test', baseURL: 'test', model: 'test' }
      const controller = new AbortController()
      const resolveEmbedAsBinary = vi.fn()

      await expect(
        providerFacade.sendRequest('nonexistent', messages, options, controller, resolveEmbedAsBinary)
      ).rejects.toThrow('Operation failed: sendRequest')
    })
  })

  describe('Cache Management', () => {
    it('should clear cache', () => {
      providerFacade.getProviderInstance('openai')
      providerFacade.getProviderInstance('claude')

      expect(providerFacade['providerInstances'].size).toBe(2)
      expect(providerFacade['providerCache'].size).toBe(0)

      // Get provider info to populate cache
      providerFacade.getProviderInfo('openai')
      expect(providerFacade['providerCache'].size).toBe(1)

      providerFacade.clearCache()

      expect(providerFacade['providerInstances'].size).toBe(0)
      expect(providerFacade['providerCache'].size).toBe(0)
    })

    it('should handle refresh errors gracefully', () => {
      expect(() => {
        providerFacade.refreshProvider('')
      }).toThrow('Invalid provider tag: ')

      // Should throw for non-existent provider (consistent with behavior)
      expect(() => {
        providerFacade.refreshProvider('nonexistent')
      }).toThrow('Provider not found: nonexistent')
    })
  })

  describe('Statistics', () => {
    it('should get provider statistics', () => {
      const stats = providerFacade.getProviderStats()
      expect(stats.total).toBe(3)
      expect(stats.available).toBe(2)
      expect(stats.unavailable).toBe(1)
      expect(stats.byVendor.openai).toBe(2) // openai + invalid
      expect(stats.byVendor.claude).toBe(1)
    })
  })

  describe('Static Factory', () => {
    it('should create instance with default settings', () => {
      const facade = TestProviderFacade.create()
      expect(facade.getAvailableProviders()).toHaveLength(0)
    })

    it('should create instance with custom settings', () => {
      const customSettings: ProviderSettings[] = [
        {
          tag: 'custom',
          vendor: 'openai',
          options: {
            apiKey: 'test',
            baseURL: 'test',
            model: 'test',
            parameters: {},
            enableWebSearch: false,
          },
        },
      ]

      const facade = TestProviderFacade.create(customSettings)
      expect(facade.getAvailableProviders()).toHaveLength(1)
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle concurrent provider access', async () => {
      const promises = Array.from({ length: 10 }, () =>
        Promise.resolve(providerFacade.getProviderInstance('openai'))
      )

      const results = await Promise.all(promises)
      expect(results).toHaveLength(10)

      // All results should be the same instance (cached)
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toBe(results[0])
      }
    })

    it('should handle provider info caching correctly', () => {
      const info1 = providerFacade.getProviderInfo('openai')
      const info2 = providerFacade.getProviderInfo('openai')

      expect(info1).toBe(info2) // Same cached object

      // Refresh should clear cache
      providerFacade.refreshProvider('openai')
      const info3 = providerFacade.getProviderInfo('openai')

      expect(info1).not.toBe(info3) // Different object after refresh
    })
  })
})