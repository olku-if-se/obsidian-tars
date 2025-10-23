import type OpenAI from 'openai'
import { CompletionsStream, type CompletionsStreamOptions } from '../../streaming/CompletionsStream'
import type { StreamEvent, ToolCall } from '../../streaming/types'
import type { DeepseekMessage } from './types'

// Error messages (i18n-ready)
const Errors = {
	stream_failed: 'Deepseek stream request failed',
	no_client: 'OpenAI client is required'
} as const

// Callout markers for reasoning content
const CALLOUT_BLOCK_START = '\n> [!quote] Reasoning\n> '
const CALLOUT_BLOCK_END = '\n\n'

/**
 * Deepseek-specific completion stream
 * Uses OpenAI SDK with reasoning support
 */
export class DeepseekCompletionsStream extends CompletionsStream {
	private client: OpenAI
	private deepseekMessages: DeepseekMessage[]
	private tools?: any[]

	constructor(messages: DeepseekMessage[], options: CompletionsStreamOptions, client: OpenAI, tools?: any[]) {
		super(messages, options)

		if (!client) {
			throw new Error(Errors.no_client)
		}

		this.client = client
		this.deepseekMessages = messages
		this.tools = tools
	}

	/**
	 * Factory method for creating Deepseek streams
	 */
	static from(
		messages: DeepseekMessage[],
		options: CompletionsStreamOptions,
		client: OpenAI,
		tools?: any[]
	): DeepseekCompletionsStream {
		return new DeepseekCompletionsStream(messages, options, client, tools)
	}

	/**
	 * Async iterator - yields StreamEvents from Deepseek API
	 */
	async *[Symbol.asyncIterator](): AsyncIterableIterator<StreamEvent> {
		try {
			this.checkAborted()

			// Create streaming request
			const requestParams: any = {
				model: this.model,
				messages: this.deepseekMessages,
				stream: true,
				temperature: this.options.temperature,
				...(this.options.providerOptions || {})
			}

			// Add tools if available
			if (this.tools && this.tools.length > 0) {
				requestParams.tools = this.tools
				requestParams.tool_choice = 'auto'
			}

			// Create stream
			const stream = await this.client.chat.completions.create(requestParams as any, { signal: this.signal })

			// Accumulate tool calls and track reasoning state
			const toolCalls: Map<number, ToolCall> = new Map()
			let inReasoning = false

			// Process stream
			for await (const chunk of stream) {
				this.checkAborted()

				const delta = chunk.choices?.[0]?.delta as any

				if (!delta) continue

				// Handle reasoning content (Deepseek-specific)
				if (delta.reasoning_content) {
					const prefix = !inReasoning ? ((inReasoning = true), CALLOUT_BLOCK_START) : ''
					const formattedContent = prefix + delta.reasoning_content.replace(/\n/g, '\n> ')

					yield {
						type: 'content',
						data: formattedContent
					}
					continue
				}

				// Handle regular content
				if (delta.content) {
					const prefix = inReasoning ? ((inReasoning = false), CALLOUT_BLOCK_END) : ''
					yield {
						type: 'content',
						data: prefix + delta.content
					}
				}

				// Handle tool calls (OpenAI-compatible)
				if (delta.tool_calls) {
					for (const toolCallChunk of delta.tool_calls) {
						const index = toolCallChunk.index

						// Initialize or get existing tool call
						if (!toolCalls.has(index)) {
							toolCalls.set(index, {
								id: toolCallChunk.id || '',
								type: 'function',
								function: {
									name: '',
									arguments: ''
								}
							})
						}

						const toolCall = toolCalls.get(index)
						if (!toolCall) continue

						// Accumulate tool call data
						if (toolCallChunk.id) {
							toolCall.id = toolCallChunk.id
						}
						if (toolCallChunk.function?.name) {
							toolCall.function.name += toolCallChunk.function.name
						}
						if (toolCallChunk.function?.arguments) {
							toolCall.function.arguments += toolCallChunk.function.arguments
						}
					}
				}

				// Log token usage if available
				if (chunk.usage?.prompt_tokens && chunk.usage.completion_tokens) {
					// Usage information available but not yielded as event
					// Could add a 'usage' event type if needed
				}
			}

			// Close reasoning block if still open
			if (inReasoning) {
				yield {
					type: 'content',
					data: CALLOUT_BLOCK_END
				}
			}

			// Yield tool calls if any were accumulated
			if (toolCalls.size > 0) {
				const toolCallsArray = Array.from(toolCalls.values())
				yield {
					type: 'tool_calls',
					data: toolCallsArray
				}
			}

			// Yield stream end
			yield {
				type: 'stream_end',
				data: null
			}
		} catch (error) {
			// Yield error event
			yield {
				type: 'error',
				data: Object.assign(new Error(Errors.stream_failed), { cause: error })
			}
		}
	}
}
