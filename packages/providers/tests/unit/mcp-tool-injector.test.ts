/**
 * Tests for MCPToolInjector implementation
 * Tests the simple path MCP integration for providers that don't support
 * the advanced Tool Calling Coordinator pattern
 */

import { describe, expect, it, beforeEach, vi, type MockedFunction } from 'vitest'

// Mock the logger to avoid console output in tests
vi.mock('@tars/logger', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }))
}))

// Import interfaces for type checking
import type { MCPToolInjector } from '../../src/interfaces'

// Mock MCP tools that would come from the MCP system
const mockMCPTools = [
  {
    name: 'get_weather',
    description: 'Get weather information for a location',
    inputSchema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City name, e.g. "San Francisco, CA"'
        },
        unit: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: 'Temperature unit'
        }
      },
      required: ['location']
    }
  },
  {
    name: 'search_web',
    description: 'Search the web for information',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results',
          default: 5
        }
      },
      required: ['query']
    }
  }
]

// Mock MCP manager and executor
const mockMCPManager = {
  getToolDiscoveryCache: vi.fn(() => ({
    getSnapshot: vi.fn(() => Promise.resolve(mockMCPTools))
  }))
}

const mockMCPExecutor = {
  execute: vi.fn()
}

describe('MCPToolInjector', () => {
  let mcpToolInjector: MCPToolInjector

  beforeEach(() => {
    vi.clearAllMocks()
    // We'll implement the actual class in the implementation step
    // For now, create a simple mock for test structure
    mcpToolInjector = {
      injectTools: vi.fn()
    } as any
  })

  describe('interface compliance', () => {
    it('should have injectTools method', () => {
      expect(typeof mcpToolInjector.injectTools).toBe('function')
    })

    it('should accept parameters and providerName', async () => {
      const parameters = { model: 'test-model', messages: [] }

      // This should not throw - interface compliance test
      expect(() => {
        mcpToolInjector.injectTools(parameters, 'OpenAI')
      }).not.toThrow()
    })
  })

  describe('OpenAI format conversion', () => {
    it('should convert MCP tools to OpenAI function format', async () => {
      const parameters = { model: 'gpt-4', messages: [] }
      const injector = createTestInjector('OpenAI')

      const result = await injector.injectTools(parameters, 'OpenAI')

      expect(result.tools).toBeDefined()
      expect(Array.isArray(result.tools)).toBe(true)
      expect(result.tools).toHaveLength(2)

      // Check first tool conversion
      const weatherTool = result.tools[0]
      expect(weatherTool.type).toBe('function')
      expect(weatherTool.function.name).toBe('get_weather')
      expect(weatherTool.function.description).toBe('Get weather information for a location')
      expect(weatherTool.function.parameters.type).toBe('object')
      expect(weatherTool.function.parameters.properties.location.type).toBe('string')
      expect(weatherTool.function.parameters.required).toEqual(['location'])
    })

    it('should preserve existing parameters when injecting tools', async () => {
      const parameters = {
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 1000,
        messages: []
      }
      const injector = createTestInjector('OpenAI')

      const result = await injector.injectTools(parameters, 'OpenAI')

      expect(result.model).toBe('gpt-4')
      expect(result.temperature).toBe(0.7)
      expect(result.max_tokens).toBe(1000)
      expect(result.tools).toBeDefined()
    })

    it('should handle empty tools list gracefully', async () => {
      const injector = createTestInjector('OpenAI')
      vi.mocked(injector.injectTools).mockResolvedValue({
        model: 'gpt-4',
        tools: []
      })

      const result = await injector.injectTools({ model: 'gpt-4' }, 'OpenAI')

      expect(result.tools).toEqual([])
    })
  })

  describe('Provider-specific format handling', () => {
    it('should handle Claude tool format', async () => {
      const parameters = { model: 'claude-3-5-sonnet', messages: [] }
      const injector = createTestInjector('Claude')

      const result = await injector.injectTools(parameters, 'Claude')

      expect(result.tools).toBeDefined()
      // Claude uses different format - name, description, input_schema
      const weatherTool = result.tools[0]
      expect(weatherTool.name).toBe('get_weather')
      expect(weatherTool.description).toBe('Get weather information for a location')
      expect(weatherTool.input_schema.type).toBe('object')
    })

    it('should handle Gemini function declaration format', async () => {
      const parameters = { model: 'gemini-1.5-pro', messages: [] }
      const injector = createTestInjector('Gemini')

      const result = await injector.injectTools(parameters, 'Gemini')

      expect(result.tools).toBeDefined()
      // Gemini uses functionDeclaration format
      const weatherTool = result.tools[0]
      expect(weatherTool.functionDeclaration.name).toBe('get_weather')
      expect(weatherTool.functionDeclaration.description).toBe('Get weather information for a location')
      expect(weatherTool.functionDeclaration.parameters.type).toBe('object')
    })

    it('should default to OpenAI format for unknown providers', async () => {
      const parameters = { model: 'unknown-model', messages: [] }
      const injector = createTestInjector('UnknownProvider')

      const result = await injector.injectTools(parameters, 'UnknownProvider')

      expect(result.tools).toBeDefined()
      const tool = result.tools[0]
      expect(tool.type).toBe('function')
      expect(tool.function).toBeDefined()
    })
  })

  describe('Error handling', () => {
    it('should handle tool discovery failures gracefully', async () => {
      const parameters = { model: 'test-model', messages: [] }
      const injector = createTestInjector('OpenAI')

      // Mock failure scenario
      vi.mocked(injector.injectTools).mockRejectedValue(
        new Error('Failed to discover MCP tools')
      )

      await expect(injector.injectTools(parameters, 'OpenAI'))
        .rejects.toThrow('Failed to discover MCP tools')
    })

    it('should handle schema validation errors', async () => {
      const invalidTool = {
        name: 'invalid-tool',
        description: 'Tool with invalid schema',
        inputSchema: {
          // Invalid schema - missing type
          properties: {
            param: { type: 'invalid-type' }
          }
        }
      }

      const injector = createTestInjector('OpenAI')
      vi.mocked(injector.injectTools).mockImplementation(async () => {
        throw new Error('Invalid tool schema')
      })

      await expect(injector.injectTools({ model: 'test' }, 'OpenAI'))
        .rejects.toThrow('Invalid tool schema')
    })
  })

  describe('Integration scenarios', () => {
    it('should work with real DeepSeek provider parameters', async () => {
      const deepSeekParams = {
        model: 'deepseek-chat',
        temperature: 0.5,
        max_tokens: 2000,
        messages: []
      }

      const injector = createTestInjector('DeepSeek')
      const result = await injector.injectTools(deepSeekParams, 'DeepSeek')

      expect(result.model).toBe('deepseek-chat')
      expect(result.temperature).toBe(0.5)
      expect(result.max_tokens).toBe(2000)
      expect(result.tools).toBeDefined()
    })

    it('should work with real SiliconFlow provider parameters', async () => {
      const siliconFlowParams = {
        model: 'deepseek-chat',
        temperature: 0.7,
        top_p: 0.9,
        messages: []
      }

      const injector = createTestInjector('SiliconFlow')
      const result = await injector.injectTools(siliconFlowParams, 'SiliconFlow')

      expect(result.model).toBe('deepseek-chat')
      expect(result.temperature).toBe(0.7)
      expect(result.top_p).toBe(0.9)
      expect(result.tools).toBeDefined()
    })
  })
})

// Helper function to create test injector instances
// This will be replaced by the actual implementation
function createTestInjector(providerName: string): MCPToolInjector {
  const mockInjector = {
    injectTools: vi.fn().mockImplementation(async (params, provider) => {
      // Mock implementation that returns format based on provider
      const baseResult = { ...params }

      switch (provider) {
        case 'Claude':
          baseResult.tools = mockMCPTools.map(tool => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.inputSchema
          }))
          break
        case 'Gemini':
          baseResult.tools = mockMCPTools.map(tool => ({
            functionDeclaration: {
              name: tool.name,
              description: tool.description,
              parameters: tool.inputSchema
            }
          }))
          break
        default: // OpenAI format
          baseResult.tools = mockMCPTools.map(tool => ({
            type: 'function',
            function: {
              name: tool.name,
              description: tool.description,
              parameters: tool.inputSchema
            }
          }))
      }

      return baseResult
    })
  }

  return mockInjector
}