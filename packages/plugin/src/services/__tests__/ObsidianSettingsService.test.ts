import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ObsidianSettingsService } from '../ObsidianSettingsService'
import { ISettingsService } from '@tars/contracts'
import { App, TFile } from 'obsidian'

// Mock Obsidian App and TFile
vi.mock('obsidian', () => ({
	App: vi.fn(),
	TFile: vi.fn()
}))

describe('ObsidianSettingsService', () => {
	let settingsService: ISettingsService
	let mockApp: any
	let mockPlugin: any
	let mockSettings: any

	beforeEach(() => {
		// Create mock app
		mockApp = {
			vault: {
				getAbstractFileByPath: vi.fn(),
				read: vi.fn(),
				modify: vi.fn(),
				create: vi.fn()
			},
			workspace: {
				getActiveFile: vi.fn()
			}
		}

		// Create mock plugin
		mockPlugin = {
			saveSettings: vi.fn().mockResolvedValue(undefined)
		}

		// Create mock settings
		mockSettings = {
			testKey: 'testValue',
			numberKey: 42,
			booleanKey: true,
			objectKey: { nested: 'value' }
		}

		settingsService = new ObsidianSettingsService(mockApp, mockPlugin, mockSettings)
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	it('should be instantiable', () => {
		expect(settingsService).toBeInstanceOf(ObsidianSettingsService)
	})

	it('should implement ISettingsService interface', () => {
		expect(settingsService.get).toBeTypeOf('function')
		expect(settingsService.set).toBeTypeOf('function')
		expect(settingsService.watch).toBeTypeOf('function')
		expect(settingsService.getAll).toBeTypeOf('function')
		expect(settingsService.setAll).toBeTypeOf('function')
		expect(settingsService.has).toBeTypeOf('function')
		expect(settingsService.remove).toBeTypeOf('function')
		expect(settingsService.clear).toBeTypeOf('function')
	})

	it('should get existing values', () => {
		expect(settingsService.get('testKey')).toBe('testValue')
		expect(settingsService.get('numberKey')).toBe(42)
		expect(settingsService.get('booleanKey')).toBe(true)
	})

	it('should return default value for non-existent keys', () => {
		expect(settingsService.get('nonExistentKey', 'default')).toBe('default')
		expect(settingsService.get('nonExistentKey')).toBeUndefined()
	})

	it('should set values correctly', () => {
		const newValue = 'newValue'
		settingsService.set('newKey', newValue)

		expect(settingsService.get('newKey')).toBe(newValue)
		expect(mockPlugin.saveSettings).toHaveBeenCalled()
	})

	it('should overwrite existing values', () => {
		settingsService.set('testKey', 'updatedValue')

		expect(settingsService.get('testKey')).toBe('updatedValue')
		expect(mockPlugin.saveSettings).toHaveBeenCalled()
	})

	it('should get all settings', () => {
		const allSettings = settingsService.getAll()

		expect(allSettings).toEqual(mockSettings)
	})

	it('should set multiple values', () => {
		const newSettings = {
			key1: 'value1',
			key2: 'value2',
			key3: 123
		}

		settingsService.setAll(newSettings)

		expect(settingsService.get('key1')).toBe('value1')
		expect(settingsService.get('key2')).toBe('value2')
		expect(settingsService.get('key3')).toBe(123)
		expect(mockPlugin.saveSettings).toHaveBeenCalled()
	})

	it('should check if key exists', () => {
		expect(settingsService.has('testKey')).toBe(true)
		expect(settingsService.has('nonExistentKey')).toBe(false)
	})

	it('should remove keys', () => {
		settingsService.remove('testKey')

		expect(settingsService.has('testKey')).toBe(false)
		expect(mockPlugin.saveSettings).toHaveBeenCalled()
	})

	it('should clear all settings', () => {
		settingsService.clear()

		const allSettings = settingsService.getAll()
		expect(Object.keys(allSettings)).toHaveLength(0)
		expect(mockPlugin.saveSettings).toHaveBeenCalled()
	})

	it('should watch for changes to specific keys', () => {
		const callback = vi.fn()
		const unsubscribe = settingsService.watch('testKey', callback)

		// Change the value
		settingsService.set('testKey', 'newValue')

		expect(callback).toHaveBeenCalledWith('newValue')
		expect(typeof unsubscribe).toBe('function')
	})

	it('should handle multiple watchers for same key', () => {
		const callback1 = vi.fn()
		const callback2 = vi.fn()

		settingsService.watch('testKey', callback1)
		settingsService.watch('testKey', callback2)

		settingsService.set('testKey', 'newValue')

		expect(callback1).toHaveBeenCalledWith('newValue')
		expect(callback2).toHaveBeenCalledWith('newValue')
	})

	it('should unsubscribe watchers correctly', () => {
		const callback = vi.fn()
		const unsubscribe = settingsService.watch('testKey', callback)

		unsubscribe()
		settingsService.set('testKey', 'newValue')

		expect(callback).not.toHaveBeenCalled()
	})

	it('should get app folder name', () => {
		const appFolder = (settingsService as any).getAppFolder()
		expect(typeof appFolder).toBe('string')
	})

	it('should get active file path', () => {
		const mockFile = { path: 'test.md' }
		mockApp.workspace.getActiveFile.mockReturnValue(mockFile)

		const activePath = (settingsService as any).getActiveFilePath()
		expect(activePath).toBe('test.md')
		expect(mockApp.workspace.getActiveFile).toHaveBeenCalled()
	})
})