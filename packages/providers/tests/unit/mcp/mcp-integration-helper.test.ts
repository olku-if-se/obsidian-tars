/**
 * MCPIntegrationHelper Tests
 *
 * Tests the new centralized MCP integration helper that replaces
 * duplicate code across provider implementations.
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

import type { MCPIntegration, MCPToolInjector } from '../../../src/interfaces'
import { createMCPIntegrationHelper, MCPIntegrationHelper } from '../../../src/mcp-integration-helper'

describe('MCPIntegrationHelper', () => {
	let mockMcpIntegration: MCPIntegration
	let mockMcpToolInjector: MCPToolInjector
	let mockCoordinator: any
	let mockAdapter: any
	let mockExecutor: any

	beforeEach(() => {
		// Create mock MCP components
		mockCoordinator = {
			generateWithTools: vi.fn().mockImplementation(function* () {
				yield 'Tool calling response'
			})
		}

		mockAdapter = {
			initialize: vi.fn().mockResolvedValue(undefined)
		}

		mockExecutor = {
			executeTool: vi.fn()
		}

		mockMcpToolInjector = {
			injectTools: vi.fn().mockResolvedValue({
				tools: [{ type: 'function', function: { name: 'test_tool', description: 'Test' } }]
			})
		}

		mockMcpIntegration = {
			mcpToolInjector: mockMcpToolInjector,
			toolCallingCoordinator: mockCoordinator,
			providerAdapter: mockAdapter,
			mcpExecutor: mockExecutor
		}
	})

	describe('constructor', () => {
		it('should create helper with required MCP components', () => {
			// WHEN: Creating helper
			const helper = new MCPIntegrationHelper(mockMcpIntegration, mockMcpToolInjector)

			// THEN: Should create successfully
			expect(helper).toBeInstanceOf(MCPIntegrationHelper)
		})
	})

	describe('hasToolCalling', () => {
		it('should return true when tool calling components are available', () => {
			// GIVEN: Helper with all components
			const helper = new MCPIntegrationHelper(mockMcpIntegration, mockMcpToolInjector)

			// WHEN: Checking tool calling availability
			const result = helper.hasToolCalling()

			// THEN: Should return true
			expect(result).toBe(true)
		})

		it('should return false when tool calling coordinator is missing', () => {
			// GIVEN: Helper without coordinator
			const incompleteIntegration = { ...mockMcpIntegration }
			delete incompleteIntegration.toolCallingCoordinator
			const helper = new MCPIntegrationHelper(incompleteIntegration, mockMcpToolInjector)

			// WHEN: Checking tool calling availability
			const result = helper.hasToolCalling()

			// THEN: Should return false
			expect(result).toBe(false)
		})

		it('should return false when provider adapter is missing', () => {
			// GIVEN: Helper without adapter
			const incompleteIntegration = { ...mockMcpIntegration }
			delete incompleteIntegration.providerAdapter
			const helper = new MCPIntegrationHelper(incompleteIntegration, mockMcpToolInjector)

			// WHEN: Checking tool calling availability
			const result = helper.hasToolCalling()

			// THEN: Should return false
			expect(result).toBe(false)
		})
	})

	describe('generateWithTools', () => {
		it('should generate using tool calling coordinator when available', async () => {
			// GIVEN: Helper with tool calling capability
			const helper = new MCPIntegrationHelper(mockMcpIntegration, mockMcpToolInjector)
			const config = {
				documentPath: 'test.md',
				providerName: 'TestProvider',
				messages: [{ role: 'user', content: 'test' }],
				controller: new AbortController()
			}

			// WHEN: Generating with tools
			const generator = helper.generateWithTools(config)
			const result = await generator.next()

			// THEN: Should initialize adapter and call coordinator
			expect(mockAdapter.initialize).toHaveBeenCalledWith({ preloadTools: false })
			expect(mockCoordinator.generateWithTools).toHaveBeenCalledWith(
				expect.arrayContaining([expect.objectContaining({ role: 'user', content: 'test' })]),
				mockAdapter,
				mockExecutor,
				expect.objectContaining({
					documentPath: 'test.md',
					autoUseDocumentCache: true,
					parallelExecution: false,
					maxParallelTools: 3
				})
			)
			expect(result.value).toBe('Tool calling response')
		})

		it('should throw error when tool calling is not available', async () => {
			// GIVEN: Helper without tool calling capability
			const incompleteIntegration = { ...mockMcpIntegration }
			delete incompleteIntegration.toolCallingCoordinator
			const helper = new MCPIntegrationHelper(incompleteIntegration, mockMcpToolInjector)
			const config = {
				documentPath: 'test.md',
				providerName: 'TestProvider',
				messages: [{ role: 'user', content: 'test' }],
				controller: new AbortController()
			}

			// WHEN: Trying to generate with tools
			const generator = helper.generateWithTools(config)

			// THEN: Should throw error
			await expect(generator.next()).rejects.toThrow('Tool calling not available')
		})

		it('should handle coordinator errors gracefully', async () => {
			// GIVEN: Coordinator that throws error
			mockCoordinator.generateWithTools.mockImplementation(() => {
				throw new Error('Coordinator failed')
			})
			const helper = new MCPIntegrationHelper(mockMcpIntegration, mockMcpToolInjector)
			const config = {
				documentPath: 'test.md',
				providerName: 'TestProvider',
				messages: [{ role: 'user', content: 'test' }],
				controller: new AbortController()
			}

			// WHEN: Generating with tools
			const generator = helper.generateWithTools(config)

			// THEN: Should propagate error
			await expect(generator.next()).rejects.toThrow('Coordinator failed')
		})
	})

	describe('injectTools', () => {
		it('should inject tools using tool injector', async () => {
			// GIVEN: Helper with tool injector
			const helper = new MCPIntegrationHelper(mockMcpIntegration, mockMcpToolInjector)
			const parameters = { model: 'test-model', temperature: 0.7 }

			// WHEN: Injecting tools
			const result = await helper.injectTools(parameters, 'TestProvider')

			// THEN: Should call injector with correct parameters
			expect(mockMcpToolInjector.injectTools).toHaveBeenCalledWith(parameters, 'TestProvider')
			expect(result).toEqual({
				tools: [{ type: 'function', function: { name: 'test_tool', description: 'Test' } }]
			})
		})

		it('should return original parameters when injection fails', async () => {
			// GIVEN: Tool injector that throws error
			mockMcpToolInjector.injectTools.mockRejectedValue(new Error('Injection failed'))
			const helper = new MCPIntegrationHelper(mockMcpIntegration, mockMcpToolInjector)
			const parameters = { model: 'test-model', temperature: 0.7 }

			// WHEN: Injecting tools
			const result = await helper.injectTools(parameters, 'TestProvider')

			// THEN: Should return original parameters
			expect(result).toEqual(parameters)
		})
	})
})

describe('createMCPIntegrationHelper', () => {
	let mockMcpIntegration: MCPIntegration
	let mockMcpToolInjector: MCPToolInjector

	beforeEach(() => {
		mockMcpToolInjector = {
			injectTools: vi.fn().mockResolvedValue({})
		}

		mockMcpIntegration = {
			mcpToolInjector: mockMcpToolInjector,
			toolCallingCoordinator: {},
			providerAdapter: {},
			mcpExecutor: {}
		}
	})

	it('should create helper when both integration and injector are provided', () => {
		// GIVEN: Settings with both components
		const settings = {
			apiKey: 'test',
			baseURL: 'test',
			model: 'test',
			parameters: {},
			mcpIntegration: mockMcpIntegration,
			mcpToolInjector: mockMcpToolInjector
		}

		// WHEN: Creating helper
		const helper = createMCPIntegrationHelper(settings)

		// THEN: Should create helper
		expect(helper).toBeInstanceOf(MCPIntegrationHelper)
	})

	it('should create helper with minimal integration when only injector provided', () => {
		// GIVEN: Settings with only injector
		const settings = {
			apiKey: 'test',
			baseURL: 'test',
			model: 'test',
			parameters: {},
			mcpToolInjector: mockMcpToolInjector
		}

		// WHEN: Creating helper
		const helper = createMCPIntegrationHelper(settings)

		// THEN: Should create helper
		expect(helper).toBeInstanceOf(MCPIntegrationHelper)
	})

	it('should create helper with minimal integration when only integration provided', () => {
		// GIVEN: Settings with only integration
		const settings = {
			apiKey: 'test',
			baseURL: 'test',
			model: 'test',
			parameters: {},
			mcpIntegration: mockMcpIntegration
		}

		// WHEN: Creating helper
		const helper = createMCPIntegrationHelper(settings)

		// THEN: Should create helper
		expect(helper).toBeInstanceOf(MCPIntegrationHelper)
	})

	it('should return null when neither component is provided', () => {
		// GIVEN: Settings without MCP components
		const settings = {
			apiKey: 'test',
			baseURL: 'test',
			model: 'test',
			parameters: {}
		}

		// WHEN: Creating helper
		const helper = createMCPIntegrationHelper(settings)

		// THEN: Should return null
		expect(helper).toBeNull()
	})
})
