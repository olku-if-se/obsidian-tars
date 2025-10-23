import { Container } from '@needle-di/core'
import * as di from '@tars/contracts'
import { LoggerFactory } from '@tars/logger'
import type { Plugin } from 'obsidian'
import { ReactBridge } from '../bridge/ReactBridge'
import { ReactBridgeManager } from '../bridge/ReactBridgeManagerDI'
import { CodeBlockProcessor } from '../mcp/codeBlockProcessor'
import { ServerConfigManager } from '../mcp/serverConfigManagerDI'
import { ObsidianDocumentService } from '../services/ObsidianDocumentService'
import { ObsidianLoggingService } from '../services/ObsidianLoggingService'
import { ObsidianNotificationService } from '../services/ObsidianNotificationService'
import { ObsidianRequestControllerService } from '../services/ObsidianRequestControllerService'
import { ObsidianSettingsService } from '../services/ObsidianSettingsService'
import { ObsidianStatusService } from '../services/ObsidianStatusService'
import { StatusBarReactManager } from '../statusBarReact'

export interface CreateContainerOptions {
	plugin: Plugin // TarsPlugin instance
}

export function createPluginContainer({ plugin }: CreateContainerOptions): Container {
	const container = new Container()

	// Register framework instances as values
	container.bind({ provide: di.TarsPluginToken, useValue: plugin })
	container.bind({ provide: di.AppToken, useValue: plugin.app })

	// Register service implementations
	container.bind({ provide: di.ISettingsServiceToken, useClass: ObsidianSettingsService })
	container.bind({ provide: di.ILoggingServiceToken, useClass: ObsidianLoggingService })
	container.bind({ provide: di.ILoggerFactoryToken, useClass: LoggerFactory })
	container.bind({ provide: di.INotificationServiceToken, useClass: ObsidianNotificationService })
	container.bind({ provide: di.IStatusServiceToken, useClass: ObsidianStatusService })
	container.bind({ provide: di.IDocumentServiceToken, useClass: ObsidianDocumentService })
	container.bind({ provide: di.RequestControllerToken, useClass: ObsidianRequestControllerService })

	// Register MCP components as DI services with proper tokens
	container.bind({ provide: di.ServerConfigManagerToken, useClass: ServerConfigManager })
	container.bind({ provide: di.CodeBlockProcessorToken, useClass: CodeBlockProcessor })

	// Register React Bridge components as DI services
	container.bind({ provide: di.ReactBridgeToken, useClass: ReactBridge })
	container.bind({ provide: di.ReactBridgeManagerToken, useClass: ReactBridgeManager })

	// Register StatusBar React Manager as DI service
	container.bind({ provide: di.StatusBarReactManagerToken, useClass: StatusBarReactManager })

	return container
}
