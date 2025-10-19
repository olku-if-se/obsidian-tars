import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ObsidianStatusService } from '../ObsidianStatusService'
import { IStatusService } from '@tars/contracts'

describe('ObsidianStatusService', () => {
	let statusService: IStatusService
	let mockStatusBarManager: any

	beforeEach(() => {
		// Create mock status bar manager
		mockStatusBarManager = {
			updateStatus: vi.fn()
		}

		statusService = new ObsidianStatusService(mockStatusBarManager)
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	it('should be instantiable', () => {
		expect(statusService).toBeInstanceOf(ObsidianStatusService)
	})

	it('should implement IStatusService interface', () => {
		expect(statusService.updateStatus).toBeTypeOf('function')
		expect(statusService.showProgress).toBeTypeOf('function')
		expect(statusService.hideProgress).toBeTypeOf('function')
		expect(statusService.reportError).toBeTypeOf('function')
		expect(statusService.setReady).toBeTypeOf('function')
		expect(statusService.setBusy).toBeTypeOf('function')
		expect(statusService.setError).toBeTypeOf('function')
		expect(statusService.getCurrentStatus).toBeTypeOf('function')
		expect(statusService.onStatusChange).toBeTypeOf('function')
	})

	it('should have initial ready status', () => {
		const status = statusService.getCurrentStatus()
		expect(status.message).toBe('Ready')
		expect(status.state).toBe('ready')
		expect(status.showingProgress).toBe(false)
	})

	it('should update status correctly', () => {
		const message = 'New status message'
		statusService.updateStatus(message)

		const status = statusService.getCurrentStatus()
		expect(status.message).toBe(message)
		expect(status.state).toBe('ready')
		expect(status.showingProgress).toBe(false)
		expect(mockStatusBarManager.updateStatus).toHaveBeenCalledWith(message)
	})

	it('should show progress correctly', () => {
		const message = 'Working...'
		statusService.showProgress(message)

		const status = statusService.getCurrentStatus()
		expect(status.message).toBe(message)
		expect(status.state).toBe('progress')
		expect(status.showingProgress).toBe(true)
		expect(status.progressMessage).toBe(message)
		expect(mockStatusBarManager.updateStatus).toHaveBeenCalledWith(`⏳ ${message}`)
	})

	it('should hide progress correctly', () => {
		// First show progress
		statusService.showProgress('Test progress')
		expect(statusService.getCurrentStatus().showingProgress).toBe(true)

		// Then hide progress
		statusService.hideProgress()

		const status = statusService.getCurrentStatus()
		expect(status.showingProgress).toBe(false)
		expect(status.progressMessage).toBeUndefined()
		expect(status.state).toBe('ready')
	})

	it('should report errors correctly', () => {
		const error = new Error('Test error')
		statusService.reportError(error)

		const status = statusService.getCurrentStatus()
		expect(status.message).toBe('Error: Test error')
		expect(status.state).toBe('error')
		expect(status.showingProgress).toBe(false)
		expect(status.lastError).toBe(error)
		expect(mockStatusBarManager.updateStatus).toHaveBeenCalledWith('❌ Test error')
	})

	it('should set ready status', () => {
		statusService.setReady()

		const status = statusService.getCurrentStatus()
		expect(status.message).toBe('Ready')
		expect(status.state).toBe('ready')
		expect(status.showingProgress).toBe(false)
	})

	it('should set busy status', () => {
		const message = 'Processing...'
		statusService.setBusy(message)

		const status = statusService.getCurrentStatus()
		expect(status.message).toBe(message)
		expect(status.state).toBe('busy')
		expect(status.showingProgress).toBe(false)
		expect(mockStatusBarManager.updateStatus).toHaveBeenCalledWith(`🔄 ${message}`)
	})

	it('should set busy status with default message', () => {
		statusService.setBusy()

		const status = statusService.getCurrentStatus()
		expect(status.message).toBe('Working...')
		expect(status.state).toBe('busy')
	})

	it('should set error status', () => {
		const message = 'Custom error message'
		statusService.setError(message)

		const status = statusService.getCurrentStatus()
		expect(status.message).toBe(message)
		expect(status.state).toBe('error')
		expect(mockStatusBarManager.updateStatus).toHaveBeenCalledWith(`❌ ${message}`)
	})

	it('should track status changes with callbacks', () => {
		const callback = vi.fn()
		const unsubscribe = statusService.onStatusChange(callback)

		statusService.updateStatus('New status')
		statusService.setError('Error status')

		expect(callback).toHaveBeenCalledTimes(2)
		expect(callback).toHaveBeenNthCalledWith(1, expect.objectContaining({
			message: 'New status',
			state: 'ready'
		}))
		expect(callback).toHaveBeenNthCalledWith(2, expect.objectContaining({
			message: 'Error status',
			state: 'error'
		}))

		expect(typeof unsubscribe).toBe('function')
	})

	it('should handle multiple status change listeners', () => {
		const callback1 = vi.fn()
		const callback2 = vi.fn()

		statusService.onStatusChange(callback1)
		statusService.onStatusChange(callback2)

		statusService.updateStatus('Test status')

		expect(callback1).toHaveBeenCalledTimes(1)
		expect(callback2).toHaveBeenCalledTimes(1)
	})

	it('should unsubscribe from status changes correctly', () => {
		const callback = vi.fn()
		const unsubscribe = statusService.onStatusChange(callback)

		unsubscribe()
		statusService.updateStatus('Test status')

		expect(callback).not.toHaveBeenCalled()
	})

	it('should provide status snapshots that are immutable', () => {
		statusService.updateStatus('Original status')
		const status1 = statusService.getCurrentStatus()

		statusService.updateStatus('Updated status')
		const status2 = statusService.getCurrentStatus()

		expect(status1.message).toBe('Original status')
		expect(status2.message).toBe('Updated status')
		expect(status1).not.toBe(status2) // Different objects
	})

	it('should handle missing status bar manager gracefully', () => {
		const serviceWithoutManager = new ObsidianStatusService(null)

		expect(() => {
			serviceWithoutManager.updateStatus('Test')
			serviceWithoutManager.showProgress('Test')
			serviceWithoutManager.setError('Error')
		}).not.toThrow()
	})

	it('should update timestamps correctly', () => {
		const beforeTime = new Date()
		statusService.updateStatus('Test')
		const afterTime = new Date()

		const status = statusService.getCurrentStatus()
		expect(status.lastUpdated.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
		expect(status.lastUpdated.getTime()).toBeLessThanOrEqual(afterTime.getTime())
	})
})