import { inject, injectable } from '@needle-di/core'
import type { IRequestController } from '@tars/contracts'
import { ISettingsServiceToken } from '@tars/contracts'

/**
 * Obsidian-specific implementation of IRequestController
 * Manages AbortController instances with cleanup capabilities
 */
@injectable()
export class ObsidianRequestControllerService implements IRequestController {
	private aborterInstance: AbortController | null = null

	constructor(private settingsService = inject(ISettingsServiceToken)) {}

	/**
	 * Get the current AbortController instance, creating one if needed
	 * @returns AbortController instance for cancellation operations
	 */
	getController(): AbortController {
		if (!this.aborterInstance) {
			this.aborterInstance = new AbortController()
		}
		return this.aborterInstance
	}

	/**
	 * Cleanup method to reset the controller state and update editor status
	 * Resets isTextInserting flag and clears the aborter instance
	 */
	cleanup(): void {
		const settings = this.settingsService.getAll()
		if (settings && typeof settings === 'object' && 'editorStatus' in settings) {
			// Update editor status to indicate text insertion is complete
			;(settings as any).editorStatus.isTextInserting = false
		}
		this.aborterInstance = null
	}
}
