// Basic type definitions for Tars Obsidian Plugin
// This will be expanded with proper types as migration progresses

export interface TarsPluginSettings {
  // Plugin settings will be defined here
  [key: string]: unknown
}

export interface Vendor {
  // Vendor interface will be defined here
  name: string
  // Additional vendor properties to be added
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
}

export interface AIProvider {
  id: string
  name: string
  vendor: Vendor
  // Additional provider properties to be added
}

// TarsPlugin interface for Obsidian plugin implementation
export interface TarsPlugin {
  settings: TarsSettings
  corePlugin: unknown
  settingsManager: unknown
  onload(): Promise<void>
  onunload(): Promise<void>
  saveSettings(): Promise<void>
}

// Alias for TarsPluginSettings for backward compatibility
export type TarsSettings = TarsPluginSettings

// Message and provider types for AI functionality
export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export type ProviderType = string

export interface VendorCapabilities {
  textGeneration: boolean
  streaming: boolean
  vision: boolean
  imageGeneration: boolean
  webSearch: boolean
  maxTokens: number
  supportedModels: string[]
}

export interface AIResponse {
  content: string
  done: boolean
}

export type SendRequest = (
  messages: Message[],
  options?: Record<string, unknown>
) => Promise<AIResponse | AsyncGenerator<string, void, unknown>>

// MCP (Model Context Protocol) types
export interface MCPMessage {
  id?: string
  method: string
  params?: Record<string, unknown>
}

export interface MCPResponse {
  id: string
  result: {
    content: string
    timestamp?: string
    server?: string
  }
  error?: {
    code: number
    message: string
  }
}

export interface MCPServer {
  id: string
  name: string
  url: string
  status: 'online' | 'offline' | 'error'
  capabilities: string[]
}

export interface MCPCommand {
  name: string
  description: string
  parameters?: Record<string, unknown>
  handler: (params: Record<string, unknown>) => Promise<unknown>
}

// Re-export common types
