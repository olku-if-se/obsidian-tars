/**
 * SiliconFlow provider types
 * OpenAI-compatible Chinese provider with reasoning
 */

import type { Message } from '@tars/contracts'

/**
 * SiliconFlow message format (OpenAI-compatible with multi-modal support)
 */
export interface SiliconFlowMessage {
	role: 'system' | 'user' | 'assistant' | 'tool'
	content: string | ContentItem[]
	tool_calls?: SiliconFlowToolCall[]
	tool_call_id?: string
}

/**
 * Content item for multi-modal messages
 */
export type ContentItem =
	| { type: 'text'; text: string }
	| { type: 'image_url'; image_url: { url: string } }

/**
 * SiliconFlow tool call format (OpenAI-compatible)
 */
export interface SiliconFlowToolCall {
	id: string
	type: 'function'
	function: {
		name: string
		arguments: string
	}
}

/**
 * SiliconFlow streaming chunk (extends OpenAI format)
 */
export interface SiliconFlowStreamChunk {
	id: string
	object: string
	created: number
	model: string
	choices: Array<{
		index: number
		delta: {
			role?: string
			content?: string
			reasoning_content?: string // Reasoning support
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
 * SiliconFlow provider options
 */
export interface SiliconFlowProviderOptions {
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
 * Convert generic Message to SiliconFlow format
 */
export function toSiliconFlowMessage(message: Message): SiliconFlowMessage {
	return {
		role: message.role as any,
		content: message.content
	}
}
