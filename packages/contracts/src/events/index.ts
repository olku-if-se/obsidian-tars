/**
 * Event contracts for provider events
 */

export interface ProviderEvent {
	/**
	 * Event type identifier
	 */
	type: string

	/**
	 * Event timestamp
	 */
	timestamp: Date

	/**
	 * Event payload data
	 */
	data?: unknown

	/**
	 * Event source/provider name
	 */
	source: string
}

export interface ProviderRequestEvent extends ProviderEvent {
	type: 'request:start' | 'request:progress' | 'request:complete' | 'request:error'
	data: {
		messageCount?: number
		responseLength?: number
		error?: Error
	}
}

export interface ProviderToolEvent extends ProviderEvent {
	type: 'tool:start' | 'tool:complete' | 'tool:error'
	data: {
		toolName: string
		serverName: string
		result?: unknown
		error?: Error
	}
}

export type ProviderEvents = ProviderRequestEvent | ProviderToolEvent

export interface ProviderEventEmitter {
	/**
	 * Emit a provider event
	 */
	emit(event: ProviderEvent): void

	/**
	 * Subscribe to provider events
	 * Returns an unsubscribe function
	 */
	on(eventType: string, callback: (event: ProviderEvent) => void): () => void

	/**
	 * Subscribe to all provider events
	 * Returns an unsubscribe function
	 */
	onAll(callback: (event: ProviderEvent) => void): () => void

	/**
	 * Remove all event listeners
	 */
	removeAllListeners(): void
}
