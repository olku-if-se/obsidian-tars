/**
 * Pure utility functions for streaming operations
 * Following code-rules.md: Extract complex object literals and repeated conditions
 */

/**
 * Wait for a duration with abort signal support
 * Extracted from StreamQueue to follow pure utility pattern
 */
export const waitWithAbort = (ms: number, signal?: AbortSignal): Promise<void> => {
	return Promise.race([
		new Promise<void>((resolve) => setTimeout(resolve, ms)),
		new Promise<void>((_, reject) => {
			signal?.addEventListener('abort', () => {
				const error = new Error('Operation aborted')
				error.name = 'AbortError'
				reject(error)
			})
		})
	])
}

/**
 * Check if abort signal is active
 */
export const checkAborted = (signal?: AbortSignal): void => {
	if (signal?.aborted) {
		const error = new Error('Operation aborted')
		error.name = 'AbortError'
		throw error
	}
}

/**
 * Create an abort error with proper cause chain
 */
export const createAbortError = (message: string, cause?: unknown): Error => {
	const error = new Error(message)
	error.name = 'AbortError'
	return Object.assign(error, { cause })
}

/**
 * Wrap an async iterable with timeout support
 * Throws error if no item is yielded within timeoutMs
 */
export const withTimeout = <T>(
	iterable: AsyncIterable<T>,
	timeoutMs: number,
	signal?: AbortSignal
): AsyncIterable<T> => {
	return {
		[Symbol.asyncIterator]() {
			const iterator = iterable[Symbol.asyncIterator]()
			return {
				async next(): Promise<IteratorResult<T>> {
					return Promise.race([
						iterator.next(),
						new Promise<IteratorResult<T>>((_, reject) => {
							const timeoutId = setTimeout(() => {
								const error = Object.assign(new Error(`Stream timed out after ${timeoutMs}ms of inactivity`), {
									name: 'TimeoutError'
								})
								reject(error)
							}, timeoutMs)

							signal?.addEventListener('abort', () => {
								clearTimeout(timeoutId)
							})
						})
					])
				}
			}
		}
	}
}

/**
 * Delay with exponential backoff
 * Pure utility for retry logic
 */
export const backoffDelay = (attempt: number, baseDelay: number, multiplier: number, maxDelay: number): number => {
	return Math.min(baseDelay * multiplier ** attempt, maxDelay)
}

/**
 * Check if error matches retry pattern
 */
export const isRetryableError = (error: Error, patterns: string[], statusCodes?: number[]): boolean => {
	// Check error name/message
	const matchesPattern = patterns.some((pattern) => error.name.includes(pattern) || error.message.includes(pattern))

	// Check status code if available (from HTTP errors)
	const errorWithStatus = error as Error & { status?: number }
	const matchesStatus = statusCodes && errorWithStatus.status ? statusCodes.includes(errorWithStatus.status) : false

	return matchesPattern || matchesStatus
}
