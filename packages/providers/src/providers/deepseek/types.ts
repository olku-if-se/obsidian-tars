/**
 * Deepseek provider types
 * OpenAI-compatible with reasoning support
 */

import type { Message } from '@tars/contracts'

/**
 * Deepseek message format (OpenAI-compatible)
 */
export interface DeepseekMessage {
	role: 'system' | 'user' | 'assistant' | 'tool'
	content: string | null
	tool_calls?: DeepseekToolCall[]
	tool_call_id?: string
}

/**
 * Deepseek tool call format (OpenAI-compatible)
 */
export interface DeepseekToolCall {
	id: string
	type: 'function'
	function: {
		name: string
		arguments: string
	}
}

/**
 * Deepseek streaming chunk (extends OpenAI format)
 */
export interface DeepseekStreamChunk {
	id: string
	object: string
	created: number
	model: string
	choices: Array<{
		index: number
		delta: {
			role?: string
			content?: string
			reasoning_content?: string // Deepseek-specific for reasoning models
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
	usage?: {
		prompt_tokens: number
		completion_tokens: number
		total_tokens: number
	}
}

/**
 * Deepseek provider options
 */
export interface DeepseekProviderOptions {
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
 * Convert generic Message to Deepseek format
 */
export function toDeepseekMessage(message: Message): DeepseekMessage {
	return {
		role: message.role as any,
		content: message.content
	}
}

/**
 * Convert Deepseek message to generic format
 */
export function fromDeepseekMessage(message: DeepseekMessage): Message {
	return {
		role: message.role,
		content: message.content || ''
	}
}
