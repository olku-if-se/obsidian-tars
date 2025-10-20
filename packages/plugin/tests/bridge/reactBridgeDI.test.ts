/**
 * Test for DI-enabled React Bridge
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Container } from '@needle-di/core'
import { ReactBridge } from '../../src/bridge/ReactBridge'
import { ReactBridgeManager } from '../../src/bridge/ReactBridgeManagerDI'
import { ObsidianLoggingService } from '../../src/services/ObsidianLoggingService'
import {
	LoggingServiceToken,
	ReactBridgeToken,
	ReactBridgeManagerToken,
	AppToken
} from '@tars/contracts'

describe('DI React Bridge', () => {
	let container: Container
	let mockLoggingService: any
	let mockApp: any

	beforeEach(() => {
		container = new Container()

		// Mock logging service
		mockLoggingService = {
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn()
		}

		// Mock Obsidian app
		mockApp = {
			vault: {},
			workspace: {}
		}

		// Register mock services
		container.bind(LoggingServiceToken).toValue(mockLoggingService)
		container.bind(AppToken).toValue(mockApp)
		container.bind(ReactBridgeToken).toClass(ReactBridge)
		container.bind(ReactBridgeManagerToken).toClass(ReactBridgeManager)
	})

	it('should be injectable and work with DI', () => {
		const bridge = container.get(ReactBridgeToken)
		expect(bridge).toBeInstanceOf(ReactBridge)
	})

	it('should create ReactBridgeManager through DI', () => {
		const manager = container.get(ReactBridgeManagerToken)
		expect(manager).toBeInstanceOf(ReactBridgeManager)
	})

	it('should initialize React bridge through manager', () => {
		const manager = container.get(ReactBridgeManagerToken)

		// Initialize the bridge
		manager.initialize(mockApp)

		expect(manager.isReady()).toBe(true)
		expect(mockLoggingService.info).toHaveBeenCalledWith('Initializing React bridge for DI architecture')
		expect(mockLoggingService.info).toHaveBeenCalledWith('React bridge initialized successfully')
	})

	it('should get React bridge from manager', () => {
		const manager = container.get(ReactBridgeManagerToken)
		manager.initialize(mockApp)

		const bridge = manager.getReactBridge()
		expect(bridge).toBeInstanceOf(ReactBridge)
	})

	it('should handle component mounting with DI logging', () => {
		const bridge = container.get(ReactBridgeToken)
		const mockContainer = {
			tagName: 'DIV',
			empty: vi.fn(),
			createDiv: vi.fn()
		}

		const MockComponent = vi.fn()
		MockComponent.displayName = 'TestComponent'

		bridge.mount(mockContainer as any, MockComponent as any, { test: 'value' })

		expect(mockLoggingService.debug).toHaveBeenCalledWith('Mounting React component', {
			componentName: 'TestComponent',
			containerTag: 'DIV',
			hasExistingRoot: false
		})
	})

	it('should handle cleanup through manager', () => {
		const manager = container.get(ReactBridgeManagerToken)
		manager.initialize(mockApp)

		// Dispose through manager
		manager.dispose()

		expect(manager.isReady()).toBe(false)
		expect(mockLoggingService.info).toHaveBeenCalledWith('React bridge disposed')
	})

	it('should prevent double initialization', () => {
		const manager = container.get(ReactBridgeManagerToken)
		manager.initialize(mockApp)

		// Try to initialize again
		manager.initialize(mockApp)

		expect(mockLoggingService.warn).toHaveBeenCalledWith('React bridge already initialized')
	})

	it('should throw error when getting bridge before initialization', () => {
		const manager = container.get(ReactBridgeManagerToken)

		expect(() => manager.getReactBridge()).toThrow(
			'React bridge not initialized. Call initialize() first.'
		)
	})
})