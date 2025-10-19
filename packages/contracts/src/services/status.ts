/**
 * Status service interface for managing status bar and progress indicators
 */
export interface IStatusService {
	/**
	 * Update the main status bar message
	 */
	updateStatus(status: string): void

	/**
	 * Show a progress indicator with message
	 */
	showProgress(message: string): void

	/**
	 * Hide the progress indicator
	 */
	hideProgress(): void

	/**
	 * Report an error and update status accordingly
	 */
	reportError(error: Error): void

	/**
	 * Set status to ready/normal state
	 */
	setReady(): void

	/**
	 * Set status to busy/working state
	 */
	setBusy(message?: string): void

	/**
	 * Set status to error state
	 */
	setError(message: string): void

	/**
	 * Get current status information
	 */
	getCurrentStatus(): StatusInfo

	/**
	 * Subscribe to status changes
	 * Returns an unsubscribe function
	 */
	onStatusChange(callback: (status: StatusInfo) => void): () => void
}

/**
 * Status information interface
 */
export interface StatusInfo {
	/**
	 * Current status message
	 */
	message: string

	/**
	 * Current status state
	 */
	state: StatusState

	/**
	 * Whether progress is being shown
	 */
	showingProgress: boolean

	/**
	 * Progress message if showing progress
	 */
	progressMessage?: string

	/**
	 * Last error if any
	 */
	lastError?: Error

	/**
	 * Timestamp of last update
	 */
	lastUpdated: Date
}

/**
 * Status states
 */
export type StatusState = 'ready' | 'busy' | 'error' | 'progress'
