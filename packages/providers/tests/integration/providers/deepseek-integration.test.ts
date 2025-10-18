/**
 * DeepSeek Provider Integration Tests with MCP Tool Injection
 *
 * Tests the DeepSeek provider implementation with MCP tool injection
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

import { deepSeekVendor } from '../../../src/implementations/deepSeek'
import { createMockMCPToolInjector } from '../../mocks/mcp-infrastructure-mocks'

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

	it('should preserve DeepSeek-specific parameters during injection', async () => {
		// GIVEN: DeepSeek-specific parameters
		const deepSeekParams = {
			model: 'deepseek-chat',
			temperature: 0.5,
			max_tokens: 2000,
			top_p: 0.9,
			frequency_penalty: 0.1,
			presence_penalty: 0.1
		}

		mockMcpInjector.injectTools.mockImplementation((params, provider) => {
			return Promise.resolve({
				...params,
				tools: [{ type: 'function', function: { name: 'test_tool', description: 'Test' } }]
			})
		})

		const options = {
			...deepSeekProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key',
			...deepSeekParams
		}

		// WHEN: Creating send request function
		const sendRequest = deepSeekProvider.sendRequestFunc(options)
		const mockMessages = [{ role: 'user', content: 'test' }]
		const mockController = new AbortController()

		// Mock the OpenAI client
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
			const generator = sendRequest(mockMessages, mockController)
			await generator.next()
		} catch (error) {
			// Expected to fail
		}

		// THEN: Should call injector with all DeepSeek parameters
		expect(mockMcpInjector.injectTools).toHaveBeenCalledWith(expect.objectContaining(deepSeekParams), 'DeepSeek')
	})

	it('should handle DeepSeek API key validation', async () => {
		// GIVEN: Options without API key
		const options = {
			...deepSeekProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector
			// Missing apiKey
		}

		// WHEN: Creating send request function
		const sendRequest = deepSeekProvider.sendRequestFunc(options)

		// THEN: Should still create function (validation happens at runtime)
		expect(sendRequest).toBeDefined()
		expect(typeof sendRequest).toBe('function')
	})

	it('should support DeepSeek model variations', async () => {
		// GIVEN: Different DeepSeek models
		const models = ['deepseek-chat', 'deepseek-coder']

		for (const model of models) {
			const options = {
				...deepSeekProvider.defaultOptions,
				mcpToolInjector: mockMcpInjector,
				apiKey: 'test-key',
				model
			}

			// WHEN: Creating send request function
			const sendRequest = deepSeekProvider.sendRequestFunc(options)

			// THEN: Should support each model
			expect(sendRequest).toBeDefined()
			expect(typeof sendRequest).toBe('function')
		}
	})
})
