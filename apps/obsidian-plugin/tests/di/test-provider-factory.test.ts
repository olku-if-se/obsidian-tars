import { Container } from '@needle-di/core'
import { beforeEach, describe, expect, it } from 'vitest'
import { BaseVendorOptions } from '../../src/di/base-vendor-options'
import { ProviderRegistry } from '../../src/di/provider-registry'
import { Tokens } from '../../src/di/tokens'
import type { BaseOptions } from '../../src/providers'
import type { PluginSettings, Vendor } from '../../src/settings'

describe('Provider Factory (Contract Test)', () => {
  let container: Container
  let mockSettings: PluginSettings

  beforeEach(() => {
    // GIVEN: A test container with comprehensive provider settings
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
        {
          tag: 'claude',
          vendor: 'Claude',
          options: {
            apiKey: 'test-claude-key',
            baseURL: 'https://api.anthropic.com',
            model: 'claude-3-sonnet-20241022',
            parameters: {
              temperature: 0.8,
              maxTokens: 4000,
            },
          },
        },
        {
          tag: 'custom-test',
          vendor: 'CustomTest',
          options: {
            apiKey: 'test-custom-key',
            baseURL: 'https://custom.example.com',
            model: 'custom-model',
            parameters: {},
          },
        },
        {
          tag: 'provider1',
          vendor: 'Provider1',
          options: {
            apiKey: 'test-provider1-key',
            baseURL: 'https://provider1.example.com',
            model: 'provider1-model',
            parameters: {},
          },
        },
        {
          tag: 'provider2',
          vendor: 'Provider2',
          options: {
            apiKey: 'test-provider2-key',
            baseURL: 'https://provider2.example.com',
            model: 'provider2-model',
            parameters: {},
          },
        },
        {
          tag: 'configurable',
          vendor: 'Configurable',
          options: {
            apiKey: 'test-configurable-key',
            baseURL: 'https://configurable.example.com',
            model: 'configurable-model',
            parameters: {},
          },
        },
        {
          tag: 'customai',
          vendor: 'CustomAI',
          options: {
            apiKey: 'test-customai-key',
            baseURL: 'https://customai.example.com',
            model: 'customai-model',
            parameters: {},
          },
        },
        {
          tag: 'factory-a',
          vendor: 'FactoryA',
          options: {
            apiKey: 'test-factory-a-key',
            baseURL: 'https://factorya.example.com',
            model: 'factory-a-model',
            parameters: {},
          },
        },
        {
          tag: 'factory-b',
          vendor: 'FactoryB',
          options: {
            apiKey: 'test-factory-b-key',
            baseURL: 'https://factoryb.example.com',
            model: 'factory-b-model',
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

    container.bind({
      provide: Tokens.AppSettings,
      useValue: mockSettings,
    })

    const registry = ProviderRegistry.create(mockSettings)
    container.bind(ProviderRegistry, { useValue: registry })
  })

  it('should create providers through factory pattern without code changes', () => {
    // GIVEN: A test provider class
    class CustomTestProvider extends BaseVendorOptions implements Vendor {
      public readonly name = 'CustomTestProvider'
      public readonly capabilities = ['Text Generation', 'Custom Capability']

      protected getProviderName(): string {
        return 'custom-test'
      }

      get models(): string[] {
        return ['custom-model-v1', 'custom-model-v2']
      }
      get websiteToObtainKey(): string {
        return 'https://custom.example.com/api-keys'
      }

      // biome-ignore lint/suspicious/noExplicitAny: Test mock using any type
      get sendRequestFunc(): (options: BaseOptions) => any {
        return async function* () {
          yield '[Custom Provider Response]'
        }
      }

      get defaultOptions(): BaseOptions {
        return this.providerSettings.options
      }
    }

    // WHEN: Creating provider through factory method
    expect(() => {
      const customProvider = new CustomTestProvider(mockSettings)

      // THEN: Provider should be fully configured with settings
      expect(customProvider.name).toBe('CustomTestProvider')
      expect(customProvider.apiKey).toBe('test-custom-key') // From providerSettings
      expect(customProvider.models).toContain('custom-model-v1')
    }).not.toThrow()
  })

  it('should support multiple provider instances from same factory', () => {
    // GIVEN: A reusable provider factory
    const createProvider = (_settings: PluginSettings, vendorName: string) => {
      return class DynamicProvider extends BaseVendorOptions implements Vendor {
        public readonly name = vendorName
        public readonly capabilities = ['Text Generation', 'Reasoning']

        protected getProviderName(): string {
          return vendorName.toLowerCase()
        }

        get models(): string[] {
          return ['model-v1', 'model-v2']
        }
        get websiteToObtainKey(): string {
          return 'https://example.com'
        }

        // biome-ignore lint/suspicious/noExplicitAny: Test mock using any type
        get sendRequestFunc(): (options: BaseOptions) => any {
          return async function* () {
            yield `[${vendorName} Response]`
          }
        }

        get defaultOptions(): BaseOptions {
          return this.providerSettings.options
        }
      }
    }

    // WHEN: Creating multiple providers from same factory
    const Provider1Class = createProvider(mockSettings, 'Provider1')
    const Provider2Class = createProvider(mockSettings, 'Provider2')

    const provider1 = new Provider1Class(mockSettings)
    const provider2 = new Provider2Class(mockSettings)

    // THEN: Each provider should be independently configured
    expect(provider1.name).toBe('Provider1')
    expect(provider2.name).toBe('Provider2')
    expect(provider1).not.toBe(provider2)
  })

  it('should enable provider configuration through factory parameters', () => {
    // GIVEN: A factory that accepts configuration parameters
    const createConfigurableProvider = (
      _baseSettings: PluginSettings,
      config: { modelName: string; capability: string }
    ) => {
      return class ConfigurableProvider extends BaseVendorOptions implements Vendor {
        public readonly name = `Configurable-${config.modelName}`
        public readonly capabilities = [config.capability, 'Text Generation']

        protected getProviderName(): string {
          return 'configurable'
        }

        get models(): string[] {
          return [config.modelName]
        }
        get websiteToObtainKey(): string {
          return 'https://configurable.example.com'
        }

        // biome-ignore lint/suspicious/noExplicitAny: Test mock using any type
        get sendRequestFunc(): (options: BaseOptions) => any {
          return async function* () {
            yield `[${config.capability} Response from ${config.modelName}]`
          }
        }

        get defaultOptions(): BaseOptions {
          return {
            ...this.providerSettings.options,
            model: config.modelName,
          }
        }
      }
    }

    // WHEN: Creating providers with different configurations
    const FastProviderClass = createConfigurableProvider(mockSettings, {
      modelName: 'fast-model',
      capability: 'Speed',
    })

    const AccurateProviderClass = createConfigurableProvider(mockSettings, {
      modelName: 'accurate-model',
      capability: 'Accuracy',
    })

    const fastProvider = new FastProviderClass(mockSettings)
    const accurateProvider = new AccurateProviderClass(mockSettings)

    // THEN: Each provider should reflect its unique configuration
    expect(fastProvider.name).toBe('Configurable-fast-model')
    expect(fastProvider.capabilities).toContain('Speed')
    expect(fastProvider.models).toContain('fast-model')

    expect(accurateProvider.name).toBe('Configurable-accurate-model')
    expect(accurateProvider.capabilities).toContain('Accuracy')
    expect(accurateProvider.models).toContain('accurate-model')
  })

  it('should support provider registration without requiring core plugin modifications', () => {
    // GIVEN: A factory-based provider registration system
    const providerFactory = {
      createProvider: (vendorName: string, settings: PluginSettings) => {
        // Factory function that creates providers dynamically
        return new (class extends BaseVendorOptions implements Vendor {
          public readonly name = vendorName
          public readonly capabilities = ['Text Generation']

          protected getProviderName(): string {
            return vendorName.toLowerCase()
          }

          get models(): string[] {
            return [`${vendorName}-model-v1`]
          }
          get websiteToObtainKey(): string {
            return 'https://api.example.com'
          }

          // biome-ignore lint/suspicious/noExplicitAny: Test mock using any type
          get sendRequestFunc(): (options: BaseOptions) => any {
            return async function* () {
              yield `[${vendorName} AI Response]`
            }
          }

          get defaultOptions(): BaseOptions {
            return this.providerSettings.options
          }
        })(settings)
      },
    }

    // WHEN: Registering new providers through factory
    expect(() => {
      const customProvider = providerFactory.createProvider('CustomAI', mockSettings)

      // THEN: Provider should be functional without core code changes
      expect(customProvider.name).toBe('CustomAI')
      expect(customProvider.getProviderName()).toBe('customai')
    }).not.toThrow()
  })

  it('should maintain factory isolation and independence', () => {
    // GIVEN: Two independent provider factories
    const factoryA = {
      create: () =>
        class FactoryAProvider extends BaseVendorOptions implements Vendor {
          public readonly name = 'FactoryA-Provider'
          public readonly capabilities = ['FactoryA Capability']

          protected getProviderName(): string {
            return 'factory-a'
          }

          get models(): string[] {
            return ['factory-a-model']
          }
          get websiteToObtainKey(): string {
            return 'https://factorya.example.com'
          }

          // biome-ignore lint/suspicious/noExplicitAny: Test mock using any type
          get sendRequestFunc(): (options: BaseOptions) => any {
            return async function* () {
              yield '[FactoryA Response]'
            }
          }

          get defaultOptions(): BaseOptions {
            return this.providerSettings.options
          }
        },
    }

    const factoryB = {
      create: () =>
        class FactoryBProvider extends BaseVendorOptions implements Vendor {
          public readonly name = 'FactoryB-Provider'
          public readonly capabilities = ['FactoryB Capability']

          protected getProviderName(): string {
            return 'factory-b'
          }

          get models(): string[] {
            return ['factory-b-model']
          }
          get websiteToObtainKey(): string {
            return 'https://factoryb.example.com'
          }

          // biome-ignore lint/suspicious/noExplicitAny: Test mock using any type
          get sendRequestFunc(): (options: BaseOptions) => any {
            return async function* () {
              yield '[FactoryB Response]'
            }
          }

          get defaultOptions(): BaseOptions {
            return this.providerSettings.options
          }
        },
    }

    // WHEN: Creating providers from different factories
    const providerA = factoryA.create()
    const providerB = factoryB.create()

    const instanceA = new providerA(mockSettings)
    const instanceB = new providerB(mockSettings)

    // THEN: Providers should be completely independent
    expect(instanceA.name).toBe('FactoryA-Provider')
    expect(instanceB.name).toBe('FactoryB-Provider')
    expect(instanceA.capabilities).toContain('FactoryA Capability')
    expect(instanceB.capabilities).toContain('FactoryB Capability')

    // Cross-contamination should not occur
    expect(instanceA.capabilities).not.toContain('FactoryB Capability')
    expect(instanceB.capabilities).not.toContain('FactoryA Capability')
  })
})
