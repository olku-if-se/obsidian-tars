import 'reflect-metadata'
import { Container } from '@needle-di/core'
import {
	ILoggingService,
	INotificationService,
	ISettingsService,
	IStatusService,
	IDocumentService,
	IMcpService
} from '@tars/contracts'

// Service implementations
import { ObsidianLoggingService } from '../services/ObsidianLoggingService'
import { ObsidianNotificationService } from '../services/ObsidianNotificationService'
import { ObsidianStatusService } from '../services/ObsidianStatusService'
import { ObsidianDocumentService } from '../services/ObsidianDocumentService'
import { ObsidianSettingsService } from '../services/ObsidianSettingsService'
import { ObsidianMcpService } from '../services/ObsidianMcpService'

// Existing MCP components (will be wrapped for DI)
import { MCPServerManager, ToolExecutor } from '@tars/mcp-hosting'
import { CodeBlockProcessor } from '../mcp/codeBlockProcessor'

// Contract imports for token registration
import {
	IMCPServerManager,
	IToolExecutor,
	ICodeBlockProcessor
} from '@tars/contracts'

// DI Commands
import { AssistantTagDICommand, UserTagDICommand, SystemTagDICommand } from '../commands/di'

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
	container.register(ISettingsService).toClass(ObsidianSettingsService)

	// Register MCP components as DI services with proper tokens
	container.register(IMCPServerManager).toClass(MCPServerManager)
	container.register(IToolExecutor).toClass(ToolExecutor)
	container.register(ICodeBlockProcessor).toClass(CodeBlockProcessor)

	// Register MCP service with dependencies
	container.register(IMcpService).toClass(ObsidianMcpService)

	// Register DI Commands
	container.register(AssistantTagDICommand).toClass(AssistantTagDICommand)
	container.register(UserTagDICommand).toClass(UserTagDICommand)
	container.register(SystemTagDICommand).toClass(SystemTagDICommand)

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

	// Register MCP services for testing
	container.register(IMCPServerManager).toInstance({
		startServer: jest.fn(),
		stopServer: jest.fn(),
		listTools: jest.fn(),
		callTool: jest.fn(),
		isServerRunning: jest.fn().mockReturnValue(false)
	})

	container.register(IToolExecutor).toInstance({
		executeTool: jest.fn(),
		getActiveExecutions: jest.fn().mockReturnValue(new Map()),
		cancelExecution: jest.fn(),
		getStats: jest.fn()
	})

	container.register(ICodeBlockProcessor).toInstance({
		processCodeBlock: jest.fn(),
		renderToolResult: jest.fn()
	})

	container.register(IMcpService).toInstance({
		initialize: jest.fn(),
		shutdown: jest.fn(),
		getStatus: jest.fn().mockReturnValue({ isConnected: false }),
		executeTool: jest.fn()
	})

	container.register('App').toInstance({})
	container.register('TarsPlugin').toInstance({})
	container.register('PluginSettings').toInstance({})
	container.register('StatusBarManager').toInstance({})

	return container
}