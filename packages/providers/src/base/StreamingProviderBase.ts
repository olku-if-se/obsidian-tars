import type { BaseOptions, ILogger, ISettingsService, LlmCapability, LlmProvider, Message } from '@tars/contracts'
import { type ICompletionsStream, StreamQueue } from '../streaming'
import { DEFAULT_ERROR_HANDLING_CONFIG, type RetryConfig } from './ErrorHandlingConfig'
import type { StreamConfig } from './StreamConfig'
import { DEFAULT_PROCESSING_CONFIG, DEFAULT_STREAM_CONFIG } from './StreamConfig'
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
export abstract class StreamingProviderBase implements LlmProvider {
	protected logger: ILogger
	protected settings: ISettingsService

	protected constructor(logger: ILogger, settings: ISettingsService) {
		this.logger = logger
		this.settings = settings
	}

	// Abstract properties that providers must implement
	abstract readonly name: string
	abstract readonly displayName: string
	abstract readonly capabilities: LlmCapability[]
	abstract readonly websiteToObtainKey: string
	abstract readonly defaultOptions: BaseOptions

	validateOptions(_options: BaseOptions): boolean {
		return true
	}

	/**
	 * Create a completion stream for the given messages
	 * Provider-specific implementation
	 */
	protected abstract createCompletionStream(messages: Message[], config: StreamConfig): ICompletionsStream

	/**
	 * Stream with full error handling, retries, and callbacks
	 * This is the main entry point for streaming
	 */
	async *stream(messages: Message[], streamConfig: StreamConfig = {}): AsyncGenerator<string, void, unknown> {
		const config = this.mergeConfig(streamConfig)
		const context = new StreamingContext(this.name, 'default-model', config, {
			messageCount: messages.length
		})
		const { onStreamStart, onStreamEnd, onStreamEvent, onError } = config.callbacks ?? {}

		// Create stream queue with abort signal
		const stream = await this.createStreamWithRetry(messages, config)
		const queue = new StreamQueue(stream, config.signal)

		// Call onStreamStart callback
		await this.invokeCallback(onStreamStart, context.toStartStreamArgs())

		try {
			// Process queue with timeout wrapper
			const wrappedQueue = this.withTimeout(queue, config)

			for await (const event of wrappedQueue) {
				// Invoke onStreamEvent callback
				await this.invokeCallback(onStreamEvent, context.toEventArgs(event))

				// Process event based on type
				if (event.type === 'content') {
					const content = await this.processContent(event.data, context)
					if (content) yield content
				} else if (event.type === 'tool_calls') {
					// Tool calls handled by callback
					await this.invokeCallback(config.callbacks?.onToolCall, event.data)
				} else if (event.type === 'stream_end') {
					// Stream ended
					break
				} else if (event.type === 'error') {
					// Error event
					const error = event.data
					await this.invokeCallback(onError, error)
					throw error
				}
			}

			// Call onStreamEnd callback
			// noinspection TypeScriptValidateTypes
			await this.invokeCallback(onStreamEnd, context.toEndStreamArgs())
		} catch (error) {
			const wrappedError = error instanceof Error ? error : new Error(String(error))

			// Call onError callback
			// noinspection TypeScriptValidateTypes
			await this.invokeCallback(onError, context.toErrorArgs(wrappedError))

			throw wrappedError
		} finally {
			queue.close()
		}
	}

	/** Wrap iterable with timeout support. */
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

	/** Create stream with retry logic. */
	protected async createStreamWithRetry(messages: Message[], config: StreamConfig): Promise<ICompletionsStream> {
		const retryConfig = {
			...DEFAULT_ERROR_HANDLING_CONFIG.retry,
			...config.errorHandling?.retry
		}

		return this.withRetry(() => Promise.resolve(this.createCompletionStream(messages, config)), retryConfig)
	}

	/** Retry logic wrapper. */
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

	/** Check if error is retryable. */
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

	/** Process content with preprocessors/postprocessors. */
	protected async processContent(content: string, context: StreamingContext): Promise<string | null> {
		context.incrementChunk()

		const config = context.config
		const { onContentChunk } = config.callbacks ?? {}
		const { preprocessor, postprocessor } = config.processing ?? {}
		let processedContent = content

		// Apply preprocessor
		if (preprocessor) {
			processedContent = await preprocessor(processedContent, context.getProcessingContext())
		}

		// Invoke onContent callback
		// noinspection TypeScriptValidateTypes
		await this.invokeCallback(onContentChunk, context.toContentArgs(processedContent))

		// Apply postprocessor
		if (postprocessor) {
			processedContent = await postprocessor(processedContent, context.getProcessingContext())
		}

		// Accumulate if needed
		if (config.processing?.accumulateContent) {
			context.addContent(processedContent)
		}

		return processedContent
	}

	/** Merge configuration with defaults. */
	protected mergeConfig(config: Partial<StreamConfig>): StreamConfig {
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

	// noinspection JSAnnotator
	/** Invoke callback safely. */
	protected async invokeCallback<T extends AnyFunction>(
		callback: T | undefined,
		...args: Parameters<T>
	): Promise<unknown> {
		if (!callback) return // empty

		try {
			return await callback(...args)
		} catch (error) {
			// Log callback errors but don't throw
			this.logger?.warn?.('Callback error', error)
		}
	}
}

// biome-ignore lint/suspicious/noExplicitAny: keep it simple
type AnyFunction = (...args: any[]) => any
