/**
 * Conversation and message types
 */

/**
 * Message role types
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'newChat'

/**
 * Message content types
 */
export type MessageContent =
  | TextContent
  | MultimodalContent
  | ImageContent
  | FileContent

export interface TextContent {
  type: 'text'
  text: string
}

export interface ImageContent {
  type: 'image'
  data: string // Base64 encoded image data
  mimeType: string
  url?: string
}

export interface FileContent {
  type: 'file'
  data: string // Base64 encoded file data
  mimeType: string
  filename: string
  url?: string
}

export interface MultimodalContent {
  type: 'multimodal'
  text?: string
  images?: ImageContent[]
  files?: FileContent[]
}

/**
 * Message interface
 */
export interface Message {
  /** Unique message identifier */
  id: string
  /** Message role */
  role: MessageRole
  /** Message content */
  content: MessageContent
  /** Message timestamp */
  timestamp: Date
  /** Message metadata */
  metadata?: MessageMetadata
}

/**
 * Conversation interface
 */
export interface Conversation {
  /** Unique conversation identifier */
  id: string
  /** Array of messages */
  messages: Message[]
  /** Additional context */
  context?: Record<string, unknown>
  /** Conversation metadata */
  metadata?: ConversationMetadata
}

/**
 * Message metadata
 */
export interface MessageMetadata {
  /** Token usage information */
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  /** Provider information */
  provider?: string
  /** Model used */
  model?: string
  /** Processing time */
  processingTime?: number
  /** Additional custom metadata */
  [key: string]: unknown
}

/**
 * Conversation metadata
 */
export interface ConversationMetadata {
  /** Conversation title */
  title?: string
  /** Creation timestamp */
  createdAt: Date
  /** Last update timestamp */
  updatedAt: Date
  /** File path where conversation is stored */
  filePath?: string
  /** Tags associated with conversation */
  tags?: string[]
  /** Provider used for conversation */
  provider?: string
  /** Model used for conversation */
  model?: string
  /** Total tokens used */
  totalTokens?: number
  /** Additional custom metadata */
  [key: string]: unknown
}

/**
 * Message parsing types
 */
export interface ParsedConversation {
  messages: Message[]
  metadata: ConversationMetadata
  errors: ParseError[]
}

export interface ParseError {
  line: number
  column: number
  message: string
  severity: 'error' | 'warning' | 'info'
}

/**
 * Conversation validation types
 */
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  code: string
  message: string
  path: string
  severity: 'error'
}

export interface ValidationWarning {
  code: string
  message: string
  path: string
  severity: 'warning'
}