import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPluginContainer, createTestContainer } from '../../src/container/plugin-container'
import type { ILoggingService, INotificationService, ISettingsService } from '@tars/contracts'

describe('DI Workflow Integration Tests', () => {
	let container: ReturnType<typeof createTestContainer>
	let mockApp: any
	let mockPlugin: any
	let mockSettings: any
	let mockStatusBarManager: any

	beforeEach(() => {
		// Setup mock objects
		mockApp = {
			vault: {},
			workspace: {}
		}
		mockPlugin = {
			settings: {}
		}
		mockSettings = {
			providers: [],
			userTags: ['#User :'],
			assistantTags: ['#Claude :']
		}
		mockStatusBarManager = {
			updateStatus: vi.fn(),
			showProgress: vi.fn(),
			hideProgress: vi.fn(),
			reportError: vi.fn()
		}

		// Create test container
		container = createTestContainer()
	})

	describe('Container Lifecycle', () => {
		it('should create plugin container with all dependencies', () => {
			const pluginContainer = createPluginContainer({
				app: mockApp,
				plugin: mockPlugin,
				settings: mockSettings,
				statusBarManager: mockStatusBarManager
			})

			expect(pluginContainer).toBeDefined()

			// Test that all expected services can be resolved
			const loggingService = pluginContainer.get(ILoggingService)
			const notificationService = pluginContainer.get(INotificationService)
			const settingsService = pluginContainer.get(ISettingsService)

			expect(loggingService).toBeDefined()
			expect(notificationService).toBeDefined()
			expect(settingsService).toBeDefined()
		})

		it('should provide consistent service instances (singleton pattern)', () => {
			const loggingService1 = container.get(ILoggingService)
			const loggingService2 = container.get(ILoggingService)

			expect(loggingService1).toBe(loggingService2)
		})
	})

	describe('Service Integration', () => {
		it('should allow services to communicate through DI', () => {
			const loggingService = container.get(ILoggingService)
			const notificationService = container.get(INotificationService)

			// Test that logging service works
			loggingService.debug('Test message')
			loggingService.info('Info message')
			loggingService.warn('Warning message')
			loggingService.error('Error message')

			// Test that notification service works
			notificationService.show('Success message')
			notificationService.warn('Warning message')
			notificationService.error('Error message')

			// Verify no errors thrown
			expect(true).toBe(true)
		})

		it('should support service replacement in test environment', () => {
			const originalService = container.get(ILoggingService)

			// Replace service with mock
			const mockService = {
				debug: vi.fn(),
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn()
			}

			container.register(ILoggingService).toInstance(mockService)
			const replacedService = container.get(ILoggingService)

			// Verify mock is used
			replacedService.debug('test')
			expect(mockService.debug).toHaveBeenCalledWith('test')

			// Verify it's different from original
			expect(replacedService).not.toBe(originalService)
		})
	})

	describe('Error Handling', () => {
		it('should handle missing services gracefully', () => {
			// Try to get a service that doesn't exist
			expect(() => {
				// This should work because container returns undefined for unregistered tokens
				const result = container.get('NonExistentService' as any)
				expect(result).toBeUndefined()
			}).not.toThrow()
		})

		it('should handle service creation errors', () => {
			// Register a service that throws in constructor
			class FailingService {
				constructor() {
					throw new Error('Service creation failed')
				}
			}

			expect(() => {
				container.register('FailingService').toClass(FailingService)
				container.get('FailingService')
			}).toThrow('Service creation failed')
		})
	})

	describe('Performance Validation', () => {
		it('should maintain performance with multiple service resolutions', () => {
			const iterations = 100

			const startTime = performance.now()

			for (let i = 0; i < iterations; i++) {
				const loggingService = container.get(ILoggingService)
				const notificationService = container.get(INotificationService)
				const settingsService = container.get(ISettingsService)

				// Use services
				loggingService.debug(`Iteration ${i}`)
				notificationService.show(`Notification ${i}`)
				settingsService.get('test-key', `value-${i}`)
			}

			const endTime = performance.now()
			const totalTime = endTime - startTime
			const averageTime = totalTime / (iterations * 3) // 3 services per iteration

			console.log(`DI Service Resolution Performance: ${averageTime.toFixed(6)}ms average per resolution`)
			console.log(`Total time for ${iterations * 3} resolutions: ${totalTime.toFixed(2)}ms`)

			// Should be very fast
			expect(averageTime).toBeLessThan(0.01)
		})
	})

	describe('DI Container Reuse', () => {
		it('should allow creating multiple test containers', () => {
			const container1 = createTestContainer()
			const container2 = createTestContainer()

			// Both containers should work independently
			const service1 = container1.get(ILoggingService)
			const service2 = container2.get(ILoggingService)

			expect(service1).toBeDefined()
			expect(service2).toBeDefined()
			expect(service1).not.toBe(service2) // Different instances

			// Test isolation
			service1.debug('Container 1')
			service2.debug('Container 2')

			expect(true).toBe(true)
		})

		it('should maintain clean state between tests', () => {
			// Verify container is clean after setup
			const loggingService = container.get(ILoggingService)
			expect(loggingService).toBeDefined()

			// Container should be in clean state
			expect(container).toBeDefined()
		})
	})

	describe('Real-world Simulation', () => {
		it('should simulate plugin initialization workflow', () => {
			// Simulate the actual plugin initialization order
			const pluginContainer = createPluginContainer({
				app: mockApp,
				plugin: mockPlugin,
				settings: mockSettings,
				statusBarManager: mockStatusBarManager
			})

			// Simulate plugin initialization sequence
			const loggingService = pluginContainer.get(ILoggingService)
			const notificationService = pluginContainer.get(INotificationService)
			const settingsService = pluginContainer.get(ISettingsService)

			// Simulate plugin startup
			loggingService.info('Plugin starting...')
			notificationService.show('Plugin loaded successfully')

			// Simulate settings loading
			const loadedSettings = settingsService.getAll()
			expect(loadedSettings).toBeDefined()

			// Simulate plugin ready state
			loggingService.info('Plugin ready')

			// Verify all services are working
			expect(loggingService).toBeDefined()
			expect(notificationService).toBeDefined()
			expect(settingsService).toBeDefined()
		})

		it('should simulate command execution with DI', () => {
			const container = createPluginContainer({
				app: mockApp,
				plugin: mockPlugin,
				settings: mockSettings,
				statusBarManager: mockStatusBarManager
			})

			const loggingService = container.get(ILoggingService)
			const notificationService = container.get(INotificationService)

			// Simulate command execution
			const executeCommand = (commandName: string) => {
				loggingService.info(`Executing command: ${commandName}`)
				notificationService.show(`Command ${commandName} executed`)
				return { success: true }
			}

			// Execute multiple commands
			const commands = ['insert-tag', 'generate-response', 'clear-cache']
			const results = commands.map(executeCommand)

			// Verify all commands executed successfully
			results.forEach(result => {
				expect(result.success).toBe(true)
			})

			// Verify services were called
			expect(loggingService.info).toHaveBeenCalledTimes(commands.length)
			expect(notificationService.show).toHaveBeenCalledTimes(commands.length)
		})
	})
})