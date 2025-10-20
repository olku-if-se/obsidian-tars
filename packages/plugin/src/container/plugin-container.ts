import 'reflect-metadata'
import { Container } from '@needle-di/core'
import type { InjectionToken } from '@needle-di/core'
import {
	ILoggingService,
	INotificationService,
	ISettingsService,
	IStatusService,
	IDocumentService,
	IMcpService,
	LoggerFactoryToken
} from '@tars/contracts'
import { LoggerFactory } from '@tars/logger'

// Service implementations
import { ObsidianLoggingService } from '../services/ObsidianLoggingService'
import { ObsidianNotificationService } from '../services/ObsidianNotificationService'
import { ObsidianStatusService } from '../services/ObsidianStatusService'
import { ObsidianDocumentService } from '../services/ObsidianDocumentService'
import { ObsidianSettingsService } from '../services/ObsidianSettingsService'
// MCP imports temporarily commented out
// import { ObsidianMcpService, ToolExecutorToken, MCPServerManagerToken, CodeBlockProcessorToken } from '../services/ObsidianMcpService'

// Existing MCP components (will be wrapped for DI)
// import {
// 	MCPServerManager as MCPServerManagerImpl,
// 	ToolExecutor as ToolExecutorImpl
// } from '@tars/mcp-hosting'
// import { CodeBlockProcessor as CodeBlockProcessorImpl } from '../mcp/codeBlockProcessor'

// Contract imports for token registration
// import type {
// 	MCPServerManager,
// 	ToolExecutor,
// 	CodeBlockProcessor
// } from '@tars/contracts'

// DI Commands
import { AssistantTagDICommand, UserTagDICommand, SystemTagDICommand } from '../commands/di'
// Central tokens
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
} from './tokens'

export interface CreateContainerOptions {
	app: any // Obsidian App instance
	plugin: any // TarsPlugin instance
	settings: any // PluginSettings instance
	statusBarManager: any // StatusBarManager instance
}

export function createPluginContainer(options: CreateContainerOptions): Container {
	const { app, plugin, settings, statusBarManager } = options

	const container = new Container()

	// Register framework instances as values
	container.bind(AppToken).toConstantValue(app)
	container.bind(TarsPluginToken).toConstantValue(plugin)
	container.bind(PluginSettingsToken).toConstantValue(settings)
	container.bind(StatusBarManagerToken).toConstantValue(statusBarManager)

	// Register service implementations as singletons
	// Register with both interface types and tokens for maximum compatibility
	container.bind(ILoggingService).toClass(ObsidianLoggingService)
	container.bind(ILoggingServiceToken).toClass(ObsidianLoggingService)
	container.bind(LoggerFactoryToken).toClass(LoggerFactory)

	container.bind(INotificationService).toClass(ObsidianNotificationService)
	container.bind(INotificationServiceToken).toClass(ObsidianNotificationService)

	container.bind(IStatusService).toClass(ObsidianStatusService)
	container.bind(IStatusServiceToken).toClass(ObsidianStatusService)

	container.bind(IDocumentService).toClass(ObsidianDocumentService)
	container.bind(IDocumentServiceToken).toClass(ObsidianDocumentService)

	container.bind(ISettingsService).toClass(ObsidianSettingsService)
	container.bind(ISettingsServiceToken).toClass(ObsidianSettingsService)

	// Register MCP components as DI services with proper tokens
	// TODO: Fix MCP service injection issues - temporarily commented out
	// container.register(MCPServerManagerToken, { useClass: MCPServerManagerImpl })
	// container.register(ToolExecutorToken, { useClass: ToolExecutorImpl })
	// container.register(CodeBlockProcessorToken, { useClass: CodeBlockProcessorImpl })

	// Register MCP service with dependencies
	// container.register(IMcpService, { useClass: ObsidianMcpService })

	// Register DI Commands
	// TODO: Fix token mismatch between central tokens and command-local tokens
	// container.register(AssistantTagDICommand, { useClass: AssistantTagDICommand })
	// container.register(UserTagDICommand, { useClass: UserTagDICommand })
	// container.register(SystemTagDICommand, { useClass: SystemTagDICommand })

	return container
}

