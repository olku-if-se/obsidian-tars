import { inject } from '@needle-di/core'
import { DIBaseProvider } from '@tars/contracts'
import type { LlmCapability, LlmProvider } from '@tars/contracts/providers'
import { tokens } from '@tars/contracts/tokens'

/**
 * Template for creating DI-enabled providers
 * Extend this class to convert existing vendors to DI pattern
 */
export abstract class ProviderTemplate extends DIBaseProvider implements LlmProvider {
	// Abstract properties to be implemented by each provider
	abstract readonly name: string
	abstract readonly displayName: string
	abstract readonly capabilities: LlmCapability[]

	constructor(
		loggingService = inject(tokens.Logger),
		notificationService = inject(tokens.Notification, { optional: true }) || null,
		settingsService = inject(tokens.Settings, { optional: true }) || null,
		documentService = inject(tokens.Document, { optional: true }) || null
	) {
		super(loggingService, notificationService as any, settingsService as any, documentService as any)
	}

	// Getters for LlmProvider interface
	get defaultOptions() {
		return this.getDefaultOptions()
	}

	// Abstract methods for providers to implement
	protected abstract getDefaultOptions(): any
	protected abstract createVendorImplementation(): any

	// LlmProvider interface methods
	createSendRequest(options: any) {
		const vendor = this.createVendorImplementation()
		return vendor.sendRequestFunc(options)
	}

	validateOptions(options: any): boolean {
		try {
			const vendor = this.createVendorImplementation()
			return vendor.validateOptions?.(options) ?? true
		} catch {
			return false
		}
	}
}
