/**
 * Abstract interface for user notification functionality.
 * Host applications implement this to provide user notification capabilities.
 */
export interface INotificationHandler {
	/**
	 * Handle session limit reached scenario
	 * @param documentPath - Path to the document that reached the limit
	 * @param limit - The session limit
	 * @param current - Current session count
	 * @returns Promise resolving to 'continue' or 'cancel'
	 */
	onSessionLimitReached(documentPath: string, limit: number, current: number): Promise<'continue' | 'cancel'>

	/**
	 * Handle session reset notification
	 * @param documentPath - Path to the document that was reset
	 */
	onSessionReset(documentPath: string): void

	/**
	 * Handle server auto-disable notification
	 * @param serverId - The server identifier
	 * @param serverName - Human-readable server name
	 * @param failureCount - Number of consecutive failures
	 */
	onServerAutoDisabled(serverId: string, serverName: string, failureCount: number): void
}

/**
 * Default notification handler implementation that always cancels at limits
 */
export class DefaultNotificationHandler implements INotificationHandler {
	async onSessionLimitReached(_documentPath: string, _limit: number, _current: number): Promise<'continue' | 'cancel'> {
		return 'cancel'
	}

	onSessionReset(_documentPath: string): void {
		// No-op by default
	}

	onServerAutoDisabled(_serverId: string, _serverName: string, _failureCount: number): void {
		// No-op by default
	}
}
