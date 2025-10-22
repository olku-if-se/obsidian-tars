/**
 * OpenRouter provider types
 * OpenAI-compatible multi-provider router
 */

import type { Message } from '@tars/contracts'

/**
 * OpenRouter message format (OpenAI-compatible with extended multi-modal)
 */
export interface OpenRouterMessage {
	role: 'system' | 'user' | 'assistant' | 'tool'
	content: string | ContentItem[]
	tool_calls?: OpenRouterToolCall[]
	tool_call_id?: string
}

/**
 * Content item for multi-modal messages
 * Supports images and PDFs
 */
export type ContentItem =
	| { type: 'text'; text: string }
	| { type: 'image_url'; image_url: { url: string } }
	| { type: 'file'; file: { filename: string; file_data: string } }

/**
 * OpenRouter tool call format (OpenAI-compatible)
 */
export interface OpenRouterToolCall {
	id: string
	type: 'function'
	function: {
		name: string
		arguments: string
	}
}

/**
 * OpenRouter streaming chunk (OpenAI-compatible)
 */
export interface OpenRouterStreamChunk {
	id: string
	object: string
	created: number
	model: string
	choices: Array<{
		index: number
		delta: {
			role?: string
			content?: string
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
 * OpenRouter provider options
 */
export interface OpenRouterProviderOptions {
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
 * Convert generic Message to OpenRouter format
 */
export function toOpenRouterMessage(message: Message): OpenRouterMessage {
	// Simple text message
	if (!message.embeds || message.embeds.length === 0) {
		return {
			role: message.role as any,
			content: message.content
		}
	}

	// Multi-modal message with embeds
	// Note: Embeds converted to ContentItems by provider
	return {
		role: message.role as any,
		content: message.content
	}
}
