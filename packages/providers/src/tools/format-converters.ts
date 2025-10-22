/**
 * Tool format converters for different providers
 * Based on provider documentation in packages/providers/docs/
 */

import type { ToolDefinition } from './types'

/**
 * JSON Schema type (simplified)
 */
export type JSONSchema = Record<string, unknown>

/**
 * OpenAI tool format (also used by Ollama, Grok, Azure, Deepseek)
 * @see packages/providers/docs/openai.md
 */
export interface OpenAITool {
	type: 'function'
	function: {
		name: string
		description: string
		parameters: JSONSchema
	}
}

/**
 * Claude (Anthropic) tool format
 * @see packages/providers/docs/claude.md
 */
export interface ClaudeTool {
	name: string
	description: string
	input_schema: JSONSchema
}

/**
 * Gemini (Google) tool format
 * @see packages/providers/docs/gemini.md
 */
export interface GeminiTool {
	functionDeclaration: {
		name: string
		description: string
		parameters: {
			type: 'object'
			properties: Record<string, unknown>
			required?: string[]
		}
	}
}

/**
 * Convert unified tool definition to OpenAI format
 * Used by: OpenAI, Ollama, Grok, Azure, Deepseek
 */
export const toOpenAITools = (tools: ToolDefinition[]): OpenAITool[] => {
	return tools.map((tool) => ({
		type: 'function' as const,
		function: {
			name: tool.function.name,
			description: tool.function.description,
			parameters: tool.function.parameters
		}
	}))
}

/**
 * Convert unified tool definition to Claude format
 * Used by: Claude (Anthropic)
 */
export const toClaudeTools = (tools: ToolDefinition[]): ClaudeTool[] => {
	return tools.map((tool) => ({
		name: tool.function.name,
		description: tool.function.description,
		input_schema: tool.function.parameters
	}))
}

/**
 * Convert unified tool definition to Gemini format
 * Used by: Gemini (Google)
 */
export const toGeminiTools = (tools: ToolDefinition[]): GeminiTool[] => {
	return tools.map((tool) => {
		const params = tool.function.parameters

		return {
			functionDeclaration: {
				name: tool.function.name,
				description: tool.function.description,
				parameters: {
					type: 'object',
					properties: params.properties || {},
					required: params.required
				}
			}
		}
	})
}

/**
 * Provider-specific tool format converters
 * Maps provider names to their converter functions
 */
export const ToolFormatConverters = {
	openai: toOpenAITools,
	claude: toClaudeTools,
	ollama: toOpenAITools, // OpenAI-compatible
	gemini: toGeminiTools,
	grok: toOpenAITools, // OpenAI-compatible
	azure: toOpenAITools, // OpenAI-compatible
	deepseek: toOpenAITools, // OpenAI-compatible
	siliconflow: toOpenAITools, // OpenAI-compatible
	qianfan: toOpenAITools, // Assume OpenAI-compatible
	qwen: toOpenAITools, // Assume OpenAI-compatible
	zhipu: toOpenAITools, // Assume OpenAI-compatible
	doubao: toOpenAITools, // Assume OpenAI-compatible
	kimi: toOpenAITools // Assume OpenAI-compatible
} as const

/**
 * Tool converter function type
 */
export type ToolConverter = (tools: ToolDefinition[]) => Array<OpenAITool | ClaudeTool | GeminiTool>

/**
 * Get tool converter for a provider
 */
export const getToolConverter = (providerName: string): ToolConverter => {
	const normalizedName = providerName.toLowerCase() as keyof typeof ToolFormatConverters

	return ToolFormatConverters[normalizedName] || toOpenAITools
}

/**
 * Convert tools to provider-specific format
 */
export const convertToolsForProvider = (
	tools: ToolDefinition[],
	providerName: string
): Array<OpenAITool | ClaudeTool | GeminiTool> => {
	const converter = getToolConverter(providerName)
	return converter(tools)
}
