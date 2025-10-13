/**
 * Abstract interface for logging functionality.
 * Host applications implement this to provide logging capabilities.
 */
export interface ILogger {
	/**
	 * Log debug information
	 * @param message - The message to log
	 * @param context - Additional context data
	 */
	debug(message: string, context?: Record<string, unknown>): void

	/**
	 * Log informational messages
	 * @param message - The message to log
	 * @param context - Additional context data
	 */
	info(message: string, context?: Record<string, unknown>): void

	/**
	 * Log warning messages
	 * @param message - The message to log
	 * @param context - Additional context data
	 */
	warn(message: string, context?: Record<string, unknown>): void

	/**
	 * Log error messages
	 * @param message - The message to log
	 * @param error - Optional error object
	 * @param context - Additional context data
	 */
	error(message: string, error?: Error, context?: Record<string, unknown>): void
}

/**
 * No-op logger implementation for hosts that don't need logging
 */
export class NoOpLogger implements ILogger {
	debug(): void {}
	info(): void {}
	warn(): void {}
	error(): void {}
}

/**
 * Console logger implementation for testing and simple applications
 */
export class ConsoleLogger implements ILogger {
	constructor(private prefix = '[MCP]') {}

	debug(message: string, context?: Record<string, unknown>): void {
		console.debug(`${this.prefix} ${message}`, context ?? '')
	}

	info(message: string, context?: Record<string, unknown>): void {
		console.info(`${this.prefix} ${message}`, context ?? '')
	}

	warn(message: string, context?: Record<string, unknown>): void {
		console.warn(`${this.prefix} ${message}`, context ?? '')
	}

	error(message: string, error?: Error, context?: Record<string, unknown>): void {
		console.error(`${this.prefix} ${message}`, error ?? '', context ?? '')
	}
}
