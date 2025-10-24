/**
 * Tars Plugin Types - Monorepo Type Definitions
 * Version 3.6.0
 */

// ============================================================================
// Provider System Types
// ============================================================================

/**
 * Provider types supported by the plugin
 */
export type ProviderType =
  | 'openai'
  | 'claude'
  | 'deepseek'
  | 'gemini'
  | 'ollama'
  | 'openrouter'
  | 'siliconflow'
  | 'zhipu'
  | 'qwen'
  | 'doubao'
  | 'kimi'
  | 'xai'
  | 'grok'
  | 'azure'
  | 'gptimage'
  | 'mock'

/**
 * Provider capabilities
 */
export interface ProviderCapabilities {
  /** Text generation capability */
  textGeneration: boolean
  /** Vision/image analysis capability */
  vision: boolean
  /** Image generation capability */
  imageGeneration: boolean
  /** Web search capability */
  webSearch: boolean
  /** Streaming response capability */
  streaming: boolean
  /** Multimodal content processing */
  multimodal: boolean
  /** Reasoning capability */
  reasoning: boolean
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  /** Unique provider identifier */
  id: string
  /** Provider type */
  type: ProviderType
  /** Human-readable provider name */
  name: string
  /** API key for authentication */
  apiKey?: string
  /** Base URL for API endpoints */
  baseUrl?: string
  /** Default model to use */
  model?: string
  /** Additional provider-specific parameters */
  parameters?: Record<string, unknown>
  /** Whether provider is enabled */
  enabled: boolean
  /** Provider capabilities */
  capabilities: ProviderCapabilities
  /** Website to obtain API key */
  websiteToObtainKey?: string
}

/**
 * Base provider interface
 */
export interface Vendor {
  /** Unique provider identifier */
  readonly id: string
  /** Human-readable provider name */
  readonly name: string
  /** Provider type */
  readonly type: ProviderType
  /** Provider capabilities */
  readonly capabilities: ProviderCapabilities
  /** Available models */
  readonly models: string[]
  /** Website to obtain API key */
  readonly websiteToObtainKey: string
  /** Default configuration options */
  readonly defaultOptions: BaseOptions
  /** Send request function */
  readonly sendRequestFunc: (options: BaseOptions) => SendRequest
}

/**
 * Base options for providers
 */
export interface BaseOptions {
  /** API key for authentication */
  apiKey: string
  /** Base URL for API endpoints */
  baseURL: string
  /** Model to use */
  model: string
  /** Additional parameters */
  parameters: Record<string, unknown>
  /** Enable web search if supported */
  enableWebSearch?: boolean
}

/**
 * Provider settings (for plugin configuration)
 */
export interface ProviderSettings {
  /** Tag identifier */
  tag: string
  /** Vendor name */
  readonly vendor: string
  /** Provider options */
  options: BaseOptions
}

/**
 * Message role types
 */
export type MsgRole = 'user' | 'assistant' | 'system'

/**
 * Capability enum for backwards compatibility
 */
export type Capability =
  | 'Text Generation'
  | 'Image Vision'
  | 'PDF Vision'
  | 'Image Generation'
  | 'Image Editing'
  | 'Web Search'
  | 'Reasoning'

// ============================================================================
// Message and Conversation Types
// ============================================================================

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
 * Legacy message interface for backwards compatibility
 */
export interface LegacyMessage {
  readonly role: MsgRole
  readonly content: string
  readonly timestamp: Date
}

// ============================================================================
// Request and Response Types
// ============================================================================

/**
 * Function types for provider operations
 */
export type SaveAttachment = (
  fileName: string,
  data: ArrayBuffer
) => Promise<void>

export type ResolveEmbedAsBinary = (embed: any) => Promise<ArrayBuffer>

export type CreatePlainText = (filePath: string, text: string) => Promise<void>

/**
 * Request function type
 */
export type SendRequest = (
  messages: readonly LegacyMessage[],
  controller: AbortController,
  resolveEmbedAsBinary: ResolveEmbedAsBinary,
  saveAttachment?: SaveAttachment
) => AsyncGenerator<string, void, unknown>

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

// ============================================================================
// UI System Types
// ============================================================================

/**
 * UI configuration
 */
export interface UIConfig {
  /** Theme preference */
  theme: 'light' | 'dark' | 'auto'
  /** Font size */
  fontSize: number
  /** Show status bar */
  showStatusBar: boolean
  /** Show suggestions */
  showSuggestions: boolean
  /** Maximum tokens for generation */
  maxTokens: number
  /** Auto-save settings */
  autoSave: boolean
  /** Auto-save interval in seconds */
  autoSaveInterval: number
  /** Show generation stats */
  showStats: boolean
  /** Compact mode */
  compactMode: boolean
}

/**
 * Status bar types
 */
export type StatusBarType = 'idle' | 'generating' | 'success' | 'error'

export interface StatusBarContent {
  /** Main status text */
  text: string
  /** Optional detail text */
  detail?: string
  /** Status icon class */
  icon?: string
  /** Status color */
  color?: string
  /** Progress indicator (0-1) */
  progress?: number
}

export interface StatusBarState {
  /** Status type */
  type: StatusBarType
  /** Status content */
  content: StatusBarContent
  /** Timestamp */
  timestamp: Date
  /** Error information if applicable */
  error?: ErrorInfo
}

/**
 * Generation statistics
 */
export interface GenerationStats {
  /** Tokens generated */
  tokensGenerated: number
  /** Tokens used as input */
  tokensInput: number
  /** Total tokens */
  totalTokens: number
  /** Generation time in milliseconds */
  generationTime: number
  /** Tokens per second */
  tokensPerSecond: number
  /** Provider used */
  provider: string
  /** Model used */
  model: string
  /** Cost estimation */
  estimatedCost?: number
}

/**
 * Error information for UI display
 */
export interface ErrorInfo {
  /** Error message */
  message: string
  /** Error code */
  code?: string
  /** Provider where error occurred */
  provider?: string
  /** Model where error occurred */
  model?: string
  /** Timestamp */
  timestamp: Date
  /** Stack trace */
  stack?: string
  /** Whether error is retryable */
  retryable?: boolean
}

// ============================================================================
// MCP Types
// ============================================================================

/**
 * MCP server configuration
 */
export interface MCPServerConfig {
  /** Unique server identifier */
  id: string
  /** Human-readable server name */
  name: string
  /** Command to start the MCP server */
  command: string
  /** Arguments to pass to the command */
  args?: string[]
  /** Environment variables for the server process */
  env?: Record<string, string>
  /** Whether server is enabled */
  enabled: boolean
  /** Server capabilities */
  capabilities: MCPCapabilities
  /** Working directory */
  cwd?: string
  /** Connection timeout */
  timeout?: number
}

/**
 * MCP server capabilities
 */
export interface MCPCapabilities {
  /** Server supports tool calls */
  tools: boolean
  /** Server supports resource access */
  resources: boolean
  /** Server supports prompt templates */
  prompts: boolean
  /** Server supports language model sampling */
  sampling: boolean
  /** Server supports logging */
  logging: boolean
}

// ============================================================================
// Plugin Core Types
// ============================================================================

/**
 * Main plugin interface
 */
export interface TarsPlugin {
  readonly id: string
  readonly version: string
  readonly settings: TarsSettings
  readonly providers: ProviderRegistry
  readonly mcpServers: MCPServerRegistry
}

/**
 * Plugin settings interface
 */
export interface TarsSettings {
  /** AI provider configurations */
  providers: ProviderConfig[]
  /** MCP server configurations */
  mcpServers: MCPServerConfig[]
  /** Command configurations */
  commands: CommandConfig[]
  /** UI configuration */
  ui: UIConfig
  /** Plugin version */
  version: string
  /** Enable/disable features */
  features: {
    statusBar: boolean
    suggestions: boolean
    autoSave: boolean
  }
}

/**
 * Event system interfaces
 */
export interface TarsEvent {
  readonly type: EventType
  readonly payload: unknown
  readonly timestamp: Date
  readonly source: string
}

export type EventType =
  | 'provider:initialized'
  | 'provider:error'
  | 'mcp:connected'
  | 'mcp:error'
  | 'conversation:started'
  | 'message:received'
  | 'settings:changed'
  | 'generation:started'
  | 'generation:completed'
  | 'generation:failed'

/**
 * Registry interfaces
 */
export interface ProviderRegistry {
  readonly providers: Map<string, Vendor>
  register(provider: Vendor): void
  unregister(id: string): void
  get(id: string): Vendor | undefined
  getAll(): Vendor[]
  getByCapability(capability: ProviderCapabilities): Vendor[]
}

export interface MCPServerRegistry {
  readonly servers: Map<string, MCPServer>
  register(server: MCPServer): void
  unregister(id: string): void
  get(id: string): MCPServer | undefined
  getAll(): MCPServer[]
  getCapabilities(): MCPCapabilities[]
}

/**
 * Configuration interfaces
 */
export interface CommandConfig {
  id: string
  name: string
  type: CommandType
  enabled: boolean
  shortcut?: string
}

export type CommandType = 'user' | 'assistant' | 'system' | 'newChat' | 'export' | 'template'

// Forward declarations for MCP
export interface MCPServer {
  readonly id: string
  readonly name: string
  readonly capabilities: MCPCapabilities
}

// ============================================================================
// Error Handling Types
// ============================================================================

/**
 * Base Tars error interface
 */
export interface TarsError extends Error {
  /** Error code */
  code: ErrorCode
  /** Provider where error occurred */
  provider?: string
  /** Additional error details */
  details?: Record<string, unknown>
  /** Error timestamp */
  timestamp: Date
  /** Request ID if applicable */
  requestId?: string
  /** Whether error is retryable */
  retryable: boolean
}

/**
 * Error codes
 */
export type ErrorCode =
  | 'PROVIDER_NOT_FOUND'
  | 'PROVIDER_INIT_FAILED'
  | 'PROVIDER_AUTH_FAILED'
  | 'PROVIDER_RATE_LIMITED'
  | 'PROVIDER_QUOTA_EXCEEDED'
  | 'PROVIDER_MODEL_NOT_SUPPORTED'
  | 'MCP_CONNECTION_FAILED'
  | 'MCP_SERVER_ERROR'
  | 'MCP_TIMEOUT'
  | 'CONVERSATION_ERROR'
  | 'MESSAGE_PARSE_ERROR'
  | 'SETTINGS_INVALID'
  | 'NETWORK_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'FILE_NOT_FOUND'
  | 'FILE_ACCESS_DENIED'
  | 'FILE_CORRUPTED'
  | 'ATTACHMENT_TOO_LARGE'
  | 'ATTACHMENT_NOT_SUPPORTED'
  | 'GENERATION_TIMEOUT'
  | 'GENERATION_CANCELLED'
  | 'GENERATION_FAILED'
  | 'UNKNOWN_ERROR'

/**
 * Validation result types
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

// ============================================================================
// Event System Types
// ============================================================================

/**
 * Event listener function type
 */
export type EventListener<T = unknown> = (event: T) => void | Promise<void>

/**
 * Event bus interface
 */
export interface EventBus {
  /**
   * Register an event listener
   */
  on<T = unknown>(eventType: EventType, listener: EventListener<T>): () => void

  /**
   * Register a one-time event listener
   */
  once<T = unknown>(eventType: EventType, listener: EventListener<T>): () => void

  /**
   * Remove an event listener
   */
  off<T = unknown>(eventType: EventType, listener: EventListener<T>): void

  /**
   * Emit an event
   */
  emit<T = unknown>(event: T): Promise<void>

  /**
   * Remove all listeners for an event type
   */
  clear(eventType?: EventType): void

  /**
   * Get listener count for an event type
   */
  listenerCount(eventType: EventType): number

  /**
   * Get all registered event types
   */
  eventTypes(): EventType[]
}

// ============================================================================
// File and Media Types
// ============================================================================

/**
 * File content interface
 */
export interface FileContent {
  /** File name */
  filename: string
  /** File data (base64 encoded) */
  data: string
  /** MIME type */
  mimeType: string
  /** File size in bytes */
  size: number
  /** Optional URL */
  url?: string
  /** File hash for integrity checking */
  hash?: string
}

/**
 * Image content interface
 */
export interface ImageContent {
  /** Image data (base64 encoded) */
  data: string
  /** MIME type */
  mimeType: string
  /** Image dimensions */
  dimensions?: {
    width: number
    height: number
  }
  /** Image description */
  description?: string
  /** Optional URL */
  url?: string
  /** File name if available */
  filename?: string
}

/**
 * Media content (supports various media types)
 */
export interface MediaContent {
  /** Content type discriminator */
  type: 'image' | 'video' | 'audio' | 'document'
  /** Media data (base64 encoded) */
  data: string
  /** MIME type */
  mimeType: string
  /** File name */
  filename: string
  /** File size */
  size: number
  /** Duration for audio/video */
  duration?: number
  /** Dimensions for images/video */
  dimensions?: {
    width: number
    height: number
  }
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Helper type for making all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Helper type for making all properties required recursively
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

/**
 * Common union types
 */
export type StringOrNumber = string | number
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type AsyncFunction<T = unknown> = (...args: unknown[]) => Promise<T>
export type SyncFunction<T = unknown> = (...args: unknown[]) => T

/**
 * Brand types for type safety
 */
export type BrandedString<T extends string> = string & { readonly __brand: T }
export type BrandedNumber<T extends string> = number & { readonly __brand: T }