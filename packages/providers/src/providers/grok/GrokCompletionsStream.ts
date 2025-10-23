import axios from 'axios'
import { CompletionsStream, type CompletionsStreamOptions } from '../../streaming/CompletionsStream'
import type { StreamEvent, ToolCall } from '../../streaming/types'
import type { GrokMessage, GrokStreamChunk } from './types'

// Error messages (i18n-ready)
const Errors = {
	stream_failed: 'Grok stream request failed',
	parse_error: 'Failed to parse Grok response chunk',
	no_api_key: 'Grok API key is required'
} as const

// Callout markers for reasoning content
const CALLOUT_BLOCK_START = '\n> [!quote] Reasoning\n> '
const CALLOUT_BLOCK_END = '\n\n'

/**
 * Grok-specific completion stream
 * OpenAI-compatible with reasoning support
 * Uses axios for HTTP streaming
 */
export class GrokCompletionsStream extends CompletionsStream {
	private apiKey: string
	private baseURL: string
	private grokMessages: GrokMessage[]
	private tools?: any[]

	constructor(
		messages: GrokMessage[],
		options: CompletionsStreamOptions & { apiKey: string; baseURL?: string },
		tools?: any[]
	) {
		super(messages, options)

		if (!options.apiKey) {
			throw new Error(Errors.no_api_key)
		}

		this.apiKey = options.apiKey
		this.baseURL = options.baseURL || 'https://api.x.ai/v1/chat/completions'
		this.grokMessages = messages
		this.tools = tools
	}

	/**
	 * Factory method for creating Grok streams
	 */
	static from(
		messages: GrokMessage[],
		options: CompletionsStreamOptions & { apiKey: string; baseURL?: string },
		tools?: any[]
	): GrokCompletionsStream {
		return new GrokCompletionsStream(messages, options, tools)
	}

	/**
	 * Async iterator - yields StreamEvents from Grok API
	 */
	async *[Symbol.asyncIterator](): AsyncIterableIterator<StreamEvent> {
		try {
			this.checkAborted()

			// Create streaming request
			const requestBody: Record<string, unknown> = {
				model: this.model,
				messages: this.grokMessages,
				stream: true,
				temperature: this.options.temperature,
				...(this.options.providerOptions || {})
			}

			// Add tools if available
			if (this.tools && this.tools.length > 0) {
				requestBody.tools = this.tools
				requestBody.tool_choice = 'auto'
			}

			// Make HTTP request with axios
			const response = await axios.post(this.baseURL, requestBody, {
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					'Content-Type': 'application/json'
				},
				adapter: 'fetch',
				responseType: 'stream',
				withCredentials: false,
				signal: this.signal
			})

			// Get reader from stream
			const reader = response.data.pipeThrough(new TextDecoderStream()).getReader()

			// Accumulate tool calls and track reasoning state
			const toolCalls: Map<number, ToolCall> = new Map()
			let inReasoning = false

			// Read stream chunks
			let reading = true
			let buffer = '' // Buffer to accumulate incomplete JSON chunks

			while (reading) {
				this.checkAborted()

				const { done, value } = await reader.read()
				if (done) {
					reading = false
					break
				}

				// Add new data to buffer and process complete lines
				buffer += value
				const lines = buffer.split('\n')

				// Keep the last incomplete line in buffer
				buffer = lines.pop() || ''

				for (const line of lines) {
					// Check for stream end marker
					if (line.includes('data: [DONE]')) {
						reading = false
						break
					}

					// Parse JSON data
					const trimmed = line.replace(/^data: /, '').trim()
					if (!trimmed) continue

					try {
						const chunk: GrokStreamChunk = JSON.parse(trimmed)
						const delta = chunk.choices?.[0]?.delta

						if (!delta) continue

						// Handle reasoning content (Grok-specific)
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
					} catch (parseError) {
						// Log parse errors with more context for debugging
						console.warn(Errors.parse_error, {
							error: parseError,
							trimmedData: trimmed,
							dataPreview: trimmed.substring(0, 100) + (trimmed.length > 100 ? '...' : ''),
							lineNumber: lines.indexOf(line) + 1
						})
						// Continue processing other lines
					}
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
				data: Object.assign(
					new Error(Errors.stream_failed),
					{ cause: error }
				)
			}
		}
	}
}
