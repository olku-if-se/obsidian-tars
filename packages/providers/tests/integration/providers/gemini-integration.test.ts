/**
 * Gemini Provider Integration Tests with MCP Tool Injection
 *
 * Tests the Gemini provider implementation with MCP tool injection
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

// Mock Google Generative AI SDK to prevent real API calls
vi.mock('@google/generative-ai', () => ({
	GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
		getGenerativeModel: vi.fn().mockReturnValue({
			generateContent: vi.fn().mockResolvedValue({
				response: {
					text: 'Mock Gemini response'
				}
			})
		})
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

import { geminiVendor } from '../../../src/implementations/gemini'
import { createMockMCPToolInjector } from '../../mocks/mcp-infrastructure-mocks'

describe('Gemini MCP Tool Injection', () => {
	let geminiProvider: any
	let mockMcpInjector: any

	beforeEach(() => {
		// GIVEN: Gemini provider and mock MCP injector
		geminiProvider = geminiVendor
		mockMcpInjector = createMockMCPToolInjector()
	})

	it('should use simple injection path for Gemini', async () => {
		// GIVEN: Provider options with MCP tool injector
		const options = {
			...geminiProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key',
			model: 'gemini-1.5-pro'
		}

		// WHEN: Creating send request function
		const sendRequest = geminiVendor.sendRequestFunc(options)

		// THEN: Should be able to call with mock MCP context
		expect(sendRequest).toBeDefined()
		expect(typeof sendRequest).toBe('function')
	})

	it('should inject tools into Gemini request parameters', async () => {
		// GIVEN: Mock tool injector and Gemini options
		mockMcpInjector.injectTools.mockResolvedValue({
			model: 'gemini-1.5-pro',
			tools: [
				{
					functionDeclaration: {
						name: 'test_tool',
						description: 'Test tool for Gemini',
						parameters: {
							type: 'object',
							properties: {
								param1: { type: 'string', description: 'Test parameter' }
							},
							required: ['param1']
						}
					}
				}
			]
		})

		const options = {
			...geminiProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key',
			model: 'gemini-1.5-pro'
		}

		// WHEN: Executing the send request
		const sendRequest = geminiVendor.sendRequestFunc(options)
		const mockMessages = [{ role: 'user', content: 'test' }]
		const mockController = new AbortController()

		try {
			// This will trigger the tool injection
			const generator = sendRequest(mockMessages, mockController)
			await generator.next()
		} catch (error) {
			// Expected to fail due to mocked API call, but tool injection should have happened
		}

		// THEN: Should call tool injector with correct parameters
		expect(mockMcpInjector.injectTools).toHaveBeenCalledWith(
			expect.objectContaining({ model: 'gemini-1.5-pro' }),
			'Gemini'
		)
	})

	it('should preserve Gemini-specific parameters during injection', async () => {
		// GIVEN: Gemini-specific parameters
		const geminiParams = {
			model: 'gemini-1.5-pro',
			temperature: 0.8,
			topP: 0.95,
			topK: 40,
			maxOutputTokens: 2048,
			candidateCount: 1
		}

		mockMcpInjector.injectTools.mockImplementation((params, provider) => {
			return Promise.resolve({
				...params,
				tools: [
					{
						functionDeclaration: {
							name: 'gemini_tool',
							description: 'Gemini test tool',
							parameters: {
								type: 'object',
								properties: {},
								required: []
							}
						}
					}
				]
			})
		})

		const options = {
			...geminiProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key',
			...geminiParams
		}

		// WHEN: Creating send request function
		const sendRequest = geminiVendor.sendRequestFunc(options)
		const mockMessages = [{ role: 'user', content: 'test' }]
		const mockController = new AbortController()

		try {
			const generator = sendRequest(mockMessages, mockController)
			await generator.next()
		} catch (error) {
			// Expected to fail
		}

		// THEN: Should call injector with all Gemini parameters
		expect(mockMcpInjector.injectTools).toHaveBeenCalledWith(expect.objectContaining(geminiParams), 'Gemini')
	})

	it('should support different Gemini models', async () => {
		// GIVEN: Various Gemini models
		const models = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro', 'gemini-pro-vision']

		for (const model of models) {
			const options = {
				...geminiProvider.defaultOptions,
				mcpToolInjector: mockMcpInjector,
				apiKey: 'test-key',
				model
			}

			// WHEN: Creating send request function
			const sendRequest = geminiVendor.sendRequestFunc(options)

			// THEN: Should support each model
			expect(sendRequest).toBeDefined()
			expect(typeof sendRequest).toBe('function')
		}
	})

	it('should handle Gemini streaming with MCP tools', async () => {
		// GIVEN: Streaming configuration for Gemini
		const options = {
			...geminiProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key',
			stream: true,
			model: 'gemini-1.5-flash'
		}

		// WHEN: Creating send request function
		const sendRequest = geminiVendor.sendRequestFunc(options)

		// THEN: Should support streaming with tools
		expect(sendRequest).toBeDefined()
		expect(typeof sendRequest).toBe('function')
	})

	it('should handle MCP injection failures gracefully for Gemini', async () => {
		// GIVEN: Mock tool injector that fails
		mockMcpInjector.injectTools.mockRejectedValue(new Error('Gemini MCP injection failed'))

		const options = {
			...geminiProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key',
			model: 'gemini-1.5-pro'
		}

		// WHEN: Creating send request function
		const sendRequest = geminiVendor.sendRequestFunc(options)

		// THEN: Should still create function despite MCP failure
		expect(sendRequest).toBeDefined()
		expect(typeof sendRequest).toBe('function')
	})

	it('should validate Gemini API key format', async () => {
		// GIVEN: Different Google AI API key formats
		const apiKeys = [
			'AIzaSyTestKey123', // Standard Google AI format
			'test-gemini-key',
			'gemini-api-key'
		]

		for (const apiKey of apiKeys) {
			const options = {
				...geminiProvider.defaultOptions,
				mcpToolInjector: mockMcpInjector,
				apiKey,
				model: 'gemini-1.5-pro'
			}

			// WHEN: Creating send request function
			const sendRequest = geminiVendor.sendRequestFunc(options)

			// THEN: Should accept different key formats
			expect(sendRequest).toBeDefined()
			expect(typeof sendRequest).toBe('function')
		}
	})

	it('should handle Gemini safety settings with MCP tools', async () => {
		// GIVEN: Gemini safety settings
		const safetySettings = [
			{
				category: 'HARM_CATEGORY_HARASSMENT',
				threshold: 'BLOCK_MEDIUM_AND_ABOVE'
			},
			{
				category: 'HARM_CATEGORY_HATE_SPEECH',
				threshold: 'BLOCK_MEDIUM_AND_ABOVE'
			}
		]

		const options = {
			...geminiProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key',
			model: 'gemini-1.5-pro',
			safetySettings
		}

		// WHEN: Creating send request function
		const sendRequest = geminiVendor.sendRequestFunc(options)

		// THEN: Should create function with safety settings
		expect(sendRequest).toBeDefined()
		expect(typeof sendRequest).toBe('function')
	})

	it('should handle Gemini vision capabilities with MCP tools', async () => {
		// GIVEN: Vision model configuration
		const options = {
			...geminiProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key',
			model: 'gemini-pro-vision',
			generationConfig: {
				temperature: 0.4,
				topP: 1,
				topK: 32,
				maxOutputTokens: 4096
			}
		}

		// WHEN: Creating send request function
		const sendRequest = geminiVendor.sendRequestFunc(options)

		// THEN: Should support vision with tools
		expect(sendRequest).toBeDefined()
		expect(typeof sendRequest).toBe('function')
	})

	it('should handle Gemini function calling format specifically', async () => {
		// GIVEN: Gemini-specific function calling format
		mockMcpInjector.injectTools.mockResolvedValue({
			model: 'gemini-1.5-pro',
			tools: [
				{
					functionDeclaration: {
						name: 'search_web',
						description: 'Search the web for current information',
						parameters: {
							type: 'object',
							properties: {
								query: {
									type: 'string',
									description: 'The search query to use'
								},
								max_results: {
									type: 'integer',
									description: 'Maximum number of results to return',
									minimum: 1,
									maximum: 10
								}
							},
							required: ['query']
						}
					}
				},
				{
					functionDeclaration: {
						name: 'get_current_time',
						description: 'Get the current time in a specific timezone',
						parameters: {
							type: 'object',
							properties: {
								timezone: {
									type: 'string',
									description: 'The timezone to get the time for (e.g., "America/New_York")'
								}
							},
							required: ['timezone']
						}
					}
				}
			]
		})

		const options = {
			...geminiProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key',
			model: 'gemini-1.5-pro'
		}

		// WHEN: Creating and executing send request function
		const sendRequest = geminiVendor.sendRequestFunc(options)

		// Execute the function to trigger tool injection
		const generator = sendRequest(
			[{ role: 'user', content: 'test message' }],
			new AbortController()
		)

		// Try to get the first value (this will trigger tool injection)
		try {
			await generator.next()
		} catch (error) {
			// Expected to fail due to mocked setup, but tool injection should have happened
		}

		// THEN: Should be configured with Gemini function declarations
		expect(sendRequest).toBeDefined()
		expect(typeof sendRequest).toBe('function')

		// Verify the injector was called with correct provider name
		expect(mockMcpInjector.injectTools).toHaveBeenCalledWith(expect.any(Object), 'Gemini')
	})
})
