import { Container } from '@needle-di/core'
import { vi } from 'vitest'
import {
	ILoggingService,
	INotificationService,
	ISettingsService,
	IStatusService,
	IDocumentService,
	IMcpService,
	MCPServerManager,
	ToolExecutor,
	CodeBlockProcessor
} from '@tars/contracts'
import {
	ILoggingServiceToken,
	INotificationServiceToken,
	ISettingsServiceToken,
	IStatusServiceToken,
	IDocumentServiceToken,
	AppToken,
	TarsPluginToken,
	PluginSettingsToken,
	StatusBarManagerToken
} from '../tokens'
// MCP tokens temporarily disabled to avoid import issues
// import { ToolExecutorToken, MCPServerManagerToken, CodeBlockProcessorToken } from '../../services/ObsidianMcpService'

/**
 * Create a container for testing with mocked services
 */
export function createTestContainer(): Container {
	const container = new Container()

	// Mock implementations for testing
	// Register with both interface types and tokens for maximum compatibility
	const loggingServiceMock = {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	}
	container.bind(ILoggingService).toConstantValue(loggingServiceMock)
	container.bind(ILoggingServiceToken).toConstantValue(loggingServiceMock)

	const notificationServiceMock = {
		show: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	}
	container.bind(INotificationService).toConstantValue(notificationServiceMock)
	container.bind(INotificationServiceToken).toConstantValue(notificationServiceMock)

	const settingsServiceMock = {
		get: vi.fn((key: string, defaultValue?: any) => defaultValue ?? null),
		set: vi.fn(),
		watch: vi.fn(),
		getAll: vi.fn(),
		setAll: vi.fn(),
		has: vi.fn(),
		remove: vi.fn(),
		clear: vi.fn()
	}
	container.bind(ISettingsService).toConstantValue(settingsServiceMock)
	container.bind(ISettingsServiceToken).toConstantValue(settingsServiceMock)

	const statusServiceMock = {
		updateStatus: vi.fn(),
		showProgress: vi.fn(),
		hideProgress: vi.fn(),
		reportError: vi.fn(),
		setReady: vi.fn(),
		setBusy: vi.fn(),
		setError: vi.fn(),
		getCurrentStatus: vi.fn(),
		onStatusChange: vi.fn()
	}
	container.bind(IStatusService).toConstantValue(statusServiceMock)
	container.bind(IStatusServiceToken).toConstantValue(statusServiceMock)

	const documentServiceMock = {
		getCurrentDocumentPath: vi.fn().mockReturnValue('test.md'),
		resolveEmbedAsBinary: vi.fn(),
		createPlainText: vi.fn(),
		getDocumentWriteLock: vi.fn(),
		normalizePath: vi.fn().mockImplementation(path => path),
		getFileBasename: vi.fn().mockReturnValue('test'),
		getFileExtension: vi.fn().mockReturnValue('md'),
		getFolderPath: vi.fn().mockReturnValue(''),
		fileExists: vi.fn().mockReturnValue(true),
		readFile: vi.fn(),
		writeFile: vi.fn(),
		getFolderFiles: vi.fn().mockReturnValue([])
	}
	container.bind(IDocumentService).toConstantValue(documentServiceMock)
	container.bind(IDocumentServiceToken).toConstantValue(documentServiceMock)

	// Register MCP services for testing - temporarily disabled
	/*
	container.register(MCPServerManagerToken, {
		useValue: {
			startServer: vi.fn(),
			stopServer: vi.fn(),
			listTools: vi.fn(),
			callTool: vi.fn(),
			isServerRunning: vi.fn().mockReturnValue(false)
		}
	})

	container.register(ToolExecutorToken, {
		useValue: {
			executeTool: vi.fn(),
			getActiveExecutions: vi.fn().mockReturnValue(new Map()),
			cancelExecution: vi.fn(),
			getStats: vi.fn()
		}
	})

	container.register(CodeBlockProcessorToken, {
		useValue: {
			processCodeBlock: vi.fn(),
			renderToolResult: vi.fn()
		}
	})
	*/

	container.bind(IMcpService).toConstantValue({
		initialize: vi.fn(),
		shutdown: vi.fn(),
		getStatus: vi.fn().mockReturnValue({ isConnected: false }),
		executeTool: vi.fn()
	})

	container.bind(AppToken).toConstantValue({})
	container.bind(TarsPluginToken).toConstantValue({})
	container.bind(PluginSettingsToken).toConstantValue({})
	container.bind(StatusBarManagerToken).toConstantValue({})

	return container
}