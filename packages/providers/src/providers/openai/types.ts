/**
 * OpenAI-specific types
 */

import type { Message } from '@tars/contracts'

/**
 * OpenAI message format
 */
export interface OpenAIMessage {
	role: 'system' | 'user' | 'assistant' | 'tool'
	content: string | null
	tool_calls?: OpenAIToolCall[]
	tool_call_id?: string
}

/**
 * OpenAI tool call format
 */
export interface OpenAIToolCall {
	id: string
	type: 'function'
	function: {
		name: string
		arguments: string
	}
}

/**
 * OpenAI streaming chunk
 */
export interface OpenAIStreamChunk {
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
 * OpenAI provider options
 */
export interface OpenAIProviderOptions {
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
 * Convert generic Message to OpenAI format
 */
export function toOpenAIMessage(message: Message): OpenAIMessage {
	return {
		role: message.role as any,
		content: message.content,
		// Embeds handled separately in the provider
	}
}

/**
 * Convert OpenAI message to generic format
 */
export function fromOpenAIMessage(message: OpenAIMessage): Message {
	return {
		role: message.role,
		content: message.content || ''
	}
}
