/**
 * Core streaming abstractions
 * Provides provider-agnostic stream management based on llm-chat.md
 */

export { CompletionsStream, type CompletionsStreamOptions, NoOpCompletionsStream } from './CompletionsStream'
export { StreamQueue } from './StreamQueue'
export type {
	ContentEvent,
	ErrorEvent,
	ICompletionsStream,
	StreamEndEvent,
	StreamEvent,
	StreamEventType,
	StreamQueueState,
	TimeoutConfig,
	ToolCall,
	ToolCallsEvent,
	ToolResponse
} from './types'

// Pure utilities (following code-rules.md)
export {
	backoffDelay,
	checkAborted,
	createAbortError,
	isRetryableError,
	waitWithAbort,
	withTimeout
} from './utils'
