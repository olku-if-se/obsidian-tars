/**
 * Abstract interface for status reporting functionality.
 * Host applications implement this to provide status reporting capabilities.
 */
export interface IStatusReporter {
	/**
	 * Report server connection status
	 * @param serverId - The server identifier
	 * @param status - The connection status
	 */
	reportServerStatus(serverId: string, status: 'connected' | 'disconnected' | 'error' | 'retrying'): void

	/**
	 * Report active execution count
	 * @param count - Number of currently active executions
	 */
	reportActiveExecutions(count: number): void

	/**
	 * Report session count for a document
	 * @param documentPath - Path to the document
	 * @param count - Current session count
	 * @param limit - Session limit for the document
	 */
	reportSessionCount(documentPath: string, count: number, limit: number): void

	/**
	 * Report error information
	 * @param type - Type of error (generation, mcp, tool, system)
	 * @param message - Error message
	 * @param error - Error object
	 * @param context - Additional context data
	 */
	reportError(
		type: 'generation' | 'mcp' | 'tool' | 'system',
		message: string,
		error: Error,
		context?: Record<string, unknown>
	): void
}

/**
 * No-op status reporter implementation for hosts that don't need status reporting
 */
export class NoOpStatusReporter implements IStatusReporter {
	reportServerStatus(): void {}
	reportActiveExecutions(): void {}
	reportSessionCount(): void {}
	reportError(): void {}
}
