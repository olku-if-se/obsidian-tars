/**
 * Mock implementations of DI services for DEMONSTRATION and UNIT TESTING purposes ONLY
 *
 * These provide no-op implementations that satisfy interface contracts.
 *
 * IMPORTANT: These mocks should NEVER be used as fallbacks in production code.
 * Production code should fail fast if DI services are not properly configured.
 *
 * Usage:
 * - Unit tests: Use these mocks to isolate provider functionality
 * - Demo purposes: Use these mocks when running providers standalone
 * - NEVER in production: Always require proper DI configuration
 */

import type { INotificationService, ISettingsService, IDocumentService } from '@tars/contracts'

/**
 * Mock notification service that does nothing
 */
export class MockNotificationService implements INotificationService {
	show(message: string): void {
		// No-op implementation
	}

	warn(message: string): void {
		// No-op implementation
	}

	error(message: string): void {
		// No-op implementation
	}
}

/**
 * Mock settings service that returns empty values
 */
export class MockSettingsService implements ISettingsService {
	async initialize(): Promise<void> {
		// No-op implementation
	}

	get<T>(key: string, defaultValue?: T): T {
		return defaultValue as T
	}

	set<T>(key: string, value: T): void {
		// No-op implementation
	}

	load(): Promise<void> {
		return Promise.resolve()
	}

	save(): Promise<void> {
		return Promise.resolve()
	}

	onChange(callback: (key: string, value: unknown) => void): void {
		// No-op implementation
	}
}

/**
 * Mock document service that returns empty values
 */
export class MockDocumentService implements IDocumentService {
	getCurrentDocumentPath(): string {
		return ''
	}

	getContent(): string {
		return ''
	}

	getDocumentPath(): string {
		return ''
	}
}

/**
 * Create a mock notification service
 */
export function createMockNotificationService(): INotificationService {
	return new MockNotificationService()
}

/**
 * Create a mock settings service
 */
export function createMockSettingsService(): ISettingsService {
	return new MockSettingsService()
}

/**
 * Create a mock document service
 */
export function createMockDocumentService(): IDocumentService {
	return new MockDocumentService()
}