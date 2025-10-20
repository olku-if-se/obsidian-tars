/**
 * Test for self-contained DI StatusBarReactManager that creates its own status bar element
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
	StatusBarReactManagerToken,
	StatusBarElementToken
} from '@tars/contracts'
import type { PluginSettings } from '../../src/settings'
import { createPluginContainer, registerStatusBarElement } from '../../src/container/plugin-container'

describe('Self-contained DI StatusBarReactManager', () => {
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
			workspace: {},
			addStatusBarItem: vi.fn().mockReturnValue({
				empty: vi.fn(),
				appendChild: vi.fn(),
				setText: vi.fn(),
				setAttribute: vi.fn(),
				style: {},
				onclick: null
			})
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
		container.bind(StatusBarReactManagerToken).toClass(StatusBarReactManager)
	})

	it('should create its own status bar element when instantiated', () => {
		const statusBarManager = container.get(StatusBarReactManagerToken)

		// Verify that addStatusBarItem was called
		expect(mockApp.addStatusBarItem).toHaveBeenCalled()

		// Verify that the manager has the status bar element
		const statusBarElement = statusBarManager.getStatusBarElement()
		expect(statusBarElement).toBeDefined()

		// Verify logging
		expect(mockLoggingService.debug).toHaveBeenCalledWith('Created status bar element', {
			element: expect.any(Boolean)
		})
	})

	it('should make status bar element available through DI registration', () => {
		const statusBarManager = container.get(StatusBarReactManagerToken)

		// Register the status bar element
		registerStatusBarElement(container)

		// Verify that the status bar element can be retrieved via DI
		const statusBarElement = container.get(StatusBarElementToken)
		expect(statusBarElement).toBe(statusBarManager.getStatusBarElement())

		expect(mockApp.addStatusBarItem).toHaveBeenCalled()
	})

	it('should be completely self-contained with no external dependencies', () => {
		// Create container options without statusBarItem
		const containerOptions = {
			app: mockApp,
			plugin: {},
			settings: defaultSettings,
			statusBarManager: {}
		}

		// Create container using our plugin container factory
		const pluginContainer = createPluginContainer(containerOptions)

		// Register status bar element
		registerStatusBarElement(pluginContainer)

		// Verify everything works
		const statusBarManager = pluginContainer.get(StatusBarReactManagerToken)
		const statusBarElement = pluginContainer.get(StatusBarElementToken)

		expect(statusBarManager).toBeInstanceOf(StatusBarReactManager)
		expect(statusBarElement).toBeDefined()
		expect(statusBarElement).toBe(statusBarManager.getStatusBarElement())

		// Verify status bar creation was called
		expect(mockApp.addStatusBarItem).toHaveBeenCalled()
	})

	it('should use DI settings service for feature flag checks', () => {
		const statusBarManager = container.get(StatusBarReactManagerToken)

		// Test private method through public behavior
		const state = statusBarManager.getState()
		expect(mockSettingsService.getAll).toHaveBeenCalled()
	})

	it('should maintain all DI functionality with self-contained status bar', () => {
		const statusBarManager = container.get(StatusBarReactManagerToken)

		// Test settings watching
		expect(mockSettingsService.watch).toHaveBeenCalledWith('featureFlags', expect.any(Function))

		// Test React component mounting
		statusBarManager.setSuccessStatus({
			round: 1,
			characters: 100,
			duration: '5s',
			model: 'test-model'
		})

		expect(mockReactBridge.mount).toHaveBeenCalled()

		// Test logging through DI service
		expect(mockLoggingService.debug).toHaveBeenCalledWith('Initializing DI-enabled StatusBarReactManager')
		expect(mockLoggingService.debug).toHaveBeenCalledWith('Created status bar element', expect.any(Object))
	})

	it('should handle disposal properly', () => {
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

	it('should expose status bar element for other components via DI', () => {
		const statusBarManager = container.get(StatusBarReactManagerToken)
		registerStatusBarElement(container)

		// Verify that other components could potentially access the status bar element
		const statusBarElement = container.get(StatusBarElementToken)

		expect(statusBarElement).toBe(statusBarManager.getStatusBarElement())
		expect(statusBarElement).toBeDefined()

		// Verify it's the same element created by the manager
		expect(mockApp.addStatusBarItem).toHaveBeenCalled()
	})
})