import { injectable, inject } from '@needle-di/core'
import {
	IMcpService,
	CodeBlockProcessor,
	McpStatus,
	ToolExecutor,
	MCPServerManager
} from '@tars/contracts/services'
import { IStatusService, ILoggingService } from '@tars/contracts/services'

@injectable()
export class ObsidianMcpService implements IMcpService {
	private toolExecutor: ToolExecutor
	private serverManager: MCPServerManager
	private codeBlockProcessor: CodeBlockProcessor
	private statusService: IStatusService
	private loggingService: ILoggingService
	private isInitialized = false

	constructor(
		@inject(ToolExecutor) toolExecutor: ToolExecutor,
		@inject(MCPServerManager) serverManager: MCPServerManager,
		@inject(CodeBlockProcessor) codeBlockProcessor: CodeBlockProcessor,
		@inject(IStatusService) statusService: IStatusService,
		@inject(ILoggingService) loggingService: ILoggingService
	) {
		this.toolExecutor = toolExecutor
		this.serverManager = serverManager
		this.codeBlockProcessor = codeBlockProcessor
		this.statusService = statusService
		this.loggingService = loggingService
	}

	async initialize(): Promise<void> {
		this.loggingService.info('Initializing MCP service...')

		try {
			// Initialize server manager
			if (this.serverManager && typeof this.serverManager.initialize === 'function') {
				await this.serverManager.initialize()
			}

			// Initialize code block processor
			if (this.codeBlockProcessor && typeof this.codeBlockProcessor.initialize === 'function') {
				await this.codeBlockProcessor.initialize()
			}

			this.isInitialized = true
			this.loggingService.info('MCP service initialized successfully')
			this.statusService.updateStatus('MCP Ready')
		} catch (error) {
			this.loggingService.error('Failed to initialize MCP service:', error)
			this.statusService.reportError(error as Error)
			throw error
		}
	}

	async shutdown(): Promise<void> {
		this.loggingService.info('Shutting down MCP service...')

		try {
			// Shutdown server manager
			if (this.serverManager && typeof this.serverManager.shutdown === 'function') {
				await this.serverManager.shutdown()
			}

			this.isInitialized = false
			this.loggingService.info('MCP service shut down successfully')
		} catch (error) {
			this.loggingService.error('Failed to shutdown MCP service:', error)
			throw error
		}
	}

	isReady(): boolean {
		return this.isInitialized
	}

	getStatus(): McpStatus {
		const activeServers = this.getActiveServerCount()
		const activeExecutions = this.getActiveExecutionCount()

		return {
			ready: this.isInitialized && activeServers > 0,
			activeServers,
			activeExecutions,
			lastUpdated: new Date()
		}
	}

	getToolExecutor(): ToolExecutor {
		return this.toolExecutor
	}

	getServerManager(): MCPServerManager {
		return this.serverManager
	}

	getCodeBlockProcessor(): CodeBlockProcessor {
		return this.codeBlockProcessor
	}

	// Helper methods

	private getActiveServerCount(): number {
		if (!this.serverManager || !this.serverManager.getServers) {
			return 0
		}

		const servers = this.serverManager.getServers()
		return servers.filter(server => server.enabled && server.status === 'running').length
	}

	private getActiveExecutionCount(): number {
		if (!this.toolExecutor || !this.toolExecutor.getActiveExecutions) {
			return 0
		}

		return this.toolExecutor.getActiveExecutions()
	}
}