/**
 * Concrete Implementation of MCPToolInjector
 *
 * This class provides the concrete implementation for MCP tool injection into provider parameters.
 * Following TDD approach - tests will fail initially but define expected behavior.
 */

import type { MCPServerManager, MCPToolInjector, ToolExecutor } from '@tars/contracts'
import { createLogger } from '@tars/logger'

const logger = createLogger('providers:mcp-tool-injection-impl')

/**
 * Concrete implementation of Tool Injector
 * Converts MCP tools to provider-specific formats for injection
 */
export class ConcreteMCPToolInjector implements MCPToolInjector {
	constructor(
		private readonly manager: MCPServerManager,
		// biome-ignore lint/correctness/noUnusedPrivateClassMembers: keep it
		private readonly executor: ToolExecutor
	) {
		this.manager = manager
		this.executor = executor
	}

	/**
	 * Inject tools into provider parameters based on provider format
	 */
	async injectTools(parameters: Record<string, unknown>, providerName: string): Promise<Record<string, unknown>> {
		try {
			// Get tool discovery snapshot
			const snapshot = await this.manager.getToolDiscoveryCache().getSnapshot()

			// Build provider-specific tool format
			const tools = this.buildToolsForProvider(providerName, snapshot)

			// Return parameters with tools
			return {
				...parameters,
				tools
			}
		} catch (error) {
			logger.error('Failed to inject tools', error)

			// Fall back to original parameters without tools on error
			console.warn(
				'Falling back to original parameters without tools due to injection failure:',
				error instanceof Error ? error.message : String(error)
			)
			return parameters
		}
	}

	/**
	 * Validate tool schema before conversion
	 */
	private validateToolSchema(tool: any): boolean {
		// Basic validation checks
		if (!tool || typeof tool !== 'object') {
			return false
		}

		// Check required fields
		if (!tool.name || typeof tool.name !== 'string') {
			return false
		}

		// Validate tool name format (provider constraints)
		if (!/^[a-zA-Z0-9_-]{1,64}$/.test(tool.name)) {
			logger.warn('Invalid tool name format', { toolName: tool.name })
			return false
		}

		// Check input schema
		if (!tool.inputSchema || typeof tool.inputSchema !== 'object') {
			return false
		}

		// Basic JSON Schema validation
		const schema = tool.inputSchema
		if (schema.type !== 'object') {
			console.warn(`Tool ${tool.name} has invalid schema: missing or invalid type property`)
			return false
		}

		if (!schema.properties || typeof schema.properties !== 'object') {
			console.warn(`Tool ${tool.name} has invalid schema: missing or invalid properties`)
			return false
		}

		// Validate property types
		for (const [propName, propSchema] of Object.entries(schema.properties)) {
			if (!propSchema || typeof propSchema !== 'object' || !('type' in propSchema) || !propSchema.type) {
				console.warn(`Tool ${tool.name} has invalid property schema for ${propName}: missing type`)
				return false
			}

			// Check for valid JSON Schema types
			const validTypes = ['string', 'number', 'integer', 'boolean', 'array', 'object']
			if (!validTypes.includes(propSchema.type as string)) {
				console.warn(`Tool ${tool.name} has invalid property type for ${propName}: ${propSchema.type}`)
				return false
			}

			// Check for missing descriptions in properties (required for MCP compatibility)
			if (!('description' in propSchema) || !propSchema.description) {
				console.warn(`Tool ${tool.name} property ${propName} is missing description - rejecting tool`)
				return false
			}
		}

		// If required field exists, validate it
		if (schema.required && !Array.isArray(schema.required)) {
			console.warn(`Tool ${tool.name} has invalid required field: must be an array`)
			return false
		}

		return true
	}

	/**
	 * Build tools for specific provider format
	 */
	private buildToolsForProvider(providerName: string, snapshot: any): any[] {
		const lowerName = providerName.toLowerCase()

		// Filter out invalid tools first
		const validTools = snapshot.servers.flatMap((server: any) =>
			server.tools.filter((tool: any) => this.validateToolSchema(tool))
		)

		logger.debug('Filtered valid tools', {
			total: snapshot.servers.reduce((acc: number, server: any) => acc + server.tools.length, 0),
			valid: validTools.length
		})

		// Claude format (anthropic)
		if (lowerName.includes('claude') || lowerName.includes('anthropic')) {
			return validTools.map((tool: any) => ({
				name: tool.name,
				description: tool.description || '',
				input_schema: tool.inputSchema as any
			}))
		}

		// OpenAI format (default for most providers)
		if (
			lowerName.includes('openai') ||
			lowerName.includes('azure') ||
			lowerName.includes('openrouter') ||
			lowerName.includes('deepseek') ||
			lowerName.includes('siliconflow') ||
			lowerName.includes('grok') ||
			lowerName.includes('qwen') ||
			lowerName.includes('kimi') ||
			lowerName.includes('zhipu') ||
			lowerName.includes('doubao') ||
			lowerName.includes('qianfan')
		) {
			return validTools.map((tool: any) => ({
				type: 'function',
				function: {
					name: tool.name,
					description: tool.description || '',
					parameters: tool.inputSchema as any
				}
			}))
		}

		// Ollama format
		if (lowerName.includes('ollama')) {
			return validTools.map((tool: any) => ({
				type: 'function',
				function: {
					name: tool.name,
					description: tool.description || '',
					parameters: tool.inputSchema as unknown
				}
			}))
		}

		// Gemini format (Google function declaration)
		if (lowerName.includes('gemini')) {
			return validTools.map((tool: any) => ({
				functionDeclaration: {
					name: tool.name,
					description: tool.description || '',
					parameters: tool.inputSchema as any
				}
			}))
		}

		// Default to OpenAI format for unknown providers
		return validTools.map((tool: any) => ({
			type: 'function',
			function: {
				name: tool.name,
				description: tool.description || '',
				parameters: tool.inputSchema as any
			}
		}))
	}
}

/**
 * Format conversion utilities for different providers
 */

/**
 * Convert tools to OpenAI format
 */
export function convertToOpenAIFormat(tools: any[]): any[] {
	return tools.map((tool) => ({
		type: 'function',
		function: {
			name: tool.name,
			description: tool.description || '',
			parameters: tool.inputSchema || tool.parameters || {}
		}
	}))
}

/**
 * Convert tools to Claude format
 */
export function convertToClaudeFormat(tools: any[]): any[] {
	return tools.map((tool) => ({
		name: tool.name,
		description: tool.description || '',
		input_schema: tool.inputSchema || tool.parameters || {}
	}))
}

/**
 * Convert tools to Gemini format
 */
export function convertToGeminiFormat(tools: any[]): any[] {
	return tools.map((tool) => ({
		functionDeclaration: {
			name: tool.name,
			description: tool.description || '',
			parameters: tool.inputSchema || tool.parameters || {}
		}
	}))
}

/**
 * Convert tools to Ollama format
 */
export function convertToOllamaFormat(tools: any[]): any[] {
	return tools.map((tool) => ({
		type: 'function',
		function: {
			name: tool.name,
			description: tool.description || '',
			parameters: tool.inputSchema || tool.parameters || {}
		}
	}))
}
