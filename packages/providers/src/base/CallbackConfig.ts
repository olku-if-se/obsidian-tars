import type { StreamEvent, ToolCall } from "../streaming";

/**
 * @deprecated Use ComprehensiveCallbacks instead. CallbackConfig is deprecated and will be removed in a future version.
 * Callback configuration for runtime stream events
 * Allows external code to react to streaming events
 */

/**
 * Content chunk callback
 * Called when new content is received from the LLM
 */
export type ContentCallback = (
	chunk: string,
	metadata?: ContentMetadata,
) => void | Promise<void>;

/**
 * Tool call callback
 * Called when the LLM requests tool execution
 * Should return tool responses that will be sent back to the LLM
 */
export type ToolCallCallback = (
	toolCalls: ToolCall[],
) => Promise<ToolCallResponse[]>;

/**
 * Stream start callback
 * Called when a stream begins
 */
export type StreamStartCallback = (
	metadata?: StreamMetadata,
) => void | Promise<void>;

/**
 * Stream end callback
 * Called when a stream completes successfully
 */
export type StreamEndCallback = (
	metadata?: StreamMetadata,
) => void | Promise<void>;

/**
 * Error callback
 * Called when an error occurs during streaming
 */
export type ErrorCallback = (
	error: Error,
	recoverable: boolean,
) => void | Promise<void>;

/**
 * Generic stream event callback
 * Called for every stream event
 */
export type StreamEventCallback = (event: StreamEvent) => void | Promise<void>;

/**
 * Metadata for content chunks
 */
export interface ContentMetadata {
	/** Token count (if available) */
	tokens?: number;

	/** Chunk index in the stream */
	chunkIndex: number;

	/** Timestamp */
	timestamp: number;
}

/**
 * Metadata for streams
 */
export interface StreamMetadata {
	/** Provider name */
	provider: string;

	/** Model name */
	model: string;

	/** Number of messages in conversation */
	messageCount: number;

	/** Timestamp */
	timestamp: number;

	/** Custom metadata */
	[key: string]: unknown;
}

/**
 * Tool call response from callback
 */
export interface ToolCallResponse {
	/** ID of the tool call being responded to */
	tool_call_id: string;

	/** Result content */
	content: string;

	/** Whether execution was successful */
	success: boolean;

	/** Error message if unsuccessful */
	error?: string;
}

/**
 * Complete callback configuration
 */
export interface CallbackConfig {
	/** Called when new content is received */
	onContent?: ContentCallback;

	/** Called when tool calls are requested */
	onToolCall?: ToolCallCallback;

	/** Called when stream starts */
	onStreamStart?: StreamStartCallback;

	/** Called when stream ends */
	onStreamEnd?: StreamEndCallback;

	/** Called when an error occurs */
	onError?: ErrorCallback;

	/** Called for every stream event (includes all event types) */
	onStreamEvent?: StreamEventCallback;
}

/**
 * Empty default callbacks
 */
export const DEFAULT_CALLBACK_CONFIG: CallbackConfig = {};
