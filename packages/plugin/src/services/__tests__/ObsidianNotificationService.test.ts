import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ObsidianNotificationService } from '../ObsidianNotificationService'
import { Notice } from 'obsidian'

// Mock Obsidian Notice
vi.mock('obsidian', () => ({
	Notice: vi.fn()
}))

describe('ObsidianNotificationService', () => {
	let notificationService: ObsidianNotificationService
	let noticeMock: any

	beforeEach(() => {
		noticeMock = vi.fn()
		;(Notice as any).mockImplementation(noticeMock)

		notificationService = new ObsidianNotificationService()
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	it('should be instantiable', () => {
		expect(notificationService).toBeInstanceOf(ObsidianNotificationService)
	})

	it('should show regular notifications', () => {
		const message = 'Test notification'

		notificationService.show(message)

		expect(noticeMock).toHaveBeenCalledWith(message)
	})

	it('should show warning notifications with prefix and longer duration', () => {
		const message = 'Test warning'

		notificationService.warn(message)

		expect(noticeMock).toHaveBeenCalledWith('⚠️ Test warning', 5000)
	})

	it('should show error notifications with prefix and longest duration', () => {
		const message = 'Test error'

		notificationService.error(message)

		expect(noticeMock).toHaveBeenCalledWith('❌ Test error', 8000)
	})

	it('should handle empty messages gracefully', () => {
		expect(() => {
			notificationService.show('')
			notificationService.warn('')
			notificationService.error('')
		}).not.toThrow()

		expect(noticeMock).toHaveBeenCalledTimes(3)
	})

	it('should handle special characters in messages', () => {
		const specialMessage = 'Test with special chars: !@#$%^&*()'

		notificationService.show(specialMessage)

		expect(noticeMock).toHaveBeenCalledWith(specialMessage)
	})

	it('should handle very long messages', () => {
		const longMessage = 'A'.repeat(1000)

		notificationService.show(longMessage)

		expect(noticeMock).toHaveBeenCalledWith(longMessage)
	})
})