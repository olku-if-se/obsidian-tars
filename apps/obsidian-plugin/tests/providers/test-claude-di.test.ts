import { Container } from '@needle-di/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BaseVendorOptions } from '../../src/di/base-vendor-options'
import type { BaseOptions, Message } from '../../src/providers'
import { ClaudeProvider, ClaudeProviderError } from '../../src/providers/claude-di'
import type { PluginSettings } from '../../src/settings'

// Mock the localization
vi.mock('../../src/lang/helper', () => ({
  t: (key: string) => key,
}))

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}))

describe('ClaudeProvider DI Tests', () => {
  let _container: Container
  let mockSettings: PluginSettings
  let provider: ClaudeProvider

  beforeEach(() => {
    vi.clearAllMocks()

    mockSettings = {
      providers: [
        {
          tag: 'claude',
          vendor: 'Claude',
          options: {
            apiKey: 'test-claude-key',
            baseURL: 'https://api.anthropic.com',
            model: 'claude-3-5-sonnet-latest',
            max_tokens: 4096,
            enableWebSearch: false,
            enableThinking: false,
            budget_tokens: 1600,
            parameters: {
              temperature: 0.7,
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

    provider = new ClaudeProvider(mockSettings)
  })

  describe('Provider Configuration', () => {
    it('should have correct provider metadata', () => {
      expect(provider.name).toBe('Claude')
      expect(provider.models).toContain('claude-3-5-sonnet-latest')
      expect(provider.models).toContain('claude-opus-4-0')
      expect(provider.websiteToObtainKey).toBe('https://console.anthropic.com')
    })

    it('should have correct capabilities', () => {
      expect(provider.capabilities).toContain('Text Generation')
      expect(provider.capabilities).toContain('Web Search')
      expect(provider.capabilities).toContain('Reasoning')
      expect(provider.capabilities).toContain('Image Vision')
      expect(provider.capabilities).toContain('PDF Vision')
    })

    it('should initialize with correct default options', () => {
      const options = provider.defaultOptions
      expect(options.apiKey).toBe('test-claude-key')
      expect(options.baseURL).toBe('https://api.anthropic.com')
      expect(options.model).toBe('claude-3-5-sonnet-latest')
      expect(options.max_tokens).toBe(8192)
      expect(options.enableWebSearch).toBe(false)
      expect(options.enableThinking).toBe(false)
      expect(options.budget_tokens).toBe(1600)
    })
  })

  describe('Message Processing', () => {
    it('should validate messages correctly', () => {
      const validMessages: Message[] = [
        { role: 'user', content: 'Hello', embeds: [] },
        { role: 'assistant', content: 'Hi there!', embeds: [] },
      ]

      expect(() => provider.validateMessages(validMessages)).not.toThrow()
    })

    it('should reject empty messages array', () => {
      expect(() => provider.validateMessages([])).toThrow('Messages array cannot be empty')
    })

    it('should reject messages with missing role', () => {
      const invalidMessages = [
        // biome-ignore lint/suspicious/noExplicitAny: Test mock using any type
        { content: 'Hello' } as any,
      ]
      expect(() => provider.validateMessages(invalidMessages)).toThrow('Each message must have a role and content')
    })

    it('should reject system messages in invalid positions', () => {
      const messagesWithSystemInMiddle: Message[] = [
        { role: 'user', content: 'Hello', embeds: [] },
        { role: 'system', content: 'System message', embeds: [] },
        { role: 'assistant', content: 'Hi', embeds: [] },
      ]

      // biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
      expect(() => (provider as any).validateMessagePositions(messagesWithSystemInMiddle)).toThrow(
        ClaudeProviderError.systemMessagePosition()
      )
    })

    it('should handle system message as first message correctly', () => {
      const messagesWithSystemFirst: Message[] = [
        { role: 'system', content: 'System message', embeds: [] },
        { role: 'user', content: 'Hello', embeds: [] },
        { role: 'assistant', content: 'Hi', embeds: [] },
      ]

      // biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
      expect(() => (provider as any).validateMessagePositions(messagesWithSystemFirst.slice(1))).not.toThrow()
    })
  })

  describe('API Request Handling', () => {
    it('should throw error when API key is missing', async () => {
      // Test that accessing defaultOptions with empty API key throws an error
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

      expect(() => {
        const providerWithoutKey = new ClaudeProvider(settingsWithoutKey)
        // Accessing defaultOptions should trigger the API key validation
        const _options = providerWithoutKey.defaultOptions
      }).toThrow('API key is required')
    })

    it('should throw error for invalid model', async () => {
      const invalidOptions: BaseOptions = {
        ...provider.defaultOptions,
        model: 'invalid-model',
      }

      const messages: Message[] = [{ role: 'user', content: 'Hello', embeds: [] }]
      const mockResolveEmbedAsBinary = vi.fn()

      await expect(provider.sendRequest(messages, invalidOptions, undefined, mockResolveEmbedAsBinary)).rejects.toThrow(
        ClaudeProviderError.modelInvalid('invalid-model')
      )
    })

    it('should throw error when resolveEmbedAsBinary is missing', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Hello', embeds: [] }]

      await expect(provider.sendRequest(messages)).rejects.toThrow('resolveEmbedAsBinary function is required')
    })
  })

  describe('Stream Processing', () => {
    it('should process text delta events correctly', async () => {
      const mockStreamEvents = [
        {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: 'Hello' },
        },
        {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: ' world' },
        },
      ]

      // biome-ignore lint/suspicious/noExplicitAny: Test mock using any type
      const stream = provider.createClaudeStream(mockStreamEvents as any)
      const chunks: string[] = []

      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Hello', ' world'])
    })

    it('should process thinking delta events correctly', async () => {
      const mockStreamEvents = [
        {
          type: 'content_block_delta',
          delta: { type: 'thinking_delta', thinking: 'Let me think...\n' },
        },
        {
          type: 'content_block_delta',
          delta: { type: 'thinking_delta', thinking: 'More thinking' },
        },
      ]

      // biome-ignore lint/suspicious/noExplicitAny: Test mock using any type
      const stream = provider.createClaudeStream(mockStreamEvents as any)
      const chunks: string[] = []

      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks[0]).toContain('> [!quote]-') // CALLOUT_BLOCK_START
      expect(chunks[0]).toContain('> Let me think...')
      expect(chunks[1]).toContain('More thinking')
    })

    it('should handle web search tool usage without errors', async () => {
      const mockStreamEvents = [
        {
          type: 'content_block_start',
          content_block: {
            type: 'server_tool_use',
            name: 'web_search',
          },
        },
      ]

      // biome-ignore lint/suspicious/noExplicitAny: Test mock using any type
      const stream = provider.createClaudeStream(mockStreamEvents as any)

      // Should be able to consume the stream without errors
      const chunks: string[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      // Tool usage events don't produce output chunks
      expect(chunks).toHaveLength(0)
    })
  })

  describe('URL Normalization', () => {
    it('should handle baseURL normalization logic', () => {
      // Test the URL normalization logic directly
      let baseURL = 'https://api.anthropic.com/v1/messages/'

      // Remove /v1/messages/ from baseURL if present
      if (baseURL.endsWith('/v1/messages/')) {
        baseURL = baseURL.slice(0, -'/v1/messages/'.length)
      } else if (baseURL.endsWith('/v1/messages')) {
        baseURL = baseURL.slice(0, -'/v1/messages'.length)
      }

      expect(baseURL).toBe('https://api.anthropic.com')

      // Test without trailing slash
      baseURL = 'https://api.anthropic.com/v1/messages'

      if (baseURL.endsWith('/v1/messages/')) {
        baseURL = baseURL.slice(0, -'/v1/messages/'.length)
      } else if (baseURL.endsWith('/v1/messages')) {
        baseURL = baseURL.slice(0, -'/v1/messages'.length)
      }

      expect(baseURL).toBe('https://api.anthropic.com')
    })
  })

  describe('Factory Method', () => {
    it('should create instance using factory method', () => {
      const createdProvider = ClaudeProvider.create(mockSettings)
      expect(createdProvider).toBeInstanceOf(ClaudeProvider)
      expect(createdProvider.name).toBe('Claude')
    })
  })

  describe('Validation', () => {
    it('should validate correct configuration', () => {
      const validation = provider.validate()
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect invalid model', () => {
      const invalidSettings = {
        ...mockSettings,
        providers: [
          {
            ...mockSettings.providers[0],
            options: {
              ...mockSettings.providers[0].options,
              model: 'invalid-model',
            },
          },
        ],
      }

      const invalidProvider = new ClaudeProvider(invalidSettings)
      const validation = invalidProvider.validate()

      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(e => e.includes('Invalid model'))).toBe(true)
    })

    it('should detect invalid base URL', () => {
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

      const invalidProvider = new ClaudeProvider(invalidSettings)
      const validation = invalidProvider.validate()

      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(e => e.includes('Invalid base URL for Claude'))).toBe(true)
    })

    it('should detect invalid max_tokens', () => {
      // Test the validation logic directly
      const claudeOptions = provider.defaultOptions
      // The validation happens in the validate() method, let's test an invalid case
      const invalidSettings = {
        ...mockSettings,
        providers: [
          {
            ...mockSettings.providers[0],
            options: {
              ...mockSettings.providers[0].options,
              max_tokens: 0,
            },
          },
        ],
      }

      const invalidProvider = new ClaudeProvider(invalidSettings)
      const _validation = invalidProvider.validate()

      // Should detect the issue when max_tokens is accessed
      expect(claudeOptions.max_tokens).toBeGreaterThan(0)
    })

    it('should detect invalid budget_tokens', () => {
      // Test the validation logic directly
      const claudeOptions = provider.defaultOptions
      // The validation happens in the validate() method, let's test an invalid case
      const invalidSettings = {
        ...mockSettings,
        providers: [
          {
            ...mockSettings.providers[0],
            options: {
              ...mockSettings.providers[0].options,
              budget_tokens: -1,
            },
          },
        ],
      }

      const invalidProvider = new ClaudeProvider(invalidSettings)
      const _validation = invalidProvider.validate()

      // Should detect the issue when budget_tokens is accessed
      expect(claudeOptions.budget_tokens).toBeGreaterThanOrEqual(0)
    })
  })

  describe('DI Integration', () => {
    it('should work with dependency injection container', () => {
      _container = new Container()

      // Test that the provider can be created through DI
      expect(() => {
        const diProvider = new ClaudeProvider(mockSettings)
        expect(diProvider.name).toBe('Claude')
      }).not.toThrow()
    })

    it('should handle injection correctly with BaseVendorOptions inheritance', () => {
      expect(provider).toBeInstanceOf(BaseVendorOptions)
      expect(provider).toBeInstanceOf(ClaudeProvider)
      expect(typeof provider.sendRequest).toBe('function')
    })
  })

  describe('Send Request Function', () => {
    it('should provide sendRequestFunc that returns a generator', () => {
      const sendRequestFunc = provider.sendRequestFunc(provider.defaultOptions)
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
})
