import { EventEmitter } from 'events'
import type { ToolCall, ToolResponse } from '../streaming/types'
import type { ToolExecutionOptions, ToolExecutionResult, ToolHandler } from './types'

/**
 * Manages tool execution via an EventEmitter
 * Based on llm-chat.md architecture
 *
 * Usage:
 * ```typescript
 * const toolManager = new ToolManager()
 *
 * // Register a handler
 * toolManager.on('get_weather', async (toolCall) => {
 *   const args = JSON.parse(toolCall.function.arguments)
 *   const result = await getWeather(args.location)
 *   return {
 *     role: 'tool',
 *     tool_call_id: toolCall.id,
 *     content: JSON.stringify(result)
 *   }
 * })
 *
 * // Execute a tool call
 * const response = await toolManager.execute(toolCall)
 * ```
 */
export class ToolManager extends EventEmitter {
	private executionOptions: ToolExecutionOptions

	constructor(options?: ToolExecutionOptions) {
		super()
		this.executionOptions = options || {}
	}

	/**
	 * Execute a single tool call
	 * Emits the tool name as an event and waits for handler response
	 */
	async execute(toolCall: ToolCall): Promise<ToolResponse> {
		const startTime = Date.now()
		const eventName = toolCall.function.name

		try {
			// Check if handler exists
			if (this.listenerCount(eventName) === 0) {
				return this.createErrorResponse(toolCall.id, `No handler registered for tool '${eventName}'`)
			}

			// Get the first registered handler
			const listener = this.listeners(eventName)[0]

			if (typeof listener !== 'function') {
				return this.createErrorResponse(toolCall.id, `Handler for '${eventName}' is not a function`)
			}

			// Execute handler with timeout if configured
			const handler = listener as ToolHandler
			const response = await this.executeWithTimeout(handler, toolCall)

			return response
		} catch (error) {
			const executionTime = Date.now() - startTime
			const errorMessage = error instanceof Error ? error.message : String(error)

			// Emit error event
			this.emit('tool_error', {
				id: toolCall.id,
				error,
				executionTime,
				success: false
			} as ToolExecutionResult)

			return this.createErrorResponse(toolCall.id, `Tool execution failed: ${errorMessage}`)
		}
	}

	/**
	 * Execute multiple tool calls
	 * Supports parallel or sequential execution
	 */
	async executeMany(toolCalls: ToolCall[]): Promise<ToolResponse[]> {
		const parallel = this.executionOptions.parallel ?? false
		const maxParallel = this.executionOptions.maxParallel ?? 3

		if (parallel) {
			return this.executeParallel(toolCalls, maxParallel)
		}

		return this.executeSequential(toolCalls)
	}

	/**
	 * Execute tool calls in parallel with concurrency limit
	 */
	private async executeParallel(toolCalls: ToolCall[], maxParallel: number): Promise<ToolResponse[]> {
		const results: ToolResponse[] = []
		const executing: Promise<void>[] = []

		for (const toolCall of toolCalls) {
			const promise = this.execute(toolCall).then((response) => {
				results.push(response)
			})

			executing.push(promise)

			// Respect concurrency limit
			if (executing.length >= maxParallel) {
				await Promise.race(executing)
				executing.splice(
					executing.findIndex((p) => p === promise),
					1
				)
			}
		}

		// Wait for remaining executions
		await Promise.all(executing)

		return results
	}

	/**
	 * Execute tool calls sequentially
	 */
	private async executeSequential(toolCalls: ToolCall[]): Promise<ToolResponse[]> {
		const results: ToolResponse[] = []

		for (const toolCall of toolCalls) {
			const response = await this.execute(toolCall)
			results.push(response)
		}

		return results
	}

	/**
	 * Execute handler with timeout
	 */
	private async executeWithTimeout(handler: ToolHandler, toolCall: ToolCall): Promise<ToolResponse> {
		const timeout = this.executionOptions.timeout

		if (!timeout) {
			return handler(toolCall)
		}

		return Promise.race([
			handler(toolCall),
			new Promise<ToolResponse>((_, reject) =>
				setTimeout(() => reject(new Error(`Tool execution timeout after ${timeout}ms`)), timeout)
			)
		])
	}

	/**
	 * Register a tool handler
	 * Alias for EventEmitter.on() with type safety
	 */
	registerHandler(toolName: string, handler: ToolHandler): void {
		this.on(toolName, handler)
	}

	/**
	 * Unregister a tool handler
	 */
	unregisterHandler(toolName: string, handler: ToolHandler): void {
		this.off(toolName, handler)
	}

	/**
	 * Create an error response
	 */
	private createErrorResponse(toolCallId: string, errorMessage: string): ToolResponse {
		return {
			role: 'tool',
			tool_call_id: toolCallId,
			content: `Error: ${errorMessage}`
		}
	}

	/**
	 * Get registered tool names
	 */
	getRegisteredTools(): string[] {
		return this.eventNames().filter((name) => typeof name === 'string') as string[]
	}

	/**
	 * Check if a tool is registered
	 */
	hasHandler(toolName: string): boolean {
		return this.listenerCount(toolName) > 0
	}
}
