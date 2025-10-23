import type { ILoggingService, ISettingsService, Message } from '@tars/contracts'
import type { RetryConfig, StreamConfig } from '../config'
import { DEFAULT_ERROR_HANDLING_CONFIG, DEFAULT_PROCESSING_CONFIG, DEFAULT_STREAM_CONFIG } from '../config'
import { StreamQueue } from '../streaming'
import { StreamingContext } from './StreamingContext'

/**
 * Abstract base class for streaming providers
 * Integrates StreamQueue, error handling, retries, timeouts, and callbacks
 *
 * Based on llm-chat.md architecture with simplified DI
 *
 * RULE: Providers package should NOT interact with UI
 * - ✅ Settings: Required for configuration
 * - ✅ Logging: Required for internal debugging
 * - ❌ Notifications: Handled by callbacks (onError)
 * - ❌ Document updates: Handled by callbacks (onContent)
 * - ❌ MCP: Tools provided externally via EventEmitter
 *
 * Subclasses must implement:
 * - createCompletionStream() - Create provider-specific completion stream
 *
 * Usage:
 * ```typescript
 * @injectable()
 * class OpenAIStreamingProvider extends StreamingProviderBase {
 *   constructor(
 *     loggingService = inject(tokens.Logger),
 *     settingsService = inject(tokens.Settings)
 *   ) {
 *     super(loggingService, settingsService)
 *   }
 * }
 * ```
 *
 * Note: Do not apply @injectable() to this abstract class.
 * Apply it to concrete implementations instead.
 */
export abstract class StreamingProviderBase {
	protected loggingService: ILoggingService
	protected settingsService: ISettingsService

	constructor(loggingService: ILoggingService, settingsService: ISettingsService) {
		this.loggingService = loggingService
		this.settingsService = settingsService
	}

	// Abstract properties that providers must implement
	abstract readonly name: string
	abstract readonly displayName: string
	abstract readonly capabilities: string[]
	abstract readonly websiteToObtainKey: string
	/**
	 * Create a completion stream for the given messages
	 * Provider-specific implementation
	 */
	protected abstract createCompletionStream(messages: Message[], config: StreamConfig): ICompletionsStream

	/**
	 * Stream with full error handling, retries, and callbacks
	 * This is the main entry point for streaming
	 */
	async *stream(messages: Message[], config: StreamConfig = {}): AsyncGenerator<string, void, unknown> {
		const mergedConfig = this.mergeConfig(config)
		const context = new StreamingContext(this.name, 'default-model', mergedConfig)

		// Create stream queue with abort signal
		const queue = this.createStreamQueue(mergedConfig.signal)

		// Create initial completion stream
		const initialStream = await this.createStreamWithRetry(messages, mergedConfig)
		queue.push(initialStream)

		// Call onStreamStart callback
		await this.invokeCallback(mergedConfig.callbacks?.onStreamStart, {
			provider: this.name,
			model: 'default-model',
			messageCount: messages.length,
			timestamp: Date.now()
		})

		try {
			// Process queue with timeout wrapper
			const wrappedQueue = this.withTimeout(queue, mergedConfig)

			for await (const event of wrappedQueue) {
				// Invoke onStreamEvent callback
				await this.invokeCallback(mergedConfig.callbacks?.onStreamEvent, event)

				// Process event based on type
				if (event.type === 'content') {
					const content = await this.processContent(event.data, context, mergedConfig)
					if (content) {
						yield content
					}
				} else if (event.type === 'tool_calls') {
					// Tool calls handled by callback
					await this.invokeCallback(mergedConfig.callbacks?.onToolCall, event.data)
				} else if (event.type === 'stream_end') {
					// Stream ended
					break
				} else if (event.type === 'error') {
					// Error event
					const error = event.data
					await this.invokeCallback(mergedConfig.callbacks?.onError, error, false)
					throw error
				}
			}

			// Call onStreamEnd callback
			await this.invokeCallback(mergedConfig.callbacks?.onStreamEnd, {
				provider: this.name,
				model: 'default-model',
				messageCount: messages.length,
				timestamp: Date.now()
			})
		} catch (error) {
			const wrappedError = error instanceof Error ? error : new Error(String(error))

			// Call onError callback
			await this.invokeCallback(mergedConfig.callbacks?.onError, wrappedError, false)

			throw wrappedError
		} finally {
			queue.close()
		}
	}

	/**
	 * Create stream queue with abort signal
	 */
	protected createStreamQueue(signal?: AbortSignal): StreamQueue {
		return new StreamQueue(undefined, signal)
	}

	/**
	 * Wrap iterable with timeout support
	 */
	protected withTimeout<T>(iterable: AsyncIterable<T>, config: StreamConfig): AsyncIterable<T> {
		const timeoutMs = config.errorHandling?.timeout?.chunkTimeout

		if (!timeoutMs) {
			return iterable
		}

		const abortOnTimeout = config.errorHandling?.timeout?.abortOnTimeout ?? true

		return {
			[Symbol.asyncIterator]() {
				const iterator = iterable[Symbol.asyncIterator]()
				return {
					async next(): Promise<IteratorResult<T>> {
						return Promise.race([
							iterator.next(),
							new Promise<IteratorResult<T>>((_, reject) => {
								setTimeout(() => {
									const error = new Error(`Stream timed out after ${timeoutMs}ms of inactivity`)
									error.name = 'TimeoutError'

									if (abortOnTimeout && config.signal) {
										config.signal.dispatchEvent(new Event('abort'))
									}

									reject(error)
								}, timeoutMs)
							})
						])
					}
				}
			}
		}
	}

	/**
	 * Create stream with retry logic
	 */
	protected async createStreamWithRetry(messages: Message[], config: StreamConfig): Promise<ICompletionsStream> {
		const retryConfig = {
			...DEFAULT_ERROR_HANDLING_CONFIG.retry,
			...config.errorHandling?.retry
		}

		return this.withRetry(() => Promise.resolve(this.createCompletionStream(messages, config)), retryConfig)
	}

	/**
	 * Retry logic wrapper
	 */
	protected async withRetry<T>(fn: () => Promise<T>, retryConfig: RetryConfig): Promise<T> {
		let lastError: Error | null = null

		for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
			try {
				return await fn()
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error))

				// Check if error is retryable
				const isRetryable = this.isRetryableError(lastError, retryConfig)

				if (!isRetryable || attempt === retryConfig.maxRetries) {
					throw lastError
				}

				// Calculate delay with exponential backoff
				const delay = Math.min(
					retryConfig.retryDelay * retryConfig.backoffMultiplier ** attempt,
					retryConfig.maxRetryDelay
				)

				// Wait before retry
				await new Promise((resolve) => setTimeout(resolve, delay))
			}
		}

		throw lastError || new Error('Retry failed')
	}

	/**
	 * Check if error is retryable
	 */
	protected isRetryableError(error: Error, retryConfig: RetryConfig): boolean {
		// Custom predicate
		if (retryConfig.shouldRetry) {
			return retryConfig.shouldRetry(error, 0)
		}

		// Check error name/message
		return retryConfig.retryableErrors.some(
			(pattern) => error.name.includes(pattern) || error.message.includes(pattern)
		)
	}

	/**
	 * Process content with preprocessors/postprocessors
	 */
	protected async processContent(
		content: string,
		context: StreamingContext,
		config: StreamConfig
	): Promise<string | null> {
		context.incrementChunk()

		let processedContent = content

		// Apply preprocessor
		if (config.processing?.preprocessor) {
			processedContent = await config.processing.preprocessor(processedContent, context.getProcessingContext())
		}

		// Apply postprocessor
		if (config.processing?.postprocessor) {
			processedContent = await config.processing.postprocessor(processedContent, context.getProcessingContext())
		}

		// Invoke onContent callback
		await this.invokeCallback(config.callbacks?.onContent, processedContent, {
			chunkIndex: context.getCurrentChunkIndex(),
			tokens: undefined,
			timestamp: Date.now()
		})

		// Accumulate if needed
		if (config.processing?.accumulateContent) {
			context.addContent(processedContent)
		}

		return processedContent
	}

	/**
	 * Merge configuration with defaults
	 */
	protected mergeConfig(config: StreamConfig): StreamConfig {
		return {
			...DEFAULT_STREAM_CONFIG,
			...config,
			errorHandling: {
				...DEFAULT_ERROR_HANDLING_CONFIG,
				...config.errorHandling
			},
			processing: {
				...DEFAULT_PROCESSING_CONFIG,
				...config.processing
			}
		}
	}

	/**
	 * Invoke callback safely
	 */
	protected async invokeCallback<T extends (...args: any[]) => any>(
		callback: T | undefined,
		...args: Parameters<T>
	): Promise<void> {
		if (!callback) {
			return
		}

		try {
			const result = callback(...args)
			if (result instanceof Promise) {
				await result
			}
		} catch (error) {
			// Log callback errors but don't throw
			this.loggingService?.warn?.('Callback error', error)
		}
	}
}
