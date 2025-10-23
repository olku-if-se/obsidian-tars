import type Anthropic from '@anthropic-ai/sdk'
import type { Message } from '@tars/contracts'
import { CompletionsStream, type CompletionsStreamOptions } from '../../streaming/CompletionsStream'
import type { StreamEvent, ToolCall } from '../../streaming/types'

/**
 * Claude (Anthropic) specific completion stream
 * Uses Anthropic's native API format
 */
export class ClaudeCompletionsStream extends CompletionsStream {
	private client: Anthropic
	private claudeMessages: Anthropic.MessageParam[]
	private tools?: Anthropic.Tool[]
	private maxTokens: number

	constructor(
		messages: Message[],
		options: CompletionsStreamOptions & { maxTokens?: number },
		client: Anthropic,
		tools?: any[]
	) {
		super(messages, options)
		this.client = client
		this.maxTokens = options.maxTokens || 4096

		// Convert messages to Claude format
		this.claudeMessages = this.convertMessages(messages)

		// Convert tools to Claude format if provided
		this.tools = tools ? this.convertTools(tools) : undefined
	}

	/**
	 * Factory method for creating Claude streams
	 */
	static from(
		messages: Message[],
		options: CompletionsStreamOptions & { maxTokens?: number },
		client: Anthropic,
		tools?: any[]
	): ClaudeCompletionsStream {
		return new ClaudeCompletionsStream(messages, options, client, tools)
	}

	/**
	 * Convert generic messages to Claude format
	 */
	private convertMessages(messages: Message[]): Anthropic.MessageParam[] {
		return messages
			.filter((msg) => msg.role !== 'system') // Claude handles system separately
			.map((msg) => ({
				role: msg.role as 'user' | 'assistant',
				content: msg.content
			}))
	}

	/**
	 * Extract system message if present
	 */
	private extractSystemMessage(messages: Message[]): string | undefined {
		const systemMsg = messages.find((msg) => msg.role === 'system')
		return systemMsg?.content
	}

	/**
	 * Convert tools to Claude format
	 */
	private convertTools(tools: any[]): Anthropic.Tool[] {
		return tools.map((tool) => ({
			name: tool.function?.name || tool.name,
			description: tool.function?.description || tool.description,
			input_schema: tool.function?.parameters ||
				tool.input_schema || {
					type: 'object',
					properties: {},
					required: []
				}
		}))
	}

	/**
	 * Async iterator - yields StreamEvents from Claude API
	 */
	async *[Symbol.asyncIterator](): AsyncIterableIterator<StreamEvent> {
		try {
			this.checkAborted()

			// Build request params
			const requestParams: Anthropic.MessageCreateParams = {
				model: this.model,
				messages: this.claudeMessages,
				max_tokens: this.maxTokens,
				temperature: this.options.temperature,
				stream: true
			}

			// Add system message if present
			const systemMessage = this.extractSystemMessage(this.messages)
			if (systemMessage) {
				requestParams.system = systemMessage
			}

			// Add tools if available
			if (this.tools && this.tools.length > 0) {
				requestParams.tools = this.tools
			}

			// Create streaming request
			const stream = await this.client.messages.create(requestParams)

			// Process stream events
			let contentAccumulator = ''
			const toolUseBlocks: any[] = []

			for await (const event of stream) {
				this.checkAborted()

				switch (event.type) {
					case 'content_block_start':
						// New content block starting
						if (event.content_block.type === 'text') {
							// Text content block
						} else if (event.content_block.type === 'tool_use') {
							// Tool use block
							toolUseBlocks.push({
								id: event.content_block.id,
								name: event.content_block.name,
								input: ''
							})
						}
						break

					case 'content_block_delta':
						if (event.delta.type === 'text_delta') {
							// Text content delta
							const textChunk = event.delta.text
							contentAccumulator += textChunk

							yield {
								type: 'content',
								data: textChunk
							}
						} else if (event.delta.type === 'input_json_delta') {
							// Tool input delta
							const lastTool = toolUseBlocks[toolUseBlocks.length - 1]
							if (lastTool) {
								lastTool.input += event.delta.partial_json
							}
						}
						break

					case 'content_block_stop':
						// Content block finished
						break

					case 'message_delta':
						// Message metadata (usage, stop_reason, etc.)
						break

					case 'message_stop':
						// Message complete
						break

					case 'error':
						// Error occurred
						yield {
							type: 'error',
							data: new Error(`Claude error: ${JSON.stringify(event)}`)
						}
						break
				}
			}

			// Yield tool calls if any were collected
			if (toolUseBlocks.length > 0) {
				const toolCalls: ToolCall[] = toolUseBlocks.map((block) => ({
					id: block.id,
					type: 'function',
					function: {
						name: block.name,
						arguments: block.input
					}
				}))

				yield {
					type: 'tool_calls',
					data: toolCalls
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
