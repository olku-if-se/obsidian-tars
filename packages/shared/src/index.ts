// Shared utilities for Tars Obsidian Plugin
// This will be expanded with proper utilities as migration progresses
import type { Message } from '@tars/types'

export function sanitizeMarkdown(text: string): string {
  // Given: raw text input
  // When: sanitizing for markdown processing
  // Then: return sanitized text safe for markdown rendering
  return text.replace(/[<>]/g, '')
}

export function extractTags(content: string): string[] {
  // Given: markdown content with tag references
  // When: extracting tag patterns
  // Then: return array of found tags
  const tagPattern = /#(\w+):/g
  const matches = content.match(tagPattern)
  return matches ? matches.map(match => match.substring(1, match.length - 1)) : []
}

export function createPluginLogger(prefix: string) {
  return {
    debug: (message: string, ...args: unknown[]) => {
      console.debug(`[${prefix}] ${message}`, ...args)
    },
    info: (message: string, ...args: unknown[]) => {
      console.info(`[${prefix}] ${message}`, ...args)
    },
    warn: (message: string, ...args: unknown[]) => {
      console.warn(`[${prefix}] ${message}`, ...args)
    },
    error: (message: string, ...args: unknown[]) => {
      console.error(`[${prefix}] ${message}`, ...args)
    },
  }
}

export function summarizeMessage(message: Message): string {
  const snippet = message.content.length > 60 ? `${message.content.slice(0, 57)}...` : message.content
  return `${message.role.toUpperCase()}: ${snippet}`
}

// Re-export utilities
// Re-export utilities - this line is redundant since functions are already exported above
