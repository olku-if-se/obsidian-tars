/**
 * MCP Tool Injection Tests
 *
 * Following TDD approach - these tests will fail initially but define expected behavior
 * for proper MCP integration with providers.
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

import { ConcreteMCPToolInjector } from '../src/mcp-tool-injection-impl'
import {
	createMockCalculatorToolSnapshot,
	createMockMCPServerManager,
	createMockMultiToolSnapshot,
	createMockToolExecutor,
	createMockToolSnapshot,
	createMockWeatherToolSnapshot,
	mockErrorScenarios
} from './mocks/mcp-infrastructure-mocks'

describe('MCPToolInjector Interface', () => {
	it('should have concrete implementation available', () => {
		// GIVEN: The MCPToolInjector interface is defined in base.ts
		// WHEN: We try to create an instance
		const mockManager = createMockMCPServerManager()
		const mockExecutor = createMockToolExecutor()

		// THEN: A concrete implementation should be available
		expect(() => new ConcreteMCPToolInjector(mockManager, mockExecutor)).not.toThrow()
	})
})

describe('MCPToolInjector Basic Functionality', () => {
	let mockInjector: ConcreteMCPToolInjector
	let mockManager: any
	let mockExecutor: any

	beforeEach(() => {
		// GIVEN: Mock MCP infrastructure is set up
		mockManager = createMockMCPServerManager()
		mockExecutor = createMockToolExecutor()
		mockInjector = new ConcreteMCPToolInjector(mockManager, mockExecutor)
	})

	it('should inject tools into OpenAI format parameters', async () => {
		// GIVEN: OpenAI provider parameters and mock tools
		const parameters = { model: 'gpt-4', temperature: 0.7 }
		const mockSnapshot = createMockWeatherToolSnapshot()
		mockManager.getToolDiscoveryCache().getSnapshot.mockResolvedValue(mockSnapshot)

		const expectedTools = [
			{
				type: 'function',
				function: {
					name: 'get_weather',
					description: 'Get current weather information for a location',
					parameters: {
						type: 'object',
						properties: {
							location: { type: 'string', description: 'City name' },
							units: { type: 'string', enum: ['celsius', 'fahrenheit'] }
						},
						required: ['location']
					}
				}
			}
		]

		// WHEN: Injecting tools for OpenAI provider
		const result = await mockInjector.injectTools(parameters, 'OpenAI')

		// THEN: Should return parameters with tools in OpenAI format
		expect(result).toHaveProperty('tools')
		expect(result.tools).toEqual(expectedTools)
		expect(result.model).toBe('gpt-4')
		expect(result.temperature).toBe(0.7)
	})

	it('should inject tools into Claude format parameters', async () => {
		// GIVEN: Claude provider parameters and mock tools
		const parameters = { model: 'claude-3-sonnet', max_tokens: 4096 }
		const mockSnapshot = createMockWeatherToolSnapshot()
		mockManager.getToolDiscoveryCache().getSnapshot.mockResolvedValue(mockSnapshot)

		const expectedTools = [
			{
				name: 'get_weather',
				description: 'Get current weather information for a location',
				input_schema: {
					type: 'object',
					properties: {
						location: { type: 'string', description: 'City name' },
						units: { type: 'string', enum: ['celsius', 'fahrenheit'] }
					},
					required: ['location']
				}
			}
		]

		// WHEN: Injecting tools for Claude provider
		const result = await mockInjector.injectTools(parameters, 'Claude')

		// THEN: Should return parameters with tools in Claude format
		expect(result).toHaveProperty('tools')
		expect(result.tools).toEqual(expectedTools)
		expect(result.model).toBe('claude-3-sonnet')
		expect(result.max_tokens).toBe(4096)
	})

	it('should inject tools into Gemini format parameters', async () => {
		// GIVEN: Gemini provider parameters and mock tools
		const parameters = { model: 'gemini-1.5-flash' }
		const mockSnapshot = createMockCalculatorToolSnapshot()
		mockManager.getToolDiscoveryCache().getSnapshot.mockResolvedValue(mockSnapshot)

		const expectedTools = [
			{
				functionDeclaration: {
					name: 'calculator',
					description: 'Perform mathematical calculations',
					parameters: {
						type: 'object',
						properties: {
							expression: { type: 'string', description: 'Mathematical expression to evaluate' }
						},
						required: ['expression']
					}
				}
			}
		]

		// WHEN: Injecting tools for Gemini provider
		const result = await mockInjector.injectTools(parameters, 'Gemini')

		// THEN: Should return parameters with tools in Gemini format
		expect(result).toHaveProperty('tools')
		expect(result.tools).toEqual(expectedTools)
		expect(result.model).toBe('gemini-1.5-flash')
	})

	it('should inject tools into Ollama format parameters', async () => {
		// GIVEN: Ollama provider parameters and mock tools
		const parameters = { model: 'llama3.2' }
		const mockSnapshot = createMockToolSnapshot()
		mockManager.getToolDiscoveryCache().getSnapshot.mockResolvedValue(mockSnapshot)

		// WHEN: Injecting tools for Ollama provider
		const result = await mockInjector.injectTools(parameters, 'Ollama')

		// THEN: Should return parameters with tools in Ollama format
		expect(result).toHaveProperty('tools')
		expect(result.tools as any[]).toHaveLength(1)
		expect((result.tools as any[])[0]).toHaveProperty('type', 'function')
		expect((result.tools as any[])[0]).toHaveProperty('function')
	})

	it('should handle multiple tools correctly', async () => {
		// GIVEN: Multiple tools in snapshot
		const parameters = { model: 'gpt-4' }
		const mockSnapshot = createMockMultiToolSnapshot()
		mockManager.getToolDiscoveryCache().getSnapshot.mockResolvedValue(mockSnapshot)

		// WHEN: Injecting tools
		const result = await mockInjector.injectTools(parameters, 'OpenAI')

		// THEN: Should include all tools
		expect(result.tools as any[]).toHaveLength(2)
		expect((result.tools as any[])[0].function.name).toBe('get_weather')
		expect((result.tools as any[])[1].function.name).toBe('calculator')
	})

	it('should handle injection errors gracefully', async () => {
		// GIVEN: Mock tool discovery failure
		mockManager.getToolDiscoveryCache().getSnapshot.mockRejectedValue(mockErrorScenarios.toolDiscoveryFailure)

		// WHEN: Attempting to inject tools
		const result = await mockInjector.injectTools({}, 'OpenAI')

		// THEN: Should return original parameters without tools
		expect(result).toEqual({})
		expect(result).not.toHaveProperty('tools')
	})

	it('should return empty tools for unsupported provider', async () => {
		// GIVEN: Unsupported provider name
		const parameters = { model: 'unknown-model' }
		const mockSnapshot = createMockToolSnapshot()
		mockManager.getToolDiscoveryCache().getSnapshot.mockResolvedValue(mockSnapshot)

		// WHEN: Injecting tools for unsupported provider
		const result = await mockInjector.injectTools(parameters, 'UnknownProvider')

		// THEN: Should return empty tools array
		expect(result.tools).toEqual([])
		expect(result.model).toBe('unknown-model')
	})
})

describe('Provider-Specific Tool Injection', () => {
	let mockInjector: ConcreteMCPToolInjector
	let mockManager: any
	let mockExecutor: any

	beforeEach(() => {
		mockManager = createMockMCPServerManager()
		mockExecutor = createMockToolExecutor()
		mockInjector = new ConcreteMCPToolInjector(mockManager, mockExecutor)
	})

	describe('OpenAI-compatible providers', () => {
		it('should format tools for DeepSeek', async () => {
			const parameters = { model: 'deepseek-chat' }
			const mockSnapshot = createMockToolSnapshot()
			mockManager.getToolDiscoveryCache().getSnapshot.mockResolvedValue(mockSnapshot)

			const result = await mockInjector.injectTools(parameters, 'DeepSeek')

			expect((result.tools as any[])[0]).toHaveProperty('type', 'function')
			expect((result.tools as any[])[0]).toHaveProperty('function')
		})

		it('should format tools for SiliconFlow', async () => {
			const parameters = { model: 'deepseek-chat' }
			const mockSnapshot = createMockToolSnapshot()
			mockManager.getToolDiscoveryCache().getSnapshot.mockResolvedValue(mockSnapshot)

			const result = await mockInjector.injectTools(parameters, 'SiliconFlow')

			expect((result.tools as any[])[0]).toHaveProperty('type', 'function')
			expect((result.tools as any[])[0]).toHaveProperty('function')
		})

		it('should format tools for Grok', async () => {
			const parameters = { model: 'grok-beta' }
			const mockSnapshot = createMockToolSnapshot()
			mockManager.getToolDiscoveryCache().getSnapshot.mockResolvedValue(mockSnapshot)

			const result = await mockInjector.injectTools(parameters, 'Grok')

			expect((result.tools as any[])[0]).toHaveProperty('type', 'function')
			expect((result.tools as any[])[0]).toHaveProperty('function')
		})

		it('should format tools for Azure OpenAI', async () => {
			const parameters = { model: 'gpt-4-deployment' }
			const mockSnapshot = createMockToolSnapshot()
			mockManager.getToolDiscoveryCache().getSnapshot.mockResolvedValue(mockSnapshot)

			const result = await mockInjector.injectTools(parameters, 'Azure')

			expect((result.tools as any[])[0]).toHaveProperty('type', 'function')
			expect((result.tools as any[])[0]).toHaveProperty('function')
		})

		it('should format tools for OpenRouter', async () => {
			const parameters = { model: 'anthropic/claude-3.5-sonnet' }
			const mockSnapshot = createMockToolSnapshot()
			mockManager.getToolDiscoveryCache().getSnapshot.mockResolvedValue(mockSnapshot)

			const result = await mockInjector.injectTools(parameters, 'OpenRouter')

			expect((result.tools as any[])[0]).toHaveProperty('type', 'function')
			expect((result.tools as any[])[0]).toHaveProperty('function')
		})
	})

	describe('Chinese providers', () => {
		it('should format tools for Qwen', async () => {
			const parameters = { model: 'qwen-turbo' }
			const mockSnapshot = createMockToolSnapshot()
			mockManager.getToolDiscoveryCache().getSnapshot.mockResolvedValue(mockSnapshot)

			const result = await mockInjector.injectTools(parameters, 'Qwen')

			expect((result.tools as any[])[0]).toHaveProperty('type', 'function')
			expect((result.tools as any[])[0]).toHaveProperty('function')
		})

		it('should format tools for Kimi', async () => {
			const parameters = { model: 'moonshot-v1-8k' }
			const mockSnapshot = createMockToolSnapshot()
			mockManager.getToolDiscoveryCache().getSnapshot.mockResolvedValue(mockSnapshot)

			const result = await mockInjector.injectTools(parameters, 'Kimi')

			expect((result.tools as any[])[0]).toHaveProperty('type', 'function')
			expect((result.tools as any[])[0]).toHaveProperty('function')
		})

		it('should format tools for Zhipu', async () => {
			const parameters = { model: 'glm-4' }
			const mockSnapshot = createMockToolSnapshot()
			mockManager.getToolDiscoveryCache().getSnapshot.mockResolvedValue(mockSnapshot)

			const result = await mockInjector.injectTools(parameters, 'Zhipu')

			expect((result.tools as any[])[0]).toHaveProperty('type', 'function')
			expect((result.tools as any[])[0]).toHaveProperty('function')
		})

		it('should format tools for Doubao', async () => {
			const parameters = { model: 'doubao-pro-4k' }
			const mockSnapshot = createMockToolSnapshot()
			mockManager.getToolDiscoveryCache().getSnapshot.mockResolvedValue(mockSnapshot)

			const result = await mockInjector.injectTools(parameters, 'Doubao')

			expect((result.tools as any[])[0]).toHaveProperty('type', 'function')
			expect((result.tools as any[])[0]).toHaveProperty('function')
		})

		it('should format tools for QianFan', async () => {
			const parameters = { model: 'ernie-3.5-8k' }
			const mockSnapshot = createMockToolSnapshot()
			mockManager.getToolDiscoveryCache().getSnapshot.mockResolvedValue(mockSnapshot)

			const result = await mockInjector.injectTools(parameters, 'QianFan')

			expect((result.tools as any[])[0]).toHaveProperty('type', 'function')
			expect((result.tools as any[])[0]).toHaveProperty('function')
		})
	})
})

describe('Error Handling and Edge Cases', () => {
	let mockInjector: ConcreteMCPToolInjector
	let mockManager: any
	let mockExecutor: any

	beforeEach(() => {
		mockManager = createMockMCPServerManager()
		mockExecutor = createMockToolExecutor()
		mockInjector = new ConcreteMCPToolInjector(mockManager, mockExecutor)
	})

	it('should handle empty tool snapshot', async () => {
		// GIVEN: Empty snapshot
		const parameters = { model: 'gpt-4' }
		const emptySnapshot = { mapping: new Map(), servers: [] }
		mockManager.getToolDiscoveryCache().getSnapshot.mockResolvedValue(emptySnapshot)

		// WHEN: Injecting tools
		const result = await mockInjector.injectTools(parameters, 'OpenAI')

		// THEN: Should return empty tools array
		expect(result.tools).toEqual([])
	})

	it('should handle malformed tool schemas', async () => {
		// GIVEN: Tool with invalid schema
		const parameters = { model: 'gpt-4' }
		const malformedSnapshot = {
			mapping: new Map(),
			servers: [
				{
					serverId: 'server1',
					serverName: 'Server 1',
					tools: [
						{
							name: 'invalid_tool',
							description: 'Tool with invalid schema',
							inputSchema: null // Invalid schema
						}
					]
				}
			]
		}
		mockManager.getToolDiscoveryCache().getSnapshot.mockResolvedValue(malformedSnapshot)

		// WHEN: Injecting tools
		const result = await mockInjector.injectTools(parameters, 'OpenAI')

		// THEN: Should filter out invalid tools (proactive validation)
		expect(result.tools as any[]).toHaveLength(0)
		// Invalid tools should be filtered out to prevent runtime errors
	})

	it('should handle network timeouts gracefully', async () => {
		// GIVEN: Mock that times out
		const parameters = { model: 'gpt-4' }
		mockManager.getToolDiscoveryCache().getSnapshot.mockImplementation(() => {
			return new Promise((_resolve, reject) => {
				setTimeout(() => reject(mockErrorScenarios.networkTimeout), 100)
			})
		})

		// WHEN: Attempting to inject tools
		const startTime = Date.now()
		const result = await mockInjector.injectTools(parameters, 'OpenAI')
		const endTime = Date.now()

		// THEN: Should handle timeout gracefully and return original parameters
		expect(endTime - startTime).toBeLessThan(1000) // Should not wait long
		expect(result).toEqual(parameters)
		expect(result).not.toHaveProperty('tools')
	})

	it('should preserve original parameters when injection fails', async () => {
		// GIVEN: Original parameters with multiple properties
		const originalParams = {
			model: 'gpt-4',
			temperature: 0.7,
			max_tokens: 1000,
			custom_param: 'value'
		}
		mockManager.getToolDiscoveryCache().getSnapshot.mockRejectedValue(mockErrorScenarios.serverUnavailable)

		// WHEN: Injection fails
		const result = await mockInjector.injectTools(originalParams, 'OpenAI')

		// THEN: Should preserve all original parameters
		expect(result).toEqual(originalParams)
	})
})
