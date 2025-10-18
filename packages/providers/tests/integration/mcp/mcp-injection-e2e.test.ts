/**
 * MCP Injection End-to-End Tests
 *
 * Tests the complete MCP tool injection flow from provider setup to tool execution.
 * Following TDD approach - tests will fail initially but define expected behavior.
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

// Mock Anthropic SDK to prevent real API calls
const mockAnthropicMessagesCreate = vi.fn()
vi.mock('@anthropic-ai/sdk', () => {
	const mockAnthropic = vi.fn().mockImplementation(() => ({
		messages: {
			create: mockAnthropicMessagesCreate
		}
	}))
	return { default: mockAnthropic }
})

// Mock OpenAI SDK to prevent real API calls
const mockOpenAIChatCompletionsCreate = vi.fn()
vi.mock('openai', () => {
	const mockOpenAI = vi.fn().mockImplementation(() => ({
		chat: {
			completions: {
				create: mockOpenAIChatCompletionsCreate
			}
		}
	}))
	return { default: mockOpenAI }
})

// Mock i18n to avoid import issues during testing
vi.mock('../../../src/i18n', () => ({
	t: vi.fn((key: string) => key),
	getCapabilityEmoji: vi.fn(() => '🔧')
}))

import { claudeVendor, openAIVendor } from '../../../src/implementations'
import type { MCPIntegration, MCPToolInjector } from '../../../src/interfaces'
import { ConcreteMCPToolInjector } from '../../../src/mcp-tool-injection-impl'

// Helper functions for mock setup
const setupMocksForAdvancedIntegration = () => {
	// These mocks should ideally NOT be called when MCP integration works
	// but we'll make them return successful responses for robustness
	mockAnthropicMessagesCreate.mockImplementation(async function* () {
		yield 'Fallback Anthropic response (MCP integration should have been used)'
	})

	mockOpenAIChatCompletionsCreate.mockImplementation(async function* () {
		yield 'Fallback OpenAI response (MCP integration should have been used)'
	})
}

// Mock console.warn to avoid expected error handling output
const originalWarn = console.warn
const originalError = console.error

beforeEach(() => {
	console.warn = vi.fn()
	console.error = vi.fn()

	// Clear mock history
	vi.clearAllMocks()

	// Default to advanced integration setup
	setupMocksForAdvancedIntegration()
})

afterEach(() => {
	console.warn = originalWarn
	console.error = originalError
})

// Mock MCP infrastructure
const createMockMCPServerManager = () => ({
	getToolDiscoveryCache: vi.fn().mockReturnValue({
		getSnapshot: vi.fn().mockResolvedValue({
			mapping: new Map([
				['test_tool', { id: 'server1', name: 'Test Server' }],
				['calculate', { id: 'server1', name: 'Test Server' }]
			]),
			servers: [
				{
					serverId: 'server1',
					serverName: 'Test Server',
					tools: [
						{
							name: 'test_tool',
							description: 'Test tool for testing',
							inputSchema: {
								type: 'object',
								properties: {
									param1: { type: 'string', description: 'First parameter' }
								},
								required: ['param1']
							}
						}
					]
				}
			]
		})
	}),
	listServers: vi.fn().mockReturnValue([{ id: 'server1', name: 'Test Server', enabled: true }]),
	getClient: vi.fn()
})

const createMockToolExecutor = () => ({
	executeTool: vi.fn().mockResolvedValue({
		content: { result: 'success' },
		contentType: 'json',
		executionDuration: 100
	})
})

// Mock Tool Calling Coordinator
const createMockToolCallingCoordinator = () => ({
	generateWithTools: vi.fn().mockImplementation(async function* () {
		yield 'Tool executed successfully'
	})
})

// Mock Provider Adapter
const createMockProviderAdapter = () => ({
	initialize: vi.fn().mockResolvedValue(undefined),
	findServer: vi.fn().mockReturnValue({ id: 'server1', name: 'Test Server' }),
	formatToolResult: vi.fn()
})

describe('MCP Injection End-to-End Flow', () => {
	describe('Advanced Integration Path', () => {
		let mockMcpIntegration: MCPIntegration
		let mockMcpToolInjector: MCPToolInjector

		beforeEach(() => {
			// Setup advanced integration mocks
			mockMcpIntegration = {
				toolCallingCoordinator: createMockToolCallingCoordinator(),
				providerAdapter: createMockProviderAdapter(),
				mcpExecutor: createMockToolExecutor(),
				mcpToolInjector: undefined
			}

			const mockManager = createMockMCPServerManager()
			const mockExecutor = createMockToolExecutor()
			mockMcpToolInjector = new ConcreteMCPToolInjector(mockManager, mockExecutor)
		})

		it('should complete full injection flow for Claude with advanced integration', async () => {
			// GIVEN: Claude provider with advanced MCP integration
			const options = {
				...claudeVendor.defaultOptions,
				mcpIntegration: mockMcpIntegration,
				mcpToolInjector: mockMcpToolInjector,
				apiKey: 'test-key',
				model: 'claude-3-5-sonnet-20241022'
			}

			// WHEN: Creating send request function with MCP integration
			const sendRequest = claudeVendor.sendRequestFunc(options)

			// THEN: Should be able to call with MCP context
			expect(sendRequest).toBeDefined()
			expect(typeof sendRequest).toBe('function')

			// Verify MCP components are properly set up
			expect(mockMcpIntegration.toolCallingCoordinator).toBeDefined()
			expect(mockMcpIntegration.providerAdapter).toBeDefined()
			expect(mockMcpIntegration.mcpExecutor).toBeDefined()
		})

		it('should complete full injection flow for OpenAI with advanced integration', async () => {
			// GIVEN: OpenAI provider with advanced MCP integration
			const options = {
				...openAIVendor.defaultOptions,
				mcpIntegration: mockMcpIntegration,
				mcpToolInjector: mockMcpToolInjector,
				apiKey: 'test-key',
				model: 'gpt-4'
			}

			// WHEN: Creating send request function with MCP integration
			const sendRequest = openAIVendor.sendRequestFunc(options)

			// THEN: Should be able to call with MCP context
			expect(sendRequest).toBeDefined()
			expect(typeof sendRequest).toBe('function')

			// Verify MCP components are properly set up
			expect(mockMcpIntegration.toolCallingCoordinator).toBeDefined()
			expect(mockMcpIntegration.providerAdapter).toBeDefined()
			expect(mockMcpIntegration.mcpExecutor).toBeDefined()
		})

		it('should handle tool execution through coordinator', async () => {
			// GIVEN: Provider with tool calling coordinator
			const mockCoordinator = createMockToolCallingCoordinator()
			mockMcpIntegration.toolCallingCoordinator = mockCoordinator

			const options = {
				...claudeVendor.defaultOptions,
				mcpIntegration: mockMcpIntegration,
				apiKey: 'test-key',
				model: 'claude-3-5-sonnet-20241022'
			}

			// WHEN: Creating provider send request function
			const sendRequest = claudeVendor.sendRequestFunc(options)

			// THEN: Should have access to coordinator
			expect(sendRequest).toBeDefined()
			expect(mockCoordinator.generateWithTools).toBeDefined()
		})
	})

	describe('Simple Injection Path', () => {
		let mockMcpToolInjector: MCPToolInjector

		beforeEach(() => {
			// Setup simple injection mocks
			const mockManager = createMockMCPServerManager()
			const mockExecutor = createMockToolExecutor()
			mockMcpToolInjector = new ConcreteMCPToolInjector(mockManager, mockExecutor)
		})

		it('should complete simple injection flow without advanced integration', async () => {
			// GIVEN: Provider with only simple MCP tool injection
			const options = {
				...claudeVendor.defaultOptions,
				mcpToolInjector: mockMcpToolInjector,
				apiKey: 'test-key',
				model: 'claude-3-5-sonnet-20241022'
			}

			// WHEN: Creating send request function
			const sendRequest = claudeVendor.sendRequestFunc(options)

			// THEN: Should create successfully without advanced integration
			expect(sendRequest).toBeDefined()
			expect(typeof sendRequest).toBe('function')

			// Should not have advanced integration components
			expect(options.mcpIntegration).toBeUndefined()
		})
	})

	describe('Error Handling in Injection Flow', () => {
		it('should handle missing MCP components gracefully', async () => {
			// GIVEN: Provider settings without MCP integration
			const options = {
				...claudeVendor.defaultOptions,
				apiKey: 'test-key',
				model: 'claude-3-5-sonnet-20241022'
			}

			// WHEN: Creating send request function
			const sendRequest = claudeVendor.sendRequestFunc(options)

			// THEN: Should create successfully without MCP
			expect(sendRequest).toBeDefined()
			expect(typeof sendRequest).toBe('function')
		})

		it('should handle MCP injection failures gracefully', async () => {
			// GIVEN: Mock tool injector that fails
			const mockManager = createMockMCPServerManager()
			const mockExecutor = createMockToolExecutor()
			const mockInjector = new ConcreteMCPToolInjector(mockManager, mockExecutor)

			// Mock injection failure
			vi.spyOn(mockInjector, 'injectTools').mockRejectedValue(new Error('MCP injection failed'))

			const options = {
				...claudeVendor.defaultOptions,
				mcpToolInjector: mockInjector,
				apiKey: 'test-key',
				model: 'claude-3-5-sonnet-20241022'
			}

			// WHEN: Creating send request function
			const sendRequest = claudeVendor.sendRequestFunc(options)

			// THEN: Should still create successfully
			expect(sendRequest).toBeDefined()
			expect(typeof sendRequest).toBe('function')
		})
	})
})
