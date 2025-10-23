/**
 * DI-enabled React Bridge Manager
 * Manages React bridge instances with dependency injection
 */

import { injectable, inject } from '@needle-di/core'
import type { App } from 'obsidian'
import { ReactBridge } from './ReactBridge'
import type { IReactBridge, IReactBridgeManager, ILoggingService } from '@tars/contracts'
import { LoggingServiceToken, AppToken } from '@tars/contracts'

/**
 * DI-enabled React Bridge Manager implementation
 */
@injectable()
export class ReactBridgeManager implements IReactBridgeManager {
	private reactBridge: IReactBridge | null = null
	private isInitialized = false

	constructor(
		private loggingService = inject(LoggingServiceToken),
		private app = inject(AppToken)
	) {}

	/**
	 * Get the React bridge instance
	 */
	getReactBridge(): IReactBridge {
		if (!this.isInitialized || !this.reactBridge) {
			throw new Error('React bridge not initialized. Call initialize() first.')
		}
		return this.reactBridge
	}

	/**
	 * Initialize the React bridge with Obsidian app
	 */
	initialize(app: App): void {
		if (this.isInitialized) {
			this.loggingService.warn('React bridge already initialized')
			return
		}

		this.loggingService.info('Initializing React bridge for DI architecture')

		// Create React bridge instance with the provided app
		this.reactBridge = new ReactBridge(app)
		this.isInitialized = true

		this.loggingService.info('React bridge initialized successfully')
	}

	/**
	 * Clean up all React components
	 */
	dispose(): void {
		if (this.reactBridge) {
			this.loggingService.info(`Disposing React bridge with ${this.reactBridge.getMountedCount()} mounted components`)
			this.reactBridge.unmountAll()
			this.reactBridge = null
		}
		this.isInitialized = false
		this.loggingService.info('React bridge disposed')
	}

	/**
	 * Check if React bridge is ready
	 */
	isReady(): boolean {
		return this.isInitialized && this.reactBridge !== null
	}
}
