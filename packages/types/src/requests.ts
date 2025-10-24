/**
 * Request and response types for AI providers
 */

/**
 * AI request interface
 */
export interface AIRequest {
  /** Array of messages to process */
  messages: Message[]
  /** Target provider ID */
  providerId: string
  /** Request options */
  options?: AIRequestOptions
  /** Request metadata */
  metadata?: RequestMetadata
}

/**
 * AI request options
 */
export interface AIRequestOptions {
  /** Maximum tokens to generate */
  maxTokens?: number
  /** Temperature for response randomness (0.0-2.0) */
  temperature?: number
  /** Top probability sampling */
  topP?: number
  /** Frequency penalty */
  frequencyPenalty?: number
  /** Presence penalty */
  presencePenalty?: number
  /** Stop sequences */
  stop?: string[]
  /** Stream response */
  stream?: boolean
  /** Include reasoning */
  includeReasoning?: boolean
  /** Custom parameters */
  parameters?: Record<string, unknown>
}

/**
 * Request metadata
 */
export interface RequestMetadata {
  /** Request timestamp */
  timestamp: Date
  /** Request source */
  source: string
  /** Request ID */
  requestId: string
  /** Session ID */
  sessionId?: string
  /** User context */
  userContext?: Record<string, unknown>
}

/**
 * AI response interface
 */
export interface AIResponse {
  /** Response content */
  content: string
  /** Response metadata */
  metadata: ResponseMetadata
  /** Token usage information */
  usage?: TokenUsage
  /** Reasoning content if available */
  reasoning?: string
}

/**
 * Response metadata
 */
export interface ResponseMetadata {
  /** Provider used */
  provider: string
  /** Model used */
  model: string
  /** Response timestamp */
  timestamp: Date
  /** Processing time in milliseconds */
  processingTime: number
  /** Request ID */
  requestId: string
  /** Finish reason */
  finishReason?: 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'error'
  /** Additional metadata */
  [key: string]: unknown
}

/**
 * Token usage information
 */
export interface TokenUsage {
  /** Input tokens used */
  promptTokens: number
  /** Output tokens generated */
  completionTokens: number
  /** Total tokens used */
  totalTokens: number
}

/**
 * Request controller for managing async requests
 */
export interface RequestController {
  /** Abort controller for cancellation */
  abortController: AbortController
  /** Whether request is active */
  isActive: boolean
  /** Request start time */
  startTime: Date
  /** Request metadata */
  metadata: RequestMetadata
  /** Current status */
  status: RequestStatus
  /** Error information if request failed */
  error?: Error

  /**
   * Cancel the request
   */
  cancel(): void

  /**
   * Update request status
   */
  updateStatus(status: RequestStatus): void

  /**
   * Add listener for status changes
   */
  onStatusChange(listener: (status: RequestStatus) => void): void

  /**
   * Add listener for progress updates
   */
  onProgress(listener: (progress: RequestProgress) => void): void
}

/**
 * Request status types
 */
export type RequestStatus =
  | 'pending'
  | 'connecting'
  | 'processing'
  | 'streaming'
  | 'completed'
  | 'cancelled'
  | 'error'

/**
 * Request progress information
 */
export interface RequestProgress {
  /** Progress percentage (0-1) */
  percentage: number
  /** Current status message */
  message?: string
  /** Tokens processed so far */
  tokensProcessed?: number
  /** Estimated total tokens */
  estimatedTokens?: number
  /** Time elapsed in milliseconds */
  timeElapsed: number
  /** Estimated remaining time in milliseconds */
  estimatedTimeRemaining?: number
}

/**
 * Run environment for processing requests
 */
export interface RunEnv {
  /** Obsidian app instance */
  app: any
  /** Current file path */
  filePath: string
  /** File metadata */
  fileMeta: any
  /** Editor instance */
  editor: any
  /** Plugin settings */
  settings: any
  /** Available providers */
  providers: any[]
  /** Status bar manager */
  statusBar: any
  /** Request controller */
  controller: RequestController
  /** Additional context */
  context?: Record<string, unknown>
}

/**
 * Streaming response types
 */
export interface StreamChunk {
  /** Content delta */
  content?: string
  /** Reasoning delta */
  reasoning?: string
  /** Token usage update */
  usage?: TokenUsage
  /** Whether this is the final chunk */
  finished: boolean
  /** Error information */
  error?: Error
}

export type StreamHandler = (chunk: StreamChunk) => void

/**
 * Legacy request function types (for backwards compatibility)
 */
export type SendRequest = (
  messages: readonly Message[],
  controller: AbortController,
  resolveEmbedAsBinary: (embed: any) => Promise<ArrayBuffer>,
  saveAttachment?: (fileName: string, data: ArrayBuffer) => Promise<void>
) => AsyncGenerator<string, void, unknown>

// Forward declaration to avoid circular imports
export interface Message {
  readonly role: string
  readonly content: string
  readonly timestamp: Date
}