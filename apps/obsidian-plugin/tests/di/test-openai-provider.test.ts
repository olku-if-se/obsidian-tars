import { Container } from '@needle-di/core'
import { beforeEach, describe, expect, it } from 'vitest'
import { ProviderRegistry } from '../../src/di/provider-registry'
import { Tokens } from '../../src/di/tokens'
import { OpenAIProvider } from '../../src/providers/openai-di'
import type { PluginSettings } from '../../src/settings'

describe('OpenAI Provider Injection (Contract Test)', () => {
  let container: Container
  let mockSettings: PluginSettings

  beforeEach(() => {
    // GIVEN: A test container with mock OpenAI settings
    mockSettings = {
      providers: [
        {
          tag: 'openai',
          vendor: 'OpenAI',
          options: {
            apiKey: 'test-openai-api-key',
            baseURL: 'https://api.openai.com/v1',
            model: 'gpt-3.5-turbo',
            parameters: {
              temperature: 0.7,
              maxTokens: 1000,
            },
          },
        },
      ],
      editorStatus: { isTextInserting: false },
      systemTags: ['#System:'],
      newChatTags: ['#NewChat:'],
      userTags: ['#User:'],
      roleEmojis: { assistant: '🤖', system: '⚙️', newChat: '💬', user: '👤' },
      promptTemplates: [],
      enableInternalLink: true,
      enableInternalLinkForAssistantMsg: true,
      confirmRegenerate: false,
      enableTagSuggest: true,
      tagSuggestMaxLineLength: 30,
      answerDelayInMilliseconds: 0,
      enableExportToJSONL: false,
      enableReplaceTag: true,
      enableDefaultSystemMsg: true,
      defaultSystemMsg: 'You are a helpful assistant.',
      enableStreamLog: false,
    }

    container = new Container()

    // Bind mock settings and providers
    container.bind({
      provide: Tokens.AppSettings,
      useValue: mockSettings,
    })

    container.bind(ProviderRegistry)
  })

  it('should create OpenAI provider directly with settings', () => {
    // WHEN: We create an OpenAI provider with mock settings
    // THEN: It should create successfully and access the settings
    expect(() => {
      const provider = OpenAIProvider.createWithSettings(mockSettings)
      expect(provider).toBeDefined()
      expect(provider.name).toBe('OpenAI')
      expect(provider.apiKey).toBe('test-openai-api-key')
      expect(provider.model).toBe('gpt-3.5-turbo')
      expect(provider.baseURL).toBe('https://api.openai.com/v1')
    }).not.toThrow()
  })

  it('should create provider registry from factory', () => {
    // WHEN: We create the provider registry using the factory method
    // THEN: It should be able to access settings and list providers
    const registry = ProviderRegistry.createWithSettings(mockSettings)
    expect(registry).toBeDefined()
    expect(registry.getProviderNames()).toContain('openai')
  })

  it('should validate provider through registry', () => {
    // WHEN: We validate the OpenAI provider through the registry
    // THEN: It should pass validation
    const registry = ProviderRegistry.createWithSettings(mockSettings)
    const validation = registry.validateProvider('openai')

    expect(validation.isValid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })

  it('should handle missing provider gracefully', () => {
    // WHEN: We try to get a provider that doesn't exist
    // THEN: It should return null instead of throwing
    const registry = ProviderRegistry.createWithSettings(mockSettings)
    const provider = registry.getProvider('nonexistent')
    expect(provider).toBeNull()
  })

  it('should validate mock settings structure', () => {
    // WHEN: We validate the mock settings structure
    // THEN: Settings should have required OpenAI configuration
    expect(mockSettings.providers).toBeDefined()
    expect(mockSettings.providers).toHaveLength(1)
    expect(mockSettings.providers[0].tag).toBe('openai')
    expect(mockSettings.providers[0].vendor).toBe('OpenAI')
    expect(mockSettings.providers[0].options.apiKey).toBe('test-openai-api-key')
    expect(mockSettings.providers[0].options.baseURL).toBe('https://api.openai.com/v1')
    expect(mockSettings.providers[0].options.model).toBe('gpt-3.5-turbo')
  })

  it('should demonstrate DI pattern for provider isolation', () => {
    // GIVEN: Two different settings configurations
    const settings1 = {
      ...mockSettings,
      providers: [
        {
          ...mockSettings.providers[0],
          options: {
            ...mockSettings.providers[0].options,
            model: 'gpt-4',
          },
        },
      ],
    }

    const settings2 = {
      ...mockSettings,
      providers: [
        {
          ...mockSettings.providers[0],
          options: {
            ...mockSettings.providers[0].options,
            model: 'gpt-3.5-turbo',
          },
        },
      ],
    }

    // WHEN: Creating providers with different settings
    const provider1 = OpenAIProvider.createWithSettings(settings1)
    const provider2 = OpenAIProvider.createWithSettings(settings2)

    // THEN: Each provider should use its own isolated settings
    expect(provider1.model).toBe('gpt-4')
    expect(provider2.model).toBe('gpt-3.5-turbo')
  })
})
