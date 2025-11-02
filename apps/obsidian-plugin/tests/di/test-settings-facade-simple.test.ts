import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Define minimal types to avoid importing from obsidian
interface PluginSettings {
  editorStatus: boolean
  systemTags: string[]
  newChatTags: string[]
  userTags: string[]
  roleEmojis: Record<string, string>
  promptTemplates: string[]
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

interface SettingsChangeEvent {
  newSettings: PluginSettings
  previousSettings: PluginSettings
  changes: any
  timestamp: number
  changeId: string
}

type SettingsSubscription = (event: SettingsChangeEvent) => void

// Mock settings
const mockSettings: PluginSettings = {
  editorStatus: false,
  systemTags: ['system'],
  newChatTags: ['newchat'],
  userTags: ['user'],
  roleEmojis: {},
  promptTemplates: [],
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

// Create a simplified SettingsFacade for testing
class TestSettingsFacade {
  private currentSettings: PluginSettings
  private listeners: Set<SettingsSubscription> = new Set()

  constructor(settings: PluginSettings) {
    this.currentSettings = { ...settings }
  }

  getSettings(): PluginSettings {
    return { ...this.currentSettings }
  }

  getProviders(): ProviderSettings[] {
    return [...(this.currentSettings.providers || [])]
  }

  getProvider(tag: string): ProviderSettings | undefined {
    return this.currentSettings.providers?.find(p => p.tag === tag)
  }

  hasProvider(tag: string): boolean {
    return this.currentSettings.providers?.some(p => p.tag === tag) ?? false
  }

  addProvider(provider: ProviderSettings): void {
    if (!provider || !provider.tag) {
      throw new Error('Provider data is required')
    }

    if (this.hasProvider(provider.tag)) {
      throw new Error(`Provider ${provider.tag} already exists`)
    }

    const previousSettings = this.getSettings()
    this.currentSettings.providers = [...(this.currentSettings.providers || []), provider]
    this.emitSettingsChange(previousSettings)
  }

  updateProvider(tag: string, provider: ProviderSettings): void {
    if (!provider || provider.tag !== tag) {
      throw new Error('Provider tag must match')
    }

    if (!this.hasProvider(tag)) {
      throw new Error(`Provider ${tag} not found`)
    }

    const previousSettings = this.getSettings()
    this.currentSettings.providers = this.currentSettings.providers?.map(p =>
      p.tag === tag ? provider : p
    ) || []
    this.emitSettingsChange(previousSettings)
  }

  removeProvider(tag: string): void {
    if (!this.hasProvider(tag)) {
      return // Graceful handling of non-existent provider
    }

    const previousSettings = this.getSettings()
    this.currentSettings.providers = this.currentSettings.providers?.filter(p => p.tag !== tag) || []
    this.emitSettingsChange(previousSettings)
  }

  setProviders(providers: ProviderSettings[]): void {
    if (!Array.isArray(providers)) {
      throw new Error('Providers must be an array')
    }

    const previousSettings = this.getSettings()
    this.currentSettings.providers = [...providers]
    this.emitSettingsChange(previousSettings)
  }

  setEditorStatus(status: boolean): void {
    const previousSettings = this.getSettings()
    this.currentSettings.editorStatus = status
    this.emitSettingsChange(previousSettings)
  }

  setSystemTags(tags: string[]): void {
    const previousSettings = this.getSettings()
    this.currentSettings.systemTags = [...tags]
    this.emitSettingsChange(previousSettings)
  }

  setUserTags(tags: string[]): void {
    const previousSettings = this.getSettings()
    this.currentSettings.userTags = [...tags]
    this.emitSettingsChange(previousSettings)
  }

  setDefaultSystemMsg(message: string): void {
    const previousSettings = this.getSettings()
    this.currentSettings.defaultSystemMsg = message
    this.emitSettingsChange(previousSettings)
  }

  resetSettings(settings: PluginSettings): void {
    if (!settings) {
      throw new Error('Settings are required')
    }

    const previousSettings = this.getSettings()
    this.currentSettings = { ...settings }
    this.emitSettingsChange(previousSettings)
  }

  validateSettings(settings: PluginSettings): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

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
  }

  validateProvider(provider: ProviderSettings | undefined): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

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
  }

  getProviderMetadata(tag: string): any {
    const provider = this.getProvider(tag)
    if (!provider) {
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

    // Mock metadata based on vendor
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

    return metadataMap[provider.vendor] || {
      name: 'Unknown Provider',
      vendor: 'unknown',
      capabilities: [],
      websiteToObtainKey: '',
      defaultModel: '',
      description: 'Unknown provider',
      documentation: '',
    }
  }

  onSettingsChanged(callback: SettingsSubscription): () => void {
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

    this.listeners.add(wrapper)

    return () => {
      this.listeners.delete(wrapper)
    }
  }

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

      for (const listener of this.listeners) {
        listener(event)
      }
    } catch (error) {
      console.error('Error emitting settings change:', error)
    }
  }

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

  dispose(): void {
    this.listeners.clear()
  }
}

describe('SettingsFacade (Simplified)', () => {
  let settingsFacade: TestSettingsFacade

  beforeEach(() => {
    settingsFacade = new TestSettingsFacade(mockSettings)
  })

  afterEach(() => {
    settingsFacade.dispose()
  })

  describe('Basic Settings Access', () => {
    it('should get current settings', () => {
      const settings = settingsFacade.getSettings()
      expect(settings).toBeDefined()
      expect(settings.providers).toHaveLength(2)
      expect(settings.providers[0].tag).toBe('openai')
    })

    it('should get providers list', () => {
      const providers = settingsFacade.getProviders()
      expect(providers).toHaveLength(2)
      expect(providers[0].tag).toBe('openai')
      expect(providers[1].tag).toBe('claude')
    })

    it('should get provider by tag', () => {
      const openaiProvider = settingsFacade.getProvider('openai')
      expect(openaiProvider).toBeDefined()
      expect(openaiProvider?.tag).toBe('openai')
      expect(openaiProvider?.vendor).toBe('openai')

      const nonExistentProvider = settingsFacade.getProvider('nonexistent')
      expect(nonExistentProvider).toBeUndefined()
    })

    it('should check if provider exists', () => {
      expect(settingsFacade.hasProvider('openai')).toBe(true)
      expect(settingsFacade.hasProvider('claude')).toBe(true)
      expect(settingsFacade.hasProvider('nonexistent')).toBe(false)
    })
  })

  describe('Provider Management', () => {
    it('should add new provider', () => {
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

      settingsFacade.addProvider(newProvider)
      expect(settingsFacade.hasProvider('deepseek')).toBe(true)
      expect(settingsFacade.getProviders()).toHaveLength(3)
    })

    it('should update existing provider', () => {
      const updatedProvider: ProviderSettings = {
        tag: 'openai',
        vendor: 'openai',
        options: {
          apiKey: 'new-key',
          baseURL: 'https://api.openai.com/v1/chat/completions',
          model: 'gpt-4-turbo',
          parameters: {},
          enableWebSearch: true,
        },
      }

      settingsFacade.updateProvider('openai', updatedProvider)
      const provider = settingsFacade.getProvider('openai')
      expect(provider?.options.model).toBe('gpt-4-turbo')
      expect(provider?.options.apiKey).toBe('new-key')
      expect(provider?.options.enableWebSearch).toBe(true)
    })

    it('should remove provider', () => {
      settingsFacade.removeProvider('claude')
      expect(settingsFacade.hasProvider('claude')).toBe(false)
      expect(settingsFacade.getProviders()).toHaveLength(1)
    })

    it('should handle removing non-existent provider gracefully', () => {
      expect(() => settingsFacade.removeProvider('nonexistent')).not.toThrow()
    })

    it('should handle updating non-existent provider', () => {
      const updatedProvider: ProviderSettings = {
        tag: 'nonexistent',
        vendor: 'openai',
        options: {
          apiKey: 'test-key',
          baseURL: 'https://api.openai.com/v1/chat/completions',
          model: 'gpt-4',
          parameters: {},
          enableWebSearch: false,
        },
      }

      expect(() => settingsFacade.updateProvider('nonexistent', updatedProvider)).toThrow()
    })
  })

  describe('Settings Validation', () => {
    it('should validate settings', () => {
      const validation = settingsFacade.validateSettings(mockSettings)
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect validation errors', () => {
      const invalidSettings = {
        ...mockSettings,
        providers: [
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
        ],
      }

      const validation = settingsFacade.validateSettings(invalidSettings)
      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    it('should validate individual provider', () => {
      const provider = settingsFacade.getProvider('openai')
      const validation = settingsFacade.validateProvider(provider)
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })

  describe('Event Handling', () => {
    it('should subscribe to settings changes', () => {
      const callback = vi.fn()
      const unsubscribe = settingsFacade.onSettingsChanged(callback)

      expect(typeof unsubscribe).toBe('function')
    })

    it('should emit settings change events', () => {
      const callback = vi.fn()
      settingsFacade.onSettingsChanged(callback)

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

      settingsFacade.addProvider(newProvider)
      expect(callback).toHaveBeenCalledTimes(1)

      const event = callback.mock.calls[0][0] as SettingsChangeEvent
      expect(event.newSettings.providers).toHaveLength(3)
      expect(event.changes.providers?.length).toBeGreaterThan(0)
    })

    it('should handle subscription errors gracefully', () => {
      const faultyCallback = vi.fn(() => {
        throw new Error('Callback error')
      })

      expect(() => {
        settingsFacade.onSettingsChanged(faultyCallback)
        settingsFacade.addProvider({
          tag: 'test',
          vendor: 'openai',
          options: {
            apiKey: 'test',
            baseURL: 'test',
            model: 'test',
            parameters: {},
            enableWebSearch: false,
          },
        })
      }).not.toThrow()
    })

    it('should unsubscribe from settings changes', () => {
      const callback = vi.fn()
      const unsubscribe = settingsFacade.onSettingsChanged(callback)

      unsubscribe()

      settingsFacade.addProvider({
        tag: 'test',
        vendor: 'openai',
        options: {
          apiKey: 'test',
          baseURL: 'test',
          model: 'test',
          parameters: {},
          enableWebSearch: false,
        },
      })

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('Settings Mutations', () => {
    it('should update editor status', () => {
      settingsFacade.setEditorStatus(true)
      const settings = settingsFacade.getSettings()
      expect(settings.editorStatus).toBe(true)
    })

    it('should update system tags', () => {
      const newTags = ['system1', 'system2']
      settingsFacade.setSystemTags(newTags)
      const settings = settingsFacade.getSettings()
      expect(settings.systemTags).toEqual(newTags)
    })

    it('should update user tags', () => {
      const newTags = ['user1', 'user2']
      settingsFacade.setUserTags(newTags)
      const settings = settingsFacade.getSettings()
      expect(settings.userTags).toEqual(newTags)
    })

    it('should update default system message', () => {
      const newMessage = 'You are a helpful assistant'
      settingsFacade.setDefaultSystemMsg(newMessage)
      const settings = settingsFacade.getSettings()
      expect(settings.defaultSystemMsg).toBe(newMessage)
    })
  })

  describe('Backward Compatibility', () => {
    it('should provide access to provider metadata', () => {
      const metadata = settingsFacade.getProviderMetadata('openai')
      expect(metadata).toBeDefined()
      expect(metadata?.name).toBe('OpenAI')
      expect(metadata?.capabilities).toContain('Text Generation')
    })

    it('should provide default metadata for unknown providers', () => {
      const metadata = settingsFacade.getProviderMetadata('unknown')
      expect(metadata).toEqual({
        name: 'Unknown Provider',
        vendor: 'unknown',
        capabilities: [],
        websiteToObtainKey: '',
        defaultModel: '',
        description: 'Unknown provider',
        documentation: '',
      })
    })

    it('should maintain backward compatibility with direct settings access', () => {
      const directSettings = settingsFacade.getSettings()
      const providersViaFacade = settingsFacade.getProviders()

      expect(directSettings.providers).toHaveLength(providersViaFacade.length)
      expect(directSettings.providers[0].tag).toBe(providersViaFacade[0].tag)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid provider data gracefully', () => {
      expect(() => {
        settingsFacade.addProvider(null as any)
      }).toThrow()

      expect(() => {
        settingsFacade.updateProvider('openai', null as any)
      }).toThrow()
    })
  })

  describe('Performance', () => {
    it('should handle rapid settings changes efficiently', () => {
      const callback = vi.fn()
      settingsFacade.onSettingsChanged(callback)

      const startTime = Date.now()

      // Make rapid changes
      for (let i = 0; i < 10; i++) {
        settingsFacade.setEditorStatus(i % 2 === 0)
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete within reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100)
      expect(callback).toHaveBeenCalledTimes(10)
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle settings reset', () => {
      const originalSettings = settingsFacade.getSettings()

      // Make some changes
      settingsFacade.setEditorStatus(true)
      settingsFacade.addProvider({
        tag: 'test',
        vendor: 'openai',
        options: {
          apiKey: 'test',
          baseURL: 'test',
          model: 'test',
          parameters: {},
          enableWebSearch: false,
        },
      })

      // Reset settings
      settingsFacade.resetSettings(mockSettings)
      const resetSettings = settingsFacade.getSettings()

      expect(resetSettings.editorStatus).toBe(mockSettings.editorStatus)
      expect(resetSettings.providers).toHaveLength(mockSettings.providers.length)
    })

    it('should handle bulk provider operations', () => {
      const newProviders: ProviderSettings[] = [
        {
          tag: 'provider1',
          vendor: 'openai',
          options: {
            apiKey: 'key1',
            baseURL: 'https://api.openai.com/v1/chat/completions',
            model: 'gpt-4',
            parameters: {},
            enableWebSearch: false,
          },
        },
        {
          tag: 'provider2',
          vendor: 'claude',
          options: {
            apiKey: 'key2',
            baseURL: 'https://api.anthropic.com/v1/messages',
            model: 'claude-3-sonnet-20240229',
            parameters: {},
            enableWebSearch: false,
          },
        },
      ]

      settingsFacade.setProviders(newProviders)
      const providers = settingsFacade.getProviders()
      expect(providers).toHaveLength(2)
      expect(providers[0].tag).toBe('provider1')
      expect(providers[1].tag).toBe('provider2')
    })
  })
})