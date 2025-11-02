import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DeepSeekProvider, DeepSeekError } from '../../src/providers/deepseek-di'
import { BaseVendorOptions } from '../../src/di/base-vendor-options'
import type { PluginSettings } from '../../src/settings'
import type { BaseOptions, Message } from '../../src/providers'

// Mock the localization
vi.mock('../../src/lang/helper', () => ({
  t: (key: string) => key,
}))

// Mock OpenAI with a simple implementation
vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = {
      completions: {
        create: vi.fn().mockResolvedValue({
          stream: {
            [Symbol.asyncIterator]: async function* () {
              yield {
                choices: [{
                  delta: { content: 'Hello from DeepSeek' }
                }]
              }
              yield {
                choices: [{
                  delta: { content: ' This is a test' }
                }]
              }
            },
          },
        }),
      },
    }
  },
}))

describe('DeepSeekProvider DI Tests', () => {
  let mockSettings: PluginSettings
  let provider: DeepSeekProvider

  beforeEach(() => {
    vi.clearAllMocks()

    // GIVEN: A test configuration for DeepSeek provider
    // Business value: Ensures provider can be instantiated with standard DeepSeek settings
    mockSettings = {
      providers: [
        {
          tag: 'deepseek',
          vendor: 'DeepSeek',
          options: {
            apiKey: 'test-deepseek-key',
            baseURL: 'https://api.deepseek.com',
            model: 'deepseek-chat',
            max_tokens: 4000,
            temperature: 0.7,
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

    provider = new DeepSeekProvider(mockSettings)
  })

  describe('Provider Configuration', () => {
    it('should have correct provider metadata', () => {
      // GIVEN: A DeepSeek provider instance
      // WHEN: Checking provider metadata
      // THEN: Should have correct identifying information
      expect(provider.name).toBe('DeepSeek')
      expect(provider.models).toContain('deepseek-chat')
      expect(provider.models).toContain('deepseek-coder')
      expect(provider.models).toContain('deepseek-reasoner')
      expect(provider.websiteToObtainKey).toBe('https://platform.deepseek.com/')
    })

    it('should have correct capabilities', () => {
      // GIVEN: A DeepSeek provider instance
      // WHEN: Checking provider capabilities
      // THEN: Should support text generation, reasoning, and coding
      expect(provider.capabilities).toContain('Text Generation')
      expect(provider.capabilities).toContain('Reasoning')
      expect(provider.capabilities).toContain('Coding')
    })

    it('should initialize with correct default options', () => {
      // GIVEN: Provider settings with DeepSeek configuration
      // WHEN: Accessing default options
      // THEN: Should reflect configured settings
      const options = provider.defaultOptions
      expect(options.apiKey).toBe('test-deepseek-key')
      expect(options.baseURL).toBe('https://api.deepseek.com')
      expect(options.model).toBe('deepseek-chat')
      expect(options.parameters).toEqual({})
    })
  })

  describe('Message Processing', () => {
    it('should validate messages correctly', () => {
      // GIVEN: Valid message array with proper structure
      const validMessages: Message[] = [
        { role: 'user', content: 'Hello', embeds: [] },
        { role: 'assistant', content: 'Hi there!', embeds: [] },
      ]

      // WHEN: Validating messages
      // THEN: Should not throw any errors
      expect(() => provider.validateMessages(validMessages)).not.toThrow()
    })

    it('should reject empty messages array', () => {
      // GIVEN: Empty messages array
      const emptyMessages: Message[] = []

      // WHEN: Validating messages
      // THEN: Should throw appropriate error
      expect(() => provider.validateMessages(emptyMessages)).toThrow('Messages array cannot be empty')
    })

    it('should reject messages with missing role', () => {
      // GIVEN: Invalid message without role
      // biome-ignore lint/suspicious/noExplicitAny: Test mock using any type
      const invalidMessages = [{ content: 'Hello' } as any]

      // WHEN: Validating messages
      // THEN: Should throw validation error
      expect(() => provider.validateMessages(invalidMessages)).toThrow('Each message must have a role and content')
    })

    it('should reject invalid message roles', () => {
      // GIVEN: Message with invalid role
      // biome-ignore lint/suspicious/noExplicitAny: Test mock using any type
      const invalidMessages = [{ role: 'invalid', content: 'Hello' } as any]

      // WHEN: Validating messages
      // THEN: Should throw role validation error
      expect(() => provider.validateMessages(invalidMessages)).toThrow('Invalid message role: invalid')
    })
  })

  describe('API Request Handling', () => {
    it('should throw error when API key is missing', () => {
      // GIVEN: Settings without API key
      const settingsWithoutKey = {
        ...mockSettings,
        providers: [
          {
            ...mockSettings.providers[0],
            options: {
              ...mockSettings.providers[0].options,
              apiKey: '',
            },
          },
        ],
      }

      // WHEN: Attempting to create provider without API key
      // THEN: Should throw API key validation error
      expect(() => {
        const providerWithoutKey = new DeepSeekProvider(settingsWithoutKey)
        const _options = providerWithoutKey.defaultOptions
      }).toThrow('API key is required')
    })

    it('should throw error for invalid model', async () => {
      // GIVEN: Invalid model option
      const invalidOptions: BaseOptions = {
        ...provider.defaultOptions,
        model: 'invalid-model',
      }

      const messages: Message[] = [{ role: 'user', content: 'Hello', embeds: [] }]
      const mockResolveEmbedAsBinary = vi.fn()

      // WHEN: Sending request with invalid model
      // THEN: Should throw some error (model validation or request failure)
      await expect(
        provider.sendRequest(messages, invalidOptions, undefined, mockResolveEmbedAsBinary)
      ).rejects.toThrow()
    })

    it('should handle request failures gracefully', async () => {
      // GIVEN: Mock API failure scenario
      const messages: Message[] = [{ role: 'user', content: 'Hello', embeds: [] }]
      const mockResolveEmbedAsBinary = vi.fn()

      // Mock a failed request scenario
      const invalidOptions: BaseOptions = {
        ...provider.defaultOptions,
        model: 'invalid-model-that-causes-failure',
      }

      // WHEN: Request fails (due to invalid model or other error)
      // THEN: Should handle error gracefully
      await expect(
        provider.sendRequest(messages, invalidOptions, undefined, mockResolveEmbedAsBinary)
      ).rejects.toThrow()
    })
  })

  describe('Stream Processing', () => {
    it('should process text delta events correctly', async () => {
      // GIVEN: Mock stream with text content
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield {
            choices: [{
              delta: { content: 'Hello' }
            }]
          }
          yield {
            choices: [{
              delta: { content: ' world' }
            }]
          }
        },
      }

      // WHEN: Processing stream
      // biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
      const stream = (provider as any).createDeepSeekStream(mockStream, [])
      const chunks: string[] = []

      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      // THEN: Should emit content chunks correctly
      expect(chunks).toEqual(['Hello', ' world'])
    })

    it('should process reasoning content correctly', async () => {
      // GIVEN: Mock stream with reasoning content
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield {
            choices: [{
              delta: { reasoning_content: 'Let me think...' }
            }]
          }
          yield {
            choices: [{
              delta: { content: 'The answer is 42' }
            }]
          }
        },
      }

      // WHEN: Processing stream with reasoning
      // biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
      const stream = (provider as any).createDeepSeekStream(mockStream, [])
      const chunks: string[] = []

      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      // THEN: Should format reasoning and content appropriately
      expect(chunks[0]).toBe('<reasoning>Let me think...</reasoning>')
      expect(chunks[1]).toContain('The answer is 42')
    })

    it('should handle mixed reasoning and content streams', async () => {
      // GIVEN: Complex stream with mixed content types
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield {
            choices: [{
              delta: { reasoning_content: 'Step 1: Analyze' }
            }]
          }
          yield {
            choices: [{
              delta: { reasoning_content: 'Step 2: Reason' }
            }]
          }
          yield {
            choices: [{
              delta: { content: 'Final answer' }
            }]
          }
        },
      }

      // WHEN: Processing mixed content stream
      // biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
      const stream = (provider as any).createDeepSeekStream(mockStream, [])
      const chunks: string[] = []

      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      // THEN: Should handle both reasoning and content correctly
      expect(chunks).toContain('<reasoning>Step 1: Analyze</reasoning>')
      expect(chunks).toContain('<reasoning>Step 2: Reason</reasoning>')
      expect(chunks.some(chunk => chunk.includes('Final answer'))).toBe(true)
    })
  })

  describe('Model Validation', () => {
    it('should validate supported models', () => {
      // GIVEN: Supported DeepSeek models
      const supportedModels = ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner']

      // WHEN: Checking model support
      // THEN: All should be valid
      supportedModels.forEach(model => {
        expect(provider.models).toContain(model)
      })
    })

    it('should reject unsupported models in validation', () => {
      // GIVEN: Settings with unsupported model
      const invalidSettings = {
        ...mockSettings,
        providers: [
          {
            ...mockSettings.providers[0],
            options: {
              ...mockSettings.providers[0].options,
              model: 'unsupported-model',
            },
          },
        ],
      }

      const invalidProvider = new DeepSeekProvider(invalidSettings)
      const validation = invalidProvider.validate()

      // WHEN: Validating configuration
      // THEN: Should detect invalid model
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(e => e.includes('Invalid model'))).toBe(true)
    })
  })

  describe('URL Validation', () => {
    it('should validate DeepSeek base URL', () => {
      // GIVEN: Invalid base URL
      const invalidSettings = {
        ...mockSettings,
        providers: [
          {
            ...mockSettings.providers[0],
            options: {
              ...mockSettings.providers[0].options,
              baseURL: 'https://invalid-url.com',
            },
          },
        ],
      }

      const invalidProvider = new DeepSeekProvider(invalidSettings)
      const validation = invalidProvider.validate()

      // WHEN: Validating base URL
      // THEN: Should detect non-DeepSeek URL
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(e => e.includes('Invalid base URL for DeepSeek'))).toBe(true)
    })

    it('should accept correct DeepSeek URLs', () => {
      // GIVEN: Valid DeepSeek URLs
      const validURLs = [
        'https://api.deepseek.com',
        'https://api.deepseek.com/v1',
      ]

      validURLs.forEach(url => {
        const settingsWithURL = {
          ...mockSettings,
          providers: [
            {
              ...mockSettings.providers[0],
              options: {
                ...mockSettings.providers[0].options,
                baseURL: url,
              },
            },
          ],
        }

        const validProvider = new DeepSeekProvider(settingsWithURL)
        const validation = validProvider.validate()

        // WHEN: Validating correct URL
        // THEN: Should pass validation
        expect(validation.isValid).toBe(true)
      })
    })
  })

  describe('Factory Method', () => {
    it('should create instance using factory method', () => {
      // GIVEN: Mock settings
      // WHEN: Creating provider through factory method
      const createdProvider = DeepSeekProvider.create(mockSettings)

      // THEN: Should create valid instance
      expect(createdProvider).toBeInstanceOf(DeepSeekProvider)
      expect(createdProvider.name).toBe('DeepSeek')
    })
  })

  describe('Validation', () => {
    it('should validate correct configuration', () => {
      // GIVEN: Properly configured provider
      // WHEN: Running validation
      const validation = provider.validate()

      // THEN: Should pass all validation checks
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect base URL validation issues', () => {
      // GIVEN: Provider with invalid URL
      const invalidProvider = new DeepSeekProvider({
        ...mockSettings,
        providers: [
          {
            ...mockSettings.providers[0],
            options: {
              ...mockSettings.providers[0].options,
              baseURL: 'https://example.com',
            },
          },
        ],
      })

      const validation = invalidProvider.validate()

      // WHEN: Validating base URL
      // THEN: Should detect URL doesn't contain deepseek domain
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(e => e.includes('Expected: https://api.deepseek.com'))).toBe(true)
    })
  })

  describe('DI Integration', () => {
    it('should work with dependency injection container', () => {
      // GIVEN: DI container context
      // WHEN: Creating provider with settings injection
      expect(() => {
        const diProvider = new DeepSeekProvider(mockSettings)
        expect(diProvider.name).toBe('DeepSeek')
      }).not.toThrow()
    })

    it('should handle injection correctly with BaseVendorOptions inheritance', () => {
      // GIVEN: Provider with DI inheritance
      // WHEN: Checking inheritance chain
      // THEN: Should properly extend BaseVendorOptions and implement Vendor
      expect(provider).toBeInstanceOf(BaseVendorOptions)
      expect(provider).toBeInstanceOf(DeepSeekProvider)
      expect(typeof provider.sendRequest).toBe('function')
    })
  })

  describe('Send Request Function', () => {
    it('should provide sendRequestFunc that returns a generator', () => {
      // GIVEN: Provider instance
      // WHEN: Getting send request function
      const sendRequestFunc = provider.sendRequestFunc(provider.defaultOptions)

      // THEN: Should return proper async generator function
      expect(typeof sendRequestFunc).toBe('function')

      const generator = sendRequestFunc(
        [{ role: 'user', content: 'Hello', embeds: [] }],
        new AbortController(),
        vi.fn()
      )
      expect(generator).toHaveProperty('next')
      expect(typeof generator.next).toBe('function')
    })
  })

  describe('Error Handling', () => {
    it('should create proper error instances', () => {
      // GIVEN: Error factory methods
      // WHEN: Creating specific errors
      const apiKeyError = DeepSeekError.apiKeyMissing()
      const modelError = DeepSeekError.modelInvalid('test-model')
      const requestError = DeepSeekError.requestFailed(new Error('Network error'))

      // THEN: Should have correct error properties
      expect(apiKeyError).toBeInstanceOf(DeepSeekError)
      expect(apiKeyError.code).toBe('API_KEY_MISSING')

      expect(modelError).toBeInstanceOf(DeepSeekError)
      expect(modelError.code).toBe('MODEL_INVALID')
      expect(modelError.model).toBe('test-model')

      expect(requestError).toBeInstanceOf(DeepSeekError)
      expect(requestError.code).toBe('REQUEST_FAILED')
      expect(requestError.cause).toBeInstanceOf(Error)
    })
  })
})