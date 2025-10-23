/**
 * RequestController interface for managing AbortController instances
 * Provides centralized request lifecycle management with cleanup capabilities
 */
export interface IRequestController {
	/**
	 * Get the current AbortController instance, creating one if needed
	 * @returns AbortController instance for cancellation operations
	 */
	getController(): AbortController

	/**
	 * Cleanup method to reset the controller state and update editor status
	 * Resets isTextInserting flag and clears the aborter instance
	 */
	cleanup(): void
}
