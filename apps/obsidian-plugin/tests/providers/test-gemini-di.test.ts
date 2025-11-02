import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GeminiProvider } from '../../src/providers/gemini-di'
import type { PluginSettings } from '../../src/settings'

// Mock the localization
vi.mock('../../src/lang/helper', () => ({
  t: (key: string) => key,
}))

// Mock GoogleGenerativeAI with a simple implementation
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class MockGoogleGenerativeAI {
    getGenerativeModel() {
      return {
        startChat() {
          return {
            sendMessageStream: vi.fn().mockResolvedValue({
              stream: {
                [Symbol.asyncIterator]: async function* () {
                  yield { text: () => 'Hello from Gemini' }
                  yield { text: () => ' This is a test' }
                },
              },
            }),
          }
        },
      }
    }
  },
}))

describe('GeminiProvider (DI Implementation)', () => {
  let provider: GeminiProvider
  let mockSettings: PluginSettings

  beforeEach(() => {
    mockSettings = {
      providers: [
        {
          tag: 'gemini',
          vendor: 'Gemini',
          options: {
            apiKey: 'test-gemini-key',
            baseURL: 'https://generativelanguage.googleapis.com',
            model: 'gemini-1.5-flash',
            parameters: { temperature: 0.7 },
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

    provider = new GeminiProvider(mockSettings)
  })

  describe('Provider Configuration', () => {
    it('should have correct provider metadata', () => {
      expect(provider.name).toBe('Gemini')
      expect(provider.capabilities).toContain('Text Generation')
      expect(provider.capabilities).toContain('Multimodal')
      expect(provider.capabilities).toContain('Coding')
    })

    it('should return correct models list', () => {
      expect(provider.models).toContain('gemini-1.5-flash')
      expect(provider.models).toContain('gemini-1.5-pro')
      expect(provider.models).toContain('gemini-1.0-pro')
      expect(provider.models).toContain('gemini-pro-vision')
    })

    it('should return correct website URL', () => {
      expect(provider.websiteToObtainKey).toBe('https://makersuite.google.com/app/apikey')
    })

    it('should return default options from settings', () => {
      const options = provider.defaultOptions
      expect(options.apiKey).toBe('test-gemini-key')
      expect(options.baseURL).toBe('https://generativelanguage.googleapis.com')
      expect(options.model).toBe('gemini-1.5-flash')
      expect(options.parameters.temperature).toBe(0.7)
    })
  })

  describe('Message Processing', () => {
    it('should validate messages correctly', () => {
      const validMessages = [
        { role: 'user', content: 'Hello, how are you?' },
        { role: 'assistant', content: 'I am doing well, thank you!' },
      ]

      expect(() => provider.validateMessages(validMessages)).not.toThrow()
    })

    it('should reject empty messages array', () => {
      expect(() => provider.validateMessages([])).toThrow('Messages array cannot be empty')
    })

    it('should reject messages with missing role', () => {
      const invalidMessages = [{ role: '', content: 'Hello' }]

      expect(() => provider.validateMessages(invalidMessages)).toThrow('Each message must have a role and content')
    })

    it('should reject messages with missing content', () => {
      const invalidMessages = [{ role: 'user', content: '' }]

      expect(() => provider.validateMessages(invalidMessages)).toThrow('Each message must have a role and content')
    })

    it('should reject invalid message roles', () => {
      const invalidMessages = [{ role: 'invalid-role', content: 'Hello' }]

      expect(() => provider.validateMessages(invalidMessages)).toThrow('Invalid message role: invalid-role')
    })

    it('should handle system messages correctly', async () => {
      const messagesWithSystem = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello!' },
      ]

      const stream = await provider.sendRequest(messagesWithSystem)
      const chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks[0]).toBe('Hello from Gemini')
    })
  })

  describe('Stream Processing', () => {
    it('should process streaming response correctly', async () => {
      const messages = [{ role: 'user', content: 'Tell me a joke' }]

      const stream = await provider.sendRequest(messages)
      const chunks = []

      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks).toContain('Hello from Gemini')
      expect(chunks).toContain(' This is a test')
    })

    it('should handle empty messages gracefully', async () => {
      const stream = await provider.sendRequest([])
      const chunks = []

      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks.length).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should throw error when API key is missing', async () => {
      const settingsWithoutKey = {
        ...mockSettings,
        providers: [
          {
            ...mockSettings.providers[0],
            options: { ...mockSettings.providers[0].options, apiKey: '' },
          },
        ],
      }

      // Test that accessing the API key throws error from base class
      expect(() => {
        const providerWithoutKey = new GeminiProvider(settingsWithoutKey)
        // Access the apiKey property to trigger validation
        providerWithoutKey.apiKey
      }).toThrow('API key is required but not configured: Gemini')
    })

    it('should throw error for invalid model', async () => {
      const settingsWithInvalidModel = {
        ...mockSettings,
        providers: [
          {
            ...mockSettings.providers[0],
            options: { ...mockSettings.providers[0].options, model: 'invalid-model' },
          },
        ],
      }

      const providerWithInvalidModel = new GeminiProvider(settingsWithInvalidModel)
      const messages = [{ role: 'user', content: 'Hello' }]

      await expect(providerWithInvalidModel.sendRequest(messages)).rejects.toThrow(
        'Invalid Gemini model specified: invalid-model'
      )
    })
  })

  describe('Validation', () => {
    it('should validate correct configuration', () => {
      const validation = provider.validate()
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect invalid model', () => {
      const settingsWithInvalidModel = {
        ...mockSettings,
        providers: [
          {
            ...mockSettings.providers[0],
            options: { ...mockSettings.providers[0].options, model: 'invalid-gemini-model' },
          },
        ],
      }

      const providerWithInvalidModel = new GeminiProvider(settingsWithInvalidModel)
      const validation = providerWithInvalidModel.validate()

      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(error => error.includes('Invalid model'))).toBe(true)
    })

    it('should detect invalid base URL', () => {
      const settingsWithInvalidURL = {
        ...mockSettings,
        providers: [
          {
            ...mockSettings.providers[0],
            options: { ...mockSettings.providers[0].options, baseURL: 'https://invalid.url.com' },
          },
        ],
      }

      const providerWithInvalidURL = new GeminiProvider(settingsWithInvalidURL)
      const validation = providerWithInvalidURL.validate()

      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(error => error.includes('Invalid base URL for Gemini'))).toBe(true)
    })
  })

  describe('Factory Method', () => {
    it('should create provider instance using factory method', () => {
      const createdProvider = GeminiProvider.create(mockSettings)

      expect(createdProvider).toBeInstanceOf(GeminiProvider)
      expect(createdProvider.name).toBe('Gemini')
      expect(createdProvider.apiKey).toBe('test-gemini-key')
    })
  })

  describe('DI Integration', () => {
    it('should work with dependency injection', () => {
      expect(provider.apiKey).toBeDefined()
      expect(provider.baseURL).toBeDefined()
      expect(provider.model).toBeDefined()
      expect(provider.parameters).toBeDefined()
    })

    it('should have correct provider name for DI', () => {
      expect(provider.getProviderName()).toBe('Gemini')
    })
  })
})
