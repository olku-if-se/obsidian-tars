import 'reflect-metadata'
import { Container } from '@needle-di/core'
import {
	ILoggingService,
	INotificationService,
	ISettingsService,
	IStatusService,
	IDocumentService
} from '@tars/contracts'

export function createSimpleTestContainer(): Container {
	const container = new Container({ defaultScope: 'singleton' })

	// Mock implementations for testing
	container.bind(ILoggingService).toConstantValue({
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	})

	container.bind(INotificationService).toConstantValue({
		show: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	})

	container.bind(ISettingsService).toConstantValue({
		get: vi.fn(),
		set: vi.fn(),
		watch: vi.fn(),
		getAll: vi.fn(),
		setAll: vi.fn(),
		has: vi.fn(),
		remove: vi.fn(),
		clear: vi.fn()
	})

	container.bind(IStatusService).toConstantValue({
		updateStatus: vi.fn(),
		showProgress: vi.fn(),
		hideProgress: vi.fn(),
		reportError: vi.fn(),
		setReady: vi.fn(),
		setBusy: vi.fn(),
		setError: vi.fn(),
		getCurrentStatus: vi.fn(),
		onStatusChange: vi.fn()
	})

	container.bind(IDocumentService).toConstantValue({
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
	})

	return container
}