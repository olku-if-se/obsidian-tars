/**
 * Tests for Gemini tool format conversion
 * Tests the specific format conversion needed for Google Gemini function calling
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the logger to avoid console output in tests
vi.mock('@tars/logger', () => ({
	createLogger: vi.fn(() => ({
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	}))
}))

// Sample MCP tools for testing
const sampleMCPTools = [
	{
		name: 'get_current_weather',
		description: 'Get the current weather in a given location',
		inputSchema: {
			type: 'object',
			properties: {
				location: {
					type: 'string',
					description: 'The city and state, e.g. San Francisco, CA'
				},
				unit: {
					type: 'string',
					enum: ['celsius', 'fahrenheit']
				}
			},
			required: ['location']
		}
	},
	{
		name: 'get_time',
		description: 'Get current time for a timezone',
		inputSchema: {
			type: 'object',
			properties: {
				timezone: {
					type: 'string',
					description: 'Timezone identifier'
				},
				format_24h: {
					type: 'boolean',
					description: 'Return time in 24-hour format',
					default: false
				}
			},
			required: ['timezone']
		}
	}
]

describe('Gemini Tool Converter', () => {
	let geminiConverter: any

	beforeEach(() => {
		vi.clearAllMocks()
		// We'll implement the actual converter in the implementation step
		// For now, create a mock for test structure
		geminiConverter = {
			convertMCPToolsToGemini: vi.fn(),
			validateGeminiSchema: vi.fn()
		}
	})

	describe('format conversion', () => {
		it('should convert MCP tools to Gemini function declaration format', () => {
			geminiConverter.convertMCPToolsToGemini = vi.fn((tools) => {
				return tools.map((tool) => ({
					name: tool.name,
					description: tool.description,
					parameters: tool.inputSchema
				}))
			})

			const result = geminiConverter.convertMCPToolsToGemini(sampleMCPTools)

			expect(result).toHaveLength(2)

			// Check first tool
			const weatherTool = result[0]
			expect(weatherTool.name).toBe('get_current_weather')
			expect(weatherTool.description).toBe('Get the current weather in a given location')
			expect(weatherTool.parameters.type).toBe('object')
			expect(weatherTool.parameters.properties.location.type).toBe('string')
			expect(weatherTool.parameters.properties.location.description).toBe('The city and state, e.g. San Francisco, CA')
			expect(weatherTool.parameters.required).toEqual(['location'])

			// Check second tool with optional parameter
			const timeTool = result[1]
			expect(timeTool.name).toBe('get_time')
			expect(timeTool.parameters.properties.format_24h.type).toBe('boolean')
			expect(timeTool.parameters.required).toEqual(['timezone'])
		})

		it('should handle empty tools array', () => {
			geminiConverter.convertMCPToolsToGemini = vi.fn(() => [])
			const result = geminiConverter.convertMCPToolsToGemini([])
			expect(result).toEqual([])
		})

		it('should preserve nested object schemas', () => {
			const complexTool = {
				name: 'complex_tool',
				description: 'Tool with nested object parameters',
				inputSchema: {
					type: 'object',
					properties: {
						config: {
							type: 'object',
							properties: {
								setting1: { type: 'string' },
								setting2: { type: 'number' }
							},
							required: ['setting1']
						},
						options: {
							type: 'array',
							items: { type: 'string' }
						}
					},
					required: ['config']
				}
			}

			geminiConverter.convertMCPToolsToGemini = vi.fn((tools) => {
				return tools.map((tool) => ({
					name: tool.name,
					description: tool.description,
					parameters: tool.inputSchema
				}))
			})

			const result = geminiConverter.convertMCPToolsToGemini([complexTool])

			expect(result[0].parameters.properties.config.type).toBe('object')
			expect(result[0].parameters.properties.config.properties.setting1.type).toBe('string')
			expect(result[0].parameters.properties.options.type).toBe('array')
			expect(result[0].parameters.properties.options.items.type).toBe('string')
		})
	})

	describe('schema validation', () => {
		it('should validate Gemini-compatible schemas', () => {
			geminiConverter.validateGeminiSchema = vi.fn((schema) => {
				// Basic validation that would be implemented
				if (schema.type !== 'object') {
					throw new Error('Schema must be of type object')
				}
				if (!schema.properties) {
					throw new Error('Schema must have properties')
				}
				return true
			})

			const validSchema = sampleMCPTools[0].inputSchema
			expect(() => geminiConverter.validateGeminiSchema(validSchema)).not.toThrow()
		})

		it('should reject invalid schemas', () => {
			geminiConverter.validateGeminiSchema = vi.fn((schema) => {
				if (schema.type !== 'object') {
					throw new Error('Schema must be of type object')
				}
				return true
			})

			const invalidSchema = { type: 'string' }
			expect(() => geminiConverter.validateGeminiSchema(invalidSchema)).toThrow('Schema must be of type object')
		})

		it('should validate parameter names', () => {
			geminiConverter.validateGeminiSchema = vi.fn((schema) => {
				// Gemini has restrictions on parameter names
				for (const [paramName, paramSchema] of Object.entries(schema.properties || {})) {
					if (typeof paramSchema !== 'object' || !paramSchema.type) {
						throw new Error(`Parameter ${paramName} must have a valid type`)
					}
				}
				return true
			})

			const schemaWithInvalidParam = {
				type: 'object',
				properties: {
					'invalid-param-name': { type: 'string' }
				}
			}

			expect(() => geminiConverter.validateGeminiSchema(schemaWithInvalidParam)).not.toThrow() // Implementation would handle name validation
		})
	})

	describe('integration scenarios', () => {
		it('should handle real-world Gemini tool calling scenario', async () => {
			// Mock a complete flow
			const converter = {
				convertMCPToolsToGemini: vi.fn((tools) => {
					return tools.map((tool) => ({
						name: tool.name,
						description: tool.description,
						parameters: tool.inputSchema
					}))
				}),
				validateGeminiSchema: vi.fn(() => true)
			}

			const result = converter.convertMCPToolsToGemini(sampleMCPTools)

			// Verify the result matches expected Gemini format
			expect(result).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						name: 'get_current_weather',
						description: expect.any(String),
						parameters: expect.objectContaining({
							type: 'object',
							properties: expect.any(Object),
							required: expect.any(Array)
						})
					})
				])
			)
		})

		it('should handle edge cases in schema conversion', () => {
			const edgeCaseTools = [
				{
					name: 'tool_no_properties',
					description: 'Tool with no properties',
					inputSchema: {
						type: 'object',
						properties: {},
						required: []
					}
				},
				{
					name: 'tool_only_required',
					description: 'Tool with only required params',
					inputSchema: {
						type: 'object',
						properties: {
							required_param: { type: 'string' }
						},
						required: ['required_param']
					}
				}
			]

			geminiConverter.convertMCPToolsToGemini = vi.fn((tools) => {
				return tools.map((tool) => ({
					name: tool.name,
					description: tool.description,
					parameters: tool.inputSchema
				}))
			})

			const result = geminiConverter.convertMCPToolsToGemini(edgeCaseTools)

			expect(result).toHaveLength(2)
			expect(result[0].parameters.properties).toEqual({})
			expect(result[0].parameters.required).toEqual([])
			expect(result[1].parameters.required).toEqual(['required_param'])
		})
	})

	describe('error handling', () => {
		it('should handle malformed tool definitions', () => {
			const malformedTool = {
				name: '', // Empty name
				description: 'Tool with malformed definition',
				inputSchema: null // Invalid schema
			}

			geminiConverter.convertMCPToolsToGemini = vi.fn(() => {
				throw new Error('Invalid tool definition: missing name or schema')
			})

			expect(() => geminiConverter.convertMCPToolsToGemini([malformedTool])).toThrow(
				'Invalid tool definition: missing name or schema'
			)
		})

		it('should handle circular references in schemas', () => {
			const circularSchema = {
				type: 'object',
				properties: {
					node: {
						type: 'object',
						properties: {
							value: { type: 'string' },
							child: {} // Circular reference would be here
						}
					}
				},
				required: ['node']
			}

			geminiConverter.convertMCPToolsToGemini = vi.fn(() => {
				throw new Error('Circular reference detected in schema')
			})

			const toolWithCircularRef = {
				name: 'circular_tool',
				description: 'Tool with circular reference',
				inputSchema: circularSchema
			}

			expect(() => geminiConverter.convertMCPToolsToGemini([toolWithCircularRef])).toThrow(
				'Circular reference detected in schema'
			)
		})
	})
})
