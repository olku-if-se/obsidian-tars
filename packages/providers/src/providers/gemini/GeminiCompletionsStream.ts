import type { GoogleGenAI } from '@google/genai'
import type { Message } from '@tars/contracts'
import { CompletionsStream, type CompletionsStreamOptions } from '../../streaming/CompletionsStream'
import type { StreamEvent, ToolCall } from '../../streaming/types'

/**
 * Gemini (Google) specific completion stream
 * Uses new @google/genai SDK (v1.26.0+)
 */
export class GeminiCompletionsStream extends CompletionsStream {
	private client: GoogleGenAI
	private systemInstruction?: string
	private userMessage: string
	private tools?: any[]
	private maxOutputTokens: number

	constructor(
		messages: Message[],
		options: CompletionsStreamOptions & { maxOutputTokens?: number },
		client: GoogleGenAI,
		tools?: any[]
	) {
		super(messages, options)
		this.client = client
		this.maxOutputTokens = options.maxOutputTokens || 4096
		
		// Convert messages to Gemini format
		const converted = this.convertMessages(messages)
		this.systemInstruction = converted.systemInstruction
		this.userMessage = converted.userMessage
		
		// Store tools if provided
		this.tools = tools
	}

	/**
	 * Factory method for creating Gemini streams
	 */
	static from(
		messages: Message[],
		options: CompletionsStreamOptions & { maxOutputTokens?: number },
		client: GoogleGenAI,
		tools?: any[]
	): GeminiCompletionsStream {
		return new GeminiCompletionsStream(messages, options, client, tools)
	}

	/**
	 * Convert generic messages to Gemini format
	 * New SDK expects: systemInstruction + user message (simplified for streaming)
	 */
	private convertMessages(messages: Message[]): { systemInstruction?: string; userMessage: string } {
		// Extract system message if present
		const systemMessage = messages.find(msg => msg.role === 'system')
		const systemInstruction = systemMessage?.content

		// Get non-system messages
		const nonSystemMessages = messages.filter(msg => msg.role !== 'system')
		
		// Combine all messages into user context (simplified approach for streaming)
		const userMessage = nonSystemMessages
			.map(msg => `${msg.role === 'assistant' ? 'Assistant' : 'User'}: ${msg.content}`)
			.join('\n\n')

		return { systemInstruction, userMessage }
	}


	/**
	 * Async iterator - yields StreamEvents from Gemini API (new SDK)
	 */
	async *[Symbol.asyncIterator](): AsyncIterableIterator<StreamEvent> {
		try {
			this.checkAborted()

			// Build request config for new SDK
			const config: any = {
				model: this.model,
				contents: this.userMessage,
				config: {
					temperature: this.options.temperature,
					maxOutputTokens: this.maxOutputTokens
				}
			}

			// Add system instruction if present
			if (this.systemInstruction) {
				config.systemInstruction = this.systemInstruction
			}

			// Add tools if available
			if (this.tools && this.tools.length > 0) {
				config.tools = this.tools
			}

			// Generate content with streaming (new SDK API)
			const response = await this.client.models.generateContentStream(config)

			// Process stream chunks (response is directly iterable)
			for await (const chunk of response) {
				this.checkAborted()

				// Get text content from chunk
				if (chunk.text) {
					yield {
						type: 'content',
						data: chunk.text
					}
				}

				// Check for function calls (tool calls)
				if (chunk.functionCalls && chunk.functionCalls.length > 0) {
					const toolCalls: ToolCall[] = chunk.functionCalls.map((fc: any, index: number) => ({
						id: `call_${index}_${Date.now()}`,
						type: 'function',
						function: {
							name: fc.name,
							arguments: JSON.stringify(fc.args || fc.arguments)
						}
					}))

					yield {
						type: 'tool_calls',
						data: toolCalls
					}
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
