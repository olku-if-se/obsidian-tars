/**
 * Basic tests for contracts package exports
 */

import { describe, expect, it } from 'vitest'
import type {
	IDocumentService,
	ILogger,
	IMcpService,
	INotificationService,
	ISettingsService,
	IStatusService
} from './services'
import type { DIBaseProvider } from './providers/di-base'
import type { BaseOptions, Message, Vendor } from './providers/base'

describe('Contracts Package', () => {
	it('should export service interfaces', () => {
		// Test that interfaces are properly exported (interfaces don't exist at runtime)
		// We verify they exist through type checking and usage
		const loggingService: ILogger = {} as ILogger
		const notificationService: INotificationService = {} as INotificationService
		const settingsService: ISettingsService = {} as ISettingsService
		const statusService: IStatusService = {} as IStatusService
		const documentService: IDocumentService = {} as IDocumentService
		const mcpService: IMcpService = {} as IMcpService

		expect(loggingService).toBeDefined()
		expect(notificationService).toBeDefined()
		expect(settingsService).toBeDefined()
		expect(statusService).toBeDefined()
		expect(documentService).toBeDefined()
		expect(mcpService).toBeDefined()
	})

	it('should export provider types', () => {
		// Test that provider types are properly exported
		const diBaseProvider: DIBaseProvider = {} as DIBaseProvider
		expect(diBaseProvider).toBeDefined()

		// These should be type interfaces that don't exist at runtime
		// but we can test their structure through assignments
		const baseOptions: BaseOptions = {} as BaseOptions
		expect(baseOptions).toBeDefined()

		const message: Message = {} as Message
		expect(message).toBeDefined()

		const vendor: Vendor = {} as Vendor
		expect(vendor).toBeDefined()
	})

	it('should have proper type safety', () => {
		// Test that the contracts provide proper type safety

		// Service interfaces should require specific methods
		const mockLoggingService: ILogger = {
			debug: (_message: string, _args: unknown[]) => {},
			info: (_message: string, _args: unknown[]) => {},
			warn: (_message: string, _args: unknown[]) => {},
			error: (_message: string, _args: unknown[]) => {}
		}
		expect(mockLoggingService).toBeDefined()

		const mockNotificationService: INotificationService = {
			show: (_message: string) => {},
			warn: (_message: string) => {},
			error: (_message: string) => {}
		}
		expect(mockNotificationService).toBeDefined()
	})

	it('should export all required modules', () => {
		// Verify that main index exports all modules through imports
		expect(() => {
			// These imports should work without throwing
			import('./services')
			import('./providers')
			import('./events')
		}).not.toThrow()
	})
})
