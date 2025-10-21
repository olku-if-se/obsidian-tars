import type { ILogger as ILoggerContract } from '@tars/contracts/services/mcp-types'

/**
 * Abstract interface for logging functionality.
 * Host applications implement this to provide logging capabilities.
 */
export type ILogger = ILoggerContract

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
