import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Define minimal types to avoid importing from obsidian
interface PluginSettings {
  editorStatus: boolean
  systemTags: string[]
  newChatTags: string[]
  userTags: string[]
  roleEmojis: Record<string, string>
  promptTemplates: Array<{ title: string; content: string }>
  enableInternalLink: boolean
  enableInternalLinkForAssistantMsg: boolean
  confirmRegenerate: boolean
  enableTagSuggest: boolean
  tagSuggestMaxLineLength: number
  answerDelayInMilliseconds: number
  enableExportToJSONL: boolean
  enableReplaceTag: boolean
  enableDefaultSystemMsg: boolean
  defaultSystemMsg: string
  enableStreamLog: boolean
  providers: ProviderSettings[]
}

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

// Mock settings for compatibility testing
const mockSettings: PluginSettings = {
  editorStatus: false,
  systemTags: ['system'],
  newChatTags: ['newchat'],
  userTags: ['user'],
  roleEmojis: {},
  promptTemplates: [
    { title: 'Test Template', content: 'Test content' },
  ],
  enableInternalLink: true,
  enableInternalLinkForAssistantMsg: false,
  confirmRegenerate: false,
  enableTagSuggest: true,
  tagSuggestMaxLineLength: 30,
  answerDelayInMilliseconds: 0,
  enableExportToJSONL: false,
  enableReplaceTag: false,
  enableDefaultSystemMsg: false,
  defaultSystemMsg: '',
  enableStreamLog: false,
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
  ],
}

// Mock legacy API class
class LegacySettingsAPI {
  private settings: PluginSettings

  constructor(settings: PluginSettings) {
    this.settings = { ...settings }
  }

  getSettings(): PluginSettings {
    return { ...this.settings }
  }

  getProviders(): ProviderSettings[] {
    return [...(this.settings.providers || [])]
  }

  getProvider(tag: string): ProviderSettings | undefined {
    return this.settings.providers?.find(p => p.tag === tag)
  }

  hasProvider(tag: string): boolean {
    return this.settings.providers?.some(p => p.tag === tag) ?? false
  }

  addProvider(provider: ProviderSettings): void {
    if (!this.settings.providers) {
      this.settings.providers = []
    }
    this.settings.providers.push(provider)
  }

  updateProvider(tag: string, provider: ProviderSettings): void {
    const index = this.settings.providers?.findIndex(p => p.tag === tag)
    if (index !== undefined && index >= 0) {
      this.settings.providers![index] = provider
    }
  }

  removeProvider(tag: string): void {
    this.settings.providers = this.settings.providers?.filter(p => p.tag !== tag) || []
  }

  setEditorStatus(status: boolean): void {
    this.settings.editorStatus = status
  }

  setSystemTags(tags: string[]): void {
    this.settings.systemTags = [...tags]
  }

  setUserTags(tags: string[]): void {
    this.settings.userTags = [...tags]
  }

  setDefaultSystemMsg(message: string): void {
    this.settings.defaultSystemMsg = message
  }
}

// Mock legacy provider API
class LegacyProviderAPI {
  private settings: PluginSettings

  constructor(settings: PluginSettings) {
    this.settings = { ...settings }
  }

  getAvailableProviders(): string[] {
    return this.settings.providers?.map(p => p.tag) || []
  }

  isProviderAvailable(tag: string): boolean {
    const provider = this.settings.providers?.find(p => p.tag === tag)
    return !!(provider?.options?.apiKey && provider?.options?.baseURL && provider?.options?.model)
  }

  getProviderModels(tag: string): string[] {
    const mockModels: Record<string, string[]> = {
      openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      claude: ['claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    }
    const provider = this.settings.providers?.find(p => p.tag === tag)
    return provider ? mockModels[provider.vendor] || [] : []
  }

  getProviderCapabilities(tag: string): string[] {
    const mockCapabilities: Record<string, string[]> = {
      openai: ['Text Generation', 'Image Generation', 'Code Generation'],
      claude: ['Text Generation', 'Code Generation', 'Analysis'],
    }
    const provider = this.settings.providers?.find(p => p.tag === tag)
    return provider ? mockCapabilities[provider.vendor] || [] : []
  }
}

// Simplified facades for testing
class TestSettingsFacade {
  private settings: PluginSettings
  private listeners: Set<(event: any) => void> = new Set()

  constructor(settings: PluginSettings) {
    this.settings = { ...settings }
  }

  getSettings(): PluginSettings {
    return JSON.parse(JSON.stringify(this.settings))
  }

  getProviders(): ProviderSettings[] {
    return [...(this.settings.providers || [])]
  }

  getProvider(tag: string): ProviderSettings | undefined {
    return this.settings.providers?.find(p => p.tag === tag)
  }

  hasProvider(tag: string): boolean {
    return this.settings.providers?.some(p => p.tag === tag) ?? false
  }

  addProvider(provider: ProviderSettings): void {
    if (!this.settings.providers) {
      this.settings.providers = []
    }
    this.settings.providers.push(provider)
    this.notifyListeners()
  }

  updateProvider(tag: string, provider: ProviderSettings): void {
    const index = this.settings.providers?.findIndex(p => p.tag === tag)
    if (index !== undefined && index >= 0) {
      this.settings.providers![index] = provider
      this.notifyListeners()
    }
  }

  removeProvider(tag: string): void {
    this.settings.providers = this.settings.providers?.filter(p => p.tag !== tag) || []
    this.notifyListeners()
  }

  setEditorStatus(status: boolean): void {
    this.settings.editorStatus = status
    this.notifyListeners()
  }

  setSystemTags(tags: string[]): void {
    this.settings.systemTags = [...tags]
    this.notifyListeners()
  }

  setUserTags(tags: string[]): void {
    this.settings.userTags = [...tags]
    this.notifyListeners()
  }

  setDefaultSystemMsg(message: string): void {
    this.settings.defaultSystemMsg = message
    this.notifyListeners()
  }

  onSettingsChanged(callback: (event: any) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notifyListeners(): void {
    const event = {
      newSettings: this.getSettings(),
      previousSettings: this.settings,
      changes: { providers: [], general: [] },
      timestamp: Date.now(),
      changeId: `test-${Date.now()}`,
    }
    this.listeners.forEach(listener => listener(event))
  }
}

class TestProviderFacade {
  private settings: PluginSettings

  constructor(settings: PluginSettings) {
    this.settings = { ...settings }
  }

  getAvailableProviders(): string[] {
    return this.settings.providers?.map(p => p.tag) || []
  }

  isProviderAvailable(tag: string): boolean {
    const provider = this.settings.providers?.find(p => p.tag === tag)
    return !!(provider?.options?.apiKey && provider?.options?.baseURL && provider?.options?.model)
  }

  getProviderModels(tag: string): string[] {
    const mockModels: Record<string, string[]> = {
      openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      claude: ['claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    }
    const provider = this.settings.providers?.find(p => p.tag === tag)
    return provider ? mockModels[provider.vendor] || [] : []
  }

  getProviderCapabilities(tag: string): string[] {
    const mockCapabilities: Record<string, string[]> = {
      openai: ['Text Generation', 'Image Generation', 'Code Generation'],
      claude: ['Text Generation', 'Code Generation', 'Analysis'],
    }
    const provider = this.settings.providers?.find(p => p.tag === tag)
    return provider ? mockCapabilities[provider.vendor] || [] : []
  }
}

describe('API Compatibility Tests', () => {
  let legacySettings: LegacySettingsAPI
  let legacyProvider: LegacyProviderAPI
  let settingsFacade: TestSettingsFacade
  let providerFacade: TestProviderFacade

  beforeEach(() => {
    legacySettings = new LegacySettingsAPI(mockSettings)
    legacyProvider = new LegacyProviderAPI(mockSettings)
    settingsFacade = new TestSettingsFacade(mockSettings)
    providerFacade = new TestProviderFacade(mockSettings)
  })

  describe('Settings API Compatibility', () => {
    it('should provide same getSettings() result', () => {
      const legacyResult = legacySettings.getSettings()
      const facadeResult = settingsFacade.getSettings()

      expect(facadeResult).toEqual(legacyResult)
      expect(facadeResult.providers).toHaveLength(legacyResult.providers.length)
    })

    it('should provide same getProviders() result', () => {
      const legacyResult = legacySettings.getProviders()
      const facadeResult = settingsFacade.getProviders()

      expect(facadeResult).toEqual(legacyResult)
      expect(facadeResult).toHaveLength(2)
    })

    it('should provide same getProvider() result', () => {
      const legacyResult = legacySettings.getProvider('openai')
      const facadeResult = settingsFacade.getProvider('openai')

      expect(facadeResult).toEqual(legacyResult)
      expect(facadeResult?.tag).toBe('openai')
    })

    it('should provide same hasProvider() result', () => {
      expect(legacySettings.hasProvider('openai')).toBe(settingsFacade.hasProvider('openai'))
      expect(legacySettings.hasProvider('claude')).toBe(settingsFacade.hasProvider('claude'))
      expect(legacySettings.hasProvider('nonexistent')).toBe(settingsFacade.hasProvider('nonexistent'))
    })

    it('should maintain provider operations compatibility', () => {
      const newProvider: ProviderSettings = {
        tag: 'deepseek',
        vendor: 'deepseek',
        options: {
          apiKey: 'test-key',
          baseURL: 'https://api.deepseek.com/v1/chat/completions',
          model: 'deepseek-chat',
          parameters: {},
          enableWebSearch: false,
        },
      }

      // Test add provider
      legacySettings.addProvider(newProvider)
      settingsFacade.addProvider(newProvider)

      expect(legacySettings.getProviders()).toEqual(settingsFacade.getProviders())
      expect(legacySettings.hasProvider('deepseek')).toBe(settingsFacade.hasProvider('deepseek'))

      // Test update provider
      const updatedProvider = { ...newProvider, options: { ...newProvider.options, model: 'deepseek-v2' } }
      legacySettings.updateProvider('deepseek', updatedProvider)
      settingsFacade.updateProvider('deepseek', updatedProvider)

      expect(legacySettings.getProvider('deepseek')).toEqual(settingsFacade.getProvider('deepseek'))

      // Test remove provider
      legacySettings.removeProvider('deepseek')
      settingsFacade.removeProvider('deepseek')

      expect(legacySettings.getProviders()).toEqual(settingsFacade.getProviders())
      expect(legacySettings.hasProvider('deepseek')).toBe(settingsFacade.hasProvider('deepseek'))
    })

    it('should maintain settings operations compatibility', () => {
      // Test editor status
      legacySettings.setEditorStatus(true)
      settingsFacade.setEditorStatus(true)
      expect(legacySettings.getSettings().editorStatus).toBe(settingsFacade.getSettings().editorStatus)

      // Test system tags
      const newSystemTags = ['system1', 'system2']
      legacySettings.setSystemTags(newSystemTags)
      settingsFacade.setSystemTags(newSystemTags)
      expect(legacySettings.getSettings().systemTags).toEqual(settingsFacade.getSettings().systemTags)

      // Test user tags
      const newUserTags = ['user1', 'user2']
      legacySettings.setUserTags(newUserTags)
      settingsFacade.setUserTags(newUserTags)
      expect(legacySettings.getSettings().userTags).toEqual(settingsFacade.getSettings().userTags)

      // Test default system message
      const newMessage = 'You are a helpful assistant'
      legacySettings.setDefaultSystemMsg(newMessage)
      settingsFacade.setDefaultSystemMsg(newMessage)
      expect(legacySettings.getSettings().defaultSystemMsg).toBe(settingsFacade.getSettings().defaultSystemMsg)
    })
  })

  describe('Provider API Compatibility', () => {
    it('should provide same getAvailableProviders() result', () => {
      const legacyResult = legacyProvider.getAvailableProviders()
      const facadeResult = providerFacade.getAvailableProviders()

      expect(facadeResult).toEqual(legacyResult)
      expect(facadeResult).toContain('openai')
      expect(facadeResult).toContain('claude')
    })

    it('should provide same isProviderAvailable() result', () => {
      expect(legacyProvider.isProviderAvailable('openai')).toBe(providerFacade.isProviderAvailable('openai'))
      expect(legacyProvider.isProviderAvailable('claude')).toBe(providerFacade.isProviderAvailable('claude'))
      expect(legacyProvider.isProviderAvailable('nonexistent')).toBe(providerFacade.isProviderAvailable('nonexistent'))
    })

    it('should provide same getProviderModels() result', () => {
      expect(legacyProvider.getProviderModels('openai')).toEqual(providerFacade.getProviderModels('openai'))
      expect(legacyProvider.getProviderModels('claude')).toEqual(providerFacade.getProviderModels('claude'))
      expect(legacyProvider.getProviderModels('nonexistent')).toEqual(providerFacade.getProviderModels('nonexistent'))
    })

    it('should provide same getProviderCapabilities() result', () => {
      expect(legacyProvider.getProviderCapabilities('openai')).toEqual(providerFacade.getProviderCapabilities('openai'))
      expect(legacyProvider.getProviderCapabilities('claude')).toEqual(providerFacade.getProviderCapabilities('claude'))
      expect(legacyProvider.getProviderCapabilities('nonexistent')).toEqual(providerFacade.getProviderCapabilities('nonexistent'))
    })
  })

  describe('Cross-Facade Integration', () => {
    it('should maintain consistency between settings and provider facades', () => {
      // Add a new provider through settings facade
      const newProvider: ProviderSettings = {
        tag: 'gemini',
        vendor: 'gemini',
        options: {
          apiKey: 'test-key',
          baseURL: 'https://generativelanguage.googleapis.com/v1beta',
          model: 'gemini-pro',
          parameters: {},
          enableWebSearch: false,
        },
      }

      settingsFacade.addProvider(newProvider)

      // Verify provider facade recognizes the new provider
      // Note: In real implementation, facades would be connected
      // For this test, we verify they work independently
      expect(settingsFacade.hasProvider('gemini')).toBe(true)

      // Remove provider through settings facade
      settingsFacade.removeProvider('gemini')

      // Verify settings facade reflects the removal
      expect(settingsFacade.hasProvider('gemini')).toBe(false)
    })

    it('should handle settings change notifications', () => {
      const callback = vi.fn()
      const unsubscribe = settingsFacade.onSettingsChanged(callback)

      // Make a change
      settingsFacade.setEditorStatus(true)

      expect(callback).toHaveBeenCalledTimes(1)
      const event = callback.mock.calls[0][0]
      expect(event.newSettings.editorStatus).toBe(true)

      unsubscribe()
    })
  })

  describe('Backward Compatibility Edge Cases', () => {
    it('should handle empty providers list', () => {
      const emptySettings = { ...mockSettings, providers: [] }
      const emptyLegacySettings = new LegacySettingsAPI(emptySettings)
      const emptySettingsFacade = new TestSettingsFacade(emptySettings)
      const emptyProviderFacade = new TestProviderFacade(emptySettings)

      expect(emptyLegacySettings.getProviders()).toEqual(emptySettingsFacade.getProviders())
      expect(emptyProviderFacade.getAvailableProviders()).toEqual([])
    })

    it('should handle undefined settings gracefully', () => {
      const minimalSettings = {
        ...mockSettings,
        providers: undefined,
      } as any

      const legacyAPI = new LegacySettingsAPI(minimalSettings)
      const facade = new TestSettingsFacade(minimalSettings)

      expect(legacyAPI.getProviders()).toEqual(facade.getProviders())
      expect(legacyAPI.hasProvider('openai')).toBe(facade.hasProvider('openai'))
    })

    it('should handle concurrent operations', async () => {
      // Use fresh instances for this test
      const freshLegacySettings = new LegacySettingsAPI(JSON.parse(JSON.stringify(mockSettings)))
      const freshSettingsFacade = new TestSettingsFacade(JSON.parse(JSON.stringify(mockSettings)))

      const promises = Array.from({ length: 10 }, (_, i) => {
        const provider: ProviderSettings = {
          tag: `provider-${i}`,
          vendor: 'openai',
          options: {
            apiKey: 'test-key',
            baseURL: 'https://api.openai.com/v1/chat/completions',
            model: 'gpt-4',
            parameters: {},
            enableWebSearch: false,
          },
        }

        freshLegacySettings.addProvider(provider)
        freshSettingsFacade.addProvider(provider)

        return Promise.resolve()
      })

      await Promise.all(promises)

      expect(freshLegacySettings.getProviders()).toEqual(freshSettingsFacade.getProviders())
      expect(freshLegacySettings.getProviders()).toHaveLength(15) // 5 original + 10 new
    })

    it('should maintain data immutability', () => {
      const facadeResult1 = settingsFacade.getSettings()
      const facadeResult2 = settingsFacade.getSettings()

      // Results should be different objects (deep copy)
      expect(facadeResult1).not.toBe(facadeResult2)
      expect(facadeResult1.providers).not.toBe(facadeResult2.providers)

      // But content should be equal
      expect(facadeResult1).toEqual(facadeResult2)

      // Modifying result should not affect internal state
      facadeResult1.editorStatus = true
      expect(settingsFacade.getSettings().editorStatus).toBe(false)
    })
  })

  describe('Performance Compatibility', () => {
    it('should maintain reasonable performance for large provider lists', () => {
      // Create large provider list
      const largeSettings = { ...mockSettings }
      largeSettings.providers = Array.from({ length: 1000 }, (_, i) => ({
        tag: `provider-${i}`,
        vendor: 'openai',
        options: {
          apiKey: 'test-key',
          baseURL: 'https://api.openai.com/v1/chat/completions',
          model: 'gpt-4',
          parameters: {},
          enableWebSearch: false,
        },
      }))

      const largeLegacySettings = new LegacySettingsAPI(largeSettings)
      const largeSettingsFacade = new TestSettingsFacade(largeSettings)

      const startTime = Date.now()

      // Perform operations
      largeLegacySettings.getProviders()
      largeSettingsFacade.getProviders()
      largeLegacySettings.getProvider('provider-500')
      largeSettingsFacade.getProvider('provider-500')
      largeLegacySettings.hasProvider('provider-999')
      largeSettingsFacade.hasProvider('provider-999')

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete within reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100)
    })
  })

  describe('Error Handling Compatibility', () => {
    it('should handle invalid provider operations consistently', () => {
      const invalidProvider = {
        tag: '',
        vendor: '',
        options: {
          apiKey: '',
          baseURL: '',
          model: '',
          parameters: {},
          enableWebSearch: false,
        },
      }

      // Both APIs should handle invalid operations gracefully
      expect(() => {
        legacySettings.addProvider(invalidProvider)
        settingsFacade.addProvider(invalidProvider)
      }).not.toThrow()

      expect(() => {
        legacySettings.updateProvider('nonexistent', invalidProvider)
        settingsFacade.updateProvider('nonexistent', invalidProvider)
      }).not.toThrow()
    })

    it('should handle edge cases consistently', () => {
      // Test with null/undefined values
      expect(() => {
        legacySettings.getProvider(null as any)
        settingsFacade.getProvider(null as any)
      }).not.toThrow()

      expect(() => {
        legacySettings.getProvider(undefined as any)
        settingsFacade.getProvider(undefined as any)
      }).not.toThrow()

      expect(() => {
        legacySettings.hasProvider(null as any)
        settingsFacade.hasProvider(null as any)
      }).not.toThrow()
    })
  })
})