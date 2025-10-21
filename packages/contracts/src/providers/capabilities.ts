import type { LlmProvider, LlmCapability } from './base'

// Forward declare types to avoid circular imports
interface McpTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

interface ImageGenOptions {
  quality?: string
  size?: string
  style?: string
}

/**
 * Tool Calling capability interface
 */
export interface LlmToolCallingProvider extends LlmProvider {
  readonly capabilities: ['Tool Calling', ...LlmCapability[]]

  /** Inject tools for tool calling */
  injectTools(tools: McpTool[]): Promise<void>

  /** Remove all injected tools */
  clearTools(): Promise<void>
}

/**
 * Image Generation capability interface
 */
export interface LlmImageGenerationProvider extends LlmProvider {
  readonly capabilities: ['Image Generation', ...LlmCapability[]]

  /** Generate image from prompt */
  generateImage(prompt: string, options?: ImageGenOptions): Promise<string>
}

/**
 * Vision capability interface
 */
export interface LlmVisionProvider extends LlmProvider {
  readonly capabilities: ['Image Vision' | 'PDF Vision', ...LlmCapability[]]

  /** Get supported image formats */
  supportedFormats(): string[]
}

/**
 * Capability guard functions for type narrowing
 */
export function isToolCallingProvider(provider: LlmProvider): provider is LlmToolCallingProvider {
  return provider.capabilities.includes('Tool Calling')
}

export function isImageGenerationProvider(provider: LlmProvider): provider is LlmImageGenerationProvider {
  return provider.capabilities.includes('Image Generation')
}

export function isVisionProvider(provider: LlmProvider): provider is LlmVisionProvider {
  return provider.capabilities.includes('Image Vision') ||
         provider.capabilities.includes('PDF Vision')
}

// Export types for external use
export type { McpTool, ImageGenOptions }