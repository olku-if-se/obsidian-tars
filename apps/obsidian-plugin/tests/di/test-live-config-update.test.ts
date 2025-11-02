import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { PluginSettings } from '../../src/settings'
import { Container } from '@needle-di/core'
import { SettingsChangeNotifier } from '../../src/di/settings-change-notifier'
import { ProviderRegistry } from '../../src/di/provider-registry'
import { ConfigBindingService } from '../../src/di/config-binding-service'
import { ProviderFactoryRegistry } from '../../src/di/provider-factory-impl'
import { OpenAIProvider } from '../../src/providers/openai-di'
import { ClaudeProvider } from '../../src/providers/claude-di'
import { Tokens } from '../../src/di/tokens'

describe('Live Configuration Update (Integration Test)', () => {
  let container: Container
  let notifier: SettingsChangeNotifier
  let providerRegistry: ProviderRegistry
  let mockSettings: PluginSettings

  beforeEach(() => {
    // GIVEN: A fully configured DI container with services
    mockSettings = {
      providers: [
        {
          tag: 'openai',
          vendor: 'OpenAI',
          options: {
            apiKey: 'original-openai-key',
            baseURL: 'https://api.openai.com/v1',
            model: 'gpt-4',
            parameters: { temperature: 0.7 },
          },
        },
        {
          tag: 'claude',
          vendor: 'Anthropic',
          options: {
            apiKey: 'original-claude-key',
            baseURL: 'https://api.anthropic.com',
            model: 'claude-3-5-sonnet-20241022',
            parameters: {},
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

    // Bind all services
    container.bind({
      provide: Tokens.AppSettings,
      useValue: mockSettings,
    })
    container.bind(SettingsChangeNotifier)
    container.bind(ProviderRegistry)
    container.bind(ProviderFactoryRegistry, { useValue: {
      registerFactory: () => {},
      getFactory: () => null,
      hasFactory: () => false,
      removeFactory: () => false,
      getRegisteredTags: () => [],
      createProvider: () => null,
      validateProvider: () => ({ isValid: true, errors: [] }),
      getAllMetadata: () => [],
      size: () => 0,
      isEmpty: () => true,
      listProviders: () => [],
    } as any })
    container.bind(ConfigBindingService)

    // Get service instances
    notifier = container.get(SettingsChangeNotifier)
    providerRegistry = container.get(ProviderRegistry)
    const configBindingService = container.get(ConfigBindingService)

    // Bind configuration services together
    configBindingService.bind()
  })

  afterEach(() => {
    notifier?.dispose?.()
    vi.clearAllMocks()
  })

  it('should update provider configuration in real-time', () => {
    // WHEN: OpenAI API key is changed
    const updatedSettings: PluginSettings = {
      ...mockSettings,
      providers: [
        {
          ...mockSettings.providers[0],
          options: {
            ...mockSettings.providers[0].options,
            apiKey: 'new-updated-api-key',
          },
        },
        mockSettings.providers[1],
      ],
    }

    // Notify the change
    notifier.notifySettingsChanged(updatedSettings, mockSettings)

    // THEN: New provider should use updated configuration
    const updatedProvider = providerRegistry.getProvider('openai')
    expect(updatedProvider).toBeDefined()
    expect(updatedProvider?.defaultOptions.apiKey).toBe('new-updated-api-key')

    // AND: Other provider should remain unchanged
    const unchangedProvider = providerRegistry.getProvider('claude')
    expect(unchangedProvider).toBeDefined()
    expect(unchangedProvider?.defaultOptions.apiKey).toBe('original-claude-key')
  })

  it('should handle provider addition dynamically', () => {
    // WHEN: New provider is added to settings
    const newProvider = {
      tag: 'gemini',
      vendor: 'Google',
      options: {
        apiKey: 'gemini-api-key',
        baseURL: 'https://generativelanguage.googleapis.com',
        model: 'gemini-1.5-pro',
        parameters: {},
      },
    }

    const updatedSettings: PluginSettings = {
      ...mockSettings,
      providers: [...mockSettings.providers, newProvider],
    }

    // Notify the change
    notifier.notifySettingsChanged(updatedSettings, mockSettings)

    // THEN: New provider should be available
    const geminiProvider = providerRegistry.getProvider('gemini')
    expect(geminiProvider).toBeDefined()
    expect(geminiProvider?.defaultOptions.apiKey).toBe('gemini-api-key')

    // AND: Existing providers should still work
    const openaiProvider = providerRegistry.getProvider('openai')
    expect(openaiProvider).toBeDefined()
  })

  it('should handle provider removal dynamically', () => {
    // GIVEN: Initial state has both providers
    expect(providerRegistry.getProvider('openai')).toBeDefined()
    expect(providerRegistry.getProvider('claude')).toBeDefined()

    // WHEN: Claude provider is removed
    const updatedSettings: PluginSettings = {
      ...mockSettings,
      providers: [mockSettings.providers[0]], // Keep only OpenAI
    }

    // Notify the change
    notifier.notifySettingsChanged(updatedSettings, mockSettings)

    // THEN: Removed provider should no longer be available
    expect(providerRegistry.getProvider('claude')).toBeNull()

    // AND: Remaining provider should still work
    expect(providerRegistry.getProvider('openai')).toBeDefined()
  })

  it('should propagate configuration changes to all provider instances', () => {
    // GIVEN: Multiple providers in registry
    const openaiProvider1 = providerRegistry.getProvider('openai')
    const openaiProvider2 = providerRegistry.getProvider('openai')

    expect(openaiProvider1?.defaultOptions.apiKey).toBe('original-openai-key')
    expect(openaiProvider2?.defaultOptions.apiKey).toBe('original-openai-key')

    // WHEN: Settings are changed
    const updatedSettings: PluginSettings = {
      ...mockSettings,
      providers: [
        {
          ...mockSettings.providers[0],
          options: {
            ...mockSettings.providers[0].options,
            apiKey: 'propagated-new-key',
            model: 'gpt-4-turbo',
          },
        },
        mockSettings.providers[1],
      ],
    }

    notifier.notifySettingsChanged(updatedSettings, mockSettings)

    // THEN: All instances should reflect the change
    const updatedProvider1 = providerRegistry.getProvider('openai')
    const updatedProvider2 = providerRegistry.getProvider('openai')

    expect(updatedProvider1?.defaultOptions.apiKey).toBe('propagated-new-key')
    expect(updatedProvider1?.defaultOptions.model).toBe('gpt-4-turbo')
    expect(updatedProvider2?.defaultOptions.apiKey).toBe('propagated-new-key')
    expect(updatedProvider2?.defaultOptions.model).toBe('gpt-4-turbo')
  })

  it('should maintain provider state during configuration updates', () => {
    // GIVEN: Provider with some internal state
    const provider = providerRegistry.getProvider('openai')
    expect(provider).toBeDefined()

    // Simulate some internal state (this would be provider-specific)
    const originalName = provider?.name
    const originalCapabilities = provider?.capabilities

    // WHEN: Configuration is updated
    const updatedSettings: PluginSettings = {
      ...mockSettings,
      providers: [
        {
          ...mockSettings.providers[0],
          options: {
            ...mockSettings.providers[0].options,
            apiKey: 'state-preserved-key',
          },
        },
        mockSettings.providers[1],
      ],
    }

    notifier.notifySettingsChanged(updatedSettings, mockSettings)

    // THEN: Provider identity should remain the same
    const updatedProvider = providerRegistry.getProvider('openai')
    expect(updatedProvider?.name).toBe(originalName)
    expect(updatedProvider?.capabilities).toEqual(originalCapabilities)
    expect(updatedProvider?.defaultOptions.apiKey).toBe('state-preserved-key')
  })

  it('should handle complex multi-provider configuration changes', () => {
    // WHEN: Multiple providers are changed simultaneously
    const updatedSettings: PluginSettings = {
      ...mockSettings,
      providers: [
        // OpenAI: Modified API key and model
        {
          ...mockSettings.providers[0],
          options: {
            ...mockSettings.providers[0].options,
            apiKey: 'multi-change-openai-key',
            model: 'gpt-4o',
            parameters: { temperature: 0.5, maxTokens: 4000 },
          },
        },
        // Claude: Modified base URL
        {
          ...mockSettings.providers[1],
          options: {
            ...mockSettings.providers[1].options,
            baseURL: 'https://api.anthropic.com/v2',
            model: 'claude-3-5-haiku-20241022',
          },
        },
        // New provider: Gemini added
        {
          tag: 'gemini',
          vendor: 'Google',
          options: {
            apiKey: 'multi-gemini-key',
            baseURL: 'https://generativelanguage.googleapis.com',
            model: 'gemini-1.5-flash',
            parameters: {},
          },
        },
      ],
      // Also change some plugin-level settings
      enableTagSuggest: false,
      tagSuggestMaxLineLength: 50,
    }

    notifier.notifySettingsChanged(updatedSettings, mockSettings)

    // THEN: All changes should be applied correctly
    const openaiProvider = providerRegistry.getProvider('openai')
    const claudeProvider = providerRegistry.getProvider('claude')
    const geminiProvider = providerRegistry.getProvider('gemini')

    expect(openaiProvider?.defaultOptions.apiKey).toBe('multi-change-openai-key')
    expect(openaiProvider?.defaultOptions.model).toBe('gpt-4o')
    expect(openaiProvider?.defaultOptions.parameters).toEqual({
      temperature: 0.5,
      maxTokens: 4000,
    })

    expect(claudeProvider?.defaultOptions.baseURL).toBe('https://api.anthropic.com/v2')
    expect(claudeProvider?.defaultOptions.model).toBe('claude-3-5-haiku-20241022')

    expect(geminiProvider?.defaultOptions.apiKey).toBe('multi-gemini-key')
    expect(geminiProvider?.defaultOptions.model).toBe('gemini-1.5-flash')
  })

  it('should validate configuration changes before applying', () => {
    // WHEN: Invalid configuration is attempted
    const invalidSettings: PluginSettings = {
      ...mockSettings,
      providers: [
        {
          ...mockSettings.providers[0],
          options: {
            ...mockSettings.providers[0].options,
            apiKey: '', // Empty API key should be invalid
            model: 'invalid-model-name',
          },
        },
        mockSettings.providers[1],
      ],
    }

    // THEN: Validation should prevent application of invalid changes
    // This would depend on the implementation of validation logic
    expect(() => {
      notifier.notifySettingsChanged(invalidSettings, mockSettings)
    }).not.toThrow() // Should not throw, but might emit validation error events

    // Provider should either maintain old settings or be in an error state
    const provider = providerRegistry.getProvider('openai')
    expect(provider).toBeDefined()
    // Implementation-specific validation behavior would be tested here
  })

  it('should support rollback of configuration changes', () => {
    // GIVEN: Original settings
    expect(providerRegistry.getProvider('openai')?.defaultOptions.apiKey).toBe('original-openai-key')

    // WHEN: Settings are changed
    const updatedSettings: PluginSettings = {
      ...mockSettings,
      providers: [
        {
          ...mockSettings.providers[0],
          options: {
            ...mockSettings.providers[0].options,
            apiKey: 'temporary-changed-key',
          },
        },
        mockSettings.providers[1],
      ],
    }

    notifier.notifySettingsChanged(updatedSettings, mockSettings)

    // THEN: Change should be applied
    expect(providerRegistry.getProvider('openai')?.defaultOptions.apiKey).toBe('temporary-changed-key')

    // WHEN: Settings are rolled back
    notifier.notifySettingsChanged(mockSettings, updatedSettings)

    // THEN: Original settings should be restored
    expect(providerRegistry.getProvider('openai')?.defaultOptions.apiKey).toBe('original-openai-key')
  })

  it('should emit appropriate events during configuration changes', () => {
    // GIVEN: Event listeners
    const changeEventSpy = vi.fn()
    const validationEventSpy = vi.fn()

    notifier.on('settingsChanged', changeEventSpy)
    notifier.on('validationError', validationEventSpy)

    // WHEN: Settings are changed
    const updatedSettings: PluginSettings = {
      ...mockSettings,
      providers: [
        {
          ...mockSettings.providers[0],
          options: {
            ...mockSettings.providers[0].options,
            apiKey: 'event-test-key',
          },
        },
        mockSettings.providers[1],
      ],
    }

    notifier.notifySettingsChanged(updatedSettings, mockSettings)

    // THEN: Appropriate events should be emitted
    expect(changeEventSpy).toHaveBeenCalledTimes(1)

    const changeEvent = changeEventSpy.mock.calls[0][0]
    expect(changeEvent.changes).toHaveProperty('providers')
    expect(changeEvent.changes.providers[0]).toMatchObject({
      type: 'modified',
      path: expect.stringContaining('apiKey'),
      oldValue: 'original-openai-key',
      newValue: 'event-test-key',
    })

    // Validation events would depend on implementation
  })

  it('should maintain performance during frequent configuration updates', () => {
    // GIVEN: Performance tracking
    const startTime = Date.now()

    // WHEN: Multiple rapid configuration changes occur
    for (let i = 0; i < 10; i++) {
      const updatedSettings: PluginSettings = {
        ...mockSettings,
        providers: [
          {
            ...mockSettings.providers[0],
            options: {
              ...mockSettings.providers[0].options,
              apiKey: `rapid-change-key-${i}`,
            },
          },
          mockSettings.providers[1],
        ],
      }

      notifier.notifySettingsChanged(updatedSettings, i === 0 ? mockSettings : {
        ...mockSettings,
        providers: [
          {
            ...mockSettings.providers[0],
            options: {
              ...mockSettings.providers[0].options,
              apiKey: `rapid-change-key-${i - 1}`,
            },
          },
          mockSettings.providers[1],
        ],
      })
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    // THEN: Performance should be reasonable (adjust threshold as needed)
    expect(duration).toBeLessThan(1000) // Should complete within 1 second

    // AND: Final state should be correct
    const finalProvider = providerRegistry.getProvider('openai')
    expect(finalProvider?.defaultOptions.apiKey).toBe('rapid-change-key-9')
  })
})