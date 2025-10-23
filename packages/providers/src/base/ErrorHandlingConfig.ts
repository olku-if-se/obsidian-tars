/**
 * Error handling and retry configuration
 * Provides unified error handling across all providers
 */

/**
 * Retry configuration for failed requests
 */
export interface RetryConfig {
	/** Maximum number of retry attempts */
	maxRetries: number

	/** Base delay between retries in milliseconds */
	retryDelay: number

	/** Exponential backoff multiplier (1 = no backoff, 2 = double each time) */
	backoffMultiplier: number

	/** Maximum delay cap in milliseconds */
	maxRetryDelay: number

	/** Error types that should trigger a retry (by error name or message pattern) */
	retryableErrors: string[]

	/** HTTP status codes that should trigger a retry */
	retryableStatusCodes: number[]

	/** Custom retry predicate function */
	shouldRetry?: (error: Error, attempt: number) => boolean
}

/**
 * Timeout configuration
 */
export interface TimeoutConfig {
	/** Timeout in milliseconds for the entire request */
	requestTimeout?: number

	/** Timeout in milliseconds for each stream chunk */
	chunkTimeout?: number

	/** Whether to abort on timeout (vs. just throwing error) */
	abortOnTimeout: boolean
}

/**
 * Error transformation and reporting
 */
export interface ErrorReportingConfig {
	/** Whether to include stack traces in error messages */
	includeStackTrace: boolean

	/** Whether to sanitize API keys from error messages */
	sanitizeSecrets: boolean

	/** Custom error transformer */
	transformError?: (error: Error) => Error

	/** Error logger callback */
	onError?: (error: Error, context: ErrorContext) => void
}

/**
 * Context information about where an error occurred
 */
export interface ErrorContext {
	/** Provider name */
	provider: string

	/** Operation that failed */
	operation: string

	/** Retry attempt number (0 for first attempt) */
	attempt: number

	/** Additional metadata */
	metadata?: Record<string, any>
}

/**
 * Complete error handling configuration
 */
export interface ErrorHandlingConfig {
	retry: RetryConfig
	timeout: TimeoutConfig
	reporting: ErrorReportingConfig
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
	maxRetries: 3,
	retryDelay: 1000, // 1 second
	backoffMultiplier: 2,
	maxRetryDelay: 30000, // 30 seconds
	retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'Network', 'timeout'],
	retryableStatusCodes: [408, 429, 500, 502, 503, 504]
}

/**
 * Default timeout configuration
 */
export const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = {
	requestTimeout: 60000, // 60 seconds
	chunkTimeout: 30000, // 30 seconds
	abortOnTimeout: true
}

/**
 * Default error reporting configuration
 */
export const DEFAULT_ERROR_REPORTING_CONFIG: ErrorReportingConfig = {
	includeStackTrace: false,
	sanitizeSecrets: true
}

/**
 * Default complete error handling configuration
 */
export const DEFAULT_ERROR_HANDLING_CONFIG: ErrorHandlingConfig = {
	retry: DEFAULT_RETRY_CONFIG,
	timeout: DEFAULT_TIMEOUT_CONFIG,
	reporting: DEFAULT_ERROR_REPORTING_CONFIG
}
