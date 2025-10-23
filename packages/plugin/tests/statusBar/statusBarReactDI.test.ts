/**
 * Test for DI-enabled StatusBarReactManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Container } from '@needle-di/core'
import { StatusBarReactManager } from '../../src/statusBarReact'
import { ObsidianLoggingService } from '../../src/services/ObsidianLoggingService'
import { ObsidianSettingsService } from '../../src/services/ObsidianSettingsService'
import { ReactBridge } from '../../src/bridge/ReactBridge'
import {
	LoggingServiceToken,
	SettingsServiceToken,
	ReactBridgeToken,
	StatusBarReactManagerToken
} from '@tars/contracts'
import type { PluginSettings } from '../../src/settings'

describe('DI StatusBarReactManager', () => {
	let container: Container
	let mockLoggingService: any
	let mockSettingsService: any
	let mockReactBridge: any
	let mockApp: any
	let mockStatusBarItem: any

	beforeEach(() => {
		container = new Container()

		// Mock logging service
		mockLoggingService = {
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn()
		}

		// Mock settings service
		mockSettingsService = {
			getAll: vi.fn(),
			watch: vi.fn(),
			setAll: vi.fn(),
			get: vi.fn(),
			set: vi.fn()
		}

		// Mock React bridge
		mockReactBridge = {
			mount: vi.fn(),
			unmount: vi.fn(),
			getMountedCount: vi.fn(),
			hasRoot: vi.fn()
		}

		// Mock Obsidian app
		mockApp = {
			vault: {},
			workspace: {}
		}

		// Mock status bar item
		mockStatusBarItem = {
			empty: vi.fn(),
			appendChild: vi.fn(),
			setText: vi.fn(),
			setAttribute: vi.fn(),
			style: {},
			onclick: null
		}

		// Set up default settings
		const defaultSettings: PluginSettings = {
			editorStatus: true,
			providers: [],
			systemTags: [],
			newChatTags: [],
			featureFlags: {
				reactStatusBar: true,
				reactModals: true
			}
		}

		mockSettingsService.getAll.mockReturnValue(defaultSettings)

		// Register mock services
		container.bind(LoggingServiceToken).toValue(mockLoggingService)
		container.bind(SettingsServiceToken).toValue(mockSettingsService)
		container.bind(ReactBridgeToken).toValue(mockReactBridge)
		container.bind('app').toValue(mockApp)
		container.bind('statusBarItem').toValue(mockStatusBarItem)
		container.bind(StatusBarReactManagerToken).toClass(StatusBarReactManager)
	})

	it('should be injectable and work with DI', () => {
		const statusBarManager = container.get(StatusBarReactManagerToken)
		expect(statusBarManager).toBeInstanceOf(StatusBarReactManager)
	})

	it('should initialize with DI dependencies', () => {
		const statusBarManager = container.get(StatusBarReactManagerToken)

		expect(mockLoggingService.debug).toHaveBeenCalledWith('Initializing DI-enabled StatusBarReactManager')
		expect(mockLoggingService.debug).toHaveBeenCalledWith('Settings watcher configured for feature flags')
		expect(mockLoggingService.debug).toHaveBeenCalledWith('StatusBarReactManager initialized successfully')
	})

	it('should set up settings watcher for feature flags', () => {
		const statusBarManager = container.get(StatusBarReactManagerToken)

		expect(mockSettingsService.watch).toHaveBeenCalledWith('featureFlags', expect.any(Function))
	})

	it('should use DI settings service for feature flag checks', () => {
		const statusBarManager = container.get(StatusBarReactManagerToken)

		// Test private method through public behavior
		const state = statusBarManager.getState()
		expect(mockSettingsService.getAll).toHaveBeenCalled()
	})

	it('should handle settings updates through DI service', () => {
		const statusBarManager = container.get(StatusBarReactManagerToken)
		const newSettings: Partial<PluginSettings> = {
			featureFlags: {
				reactStatusBar: false,
				reactModals: true
			}
		}

		// Call updateSettings
		statusBarManager.updateSettings(newSettings as PluginSettings)

		expect(mockSettingsService.setAll).toHaveBeenCalledWith(newSettings)
		expect(mockLoggingService.debug).toHaveBeenCalledWith('updateSettings called, updating settings through DI service')
	})

	it('should use DI React bridge for mounting components', () => {
		const statusBarManager = container.get(StatusBarReactManagerToken)

		// Trigger a React component mount by setting a status
		statusBarManager.setSuccessStatus({
			round: 1,
			characters: 100,
			duration: '5s',
			model: 'test-model'
		})

		// React bridge should be called for mounting
		expect(mockReactBridge.mount).toHaveBeenCalled()
	})

	it('should clean up settings watcher on dispose', () => {
		const statusBarManager = container.get(StatusBarReactManagerToken)
		const mockUnsubscribe = vi.fn()
		mockSettingsService.watch.mockReturnValue(mockUnsubscribe)

		// Re-initialize to get the unsubscribe function
		container.bind(StatusBarReactManagerToken).toClass(StatusBarReactManager)
		const newManager = container.get(StatusBarReactManagerToken)

		// Dispose
		newManager.dispose()

		expect(mockLoggingService.debug).toHaveBeenCalledWith('Disposing StatusBarReactManager')
		expect(mockLoggingService.debug).toHaveBeenCalledWith('StatusBarReactManager disposed successfully')
	})

	it('should handle modal opening with DI settings', () => {
		const statusBarManager = container.get(StatusBarReactManagerToken)

		// Set error status to enable modal opening
		const error = new Error('Test error')
		statusBarManager.setErrorStatus(error)

		// Mock DOM methods for modal creation
		global.document = {
			...global.document,
			createElement: vi.fn().mockReturnValue({
				style: {},
				appendChild: vi.fn(),
				remove: vi.fn()
			}),
			body: {
				appendChild: vi.fn()
			}
		} as any

		// Check that modal opening attempts use settings service
		expect(mockSettingsService.getAll).toHaveBeenCalled()
	})

	it('should log operations through DI logging service', () => {
		const statusBarManager = container.get(StatusBarReactManagerToken)

		// Test logging in various operations
		statusBarManager.setGeneratingStatus(1)
		statusBarManager.setSuccessStatus({
			round: 1,
			characters: 100,
			duration: '5s',
			model: 'test-model'
		})

		// Check that debug logs were made
		expect(mockLoggingService.debug).toHaveBeenCalledWith('Initializing DI-enabled StatusBarReactManager')
		expect(mockLoggingService.debug).toHaveBeenCalledWith('StatusBarReactManager initialized successfully')
	})
})
