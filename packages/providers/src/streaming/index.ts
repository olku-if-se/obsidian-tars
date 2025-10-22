/**
 * Core streaming abstractions
 * Provides provider-agnostic stream management based on llm-chat.md
 */

export { StreamQueue } from './StreamQueue'
export { CompletionsStream, NoOpCompletionsStream, type CompletionsStreamOptions } from './CompletionsStream'
export type {
	StreamEvent,
	StreamEventType,
	ContentEvent,
	ToolCallsEvent,
	StreamEndEvent,
	ErrorEvent,
	ToolCall,
	ToolResponse,
	ICompletionsStream,
	StreamQueueState,
	TimeoutConfig
} from './types'

// Pure utilities (following code-rules.md)
export {
	waitWithAbort,
	checkAborted,
	createAbortError,
	withTimeout,
	backoffDelay,
	isRetryableError
} from './utils'
