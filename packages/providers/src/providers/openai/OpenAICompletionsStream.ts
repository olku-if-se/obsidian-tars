import type OpenAI from 'openai'
import { CompletionsStream, type CompletionsStreamOptions } from '../../streaming/CompletionsStream'
import type { StreamEvent, ToolCall } from '../../streaming/types'
import type { OpenAIMessage, OpenAIToolCall } from './types'

/**
 * OpenAI-specific completion stream
 * Based on llm-chat.md architecture
 */
export class OpenAICompletionsStream extends CompletionsStream {
	private client: OpenAI
	private openAIMessages: OpenAIMessage[]
	private tools?: any[]

	constructor(
		messages: OpenAIMessage[],
		options: CompletionsStreamOptions,
		client: OpenAI,
		tools?: any[]
	) {
		super(messages, options)
		this.client = client
		this.openAIMessages = messages
		this.tools = tools
	}

	/**
	 * Factory method for creating OpenAI streams
	 */
	static from(
		messages: OpenAIMessage[],
		options: CompletionsStreamOptions,
		client: OpenAI,
		tools?: any[]
	): OpenAICompletionsStream {
		return new OpenAICompletionsStream(messages, options, client, tools)
	}

	/**
	 * Async iterator - yields StreamEvents from OpenAI API
	 */
	async *[Symbol.asyncIterator](): AsyncIterableIterator<StreamEvent> {
		try {
			this.checkAborted()

			// Create streaming request
			const requestParams: any = {
				model: this.model,
				messages: this.openAIMessages,
				stream: true,
				temperature: this.options.temperature,
				...(this.options.providerOptions || {})
			}

			// Add tools if available
			if (this.tools && this.tools.length > 0) {
				requestParams.tools = this.tools
				requestParams.tool_choice = 'auto'
			}

			// Add abort signal
			if (this.signal) {
				requestParams.signal = this.signal
			}

			const stream = await this.client.chat.completions.create(requestParams)

			// Accumulate tool calls across chunks
			const toolCalls: Map<number, ToolCall> = new Map()
			let hasContent = false

			for await (const chunk of stream) {
				this.checkAborted()

				const delta = chunk.choices[0]?.delta

				if (!delta) {
					continue
				}

				// Handle content chunks
				if (delta.content) {
					hasContent = true
					yield {
						type: 'content',
						data: delta.content
					}
				}

				// Handle tool call chunks
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

						const toolCall = toolCalls.get(index)!

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
				data: error instanceof Error ? error : new Error(String(error))
			}
		}
	}
}
