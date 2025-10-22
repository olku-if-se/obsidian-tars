/**
 * Tool management system
 * EventEmitter-based tool execution for LLM providers
 */

export { ToolManager } from './ToolManager'
export { ToolExecutor } from './ToolExecutor'
export type {
	ToolHandler,
	ToolDefinition,
	ToolExecutionResult,
	ToolExecutionContext,
	ToolExecutionOptions
} from './types'

// Tool format converters for different providers
export {
	toOpenAITools,
	toClaudeTools,
	toGeminiTools,
	ToolFormatConverters,
	getToolConverter,
	convertToolsForProvider
} from './format-converters'
export type { OpenAITool, ClaudeTool, GeminiTool } from './format-converters'
