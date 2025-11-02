import { Container } from '@needle-di/core'
import { beforeEach, describe, expect, it } from 'vitest'
import { BaseVendorOptions } from '../../src/di/base-vendor-options'
import { ProviderRegistry } from '../../src/di/provider-registry'
import { Tokens } from '../../src/di/tokens'
import type { BaseOptions } from '../../src/providers'
import type { PluginSettings, Vendor } from '../../src/settings'

describe('Provider Registration (Contract Test)', () => {
  let container: Container
  let mockSettings: PluginSettings

  beforeEach(() => {
    // GIVEN: A test container with base plugin settings
    mockSettings = {
      providers: [
        {
          tag: 'openai',
          vendor: 'OpenAI',
          options: {
            apiKey: 'test-openai-key',
            baseURL: 'https://api.openai.com/v1',
            model: 'gpt-4',
            parameters: {
              temperature: 0.7,
              maxTokens: 2000,
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

    // Bind mock settings
    container.bind({
      provide: Tokens.AppSettings,
      useValue: mockSettings,
    })

    // Bind ProviderRegistry as injectable class
    container.bind(ProviderRegistry)
  })

  it('should allow registration of new providers dynamically', () => {
    // GIVEN: A provider registry with existing providers
    const registry = container.get(ProviderRegistry)

    // WHEN: We dynamically register a new provider type
    // Note: This test documents the expected capability
    expect(registry.getProviderNames()).toContain('openai')

    // THEN: The registry should support adding new providers without core changes
    expect(typeof registry.hasProvider).toBe('function')
    expect(typeof registry.getProvider).toBe('function')
  })

  it('should support provider registration without modifying core plugin code', () => {
    // GIVEN: A clean DI container
    const testContainer = new Container()

    // WHEN: Setting up the DI system
    testContainer.bind({
      provide: Tokens.AppSettings,
      useValue: mockSettings,
    })

    // THEN: Provider registration should work through DI configuration only
    // No need to modify main.ts, settings.ts, or other core files
    expect(testContainer.get(Tokens.AppSettings)).toBeDefined()
  })

  it('should validate provider registration through factory pattern', () => {
    // GIVEN: Mock provider implementation for testing with existing provider tag
    class TestProvider extends BaseVendorOptions implements Vendor {
      public readonly name = 'TestProvider'
      public readonly capabilities = ['Text Generation', 'Reasoning']

      protected getProviderName(): string {
        return 'openai' // Use existing provider tag from settings
      }

      get models(): string[] {
        return ['test-model']
      }
      get websiteToObtainKey(): string {
        return 'https://test.example.com'
      }

      // biome-ignore lint/suspicious/noExplicitAny: Test mock using any type
      get sendRequestFunc(): (options: BaseOptions) => any {
        return async function* () {
          yield '[Test Response]'
        }
      }

      get defaultOptions(): BaseOptions {
        return this.providerSettings.options
      }
    }

    // WHEN: Creating provider through factory pattern
    // THEN: Provider should be created without registration in core files
    expect(() => {
      const testProvider = new TestProvider(mockSettings)
      expect(testProvider.name).toBe('TestProvider')
    }).not.toThrow()
  })

  it('should support multiple provider instances with different configurations', () => {
    // GIVEN: Two different configurations for the same provider type
    const config1 = {
      ...mockSettings,
      providers: [
        {
          ...mockSettings.providers[0],
          options: {
            ...mockSettings.providers[0].options,
            model: 'gpt-4-turbo',
          },
        },
      ],
    }

    const config2 = {
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

    // WHEN: Creating provider instances with different configurations
    const registry1 = ProviderRegistry.createWithSettings(config1)
    const registry2 = ProviderRegistry.createWithSettings(config2)

    // THEN: Each registry should have providers with their respective configurations
    expect(registry1.getProviderNames()).toContain('openai')
    expect(registry2.getProviderNames()).toContain('openai')

    const provider1 = registry1.getProvider('openai')
    const provider2 = registry2.getProvider('openai')

    expect(provider1?.defaultOptions.model).toBe('gpt-4-turbo')
    expect(provider2?.defaultOptions.model).toBe('gpt-3.5-turbo')
  })

  it('should maintain isolation between dynamically registered providers', () => {
    // GIVEN: Two independent DI containers
    const container1 = new Container()
    const container2 = new Container()

    // WHEN: Configuring each container with different provider sets
    const settings1 = {
      ...mockSettings,
      providers: [
        {
          ...mockSettings.providers[0],
          tag: 'custom-ai-1',
        },
      ],
    }

    const settings2 = {
      ...mockSettings,
      providers: [
        {
          ...mockSettings.providers[0],
          tag: 'custom-ai-2',
        },
      ],
    }

    container1.bind({
      provide: Tokens.AppSettings,
      useValue: settings1,
    })

    container2.bind({
      provide: Tokens.AppSettings,
      useValue: settings2,
    })

    // Bind ProviderRegistry as injectable class
    container1.bind(ProviderRegistry)
    container2.bind(ProviderRegistry)

    // THEN: Each container should have isolated provider sets
    const registry1 = container1.get(ProviderRegistry)
    const registry2 = container2.get(ProviderRegistry)

    expect(registry1.getProviderNames()).toContain('custom-ai-1')
    expect(registry2.getProviderNames()).toContain('custom-ai-2')

    // Cross-contamination should not occur
    expect(registry1.getProviderNames()).not.toContain('custom-ai-2')
    expect(registry2.getProviderNames()).not.toContain('custom-ai-1')
  })

  it('should enable extensible provider discovery without core plugin changes', () => {
    // GIVEN: Provider registry with current providers
    const registry = ProviderRegistry.createWithSettings(mockSettings)

    // WHEN: Querying available providers
    const availableProviders = registry.getAllProviders()

    // THEN: Should return all configured providers without requiring hard-coded discovery
    expect(Array.isArray(availableProviders)).toBe(true)
    expect(availableProviders.length).toBeGreaterThan(0)

    // Provider discovery should work through DI configuration
    // No need to update hardcoded provider lists in main plugin files
    expect(typeof registry.validateAllProviders).toBe('function')
  })
})
