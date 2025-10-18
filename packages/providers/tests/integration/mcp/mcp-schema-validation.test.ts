/**
 * MCP Schema Validation Tests
 *
 * Tests validation and sanitization of MCP tool schemas.
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
const createMockMCPServerManagerWithInvalidSchema = () => ({
	getToolDiscoveryCache: vi.fn().mockReturnValue({
		getSnapshot: vi.fn().mockResolvedValue({
			mapping: new Map([
				['invalid_tool', { id: 'server1', name: 'Test Server' }],
				['malformed_tool', { id: 'server1', name: 'Test Server' }],
				['valid_tool', { id: 'server1', name: 'Test Server' }]
			]),
			servers: [
				{
					serverId: 'server1',
					serverName: 'Test Server',
					tools: [
						{
							name: 'invalid_tool',
							description: 'Tool with invalid schema',
							inputSchema: {
								// Missing type property
								properties: {
									param1: { type: 'invalid-type', description: 'Invalid type' }
								},
								required: ['param1']
							}
						},
						{
							name: 'malformed_tool',
							description: 'Tool with malformed schema',
							inputSchema: {
								type: 'object',
								properties: {
									// Missing description
									param1: { type: 'string' }
								},
								required: ['param1']
							}
						},
						{
							name: 'valid_tool',
							description: 'Valid tool for testing',
							inputSchema: {
								type: 'object',
								properties: {
									param1: { type: 'string', description: 'Valid parameter' },
									optionalParam: {
										type: 'number',
										description: 'Optional parameter',
										default: 42
									}
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

const createMockMCPServerManagerWithEdgeCases = () => ({
	getToolDiscoveryCache: vi.fn().mockReturnValue({
		getSnapshot: vi.fn().mockResolvedValue({
			mapping: new Map([
				['empty_schema_tool', { id: 'server1', name: 'Test Server' }],
				['circular_ref_tool', { id: 'server1', name: 'Test Server' }],
				['deeply_nested_tool', { id: 'server1', name: 'Test Server' }]
			]),
			servers: [
				{
					serverId: 'server1',
					serverName: 'Test Server',
					tools: [
						{
							name: 'empty_schema_tool',
							description: 'Tool with empty schema',
							inputSchema: {}
						},
						{
							name: 'circular_ref_tool',
							description: 'Tool with potential circular reference',
							inputSchema: {
								type: 'object',
								properties: {
									self: {
										type: 'object',
										description: 'Potential circular reference'
									}
								}
							}
						},
						{
							name: 'deeply_nested_tool',
							description: 'Tool with deeply nested schema',
							inputSchema: {
								type: 'object',
								properties: {
									level1: {
										type: 'object',
										properties: {
											level2: {
												type: 'object',
												properties: {
													level3: {
														type: 'object',
														properties: {
															level4: {
																type: 'string',
																description: 'Deeply nested parameter'
															}
														}
													}
												}
											}
										}
									}
								}
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

describe('MCP Schema Validation', () => {
	let mockInjector: MCPToolInjector
	let mockManager: any
	let mockExecutor: any

	beforeEach(() => {
		mockExecutor = createMockToolExecutor()
	})

	describe('Schema Validation and Sanitization', () => {
		beforeEach(() => {
			mockManager = createMockMCPServerManagerWithInvalidSchema()
			mockInjector = new ConcreteMCPToolInjector(mockManager, mockExecutor)
		})

		it('should filter out tools with invalid schemas', async () => {
			// GIVEN: Provider parameters and tools with invalid schemas
			const parameters = { model: 'gpt-4', temperature: 0.7 }

			// WHEN: Injecting tools with validation
			const result = await mockInjector.injectTools(parameters, 'OpenAI')

			// THEN: Should only include valid tools
			expect(result.tools).toBeDefined()
			expect(result.tools).toHaveLength(1) // Only valid_tool should remain

			// Verify the valid tool is properly formatted
			const validTool = result.tools[0]
			expect(validTool.type).toBe('function')
			expect(validTool.function.name).toBe('valid_tool')
			expect(validTool.function.description).toBe('Valid tool for testing')
		})

		it('should sanitize malformed schema elements', async () => {
			// GIVEN: Tool with malformed schema
			const parameters = { model: 'claude-3-sonnet', max_tokens: 4096 }

			// WHEN: Injecting tools with schema sanitization
			const result = await mockInjector.injectTools(parameters, 'Claude')

			// THEN: Should handle malformed elements gracefully
			expect(result.tools).toBeDefined()
			// Invalid tools should be filtered out
			if (result.tools.length > 0) {
				result.tools.forEach((tool) => {
					// Verify all remaining tools have proper structure
					expect(tool).toHaveProperty('name')
					expect(tool).toHaveProperty('description')
					expect(tool).toHaveProperty('input_schema')
				})
			}
		})

		it('should log warnings for invalid schemas', async () => {
			// GIVEN: Tools with invalid schemas
			const parameters = { model: 'gemini-1.5-pro' }

			// WHEN: Injecting tools with validation
			await mockInjector.injectTools(parameters, 'Gemini')

			// THEN: Should log warnings for invalid tools
			expect(console.warn).toHaveBeenCalled()
			// Check that warnings mention invalid schema handling
			const warnCalls = vi.mocked(console.warn).mock.calls
			const hasInvalidSchemaWarning = warnCalls.some(
				(call) => JSON.stringify(call).includes('invalid') || JSON.stringify(call).includes('schema')
			)
			expect(hasInvalidSchemaWarning).toBe(true)
		})
	})

	describe('Edge Case Handling', () => {
		beforeEach(() => {
			mockManager = createMockMCPServerManagerWithEdgeCases()
			mockInjector = new ConcreteMCPToolInjector(mockManager, mockExecutor)
		})

		it('should handle empty schema objects', async () => {
			// GIVEN: Tool with empty schema
			const parameters = { model: 'gpt-4' }

			// WHEN: Injecting tools with empty schema
			const result = await mockInjector.injectTools(parameters, 'OpenAI')

			// THEN: Should handle empty schema gracefully
			expect(result.tools).toBeDefined()
			// Tools with empty schemas should either be included with minimal structure
			// or filtered out based on validation rules
		})

		it('should handle deeply nested schemas', async () => {
			// GIVEN: Tool with deeply nested schema
			const parameters = { model: 'claude-3-sonnet' }

			// WHEN: Injecting tools with deeply nested schema
			const result = await mockInjector.injectTools(parameters, 'Claude')

			// THEN: Should preserve deep nesting without crashes
			expect(result.tools).toBeDefined()
			if (result.tools.length > 0) {
				const deepTool = result.tools.find((tool) => tool.name === 'deeply_nested_tool')
				if (deepTool) {
					// Verify the nested structure is preserved
					expect(deepTool.input_schema).toBeDefined()
					expect(deepTool.input_schema.properties).toBeDefined()
				}
			}
		})

		it('should prevent infinite recursion in circular references', async () => {
			// GIVEN: Tool with potential circular reference
			const parameters = { model: 'gemini-1.5-pro' }

			// WHEN: Injecting tools with potential circular references
			const result = await mockInjector.injectTools(parameters, 'Gemini')

			// THEN: Should complete without infinite recursion
			expect(result.tools).toBeDefined()
			// Should not hang or crash
			expect(result).toHaveProperty('model')
		})
	})

	describe('Schema Type Validation', () => {
		it('should validate JSON Schema types correctly', async () => {
			// GIVEN: Mock manager with various JSON Schema types
			const mockManagerWithTypes = {
				getToolDiscoveryCache: vi.fn().mockReturnValue({
					getSnapshot: vi.fn().mockResolvedValue({
						mapping: new Map([['typed_tool', { id: 'server1', name: 'Test Server' }]]),
						servers: [
							{
								serverId: 'server1',
								serverName: 'Test Server',
								tools: [
									{
										name: 'typed_tool',
										description: 'Tool with various types',
										inputSchema: {
											type: 'object',
											properties: {
												stringProp: { type: 'string', description: 'String property' },
												numberProp: { type: 'number', description: 'Number property' },
												booleanProp: { type: 'boolean', description: 'Boolean property' },
												arrayProp: {
													type: 'array',
													items: { type: 'string' },
													description: 'Array property'
												},
												objectProp: {
													type: 'object',
													properties: {
														nested: { type: 'string' }
													},
													description: 'Object property'
												}
											},
											required: ['stringProp']
										}
									}
								]
							}
						]
					})
				}),
				listServers: vi.fn().mockReturnValue([{ id: 'server1', name: 'Test Server', enabled: true }]),
				getClient: vi.fn()
			}

			mockInjector = new ConcreteMCPToolInjector(mockManagerWithTypes, mockExecutor)
			const parameters = { model: 'gpt-4' }

			// WHEN: Injecting tools with various types
			const result = await mockInjector.injectTools(parameters, 'OpenAI')

			// THEN: Should preserve all valid JSON Schema types
			expect(result.tools).toBeDefined()
			expect(result.tools).toHaveLength(1)

			const tool = result.tools[0]
			const schema = tool.function.parameters

			expect(schema.properties.stringProp.type).toBe('string')
			expect(schema.properties.numberProp.type).toBe('number')
			expect(schema.properties.booleanProp.type).toBe('boolean')
			expect(schema.properties.arrayProp.type).toBe('array')
			expect(schema.properties.objectProp.type).toBe('object')
			expect(schema.required).toEqual(['stringProp'])
		})

		it('should handle enum validation', async () => {
			// GIVEN: Tool with enum properties
			const mockManagerWithEnum = {
				getToolDiscoveryCache: vi.fn().mockReturnValue({
					getSnapshot: vi.fn().mockResolvedValue({
						mapping: new Map([['enum_tool', { id: 'server1', name: 'Test Server' }]]),
						servers: [
							{
								serverId: 'server1',
								serverName: 'Test Server',
								tools: [
									{
										name: 'enum_tool',
										description: 'Tool with enum properties',
										inputSchema: {
											type: 'object',
											properties: {
												enumProp: {
													type: 'string',
													enum: ['option1', 'option2', 'option3'],
													description: 'Enum property'
												}
											},
											required: ['enumProp']
										}
									}
								]
							}
						]
					})
				}),
				listServers: vi.fn().mockReturnValue([{ id: 'server1', name: 'Test Server', enabled: true }]),
				getClient: vi.fn()
			}

			mockInjector = new ConcreteMCPToolInjector(mockManagerWithEnum, mockExecutor)
			const parameters = { model: 'claude-3-sonnet' }

			// WHEN: Injecting tools with enum properties
			const result = await mockInjector.injectTools(parameters, 'Claude')

			// THEN: Should preserve enum validation
			expect(result.tools).toBeDefined()
			expect(result.tools).toHaveLength(1)

			const tool = result.tools[0]
			const enumProp = tool.input_schema.properties.enumProp

			expect(enumProp.type).toBe('string')
			expect(enumProp.enum).toEqual(['option1', 'option2', 'option3'])
		})
	})

	describe('Error Recovery', () => {
		it('should handle schema validation errors gracefully', async () => {
			// GIVEN: Mock manager that throws schema validation error
			const mockManagerWithError = {
				getToolDiscoveryCache: vi.fn().mockReturnValue({
					getSnapshot: vi.fn().mockRejectedValue(new Error('Schema validation failed'))
				}),
				listServers: vi.fn().mockReturnValue([]),
				getClient: vi.fn()
			}

			mockInjector = new ConcreteMCPToolInjector(mockManagerWithError, mockExecutor)
			const parameters = { model: 'gpt-4' }

			// WHEN: Injecting tools with validation error
			const result = await mockInjector.injectTools(parameters, 'OpenAI')

			// THEN: Should handle error gracefully
			expect(result).toBeDefined()
			expect(result.model).toBe('gpt-4')
			// Should not crash, may return empty tools or original parameters
		})
	})
})
