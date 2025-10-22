/**
 * Tool management types
 * Provides EventEmitter-based tool execution
 */

import type { ToolCall, ToolResponse } from '../streaming/types'

/**
 * Tool handler function
 * Receives a tool call and returns a tool response
 */
export type ToolHandler = (toolCall: ToolCall) => Promise<ToolResponse>

/**
 * Tool definition (provider-agnostic)
 */
export interface ToolDefinition {
	type: 'function'
	function: {
		name: string
		description: string
		parameters: Record<string, any> // JSON Schema
	}
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
	/** Tool call ID */
	id: string

	/** Handler result */
	response: ToolResponse

	/** Execution time in milliseconds */
	executionTime: number

	/** Whether execution was successful */
	success: boolean

	/** Error if execution failed */
	error?: Error
}

/**
 * Tool execution context
 */
export interface ToolExecutionContext {
	/** Provider name */
	provider: string

	/** Model name */
	model: string

	/** Conversation context */
	conversationId?: string

	/** Additional metadata */
	metadata?: Record<string, any>
}

/**
 * Tool execution options
 */
export interface ToolExecutionOptions {
	/** Maximum execution time in milliseconds */
	timeout?: number

	/** Whether to execute tools in parallel */
	parallel?: boolean

	/** Maximum number of parallel executions */
	maxParallel?: number

	/** Context information */
	context?: ToolExecutionContext
}
