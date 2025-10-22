import type { StreamEvent, StreamQueueState } from './types'
import { waitWithAbort, checkAborted, createAbortError } from './utils'

// Error Messages (i18n-ready)
const Errors = {
	queue_closed: 'Cannot push to closed StreamQueue',
	queue_aborted: 'Queue processing aborted',
	stream_error: 'Stream processing failed'
} as const

// Constants
const POLL_INTERVAL = 100 as const

/**
 * A generic queue for managing multiple async streams
 * Based on llm-chat.md architecture with DI support
 *
 * Use cases:
 * - Follow-up streams after tool calls
 * - Retry streams on error
 * - Sequential stream processing
 */
export class StreamQueue implements AsyncIterable<StreamEvent> {
	private queue: AsyncIterator<StreamEvent>[] = []
	private state: StreamQueueState = 'idle'
	private isClosed = false
	private signal?: AbortSignal

	constructor(initialStream?: AsyncIterable<StreamEvent>, signal?: AbortSignal) {
		this.signal = signal
		if (initialStream) {
			this.push(initialStream)
		}
	}

	/**
	 * Add a new stream to the queue
	 * The stream will be processed after all previous streams complete
	 */
	push(stream: AsyncIterable<StreamEvent>): void {
		if (this.isClosed) {
			throw new Error(Errors.queue_closed)
		}
		this.queue.push(stream[Symbol.asyncIterator]())
	}

	/**
	 * Close the queue - no more streams can be added
	 * Current stream will complete, but queue will not wait for more
	 */
	close(): void {
		this.isClosed = true
		if (this.state === 'idle') {
			this.state = 'closed'
		}
	}

	/**
	 * Get current queue state
	 */
	getState(): StreamQueueState {
		return this.state
	}

	/**
	 * Check if signal is aborted
	 */
	private checkAborted(): void {
		checkAborted(this.signal)
	}

	/**
	 * Async iterator implementation
	 * Processes streams sequentially from the queue
	 */
	async *[Symbol.asyncIterator](): AsyncIterableIterator<StreamEvent> {
		this.state = 'processing'

		try {
			while (true) {
				this.checkAborted()

				// If queue is empty and closed, we're done
				if (this.queue.length === 0 && this.isClosed) {
					break
				}

				// If queue is empty but not closed, wait for more streams
				if (this.queue.length === 0) {
					await this.waitForStream()
					continue
				}

				// Process the next stream in the queue
				const stream = this.queue.shift()
				if (!stream) continue

				try {
					yield* this.processStream(stream)
				} catch (error) {
					// Stream error - emit error event but continue processing
					this.state = 'error'
					const wrappedError = Object.assign(
						new Error(Errors.stream_error),
						{ cause: error }
					)
					yield {
						type: 'error',
						data: wrappedError
					} as StreamEvent
				}
			}
		} finally {
			if (this.state === 'error') {
				// Keep error state
			} else if (this.isClosed) {
				this.state = 'closed'
			} else {
				this.state = 'idle'
			}
		}
	}

	/**
	 * Process a single stream from the queue
	 */
	private async *processStream(stream: AsyncIterator<StreamEvent>): AsyncIterableIterator<StreamEvent> {
		while (true) {
			this.checkAborted()

			const result = await stream.next()

			if (result.done) {
				break
			}

			yield result.value
		}
	}

	/**
	 * Wait for a stream to be added to the queue
	 * Uses polling with abort signal support
	 */
	private async waitForStream(): Promise<void> {
		try {
			await waitWithAbort(POLL_INTERVAL, this.signal)
		} catch (error) {
			// Re-throw with proper error chain
			throw createAbortError(Errors.queue_aborted, error)
		}
	}
}
