import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SettingsFacade } from '../../src/di/settings-facade'
import { setupDIContainer, disposeDIContainer, getDIContainer } from '../../src/di/setup'

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

// Define interfaces to avoid importing from DI types
interface SettingsChangeEvent {
  newSettings: PluginSettings
  previousSettings: PluginSettings
  changes: any
  timestamp: number
  changeId: string
}

type SettingsSubscription = (event: SettingsChangeEvent) => void

// Mock Obsidian App
const mockApp = {
  vault: {},
  workspace: {},
}

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

describe('SettingsFacade', () => {
  let settingsFacade: SettingsFacade

  beforeEach(async () => {
    // Setup DI container
    await setupDIContainer(mockApp, mockSettings)
    settingsFacade = new SettingsFacade()
  })

  afterEach(async () => {
    await disposeDIContainer()
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

    it('should handle updating non-existent provider gracefully', () => {
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

      expect(() => settingsFacade.updateProvider('nonexistent', updatedProvider)).not.toThrow()
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
      const validation = settingsFacade.validateProvider(provider!)
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

    it('should handle subscription cleanup errors', () => {
      const callback = vi.fn()
      const unsubscribe = settingsFacade.onSettingsChanged(callback)

      // Mock error during unsubscribe
      const originalRemoveListener = settingsFacade.removeAllListeners
      settingsFacade.removeAllListeners = vi.fn().mockImplementation(() => {
        throw new Error('Remove listener error')
      })

      expect(() => unsubscribe()).not.toThrow()

      // Restore original method
      settingsFacade.removeAllListeners = originalRemoveListener
    })

    it('should handle validation with null settings', () => {
      expect(() => {
        settingsFacade.validateSettings(null as any)
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

    it('should batch provider updates when possible', () => {
      const callback = vi.fn()
      settingsFacade.onSettingsChanged(callback)

      // Add multiple providers rapidly
      for (let i = 0; i < 3; i++) {
        settingsFacade.addProvider({
          tag: `provider-${i}`,
          vendor: 'openai',
          options: {
            apiKey: `key-${i}`,
            baseURL: 'https://api.openai.com/v1/chat/completions',
            model: 'gpt-4',
            parameters: {},
            enableWebSearch: false,
          },
        })
      }

      expect(callback).toHaveBeenCalledTimes(3)
    })
  })

  describe('DI Integration', () => {
    it('should integrate with DI container', () => {
      const container = getDIContainer()
      expect(container).toBeDefined()

      // Facade should work independently of DI container
      const settings = settingsFacade.getSettings()
      expect(settings).toBeDefined()
    })

    it('should handle DI container disposal', async () => {
      const settingsBefore = settingsFacade.getSettings()

      await disposeDIContainer()

      // Facade should still work with cached settings
      const settingsAfter = settingsFacade.getSettings()
      expect(settingsAfter).toEqual(settingsBefore)
    })

    it('should reinitialize with new DI container', async () => {
      await disposeDIContainer()
      await setupDIContainer(mockApp, mockSettings)

      const newFacade = new SettingsFacade()
      const settings = newFacade.getSettings()
      expect(settings.providers).toHaveLength(2)
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

    it('should handle concurrent settings access', async () => {
      const promises = Array.from({ length: 10 }, () =>
        Promise.resolve(settingsFacade.getSettings())
      )

      const results = await Promise.all(promises)
      expect(results).toHaveLength(10)

      // All results should be identical
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toEqual(results[0])
      }
    })
  })
})