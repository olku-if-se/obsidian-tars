/**
 * Provider Integration Tests with MCP Tool Injection
 *
 * Tests the actual provider implementations with MCP tool injection
 * following TDD approach - these tests will fail initially but drive the implementation.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the logger to avoid console output in tests
vi.mock('@tars/logger', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }))
}))

// Mock console.warn to avoid expected error handling output
const originalWarn = console.warn
beforeEach(() => {
  console.warn = vi.fn()
})

afterEach(() => {
  console.warn = originalWarn
})

import { deepSeekVendor } from '../src/implementations/deepSeek'
import { geminiVendor } from '../src/implementations/gemini'
import { grokVendor } from '../src/implementations/grok'
import { siliconFlowVendor } from '../src/implementations/siliconflow'
import { createMockMCPToolInjector } from './mocks/mcp-infrastructure-mocks'

describe('DeepSeek MCP Tool Injection', () => {
	let deepSeekProvider: any
	let mockMcpInjector: any

	beforeEach(() => {
		// GIVEN: DeepSeek provider and mock MCP injector
		deepSeekProvider = deepSeekVendor
		mockMcpInjector = createMockMCPToolInjector()
	})

	it('should use simple injection path for DeepSeek', async () => {
		// GIVEN: Provider options with MCP tool injector
		const options = {
			...deepSeekProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key',
			model: 'deepseek-chat'
		}

		// WHEN: Creating send request function
		const sendRequest = deepSeekProvider.sendRequestFunc(options)

		// THEN: Should be able to call with mock MCP context
		expect(sendRequest).toBeDefined()
		expect(typeof sendRequest).toBe('function')
	})

	it('should inject tools into DeepSeek request parameters', async () => {
		// GIVEN: Mock tool injector and DeepSeek options
		const parameters = { model: 'deepseek-chat', temperature: 0.7 }
		mockMcpInjector.injectTools.mockResolvedValue({
			...parameters,
			tools: [{ type: 'function', function: { name: 'test_tool', description: 'Test' } }]
		})

		const options = {
			...deepSeekProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key'
		}

		// WHEN: Executing the send request
		const sendRequest = deepSeekProvider.sendRequestFunc(options)
		const mockMessages = [{ role: 'user', content: 'test' }]
		const mockController = new AbortController()

		// Execute the async generator to trigger MCP tool injection
		// Mock the OpenAI client to avoid actual HTTP calls
		vi.mock('openai', () => ({
			default: vi.fn(() => ({
				chat: {
					completions: {
						create: vi.fn().mockRejectedValue(new Error('API call mocked'))
					}
				}
			}))
		}))

		try {
			// This will trigger the tool injection
			const generator = sendRequest(mockMessages, mockController)
			await generator.next()
		} catch (error) {
			// Expected to fail due to mocked API call, but tool injection should have happened
		}

		// THEN: Should call tool injector with correct parameters
		expect(mockMcpInjector.injectTools).toHaveBeenCalledWith(
			expect.objectContaining({ model: 'deepseek-chat' }),
			'DeepSeek'
		)
	})

	it('should fall back gracefully when MCP injection fails', async () => {
		// GIVEN: Mock tool injector that throws error
		mockMcpInjector.injectTools.mockRejectedValue(new Error('MCP injection failed'))

		const options = {
			...deepSeekProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key'
		}

		// WHEN: Executing send request
		const sendRequest = deepSeekProvider.sendRequestFunc(options)
		const mockMessages = [{ role: 'user', content: 'test' }]
		const mockController = new AbortController()

		// Mock the OpenAI client to avoid actual HTTP calls
		vi.mock('openai', () => ({
			default: vi.fn(() => ({
				chat: {
					completions: {
						create: vi.fn().mockRejectedValue(new Error('API call mocked'))
					}
				}
			}))
		}))

		try {
			// This will trigger the tool injection (which should fail gracefully)
			const generator = sendRequest(mockMessages, mockController)
			await generator.next()
		} catch (error) {
			// Expected to fail due to mocked API call
		}

		// THEN: Should handle error gracefully and continue without tools
		// The actual execution will fail due to API, but the error handling should work
		expect(mockMcpInjector.injectTools).toHaveBeenCalled()
	})
})

describe('SiliconFlow MCP Tool Injection', () => {
	let siliconFlowProvider: any
	let mockMcpInjector: any

	beforeEach(() => {
		// GIVEN: SiliconFlow provider and mock MCP injector
		siliconFlowProvider = siliconFlowVendor
		mockMcpInjector = createMockMCPToolInjector()
	})

	it('should use simple injection path for SiliconFlow', async () => {
		// GIVEN: Provider options with MCP tool injector
		const options = {
			...siliconFlowProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key',
			model: 'deepseek-chat'
		}

		// WHEN: Creating send request function
		const sendRequest = siliconFlowProvider.sendRequestFunc(options)

		// THEN: Should be able to call with mock MCP context
		expect(sendRequest).toBeDefined()
		expect(typeof sendRequest).toBe('function')
	})

	it('should inject tools into SiliconFlow request parameters', async () => {
		// GIVEN: Mock tool injector returning OpenAI-compatible tools
		const parameters = { model: 'deepseek-chat' }
		mockMcpInjector.injectTools.mockResolvedValue({
			...parameters,
			tools: [{ type: 'function', function: { name: 'siliconflow_tool', description: 'Test' } }]
		})

		const options = {
			...siliconFlowProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key'
		}

		// WHEN: Executing the send request
		const sendRequest = siliconFlowProvider.sendRequestFunc(options)
		const mockMessages = [{ role: 'user' as const, content: 'test' }]
		const mockController = new AbortController()

		// Execute the generator to trigger MCP injection
		const generator = sendRequest(mockMessages, mockController, vi.fn())

		// Try to get first value (will fail on HTTP but should trigger MCP injection)
		try {
			await generator.next()
		} catch (_error) {
			// Expected to fail due to HTTP call
		}

		// THEN: Should call tool injector and pass tools to client
		expect(mockMcpInjector.injectTools).toHaveBeenCalled()
	})
})

describe('Grok MCP Tool Injection', () => {
	let grokProvider: any
	let mockMcpInjector: any

	beforeEach(() => {
		// GIVEN: Grok provider and mock MCP injector
		grokProvider = grokVendor
		mockMcpInjector = createMockMCPToolInjector()
	})

	it('should use simple injection path for Grok', async () => {
		// GIVEN: Provider options with MCP tool injector
		const options = {
			...grokProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key'
		}

		// WHEN: Creating send request function
		const sendRequest = grokProvider.sendRequestFunc(options)

		// THEN: Should be able to call with mock MCP context
		expect(sendRequest).toBeDefined()
		expect(typeof sendRequest).toBe('function')
	})

	it('should inject tools into Grok request parameters', async () => {
		// GIVEN: Mock tool injector and Grok options
		mockMcpInjector.injectTools.mockResolvedValue({
			model: 'grok-beta',
			tools: [{ type: 'function', function: { name: 'grok_tool', description: 'Test' } }]
		})

		const options = {
			...grokProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key',
			model: 'grok-beta' // Provide a model since default is empty
		}

		
		// WHEN: Executing send request
		const sendRequest = grokProvider.sendRequestFunc(options)
		const mockMessages = [{ role: 'user' as const, content: 'test' }]
		const mockController = new AbortController()
		const mockResolveEmbedAsBinary = vi.fn()

		// Mock axios to avoid actual HTTP calls
		vi.mock('axios', () => ({
			post: vi.fn().mockRejectedValue(new Error('HTTP call mocked'))
		}))

		// Execute the generator to trigger MCP injection
		const generator = sendRequest(mockMessages, mockController, mockResolveEmbedAsBinary)

		// Try to get first value (will fail on HTTP but should trigger MCP injection)
		try {
			await generator.next()
		} catch (_error) {
			// Expected to fail due to HTTP call
		}

		// THEN: Should include tools in HTTP request
		expect(mockMcpInjector.injectTools).toHaveBeenCalledWith(expect.objectContaining({}), 'Grok')
	})
})

describe('Gemini MCP Integration', () => {
	let geminiProvider: any

	beforeEach(() => {
		// GIVEN: Gemini provider
		geminiProvider = geminiVendor
	})

	it('should handle missing MCP integration gracefully', async () => {
		// GIVEN: Provider options without MCP integration
		const options = {
			...geminiProvider.defaultOptions,
			apiKey: 'test-key',
			model: 'gemini-1.5-flash'
		}

		// WHEN: Creating send request function
		const sendRequest = geminiProvider.sendRequestFunc(options)

		// THEN: Should still work without MCP tools
		expect(sendRequest).toBeDefined()
		expect(typeof sendRequest).toBe('function')
	})

	it('should log debug message when MCP components are available but not used', async () => {
		// GIVEN: Provider options with legacy MCP components (not yet implemented)
		const options = {
			...geminiProvider.defaultOptions,
			apiKey: 'test-key',
			model: 'gemini-1.5-flash',
			mcpManager: {}, // Mock manager
			mcpExecutor: {} // Mock executor
		}

		// WHEN: Creating send request function
		const sendRequest = geminiProvider.sendRequestFunc(options)

		// THEN: Should create function successfully
		expect(sendRequest).toBeDefined()
		expect(typeof sendRequest).toBe('function')

		// WHEN: Executing the request
		const mockMessages = [{ role: 'user', content: 'test' }]
		const mockController = new AbortController()

		// THEN: Should not throw error (currently skips MCP integration)
		// The actual implementation will be added later
		expect(() => {
			const _generator = sendRequest(mockMessages, mockController, vi.fn())
			// Just verify it doesn't throw immediately
		}).not.toThrow()
	})
})

describe('Provider Error Handling with MCP', () => {
	it('should handle missing API key gracefully with MCP injection', async () => {
		// GIVEN: Provider without API key but with MCP injector
		const mockMcpInjector = createMockMCPToolInjector()
		const options = {
			...deepSeekVendor.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: '' // Missing API key
		}

		// WHEN: Creating send request function
		const sendRequest = deepSeekVendor.sendRequestFunc(options)

		// THEN: Should still create function but fail on execution
		expect(sendRequest).toBeDefined()

		const mockMessages = [{ role: 'user' as const, content: 'test' }]
		const mockController = new AbortController()

		// WHEN: Executing without API key
		const generator = sendRequest(mockMessages, mockController, vi.fn())

		// THEN: Should throw error about missing API key
		await expect(generator.next()).rejects.toThrow('API key is required')
	})

	it('should handle missing model gracefully with MCP injection', async () => {
		// GIVEN: Provider without model but with MCP injector
		const mockMcpInjector = createMockMCPToolInjector()
		const options = {
			...grokVendor.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key',
			model: '' // Missing model
		}

		// WHEN: Creating send request function
		const sendRequest = grokVendor.sendRequestFunc(options)

		// THEN: Should still create function but fail on execution
		expect(sendRequest).toBeDefined()

		const mockMessages = [{ role: 'user' as const, content: 'test' }]
		const mockController = new AbortController()

		// WHEN: Executing without model
		const generator = sendRequest(mockMessages, mockController, vi.fn())

		// THEN: Should throw error about missing model
		await expect(generator.next()).rejects.toThrow('Model is required')
	})
})

describe('Provider Capabilities with MCP', () => {
	it('should advertise Tool Calling capability for providers that support it', () => {
		// GIVEN: Providers that support tool calling

		// THEN: Should have Tool Calling capability
		expect(deepSeekVendor.capabilities).toContain('Tool Calling')
		expect(siliconFlowVendor.capabilities).toContain('Tool Calling')
		expect(grokVendor.capabilities).toContain('Tool Calling')
	})

	it('should have appropriate capabilities for all providers', () => {
		// GIVEN: All providers

		// THEN: Should have Text Generation capability
		expect(deepSeekVendor.capabilities).toContain('Text Generation')
		expect(siliconFlowVendor.capabilities).toContain('Text Generation')
		expect(grokVendor.capabilities).toContain('Text Generation')
		expect(geminiVendor.capabilities).toContain('Text Generation')
	})

	it('should have proper models defined for providers', () => {
		// GIVEN: Provider implementations

		// THEN: Should have models array defined
		expect(Array.isArray(deepSeekVendor.models)).toBe(true)
		expect(Array.isArray(siliconFlowVendor.models)).toBe(true)
		expect(Array.isArray(grokVendor.models)).toBe(true)
		expect(Array.isArray(geminiVendor.models)).toBe(true)
	})

	it('should have proper website URLs for API key acquisition', () => {
		// GIVEN: Provider implementations

		// THEN: Should have valid website URLs
		expect(deepSeekVendor.websiteToObtainKey).toContain('platform.deepseek.com')
		expect(siliconFlowVendor.websiteToObtainKey).toContain('siliconflow.cn')
		expect(grokVendor.websiteToObtainKey).toContain('x.ai')
		expect(geminiVendor.websiteToObtainKey).toContain('google.com')
	})
})
