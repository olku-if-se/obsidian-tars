import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ObsidianLoggingService } from '../ObsidianLoggingService'
import { ILoggingService } from '@tars/contracts/services'

describe('ObsidianLoggingService', () => {
	let loggingService: ILoggingService
	let debugSpy: any

	beforeEach(() => {
		// Mock the debug module
		debugSpy = vi.fn()
		vi.doMock('debug', () => {
			return () => debugSpy
		})

		// Import after mocking
		const { ObsidianLoggingService } = require('../ObsidianLoggingService')
		loggingService = new ObsidianLoggingService()
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	it('should be instantiable', () => {
		expect(loggingService).toBeInstanceOf(ObsidianLoggingService)
	})

	it('should implement ILoggingService interface', () => {
		expect(loggingService.debug).toBeTypeOf('function')
		expect(loggingService.info).toBeTypeOf('function')
		expect(loggingService.warn).toBeTypeOf('function')
		expect(loggingService.error).toBeTypeOf('function')
	})

	it('should log debug messages correctly', () => {
		const message = 'Test debug message'
		const args = { key: 'value' }

		loggingService.debug(message, args)

		expect(debugSpy).toHaveBeenCalledWith('DEBUG: Test debug message', args)
	})

	it('should log info messages correctly', () => {
		const message = 'Test info message'
		const args = { key: 'value' }

		loggingService.info(message, args)

		expect(debugSpy).toHaveBeenCalledWith('INFO: Test info message', args)
	})

	it('should log warn messages correctly', () => {
		const message = 'Test warn message'
		const args = { key: 'value' }

		loggingService.warn(message, args)

		expect(debugSpy).toHaveBeenCalledWith('WARN: Test warn message', args)
	})

	it('should log error messages correctly', () => {
		const message = 'Test error message'
		const args = { key: 'value' }

		loggingService.error(message, args)

		expect(debugSpy).toHaveBeenCalledWith('ERROR: Test error message', args)
	})

	it('should handle multiple arguments correctly', () => {
		const message = 'Test message'
		const arg1 = { key1: 'value1' }
		const arg2 = { key2: 'value2' }
		const arg3 = 'string arg'

		loggingService.info(message, arg1, arg2, arg3)

		expect(debugSpy).toHaveBeenCalledWith('INFO: Test message', arg1, arg2, arg3)
	})

	it('should handle empty arguments correctly', () => {
		const message = 'Test message'

		loggingService.info(message)

		expect(debugSpy).toHaveBeenCalledWith('INFO: Test message')
	})
})