/**
 * Comprehensive Callback System for LLM Streaming
 *
 * Design Principles:
 * 1. Allow tool injection into provider setup
 * 2. Allow message transformation before/after processing
 * 3. Allow chunk interception (pre/post processing)
 * 4. Provide utility events (start, end, error, retry, timeout warnings)
 */

import type { Message } from '@tars/contracts'
import type { StreamEvent, ToolCall } from '../streaming'

// ============================================================================
// LIFECYCLE HOOKS
// ============================================================================

/**
 * Called before streaming starts
 * Allows modification of initial setup and messages
 */
export interface BeforeStreamStartHook {
	/** Original messages to be sent */
	messages: Message[]
	/** Provider name */
	provider: string
	/** Model name */
	model: string
	/** Tools available (can be modified) */
	tools?: ToolDefinition[]
	/** Provider-specific options (can be modified) */
	providerOptions?: Record<string, unknown>
}

/**
 * Result from beforeStreamStart hook
 * Consumer can modify messages, tools, and options
 */
export interface BeforeStreamStartResult {
	/** Modified messages (optional, defaults to original) */
	messages?: Message[]
	/** Modified tools (optional, defaults to original) */
	tools?: ToolDefinition[]
	/** Modified provider options (optional, defaults to original) */
	providerOptions?: Record<string, unknown>
	/** Cancel streaming if true */
	cancel?: boolean
	/** Reason for cancellation */
	cancelReason?: string
}

/**
 * Called when stream successfully starts
 */
export interface OnStreamStartHook {
	provider: string
	model: string
	messageCount: number
	hasTools: boolean
	timestamp: number
}

/**
 * Called when stream completes successfully
 */
export interface OnStreamEndHook {
	provider: string
	model: string
	totalChunks: number
	totalTokens?: number
	duration: number
	timestamp: number
}

// ============================================================================
// CHUNK/MESSAGE HOOKS
// ============================================================================

/**
 * Called BEFORE processing each chunk
 * Allows chunk inspection and modification
 */
export interface BeforeChunkHook {
	/** Raw chunk from provider */
	chunk: string
	/** Chunk index */
	index: number
	/** Accumulated content so far */
	accumulated: string
	/** Timestamp */
	timestamp: number
}

/**
 * Result from beforeChunk hook
 */
export interface BeforeChunkResult {
	/** Modified chunk (optional, defaults to original) */
	chunk?: string
	/** Skip this chunk if true */
	skip?: boolean
	/** Additional metadata to attach */
	metadata?: Record<string, unknown>
}

/**
 * Called AFTER processing each chunk
 * Allows post-processing and side effects
 */
export interface AfterChunkHook {
	/** Original chunk */
	originalChunk: string
	/** Processed chunk (after any modifications) */
	processedChunk: string
	/** Chunk index */
	index: number
	/** Accumulated content */
	accumulated: string
	/** Processing duration (ms) */
	duration: number
	/** Timestamp */
	timestamp: number
}

// ============================================================================
// TOOL HOOKS
// ============================================================================

/**
 * Called when tools need to be injected
 * Allows consumer to provide tools to the provider
 */
export interface OnToolsRequestHook {
	provider: string
	model: string
	/** Current messages in conversation */
	messages: Message[]
}

/**
 * Result from onToolsRequest hook
 */
export interface OnToolsRequestResult {
	/** Tools to inject into provider */
	tools: ToolDefinition[]
	/** Tool execution handler */
	executor?: ToolExecutor
}

/**
 * Called when LLM requests tool execution
 */
export interface OnToolCallHook {
	/** Tool calls requested by LLM */
	toolCalls: ToolCall[]
	/** Current conversation context */
	messages: Message[]
	/** Provider name */
	provider: string
}

/**
 * Result from onToolCall hook
 */
export interface OnToolCallResult {
	/** Tool execution results */
	responses: ToolCallResponse[]
	/** Whether to continue streaming after tool execution */
	continueStreaming?: boolean
}

/**
 * Tool definition (provider-agnostic)
 */
export interface ToolDefinition {
	type: 'function'
	function: {
		name: string
		description: string
		parameters: Record<string, unknown>
	}
}

/**
 * Tool executor function
 */
export type ToolExecutor = (toolCalls: ToolCall[]) => Promise<ToolCallResponse[]>

/**
 * Tool call response
 */
export interface ToolCallResponse {
	tool_call_id: string
	content: string
	success: boolean
	error?: string
}

// ============================================================================
// ERROR & RETRY HOOKS
// ============================================================================

/**
 * Called when an error occurs
 */
export interface OnErrorHook {
	error: Error
	/** Whether error is recoverable */
	recoverable: boolean
	/** Current retry attempt (0 = first try) */
	attemptNumber: number
	/** Provider name */
	provider: string
	/** Stack trace */
	stack?: string
}

/**
 * Result from onError hook
 */
export interface OnErrorResult {
	/** Whether to retry */
	retry?: boolean
	/** Delay before retry (ms) */
	retryDelay?: number
	/** Show notification to user */
	notify?: boolean
	/** Notification message */
	notificationMessage?: string
}

/**
 * Called before retry attempt
 */
export interface OnBeforeRetryHook {
	/** Error that triggered retry */
	error: Error
	/** Retry attempt number (1-indexed) */
	attemptNumber: number
	/** Max retry attempts configured */
	maxAttempts: number
	/** Delay before this retry (ms) */
	retryDelay: number
	/** Provider name */
	provider: string
}

/**
 * Called after successful retry
 */
export interface OnRetrySuccessHook {
	/** Original error */
	error: Error
	/** Number of attempts until success */
	attempts: number
	/** Total retry duration (ms) */
	duration: number
}

// ============================================================================
// TIMEOUT & PERFORMANCE HOOKS
// ============================================================================

/**
 * Called when approaching timeout (75% of allocated time)
 */
export interface OnLongWaitingHook {
	/** Elapsed time (ms) */
	elapsed: number
	/** Total timeout configured (ms) */
	timeout: number
	/** Percentage of timeout elapsed */
	percentage: number
	/** Provider name */
	provider: string
	/** Chunks received so far */
	chunksReceived: number
}

/**
 * Result from onLongWaiting hook
 */
export interface OnLongWaitingResult {
	/** Extend timeout by this amount (ms) */
	extendTimeout?: number
	/** Show warning to user */
	showWarning?: boolean
	/** Warning message */
	warningMessage?: string
}

/**
 * Called on timeout
 */
export interface OnTimeoutHook {
	/** Timeout duration (ms) */
	timeout: number
	/** Chunks received before timeout */
	chunksReceived: number
	/** Partial content accumulated */
	partialContent: string
	/** Provider name */
	provider: string
}

/**
 * Called for every chunk of content
 */
export interface OnContentHook {
	/** Chunk index */
	chunkIndex: number
	/** Tokens processed stats */
	tokens?: unknown
	/** Timestamp */
	timestamp: number
}

// ============================================================================
// COMPREHENSIVE CALLBACK CONFIGURATION
// ============================================================================

/**
 * Complete callback configuration with all hooks
 */
export interface ComprehensiveCallbacks {
	// ===== Lifecycle Hooks =====

	/** Called BEFORE streaming starts - allows message/tool modification */
	beforeStreamStart?: (hook: BeforeStreamStartHook) => Promise<BeforeStreamStartResult>

	/** Called AFTER stream starts successfully */
	onStreamStart?: (hook: OnStreamStartHook) => Promise<void>

	/** Called when stream completes successfully */
	onStreamEnd?: (hook: OnStreamEndHook) => Promise<void>

	// ===== Chunk Hooks =====

	/** Called BEFORE processing each chunk */
	beforeChunk?: (hook: BeforeChunkHook) => Promise<BeforeChunkResult>

	/** Called AFTER processing each chunk */
	afterChunk?: (hook: AfterChunkHook) => Promise<void>

	/** Called for every chunk of content */
	onContentChunk?: (hook: OnContentHook) => Promise<void>

	// ===== Tool Hooks =====

	/** Called when provider needs tools */
	onToolsRequest?: (hook: OnToolsRequestHook) => Promise<OnToolsRequestResult>

	/** Called when LLM requests tool execution */
	onToolCall?: (hook: OnToolCallHook) => Promise<OnToolCallResult>

	// ===== Error & Retry Hooks =====

	/** Called when error occurs */
	onError?: (hook: OnErrorHook) => Promise<OnErrorResult>

	/** Called before retry attempt */
	onBeforeRetry?: (hook: OnBeforeRetryHook) => Promise<void>

	/** Called after successful retry */
	onRetrySuccess?: (hook: OnRetrySuccessHook) => Promise<void>

	// ===== Timeout & Performance Hooks =====

	/** Called at 75% of timeout duration */
	onLongWaiting?: (hook: OnLongWaitingHook) => Promise<OnLongWaitingResult>

	/** Called on timeout */
	onTimeout?: (hook: OnTimeoutHook) => Promise<void>

	// ===== Generic Event Hook =====

	/** Called for every stream event (low-level) */
	onStreamEvent?: (event: StreamEvent) => Promise<void>
}

/**
 * Empty default configuration
 */
export const DEFAULT_COMPREHENSIVE_CALLBACKS: ComprehensiveCallbacks = {}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Callback execution context
 * Internal state passed through callback chain
 */
export interface CallbackContext {
	provider: string
	model: string
	startTime: number
	chunkCount: number
	accumulated: string
	attemptNumber: number
	metadata: Record<string, unknown>
}

/**
 * Callback execution result
 * Returned after all callbacks processed
 */
export interface CallbackExecutionResult {
	modified: boolean
	cancelled: boolean
	cancelReason?: string
	metadata?: Record<string, unknown>
}
