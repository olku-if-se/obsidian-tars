import { CompletionsStream, type CompletionsStreamOptions } from '../../streaming/CompletionsStream'
import type { StreamEvent, ToolCall } from '../../streaming/types'
import type { OpenRouterMessage } from './types'

// Error messages (i18n-ready)
const Errors = {
	stream_failed: 'OpenRouter stream request failed',
	no_api_key: 'OpenRouter API key is required',
	no_reader: 'Response body is not readable',
	parse_error: 'Failed to parse OpenRouter response chunk'
} as const

/**
 * OpenRouter-specific completion stream
 * Uses fetch API with manual SSE parsing
 * Supports multi-provider routing
 */
export class OpenRouterCompletionsStream extends CompletionsStream {
	private apiKey: string
	private baseURL: string
	private openrouterMessages: OpenRouterMessage[]
	private tools?: any[]

	constructor(
		messages: OpenRouterMessage[],
		options: CompletionsStreamOptions & { apiKey: string; baseURL?: string },
		tools?: any[]
	) {
		super(messages, options)

		if (!options.apiKey) {
			throw new Error(Errors.no_api_key)
		}

		this.apiKey = options.apiKey
		this.baseURL = options.baseURL || 'https://openrouter.ai/api/v1/chat/completions'
		this.openrouterMessages = messages
		this.tools = tools
	}

	/**
	 * Factory method for creating OpenRouter streams
	 */
	static from(
		messages: OpenRouterMessage[],
		options: CompletionsStreamOptions & { apiKey: string; baseURL?: string },
		tools?: any[]
	): OpenRouterCompletionsStream {
		return new OpenRouterCompletionsStream(messages, options, tools)
	}

	/**
	 * Async iterator - yields StreamEvents from OpenRouter API
	 */
	async *[Symbol.asyncIterator](): AsyncIterableIterator<StreamEvent> {
		try {
			this.checkAborted()

			// Create streaming request body
			const requestBody: Record<string, unknown> = {
				model: this.model,
				messages: this.openrouterMessages,
				stream: true,
				temperature: this.options.temperature,
				...(this.options.providerOptions || {})
			}

			// Add tools if available
			if (this.tools && this.tools.length > 0) {
				requestBody.tools = this.tools
				requestBody.tool_choice = 'auto'
			}

			// Create timeout signal (30 seconds)
			const timeoutController = new AbortController()
			const timeoutId = setTimeout(() => timeoutController.abort(), 30000)

			// Combine signals
			const combinedSignal = new AbortController()
			const handleAbort = () => {
				combinedSignal.abort()
				clearTimeout(timeoutId)
			}
			this.signal.addEventListener('abort', handleAbort)
			timeoutController.signal.addEventListener('abort', handleAbort)

			let response: Response

			try {
				// Make fetch request
				response = await fetch(this.baseURL, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${this.apiKey}`
					},
					body: JSON.stringify(requestBody),
					signal: combinedSignal.signal
				})
			} finally {
				// Cleanup
				this.signal.removeEventListener('abort', handleAbort)
				clearTimeout(timeoutId)
			}

			// Get reader from response
			const reader = response.body?.getReader()
			if (!reader) {
				throw new Error(Errors.no_reader)
			}

			const decoder = new TextDecoder()
			let buffer = ''

			// Accumulate tool calls
			const toolCalls: Map<number, ToolCall> = new Map()

			try {
				while (true) {
					this.checkAborted()

					const { done, value } = await reader.read()
					if (done) break

					// Append new chunk to buffer
					buffer += decoder.decode(value, { stream: true })

					// Process complete lines from buffer
					while (true) {
						const lineEnd = buffer.indexOf('\n')
						if (lineEnd === -1) break

						const line = buffer.slice(0, lineEnd).trim()
						buffer = buffer.slice(lineEnd + 1)

						// Parse SSE format
						if (line.startsWith('data: ')) {
							const data = line.slice(6)

							// Check for stream end
							if (data === '[DONE]') {
								break
							}

							try {
								const parsed = JSON.parse(data)
								const delta = parsed.choices?.[0]?.delta

								if (!delta) continue

								// Handle content
								if (delta.content) {
									yield {
										type: 'content',
										data: delta.content
									}
								}

								// Handle tool calls
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
							} catch (parseError) {
								// Log parse errors but continue
								console.warn(Errors.parse_error, parseError)
							}
						}
					}
				}
			} finally {
				reader.cancel()
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
