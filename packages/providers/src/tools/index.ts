/**
 * Tool management system
 * EventEmitter-based tool execution for LLM providers
 */

export type { ClaudeTool, GeminiTool, OpenAITool } from './format-converters'
// Tool format converters for different providers
export {
	convertToolsForProvider,
	getToolConverter,
	ToolFormatConverters,
	toClaudeTools,
	toGeminiTools,
	toOpenAITools
} from './format-converters'
export { ToolExecutor } from './ToolExecutor'
export { ToolManager } from './ToolManager'
export type {
	ToolDefinition,
	ToolExecutionContext,
	ToolExecutionOptions,
	ToolExecutionResult,
	ToolHandler
} from './types'
