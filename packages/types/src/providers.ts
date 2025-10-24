/**
 * Provider system types and interfaces
 */

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

/**
 * Message role types
 */
export type MsgRole = 'user' | 'assistant' | 'system'

/**
 * Message interface (forward declaration to avoid circular imports)
 */
export interface Message {
  readonly role: MsgRole
  readonly content: string
  readonly timestamp: Date
}

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
  messages: readonly Message[],
  controller: AbortController,
  resolveEmbedAsBinary: ResolveEmbedAsBinary,
  saveAttachment?: SaveAttachment
) => AsyncGenerator<string, void, unknown>