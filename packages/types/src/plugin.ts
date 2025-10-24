/**
 * Core plugin interfaces and types
 */

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

// Forward declarations (avoiding circular imports)
export interface Vendor {
  readonly id: string
  readonly name: string
  readonly type: string
  readonly capabilities: ProviderCapabilities
}

export interface MCPServer {
  readonly id: string
  readonly name: string
  readonly capabilities: MCPCapabilities
}

export interface UIConfig {
  theme: 'light' | 'dark' | 'auto'
  fontSize: number
  showStatusBar: boolean
  showSuggestions: boolean
  maxTokens: number
}

export interface ProviderConfig {
  id: string
  type: string
  name: string
  enabled: boolean
  capabilities: ProviderCapabilities
}

export interface MCPServerConfig {
  id: string
  name: string
  enabled: boolean
  capabilities: MCPCapabilities
}

export interface MCPCapabilities {
  tools: boolean
  resources: boolean
  prompts: boolean
  sampling: boolean
}