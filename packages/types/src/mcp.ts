/**
 * MCP (Model Context Protocol) integration types
 */

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

/**
 * MCP server interface
 */
export interface MCPServer {
  /** Unique server identifier */
  readonly id: string
  /** Server name */
  readonly name: string
  /** Server configuration */
  readonly config: MCPServerConfig
  /** MCP client instance */
  readonly client: MCPClient
  /** Server capabilities */
  readonly capabilities: MCPCapabilities
  /** Connection status */
  readonly status: MCPConnectionStatus

  /**
   * Connect to the MCP server
   */
  connect(): Promise<void>

  /**
   * Disconnect from the MCP server
   */
  disconnect(): Promise<void>

  /**
   * Check if server is healthy
   */
  isHealthy(): Promise<boolean>

  /**
   * Get server capabilities
   */
  getCapabilities(): MCPCapabilities

  /**
   * Get available tools
   */
  getTools(): Promise<Tool[]>

  /**
   * Call a tool
   */
  callTool(name: string, args: unknown): Promise<ToolResult>

  /**
   * Get available resources
   */
  getResources(): Promise<Resource[]>

  /**
   * Read a resource
   */
  readResource(uri: string): Promise<ResourceContent>

  /**
   * Get available prompts
   */
  getPrompts(): Promise<Prompt[]>

  /**
   * Get a prompt template
   */
  getPrompt(name: string, args?: unknown): Promise<PromptResult>
}

/**
 * MCP client interface
 */
export interface MCPClient {
  /** Server configuration */
  readonly config: MCPServerConfig
  /** Connection status */
  readonly connected: boolean
  /** Server capabilities */
  readonly capabilities: MCPCapabilities

  /**
   * Connect to the server
   */
  connect(): Promise<void>

  /**
   * Disconnect from the server
   */
  disconnect(): Promise<void>

  /**
   * List available tools
   */
  listTools(): Promise<Tool[]>

  /**
   * Call a tool
   */
  callTool(name: string, arguments: unknown): Promise<ToolResult>

  /**
   * List available resources
   */
  listResources(): Promise<Resource[]>

  /**
   * Read resource content
   */
  readResource(uri: string): Promise<ResourceContent>

  /**
   * List available prompts
   */
  listPrompts(): Promise<Prompt[]>

  /**
   * Get prompt template
   */
  getPrompt(name: string, arguments?: unknown): Promise<PromptResult>
}

/**
 * MCP connection status
 */
export type MCPConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

/**
 * Tool interfaces
 */
export interface Tool {
  /** Tool name */
  name: string
  /** Tool description */
  description: string
  /** JSON schema for tool input parameters */
  inputSchema: Record<string, unknown>
}

export interface ToolCallRequest {
  /** Tool name to call */
  name: string
  /** Arguments to pass to the tool */
  arguments: Record<string, unknown>
}

export interface ToolResult {
  /** Tool execution result content */
  content: ToolContent[]
  /** Whether the tool execution resulted in an error */
  isError: boolean
  /** Optional error message */
  errorMessage?: string
}

export interface ToolContent {
  /** Content type discriminator */
  type: 'text' | 'image' | 'resource'
  /** Text content */
  text?: string
  /** Image data (base64) */
  data?: string
  /** MIME type */
  mimeType?: string
  /** Resource reference */
  resource?: ResourceReference
}

/**
 * Resource interfaces
 */
export interface Resource {
  /** Resource URI */
  uri: string
  /** Resource name */
  name: string
  /** Resource description */
  description?: string
  /** Resource MIME type */
  mimeType: string
}

export interface ResourceReference {
  /** Resource URI */
  uri: string
}

export interface ResourceContent {
  /** Resource URI */
  uri: string
  /** Resource MIME type */
  mimeType: string
  /** Text content (for text resources) */
  text?: string
  /** Binary content (for binary resources) */
  blob?: ArrayBuffer
}

/**
 * Prompt interfaces
 */
export interface Prompt {
  /** Prompt name */
  name: string
  /** Prompt description */
  description: string
  /** Prompt arguments/parameters */
  arguments: PromptArgument[]
}

export interface PromptArgument {
  /** Argument name */
  name: string
  /** Argument description */
  description: string
  /** Whether this argument is required */
  required: boolean
  /** Argument type */
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array'
}

export interface PromptGetRequest {
  /** Prompt name */
  name: string
  /** Argument values for the prompt */
  arguments?: Record<string, unknown>
}

export interface PromptResult {
  /** Resulting prompt description */
  description: string
  /** Resulting prompt messages */
  messages: PromptMessage[]
}

export interface PromptMessage {
  /** Message role */
  role: 'system' | 'user' | 'assistant'
  /** Message content */
  content:
    | { type: 'text'; text: string }
    | { type: 'image'; data: string; mimeType: string }
    | { type: 'resource'; resource: ResourceReference }
}