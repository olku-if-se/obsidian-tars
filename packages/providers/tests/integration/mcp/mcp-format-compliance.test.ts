/**
 * MCP Format Compliance Tests
 *
 * Tests that MCP tools are correctly formatted for different providers.
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

// Mock i18n to avoid import issues during testing
vi.mock('../../../src/i18n', () => ({
	t: vi.fn((key: string) => key),
	getCapabilityEmoji: vi.fn(() => '🔧')
}))

import type { MCPToolInjector } from '../../../src/interfaces'
import { ConcreteMCPToolInjector } from '../../../src/mcp-tool-injection-impl'

// Mock console.warn to avoid expected error handling output
const originalWarn = console.warn
const originalError = console.error

beforeEach(() => {
	console.warn = vi.fn()
	console.error = vi.fn()
	vi.clearAllMocks()
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
									param1: { type: 'string', description: 'First parameter' },
									optionalParam: { type: 'number', description: 'Optional parameter' }
								},
								required: ['param1']
							}
						},
						{
							name: 'calculate',
							description: 'Perform calculations',
							inputSchema: {
								type: 'object',
								properties: {
									operation: { type: 'string', description: 'Operation to perform' },
									numbers: {
										type: 'array',
										items: { type: 'number' },
										description: 'Numbers to operate on'
									}
								},
								required: ['operation', 'numbers']
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

describe('MCP Format Compliance', () => {
	let mockInjector: MCPToolInjector
	let mockManager: any
	let mockExecutor: any

	beforeEach(() => {
		mockManager = createMockMCPServerManager()
		mockExecutor = createMockToolExecutor()
		mockInjector = new ConcreteMCPToolInjector(mockManager, mockExecutor)
	})

	describe('OpenAI Format Compliance', () => {
		it('should format tools according to OpenAI function calling specification', async () => {
			// GIVEN: OpenAI provider parameters
			const parameters = { model: 'gpt-4', temperature: 0.7 }
			const expectedTools = [
				{
					type: 'function',
					function: {
						name: 'test_tool',
						description: 'Test tool for testing',
						parameters: {
							type: 'object',
							properties: {
								param1: { type: 'string', description: 'First parameter' },
								optionalParam: { type: 'number', description: 'Optional parameter' }
							},
							required: ['param1']
						}
					}
				},
				{
					type: 'function',
					function: {
						name: 'calculate',
						description: 'Perform calculations',
						parameters: {
							type: 'object',
							properties: {
								operation: { type: 'string', description: 'Operation to perform' },
								numbers: {
									type: 'array',
									items: { type: 'number' },
									description: 'Numbers to operate on'
								}
							},
							required: ['operation', 'numbers']
						}
					}
				}
			]
			const expectedResult = { ...parameters, tools: expectedTools }

			// WHEN: Injecting tools for OpenAI provider
			const result = await mockInjector.injectTools(parameters, 'OpenAI')

			// THEN: Should return OpenAI-format tools
			expect(result).toEqual(expectedResult)
			expect(result.model).toBe('gpt-4')
			expect(result.temperature).toBe(0.7)
			expect(result.tools).toHaveLength(2)

			// Verify OpenAI-specific structure
			result.tools.forEach((tool) => {
				expect(tool).toHaveProperty('type', 'function')
				expect(tool).toHaveProperty('function')
				expect(tool.function).toHaveProperty('name')
				expect(tool.function).toHaveProperty('description')
				expect(tool.function).toHaveProperty('parameters')
			})
		})

		it('should preserve existing OpenAI parameters', async () => {
			// GIVEN: OpenAI parameters with multiple settings
			const parameters = {
				model: 'gpt-4-turbo',
				temperature: 0.5,
				max_tokens: 2000,
				top_p: 0.9,
				frequency_penalty: 0.1,
				presence_penalty: 0.1
			}

			// WHEN: Injecting tools
			const result = await mockInjector.injectTools(parameters, 'OpenAI')

			// THEN: Should preserve all existing parameters
			expect(result.model).toBe('gpt-4-turbo')
			expect(result.temperature).toBe(0.5)
			expect(result.max_tokens).toBe(2000)
			expect(result.top_p).toBe(0.9)
			expect(result.frequency_penalty).toBe(0.1)
			expect(result.presence_penalty).toBe(0.1)
			expect(result.tools).toBeDefined()
		})
	})

	describe('Claude Format Compliance', () => {
		it('should format tools according to Claude tool specification', async () => {
			// GIVEN: Claude provider parameters
			const parameters = { model: 'claude-3-5-sonnet-20241022', max_tokens: 4096 }
			const expectedTools = [
				{
					name: 'test_tool',
					description: 'Test tool for testing',
					input_schema: {
						type: 'object',
						properties: {
							param1: { type: 'string', description: 'First parameter' },
							optionalParam: { type: 'number', description: 'Optional parameter' }
						},
						required: ['param1']
					}
				},
				{
					name: 'calculate',
					description: 'Perform calculations',
					input_schema: {
						type: 'object',
						properties: {
							operation: { type: 'string', description: 'Operation to perform' },
							numbers: {
								type: 'array',
								items: { type: 'number' },
								description: 'Numbers to operate on'
							}
						},
						required: ['operation', 'numbers']
					}
				}
			]
			const expectedResult = { ...parameters, tools: expectedTools }

			// WHEN: Injecting tools for Claude provider
			const result = await mockInjector.injectTools(parameters, 'Claude')

			// THEN: Should return Claude-format tools
			expect(result).toEqual(expectedResult)
			expect(result.model).toBe('claude-3-5-sonnet-20241022')
			expect(result.max_tokens).toBe(4096)
			expect(result.tools).toHaveLength(2)

			// Verify Claude-specific structure
			result.tools.forEach((tool) => {
				expect(tool).toHaveProperty('name')
				expect(tool).toHaveProperty('description')
				expect(tool).toHaveProperty('input_schema')
				expect(tool).not.toHaveProperty('type') // Claude doesn't use 'type: function'
				expect(tool).not.toHaveProperty('function')
			})
		})

		it('should preserve existing Claude parameters', async () => {
			// GIVEN: Claude parameters with multiple settings
			const parameters = {
				model: 'claude-3-opus-20240229',
				max_tokens: 4096,
				temperature: 0.7,
				top_p: 0.9,
				stop_sequences: ['\n\nHuman:']
			}

			// WHEN: Injecting tools
			const result = await mockInjector.injectTools(parameters, 'Claude')

			// THEN: Should preserve all existing parameters
			expect(result.model).toBe('claude-3-opus-20240229')
			expect(result.max_tokens).toBe(4096)
			expect(result.temperature).toBe(0.7)
			expect(result.top_p).toBe(0.9)
			expect(result.stop_sequences).toEqual(['\n\nHuman:'])
			expect(result.tools).toBeDefined()
		})
	})

	describe('Gemini Format Compliance', () => {
		it('should format tools according to Gemini function declaration specification', async () => {
			// GIVEN: Gemini provider parameters
			const parameters = { model: 'gemini-1.5-pro' }
			const expectedTools = [
				{
					functionDeclaration: {
						name: 'test_tool',
						description: 'Test tool for testing',
						parameters: {
							type: 'object',
							properties: {
								param1: { type: 'string', description: 'First parameter' },
								optionalParam: { type: 'number', description: 'Optional parameter' }
							},
							required: ['param1']
						}
					}
				},
				{
					functionDeclaration: {
						name: 'calculate',
						description: 'Perform calculations',
						parameters: {
							type: 'object',
							properties: {
								operation: { type: 'string', description: 'Operation to perform' },
								numbers: {
									type: 'array',
									items: { type: 'number' },
									description: 'Numbers to operate on'
								}
							},
							required: ['operation', 'numbers']
						}
					}
				}
			]
			const expectedResult = { ...parameters, tools: expectedTools }

			// WHEN: Injecting tools for Gemini provider
			const result = await mockInjector.injectTools(parameters, 'Gemini')

			// THEN: Should return Gemini-format tools
			expect(result).toEqual(expectedResult)
			expect(result.model).toBe('gemini-1.5-pro')
			expect(result.tools).toHaveLength(2)

			// Verify Gemini-specific structure
			result.tools.forEach((tool) => {
				expect(tool).toHaveProperty('functionDeclaration')
				expect(tool.functionDeclaration).toHaveProperty('name')
				expect(tool.functionDeclaration).toHaveProperty('description')
				expect(tool.functionDeclaration).toHaveProperty('parameters')
			})
		})

		it('should preserve existing Gemini parameters', async () => {
			// GIVEN: Gemini parameters with multiple settings
			const parameters = {
				model: 'gemini-1.5-flash',
				temperature: 0.8,
				topP: 0.95,
				topK: 40,
				maxOutputTokens: 2048
			}

			// WHEN: Injecting tools
			const result = await mockInjector.injectTools(parameters, 'Gemini')

			// THEN: Should preserve all existing parameters
			expect(result.model).toBe('gemini-1.5-flash')
			expect(result.temperature).toBe(0.8)
			expect(result.topP).toBe(0.95)
			expect(result.topK).toBe(40)
			expect(result.maxOutputTokens).toBe(2048)
			expect(result.tools).toBeDefined()
		})
	})

	describe('Ollama Format Compliance', () => {
		it('should format tools according to Ollama tool specification', async () => {
			// GIVEN: Ollama provider parameters
			const parameters = { model: 'llama3.2' }
			const expectedTools = [
				{
					type: 'function',
					function: {
						name: 'test_tool',
						description: 'Test tool for testing',
						parameters: {
							type: 'object',
							properties: {
								param1: { type: 'string', description: 'First parameter' },
								optionalParam: { type: 'number', description: 'Optional parameter' }
							},
							required: ['param1']
						}
					}
				},
				{
					type: 'function',
					function: {
						name: 'calculate',
						description: 'Perform calculations',
						parameters: {
							type: 'object',
							properties: {
								operation: { type: 'string', description: 'Operation to perform' },
								numbers: {
									type: 'array',
									items: { type: 'number' },
									description: 'Numbers to operate on'
								}
							},
							required: ['operation', 'numbers']
						}
					}
				}
			]
			const expectedResult = { ...parameters, tools: expectedTools }

			// WHEN: Injecting tools for Ollama provider
			const result = await mockInjector.injectTools(parameters, 'Ollama')

			// THEN: Should return Ollama-format tools (similar to OpenAI)
			expect(result).toEqual(expectedResult)
			expect(result.model).toBe('llama3.2')
			expect(result.tools).toHaveLength(2)

			// Verify Ollama-specific structure (should match OpenAI format)
			result.tools.forEach((tool) => {
				expect(tool).toHaveProperty('type', 'function')
				expect(tool).toHaveProperty('function')
				expect(tool.function).toHaveProperty('name')
				expect(tool.function).toHaveProperty('description')
				expect(tool.function).toHaveProperty('parameters')
			})
		})
	})

	describe('Unknown Provider Fallback', () => {
		it('should default to OpenAI format for unknown providers', async () => {
			// GIVEN: Unknown provider parameters
			const parameters = { model: 'unknown-model' }

			// WHEN: Injecting tools for unknown provider
			const result = await mockInjector.injectTools(parameters, 'UnknownProvider')

			// THEN: Should default to OpenAI format
			expect(result.model).toBe('unknown-model')
			expect(result.tools).toBeDefined()
			expect(result.tools).toHaveLength(2)

			// Verify OpenAI format is used as fallback
			result.tools.forEach((tool) => {
				expect(tool).toHaveProperty('type', 'function')
				expect(tool).toHaveProperty('function')
			})
		})
	})
})
