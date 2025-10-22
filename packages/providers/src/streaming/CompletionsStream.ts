import type { ICompletionsStream, StreamEvent } from './types'

/**
 * Options for creating a completions stream
 */
export interface CompletionsStreamOptions {
	/** Abort signal for cancellation */
	signal?: AbortSignal
	/** Model identifier */
	model?: string
	/** Temperature for generation */
	temperature?: number
	/** Additional provider-specific options */
	[key: string]: any
}

/**
 * Abstract base class for provider-specific completion streams
 * Based on llm-chat.md architecture
 *
 * Each provider should extend this class and implement:
 * - Constructor to initialize provider client
 * - [Symbol.asyncIterator]() to yield StreamEvents
 *
 * Example usage:
 * ```typescript
 * class OpenAICompletionsStream extends CompletionsStream {
 *   constructor(messages, options, client) {
 *     super(messages, options)
 *     this.client = client
 *   }
 *
 *   async *[Symbol.asyncIterator]() {
 *     const stream = await this.client.chat.completions.create(...)
 *     for await (const chunk of stream) {
 *       yield { type: 'content', data: chunk.content }
 *     }
 *   }
 * }
 * ```
 */
export abstract class CompletionsStream implements ICompletionsStream {
	protected readonly signal?: AbortSignal
	protected readonly model: string
	protected readonly options: CompletionsStreamOptions

	constructor(protected messages: any[], options?: CompletionsStreamOptions) {
		this.options = options || {}
		this.signal = options?.signal
		this.model = options?.model || 'default-model'
	}

	/**
	 * Factory method for creating streams
	 * Subclasses can override this for custom initialization
	 */
	static from(messages: any[], options?: CompletionsStreamOptions): CompletionsStream {
		throw new Error('Subclasses must implement static from() method')
	}

	/**
	 * Check if the stream has been aborted
	 */
	protected checkAborted(): void {
		if (this.signal?.aborted) {
			throw new DOMException('Aborted', 'AbortError')
		}
	}

	/**
	 * Abstract iterator - must be implemented by provider
	 */
	abstract [Symbol.asyncIterator](): AsyncIterableIterator<StreamEvent>
}

/**
 * No-op implementation for testing
 */
export class NoOpCompletionsStream extends CompletionsStream {
	static from(messages: any[], options?: CompletionsStreamOptions): NoOpCompletionsStream {
		return new NoOpCompletionsStream(messages, options)
	}

	async *[Symbol.asyncIterator](): AsyncIterableIterator<StreamEvent> {
		this.checkAborted()

		// Yield mock content
		yield { type: 'content', data: 'Mock response from NoOp provider' }

		// End stream
		yield { type: 'stream_end', data: null }
	}
}
