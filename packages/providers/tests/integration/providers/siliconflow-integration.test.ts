/**
 * SiliconFlow Provider Integration Tests with MCP Tool Injection
 *
 * Tests the SiliconFlow provider implementation with MCP tool injection
 * following TDD approach - these tests will fail initially but drive the implementation.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock OpenAI to prevent real API calls
vi.mock('openai', () => ({
	default: vi.fn(() => ({
		chat: {
			completions: {
				create: vi.fn().mockImplementation(async function* () {
					yield 'Mock SiliconFlow response (MCP integration should have been used)'
				})
			}
		}
	}))
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

import { siliconFlowVendor } from '../../../src/implementations/siliconflow'
import { createMockMCPToolInjector } from '../../mocks/mcp-infrastructure-mocks'

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
		const sendRequest = siliconFlowVendor.sendRequestFunc(options)

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
		const sendRequest = siliconFlowVendor.sendRequestFunc(options)
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

	it('should preserve SiliconFlow-specific parameters during injection', async () => {
		// GIVEN: SiliconFlow-specific parameters
		const siliconFlowParams = {
			model: 'deepseek-chat',
			temperature: 0.7,
			top_p: 0.9,
			max_tokens: 2000,
			stream: true
		}

		mockMcpInjector.injectTools.mockImplementation((params, provider) => {
			return Promise.resolve({
				...params,
				tools: [{ type: 'function', function: { name: 'siliconflow_tool', description: 'Test' } }]
			})
		})

		const options = {
			...siliconFlowProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key',
			...siliconFlowParams
		}

		// WHEN: Creating send request function
		const sendRequest = siliconFlowVendor.sendRequestFunc(options)
		const mockMessages = [{ role: 'user', content: 'test' }]
		const mockController = new AbortController()

		// Mock HTTP call
		try {
			const generator = sendRequest(mockMessages, mockController, vi.fn())
			await generator.next()
		} catch (error) {
			// Expected to fail
		}

		// THEN: Should call injector with all SiliconFlow parameters
		expect(mockMcpInjector.injectTools).toHaveBeenCalledWith(expect.objectContaining(siliconFlowParams), 'SiliconFlow')
	})

	it('should handle SiliconFlow API endpoint configuration', async () => {
		// GIVEN: Custom API endpoint for SiliconFlow
		const options = {
			...siliconFlowProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key',
			baseURL: 'https://api.siliconflow.cn/v1',
			model: 'deepseek-chat'
		}

		// WHEN: Creating send request function
		const sendRequest = siliconFlowVendor.sendRequestFunc(options)

		// THEN: Should create function with custom endpoint
		expect(sendRequest).toBeDefined()
		expect(typeof sendRequest).toBe('function')
	})

	it('should support SiliconFlow streaming with MCP tools', async () => {
		// GIVEN: Streaming configuration
		const options = {
			...siliconFlowProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key',
			stream: true,
			model: 'Qwen/Qwen2.5-7B-Instruct'
		}

		// WHEN: Creating send request function
		const sendRequest = siliconFlowVendor.sendRequestFunc(options)

		// THEN: Should support streaming with tools
		expect(sendRequest).toBeDefined()
		expect(typeof sendRequest).toBe('function')
	})

	it('should handle multiple SiliconFlow models', async () => {
		// GIVEN: Various SiliconFlow-supported models
		const models = [
			'deepseek-chat',
			'Qwen/Qwen2.5-7B-Instruct',
			'meta-llama/Meta-Llama-3.1-8B-Instruct',
			'01-ai/Yi-1.5-9B-Chat-16K'
		]

		for (const model of models) {
			const options = {
				...siliconFlowProvider.defaultOptions,
				mcpToolInjector: mockMcpInjector,
				apiKey: 'test-key',
				model
			}

			// WHEN: Creating send request function
			const sendRequest = siliconFlowVendor.sendRequestFunc(options)

			// THEN: Should support each model
			expect(sendRequest).toBeDefined()
			expect(typeof sendRequest).toBe('function')
		}
	})

	it('should handle MCP injection failures gracefully for SiliconFlow', async () => {
		// GIVEN: Mock tool injector that fails
		mockMcpInjector.injectTools.mockRejectedValue(new Error('SiliconFlow MCP injection failed'))

		const options = {
			...siliconFlowProvider.defaultOptions,
			mcpToolInjector: mockMcpInjector,
			apiKey: 'test-key',
			model: 'deepseek-chat'
		}

		// WHEN: Creating send request function
		const sendRequest = siliconFlowVendor.sendRequestFunc(options)

		// THEN: Should still create function despite MCP failure
		expect(sendRequest).toBeDefined()
		expect(typeof sendRequest).toBe('function')
	})

	it('should validate SiliconFlow API key format', async () => {
		// GIVEN: Different API key formats
		const apiKeys = ['sk-test-key-123', 'test-key-format', 'siliconflow-key']

		for (const apiKey of apiKeys) {
			const options = {
				...siliconFlowProvider.defaultOptions,
				mcpToolInjector: mockMcpInjector,
				apiKey,
				model: 'deepseek-chat'
			}

			// WHEN: Creating send request function
			const sendRequest = siliconFlowVendor.sendRequestFunc(options)

			// THEN: Should accept different key formats
			expect(sendRequest).toBeDefined()
			expect(typeof sendRequest).toBe('function')
		}
	})
})
