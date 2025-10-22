import type { ToolCall, ToolResponse } from '../streaming/types'
import { ToolManager } from './ToolManager'
import type { ToolExecutionOptions } from './types'

/**
 * Helper for creating tool execution functions
 * Based on llm-chat.md toolsExecutor pattern
 *
 * Usage:
 * ```typescript
 * const toolManager = new ToolManager()
 * const executor = ToolExecutor.create(toolManager, messages, queue)
 *
 * // Register on stream event
 * emitter.on('tool_calls', executor)
 * ```
 */
export class ToolExecutor {
	/**
	 * Create a tool executor function
	 * This function will execute tool calls and push a follow-up stream to the queue
	 *
	 * @param toolManager - ToolManager instance with registered handlers
	 * @param messages - Message array to append tool responses to
	 * @param pushStream - Function to push follow-up stream (e.g., queue.push)
	 * @param createStream - Function to create a new stream with updated messages
	 */
	static create<TStreamFactory extends (...args: any[]) => any>(
		toolManager: ToolManager,
		messages: any[],
		pushStream: (stream: any) => void,
		createStream: TStreamFactory
	): (toolCalls: ToolCall[]) => Promise<void> {
		return async (toolCalls: ToolCall[]) => {
			try {
				// Register assistant message with tool calls
				messages.push({
					role: 'assistant',
					content: null,
					tool_calls: toolCalls
				})

				// Execute all tool calls
				const toolResponses = await toolManager.executeMany(toolCalls)

				// Register tool responses in message history
				messages.push(...toolResponses)

				// Create follow-up stream with updated messages
				const followUpStream = createStream(messages)

				// Push to queue for processing
				pushStream(followUpStream)
			} catch (error) {
				// Create error responses for all tool calls
				const errorResponses = toolCalls.map((tc) => ({
					role: 'tool' as const,
					tool_call_id: tc.id,
					content: `Error: ${error instanceof Error ? error.message : String(error)}`
				}))

				messages.push(...errorResponses)

				// Still create follow-up stream so LLM can handle the error
				const followUpStream = createStream(messages)
				pushStream(followUpStream)
			}
		}
	}

	/**
	 * Create a simple executor that doesn't push follow-up streams
	 * Useful for testing or when not using StreamQueue
	 */
	static createSimple(toolManager: ToolManager): (toolCalls: ToolCall[]) => Promise<ToolResponse[]> {
		return async (toolCalls: ToolCall[]) => {
			return toolManager.executeMany(toolCalls)
		}
	}

	/**
	 * Create an executor with custom options
	 */
	static createWithOptions<TStreamFactory extends (...args: any[]) => any>(
		toolManager: ToolManager,
		messages: any[],
		pushStream: (stream: any) => void,
		createStream: TStreamFactory,
		options: ToolExecutionOptions
	): (toolCalls: ToolCall[]) => Promise<void> {
		// Override tool manager options
		const originalOptions = (toolManager as any).executionOptions
		;(toolManager as any).executionOptions = { ...originalOptions, ...options }

		return ToolExecutor.create(toolManager, messages, pushStream, createStream)
	}
}
