import 'reflect-metadata'
import { Container } from '@needle-di/core'
import {
	ILoggingService,
	INotificationService,
	ISettingsService,
	IStatusService,
	IDocumentService,
	IMcpService
} from '@tars/contracts/services'

// Service implementations
import { ObsidianLoggingService } from '../services/ObsidianLoggingService'
import { ObsidianNotificationService } from '../services/ObsidianNotificationService'
import { ObsidianStatusService } from '../services/ObsidianStatusService'
import { ObsidianDocumentService } from '../services/ObsidianDocumentService'
import { ObsidianMcpService } from '../services/ObsidianMcpService'

// Existing MCP components (will be wrapped for DI)
import { MCPServerManager } from '../mcp/managerMCPUse'
import { ToolExecutor } from '../mcp/executor'
import { CodeBlockProcessor } from '../mcp/codeBlockProcessor'

export interface CreateContainerOptions {
	app: any // Obsidian App instance
	plugin: any // TarsPlugin instance
	settings: any // PluginSettings instance
	statusBarManager: any // StatusBarManager instance
}

export function createPluginContainer(options: CreateContainerOptions): Container {
	const { app, plugin, settings, statusBarManager } = options

	const container = new Container({ defaultScope: 'singleton' })

	// Register framework instances
	container.register('App').toInstance(app)
	container.register('TarsPlugin').toInstance(plugin)
	container.register('PluginSettings').toInstance(settings)
	container.register('StatusBarManager').toInstance(statusBarManager)

	// Register service implementations
	container.register(ILoggingService).toClass(ObsidianLoggingService)
	container.register(INotificationService).toClass(ObsidianNotificationService)
	container.register(IStatusService).toClass(ObsidianStatusService)
	container.register(IDocumentService).toClass(ObsidianDocumentService)

	// Register ObsidianSettingsService with dependencies
	container.register(ISettingsService).toClass(ObsidianSettingsService)

	// Register MCP components as DI services
	// Note: These are existing classes that we're registering for DI
	container.register('MCPServerManager').toClass(MCPServerManager)
	container.register('ToolExecutor').toClass(ToolExecutor)
	container.register('CodeBlockProcessor').toClass(CodeBlockProcessor)

	// Register MCP service with dependencies
	container.register(IMcpService).toClass(ObsidianMcpService)

	return container
}

/**
 * Create a container for testing with mocked services
 */
export function createTestContainer(): Container {
	const container = new Container({ defaultScope: 'singleton' })

	// Mock implementations for testing
	container.register(ILoggingService).toInstance({
		debug: jest.fn(),
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn()
	})

	container.register(INotificationService).toInstance({
		show: jest.fn(),
		warn: jest.fn(),
		error: jest.fn()
	})

	container.register(ISettingsService).toInstance({
		get: jest.fn(),
		set: jest.fn(),
		watch: jest.fn(),
		getAll: jest.fn(),
		setAll: jest.fn(),
		has: jest.fn(),
		remove: jest.fn(),
		clear: jest.fn()
	})

	container.register(IStatusService).toInstance({
		updateStatus: jest.fn(),
		showProgress: jest.fn(),
		hideProgress: jest.fn(),
		reportError: jest.fn(),
		setReady: jest.fn(),
		setBusy: jest.fn(),
		setError: jest.fn(),
		getCurrentStatus: jest.fn(),
		onStatusChange: jest.fn()
	})

	container.register(IDocumentService).toInstance({
		getCurrentDocumentPath: jest.fn().mockReturnValue('test.md'),
		resolveEmbedAsBinary: jest.fn(),
		createPlainText: jest.fn(),
		getDocumentWriteLock: jest.fn(),
		normalizePath: jest.fn().mockImplementation(path => path),
		getFileBasename: jest.fn().mockReturnValue('test'),
		getFileExtension: jest.fn().mockReturnValue('md'),
		getFolderPath: jest.fn().mockReturnValue(''),
		fileExists: jest.fn().mockReturnValue(true),
		readFile: jest.fn(),
		writeFile: jest.fn(),
		getFolderFiles: jest.fn().mockReturnValue([])
	})

	container.register('App').toInstance({})
	container.register('TarsPlugin').toInstance({})
	container.register('PluginSettings').toInstance({})
	container.register('StatusBarManager').toInstance({})

	return container
}