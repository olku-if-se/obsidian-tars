/**
 * Core streaming types for provider abstraction
 * Based on llm-chat.md architecture
 */

/**
 * Stream event types emitted during LLM interaction
 */
export type StreamEventType = 'content' | 'tool_calls' | 'stream_end' | 'error'

/**
 * Generic stream event structure
 */
export interface StreamEvent<T = any> {
	type: StreamEventType
	data: T
}

/**
 * Content chunk event
 */
export interface ContentEvent extends StreamEvent<string> {
	type: 'content'
	data: string
}

/**
 * Tool call request event
 */
export interface ToolCallsEvent extends StreamEvent<ToolCall[]> {
	type: 'tool_calls'
	data: ToolCall[]
}

/**
 * Stream completion event
 */
export interface StreamEndEvent extends StreamEvent<null> {
	type: 'stream_end'
	data: null
}

/**
 * Error event
 */
export interface ErrorEvent extends StreamEvent<Error> {
	type: 'error'
	data: Error
}

/**
 * Tool call structure (provider-agnostic)
 */
export interface ToolCall {
	id: string
	type: 'function'
	function: {
		name: string
		arguments: string // JSON string
	}
}

/**
 * Tool response structure
 */
export interface ToolResponse {
	role: 'tool'
	tool_call_id: string
	content: string
}

/**
 * Async iterable interface for completion streams
 */
export interface ICompletionsStream extends AsyncIterable<StreamEvent> {
	/**
	 * Get the underlying async iterator
	 */
	[Symbol.asyncIterator](): AsyncIterableIterator<StreamEvent>
}

/**
 * Stream queue state
 */
export type StreamQueueState = 'idle' | 'processing' | 'closed' | 'error'

/**
 * Configuration for timeout behavior
 */
export interface TimeoutConfig {
	/** Timeout in milliseconds for each iteration */
	timeoutMs: number
	/** Whether to abort on timeout */
	abortOnTimeout: boolean
}
