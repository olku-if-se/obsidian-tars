/**
 * Grok (xAI) provider types
 * OpenAI-compatible with reasoning support
 */

import type { Message } from '@tars/contracts'

/**
 * Grok message format (OpenAI-compatible with multi-modal support)
 */
export interface GrokMessage {
	role: 'system' | 'user' | 'assistant' | 'tool'
	content: string | ContentItem[]
	tool_calls?: GrokToolCall[]
	tool_call_id?: string
}

/**
 * Content item for multi-modal messages
 */
export type ContentItem = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }

/**
 * Grok tool call format (OpenAI-compatible)
 */
export interface GrokToolCall {
	id: string
	type: 'function'
	function: {
		name: string
		arguments: string
	}
}

/**
 * Grok streaming chunk
 */
export interface GrokStreamChunk {
	id: string
	object: string
	created: number
	model: string
	choices: Array<{
		index: number
		delta: {
			role?: string
			content?: string
			reasoning_content?: string // Grok-specific reasoning
			tool_calls?: Array<{
				index: number
				id?: string
				type?: 'function'
				function?: {
					name?: string
					arguments?: string
				}
			}>
		}
		finish_reason?: string | null
	}>
}

/**
 * Grok provider options
 */
export interface GrokProviderOptions {
	apiKey: string
	baseURL?: string
	model: string
	temperature?: number
	maxTokens?: number
	topP?: number
	frequencyPenalty?: number
	presencePenalty?: number
	stop?: string[]
}

/**
 * Convert generic Message to Grok format
 */
export function toGrokMessage(message: Message): GrokMessage {
	// Simple text message
	if (!message.embeds || message.embeds.length === 0) {
		return {
			role: message.role as any,
			content: message.content
		}
	}

	// Multi-modal message with embeds
	const content: ContentItem[] = []

	// Add text if present
	if (message.content.trim()) {
		content.push({
			type: 'text',
			text: message.content
		})
	}

	// Note: Embeds will be converted to image URLs by the provider
	return {
		role: message.role as any,
		content
	}
}
