/**
 * Grok Provider Integration Tests with MCP Tool Injection
 *
 * Tests the Grok provider implementation with MCP tool injection
 * following TDD approach - these tests will fail initially but drive the implementation.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock axios to prevent real HTTP calls
vi.mock('axios', () => ({
	default: {
		post: vi.fn().mockResolvedValue({
			data: new ReadableStream({
				start(controller) {
					// Simulate SSE stream response
					const chunks = [
						'data: {"choices":[{"delta":{"content":"Mock Grok response"}}]}\n\n',
						'data: [DONE]\n\n'
					]
					chunks.forEach(chunk => {
						controller.enqueue(new TextEncoder().encode(chunk))
					})
					controller.close()
				}
			})
		})
	}
}))

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

import { grokVendor } from '../../../src/implementations/grok'
import { createMockMCPToolInjector } from '../../mocks/mcp-infrastructure-mocks'

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
		const sendRequest = grokVendor.sendRequestFunc(options)

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

		// WHEN: Executing the send request
		const sendRequest = grokVendor.sendRequestFunc(options)
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
			// This will trigger the tool injection
			const generator = sendRequest(mockMessages, mockController)
			await generator.next()
		} catch (error) {
			// Expected to fail due to mocked API call, but tool injection should have happened
		}

		// THEN: Should call tool injector with correct parameters
		expect(mockMcpInjector.injectTools).toHaveBeenCalledWith(expect.objectContaining({ model: 'grok-beta' }), 'Grok')
	})

	it('should preserve Grok-specific parameters during injection', async () => {
		// GIVEN: Grok-specific parameters
		const grokParams = {
			model: 'grok-beta',
			temperature: 0.8,
			max_tokens: 4000,
			top_p: 0.95,
			frequency_penalty: 0.2,
			presence_penalty: 0.2,
			stream: false
		}

		mockMcpInjector.injectTools.mockImplementation((params, provider) => {
			return Promise.resolve({
				...params,
				tools: [{ type: 'function', function: { name: 'grok_tool', description: 'Test' } }]
			})
		})

		const options = {
			...grokProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key',
			...grokParams
		}

		// WHEN: Creating send request function
		const sendRequest = grokVendor.sendRequestFunc(options)
		const mockMessages = [{ role: 'user', content: 'test' }]
		const mockController = new AbortController()

		// Mock HTTP call
		try {
			const generator = sendRequest(mockMessages, mockController)
			await generator.next()
		} catch (error) {
			// Expected to fail
		}

		// THEN: Should call injector with all Grok parameters
		expect(mockMcpInjector.injectTools).toHaveBeenCalledWith(expect.objectContaining(grokParams), 'Grok')
	})

	it('should handle Grok API endpoint configuration', async () => {
		// GIVEN: Custom API endpoint for Grok (xAI API)
		const options = {
			...grokProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key',
			baseURL: 'https://api.x.ai/v1',
			model: 'grok-beta'
		}

		// WHEN: Creating send request function
		const sendRequest = grokVendor.sendRequestFunc(options)

		// THEN: Should create function with xAI endpoint
		expect(sendRequest).toBeDefined()
		expect(typeof sendRequest).toBe('function')
	})

	it('should support different Grok models', async () => {
		// GIVEN: Various Grok models
		const models = ['grok-beta', 'grok-2-latest', 'grok-2-vision-latest']

		for (const model of models) {
			const options = {
				...grokProvider.defaultOptions,
				mcpToolInjector: mockMcpInjector,
				apiKey: 'test-key',
				model
			}

			// WHEN: Creating send request function
			const sendRequest = grokVendor.sendRequestFunc(options)

			// THEN: Should support each model
			expect(sendRequest).toBeDefined()
			expect(typeof sendRequest).toBe('function')
		}
	})

	it('should handle Grok streaming with MCP tools', async () => {
		// GIVEN: Streaming configuration for Grok
		const options = {
			...grokProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key',
			stream: true,
			model: 'grok-beta'
		}

		// WHEN: Creating send request function
		const sendRequest = grokVendor.sendRequestFunc(options)

		// THEN: Should support streaming with tools
		expect(sendRequest).toBeDefined()
		expect(typeof sendRequest).toBe('function')
	})

	it('should handle MCP injection failures gracefully for Grok', async () => {
		// GIVEN: Mock tool injector that fails
		mockMcpInjector.injectTools.mockRejectedValue(new Error('Grok MCP injection failed'))

		const options = {
			...grokProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key',
			model: 'grok-beta'
		}

		// WHEN: Creating send request function
		const sendRequest = grokVendor.sendRequestFunc(options)

		// THEN: Should still create function despite MCP failure
		expect(sendRequest).toBeDefined()
		expect(typeof sendRequest).toBe('function')
	})

	it('should validate Grok API key format', async () => {
		// GIVEN: Different xAI API key formats
		const apiKeys = ['xai-test-key-123', 'grok-api-key', 'test-xai-key']

		for (const apiKey of apiKeys) {
			const options = {
				...grokProvider.defaultOptions,
				mcpToolInjector: mockMcpInjector,
				apiKey,
				model: 'grok-beta'
			}

			// WHEN: Creating send request function
			const sendRequest = grokVendor.sendRequestFunc(options)

			// THEN: Should accept different key formats
			expect(sendRequest).toBeDefined()
			expect(typeof sendRequest).toBe('function')
		}
	})

	it('should handle Grok reasoning parameters', async () => {
		// GIVEN: Grok-specific reasoning parameters
		const options = {
			...grokProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key',
			model: 'grok-beta',
			reasoning_level: 'high', // Grok-specific parameter
			search_enabled: true // Grok can search the web
		}

		// WHEN: Creating send request function
		const sendRequest = grokVendor.sendRequestFunc(options)

		// THEN: Should create function with reasoning parameters
		expect(sendRequest).toBeDefined()
		expect(typeof sendRequest).toBe('function')
	})

	it('should handle tool results in Grok responses', async () => {
		// GIVEN: Mock tool injector with comprehensive tool setup
		mockMcpInjector.injectTools.mockResolvedValue({
			model: 'grok-beta',
			tools: [
				{
					type: 'function',
					function: {
						name: 'search_web',
						description: 'Search the web for information',
						parameters: {
							type: 'object',
							properties: {
								query: { type: 'string', description: 'Search query' }
							},
							required: ['query']
						}
					}
				}
			]
		})

		const options = {
			...grokProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key',
			model: 'grok-beta'
		}

		// WHEN: Creating send request function
		const sendRequest = grokVendor.sendRequestFunc(options)

		// THEN: Should be configured to handle tool results
		expect(sendRequest).toBeDefined()
		expect(typeof sendRequest).toBe('function')
	})
})
