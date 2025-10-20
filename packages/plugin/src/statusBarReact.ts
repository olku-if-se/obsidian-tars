import { injectable, inject } from '@needle-di/core'
import { type App, Notice } from 'obsidian'
import type { IReactBridge, ISettingsService, LoggingServiceToken, ILoggingService, StatusBarElementToken } from '@tars/contracts'
import { StatusBarElementToken } from '@tars/contracts'
// Import React components from the UI package
import { StatusBar } from '@tars/ui'
import { MCPStatusModal } from '@tars/ui'
import { GenerationStatsModal } from '@tars/ui'
import type { PluginSettings } from './settings'
import type {
	StatusBarState,
	GenerationStats,
	ErrorInfo,
	ErrorLogEntry,
	MCPStatusInfo
} from '@tars/ui'
import type { ErrorLogType, StatusBarController } from './statusBarManager'
import { isFeatureEnabled } from './featureFlags'

/**
 * DI-enabled React status bar manager that uses React components when feature flags are enabled
 */
@injectable()
export class StatusBarReactManager implements StatusBarController {
	private state: StatusBarState
	private autoHideTimer: NodeJS.Timeout | null = null
	private errorLog: ErrorLogEntry[] = []
	private readonly maxErrorLogSize = 50
	private onRefreshMCPStatus?: (updateStatus: (message: string) => void) => Promise<void>
	private reactRootContainer: HTMLElement | null = null
	private statusBarItem: HTMLElement
	private settingsUnsubscribe?: () => void

	constructor(
		private app = inject('app'),
		private reactBridge = inject(IReactBridge),
		private settingsService = inject(ISettingsService),
		private loggingService = inject(LoggingServiceToken)
	) {
		this.state = {
			type: 'idle',
			content: {
				text: 'Tars',
				tooltip: 'Tars AI assistant is ready'
			},
			timestamp: new Date()
		}

		this.loggingService.debug('Initializing DI-enabled StatusBarReactManager')

		// Create our own status bar element
		this.createStatusBarElement()

		// Set up settings watcher for automatic UI updates
		this.setupSettingsWatcher()

		this.initializeReactStatusBar()

		this.loggingService.debug('StatusBarReactManager initialized successfully')
	}

	/**
	 * Create the status bar element using the Obsidian app
	 */
	private createStatusBarElement(): void {
		this.statusBarItem = this.app.addStatusBarItem()

		// Register the status bar element in DI container for other components to use
		// Note: This would require container access, which we'll handle differently
		this.loggingService.debug('Created status bar element', {
			element: !!this.statusBarItem
		})
	}

	/**
	 * Check if React UI is enabled for status bar
	 */
	private isReactUIEnabled(): boolean {
		const settings = this.settingsService.getAll() as PluginSettings
		return isFeatureEnabled(settings, 'reactStatusBar') ||
		       isFeatureEnabled(settings, 'reactModals')
	}

	/**
	 * Initialize React status bar component
	 */
	private initializeReactStatusBar() {
		if (!this.isReactUIEnabled()) {
			// Fallback to vanilla DOM if React features are disabled
			this.setupVanillaStatusBar()
			return
		}

		try {
			// Create container for React component
			this.reactRootContainer = document.createElement('div')
			this.reactRootContainer.style.cssText = `
				display: inline-flex;
				align-items: center;
				height: 100%;
			`

			// Clear existing content and mount React component
			this.statusBarItem.empty()
			this.statusBarItem.appendChild(this.reactRootContainer)

			// Mount React StatusBar component
			this.refreshReactStatusBar()
		} catch (error) {
			console.error('Failed to initialize React status bar:', error)
			// Fallback to vanilla implementation
			this.setupVanillaStatusBar()
		}
	}

	/**
	 * Setup vanilla DOM status bar as fallback
	 */
	private setupVanillaStatusBar() {
		this.statusBarItem.setText(this.state.content.text)
		this.statusBarItem.setAttribute('title', this.state.content.tooltip)
		this.statusBarItem.style.cursor = 'pointer'
		this.setupVanillaClickHandler()
	}

	/**
	 * Setup click handler for vanilla status bar
	 */
	private setupVanillaClickHandler() {
		this.statusBarItem.onclick = () => {
			this.handleStatusClick()
		}
	}

	/**
	 * Refresh React status bar component
	 */
	private refreshReactStatusBar() {
		if (!this.reactRootContainer || !this.isReactUIEnabled()) return

		try {
			this.reactBridge.mount(
				this.reactRootContainer,
				StatusBar,
				{
					app: this.app,
					state: this.state,
					onStateChange: (newState: StatusBarState) => this.updateState(newState),
					onClick: () => this.handleStatusClick(),
					onOpenModal: (type: 'mcp' | 'stats' | 'error') => this.handleOpenModal(type)
				}
			)
		} catch (error) {
			console.error('Failed to refresh React status bar:', error)
			// Fallback to vanilla implementation
			this.setupVanillaStatusBar()
		}
	}

	/**
	 * Handle status bar click
	 */
	private handleStatusClick() {
		try {
			// Priority: MCP Status > Error Details > Generation Stats
			if (this.state.mcpStatus) {
				this.handleOpenModal('mcp')
			} else if (this.state.type === 'error') {
				this.handleOpenModal('error')
			} else if (this.state.type === 'success') {
				this.handleOpenModal('stats')
			}
		} catch (error) {
			console.error('Error handling status click:', error)
			new Notice('Failed to open status details')
		}
	}

	/**
	 * Set up settings watcher for automatic UI updates when settings change
	 */
	private setupSettingsWatcher(): void {
		// Watch for settings changes that affect the UI
		this.settingsUnsubscribe = this.settingsService.watch('featureFlags', () => {
			this.loggingService.debug('Feature flags changed, refreshing status bar')
			this.initializeReactStatusBar()
		})

		this.loggingService.debug('Settings watcher configured for feature flags')
	}

	/**
	 * Handle opening different modal types
	 */
	private handleOpenModal(type: 'mcp' | 'stats' | 'error') {
		const settings = this.settingsService.getAll() as PluginSettings
		const useReactModals = isFeatureEnabled(settings, 'reactModals')

		this.loggingService.debug('Opening modal', {
			type,
			useReactModals
		})

		if (useReactModals) {
			this.openReactModal(type)
		} else {
			this.openVanillaModal(type)
		}
	}

	/**
	 * Open React-based modal
	 */
	private openReactModal(type: 'mcp' | 'stats' | 'error') {
		// Create a temporary container for the modal
		const modalContainer = document.createElement('div')
		modalContainer.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			z-index: 1000;
			display: flex;
			align-items: center;
			justify-content: center;
			background-color: rgba(0, 0, 0, 0.5);
		`

		try {
			switch (type) {
				case 'mcp':
					this.reactBridge.mount(
						modalContainer,
						MCPStatusModal,
						{
							app: this.app,
							mcpStatus: this.state.mcpStatus!,
							errorLog: this.getErrorLog(),
							currentError: this.state.type === 'error' ? this.state.data as ErrorInfo : undefined,
							onClearLogs: () => this.clearErrorLog(),
							onRemoveLog: (id: string) => this.removeErrorLogEntry(id),
							onRefresh: this.onRefreshMCPStatus,
							onClose: () => {
								this.reactBridge?.unmount(modalContainer)
								modalContainer.remove()
							}
						}
					)
					break

				case 'stats':
					this.reactBridge.mount(
						modalContainer,
						GenerationStatsModal,
						{
							app: this.app,
							stats: this.state.data as GenerationStats,
							errorLog: this.getErrorLog(),
							onClearLogs: () => this.clearErrorLog(),
							onRemoveLog: (id: string) => this.removeErrorLogEntry(id),
							onClose: () => {
								this.reactBridge?.unmount(modalContainer)
								modalContainer.remove()
							}
						}
					)
					break

				case 'error':
					// For error modal, we can reuse the MCP modal with error tab active
					this.reactBridge.mount(
						modalContainer,
						MCPStatusModal,
						{
							app: this.app,
							mcpStatus: {
								runningServers: 0,
								totalServers: 0,
								availableTools: 0,
								retryingServers: 0,
								servers: []
							},
							errorLog: this.getErrorLog(),
							currentError: this.state.data as ErrorInfo,
							onClearLogs: () => this.clearErrorLog(),
							onRemoveLog: (id: string) => this.removeErrorLogEntry(id),
							onClose: () => {
								this.reactBridge?.unmount(modalContainer)
								modalContainer.remove()
							}
						}
					)
					break
			}

			// Add modal to document
			document.body.appendChild(modalContainer)
		} catch (error) {
			console.error('Failed to open React modal:', error)
			modalContainer.remove()
			// Fallback to vanilla modal
			this.openVanillaModal(type)
		}
	}

	/**
	 * Open vanilla DOM modal as fallback
	 */
	private openVanillaModal(type: 'mcp' | 'stats' | 'error') {
		// Import vanilla modal classes dynamically to avoid circular dependencies
		const { MCPStatusModal, GenerationStatsModal, ErrorDetailModal } = require('./statusBarManager')

		switch (type) {
			case 'mcp':
				new MCPStatusModal(
					this.app,
					this.state.mcpStatus!,
					this.getErrorLog(),
					() => this.clearErrorLog(),
					(id: string) => this.removeErrorLogEntry(id),
					this.state.type === 'error' ? (this.state.data as ErrorInfo) : undefined,
					this.onRefreshMCPStatus
				).open()
				break

			case 'stats':
				new GenerationStatsModal(
					this.app,
					this.state.data as GenerationStats,
					this.getErrorLog(),
					() => this.clearErrorLog(),
					(id: string) => this.removeErrorLogEntry(id)
				).open()
				break

			case 'error':
				new ErrorDetailModal(
					this.app,
					this.state.data as ErrorInfo,
					this.getErrorLog(),
					() => this.clearErrorLog(),
					(id: string) => this.removeErrorLogEntry(id)
				).open()
				break
		}
	}

	/**
	 * Update status bar state
	 */
	private updateState(newState: Partial<StatusBarState>) {
		this.state = {
			...this.state,
			...newState,
			timestamp: new Date()
		}

		if (this.isReactUIEnabled() && this.reactRootContainer) {
			this.refreshReactStatusBar()
		} else {
			this.setupVanillaStatusBar()
		}
	}

	/**
	 * Set the refresh callback for MCP status
	 */
	setRefreshCallback(callback: (updateStatus: (message: string) => void) => Promise<void>) {
		this.onRefreshMCPStatus = callback
	}

	/**
	 * Set generating status
	 */
	setGeneratingStatus(round: number) {
		if (this.autoHideTimer) {
			clearTimeout(this.autoHideTimer)
			this.autoHideTimer = null
		}

		this.updateState({
			type: 'generating',
			content: {
				text: `Round ${round}...`,
				tooltip: `Generating round ${round} answer...`
			},
			data: undefined
		})
	}

	/**
	 * Update generating progress
	 */
	updateGeneratingProgress(characters: number) {
		if (this.state.type !== 'generating') return

		this.updateState({
			content: {
				text: `Tars: ${characters} characters`,
				tooltip: `Generating... ${characters} characters`
			}
		})
	}

	/**
	 * Set success status
	 */
	setSuccessStatus(stats: GenerationStats) {
		if (this.autoHideTimer) {
			clearTimeout(this.autoHideTimer)
			this.autoHideTimer = null
		}

		this.updateState({
			type: 'success',
			content: {
				text: `Tars: ${stats.characters} characters ${stats.duration}`,
				tooltip: `Round ${stats.round} | ${stats.characters} characters | ${stats.duration} | ${stats.model}`
			},
			data: stats
		})
	}

	/**
	 * Set MCP status
	 */
	setMCPStatus(mcpStatus: MCPStatusInfo) {
		// Update the base text to include MCP info
		let baseText = 'Tars'
		if (mcpStatus.totalServers > 0) {
			baseText += ` | MCP: ${mcpStatus.runningServers}/${mcpStatus.totalServers}`

			// Show active executions if any
			if (mcpStatus.activeExecutions && mcpStatus.activeExecutions > 0) {
				baseText += ` (${mcpStatus.activeExecutions} active)`
			}
			// Show retrying status
			else if (mcpStatus.retryingServers && mcpStatus.retryingServers > 0) {
				baseText += ` (${mcpStatus.retryingServers} retrying)`
			}
			// Show available tools
			else if (mcpStatus.availableTools > 0) {
				baseText += ` (${mcpStatus.availableTools} tools)`
			}

			// Add error indicator if there are failed servers
			if (mcpStatus.failedServers && mcpStatus.failedServers > 0) {
				baseText += ` ⚠️`
			}
		}

		let tooltip = 'Tars AI assistant is ready'
		if (mcpStatus.totalServers > 0) {
			tooltip = `MCP: ${mcpStatus.runningServers} of ${mcpStatus.totalServers} servers running`

			if (mcpStatus.activeExecutions && mcpStatus.activeExecutions > 0) {
				tooltip += `, ${mcpStatus.activeExecutions} tool${mcpStatus.activeExecutions === 1 ? '' : 's'} executing`
			}
			if (mcpStatus.retryingServers && mcpStatus.retryingServers > 0) {
				tooltip += `, ${mcpStatus.retryingServers} retrying`
			}
			if (mcpStatus.failedServers && mcpStatus.failedServers > 0) {
				tooltip += `, ${mcpStatus.failedServers} failed`
			}
			if (mcpStatus.availableTools > 0) {
				tooltip += `, ${mcpStatus.availableTools} tools available`
			}
			tooltip += '. Click for details.'
		}

		this.updateState({
			content: {
				text: baseText,
				tooltip
			},
			mcpStatus
		})
	}

	/**
	 * Set error status
	 */
	setErrorStatus(error: Error) {
		if (this.autoHideTimer) {
			clearTimeout(this.autoHideTimer)
			this.autoHideTimer = null
		}

		const errorInfo: ErrorInfo = {
			message: error.message,
			name: error.name,
			stack: error.stack,
			timestamp: new Date()
		}

		// Log to error buffer
		this.logError('generation', error.message, error)

		this.updateState({
			type: 'error',
			content: {
				text: `🔴 Tars: Error`,
				tooltip: `Error: ${error.message}`
			},
			data: errorInfo
		})

		// 2 minutes later, automatically clear the error status
		this.autoHideTimer = setTimeout(() => this.clearStatus(), 1000 * 60 * 2)
	}

	/**
	 * Set cancelled status
	 */
	setCancelledStatus() {
		if (this.autoHideTimer) {
			clearTimeout(this.autoHideTimer)
			this.autoHideTimer = null
		}

		this.updateState({
			type: 'idle',
			content: {
				text: `⚠️ Tars: Generation cancelled`,
				tooltip: 'Generation cancelled'
			},
			data: undefined
		})

		// 1 minute later, automatically clear the status
		this.autoHideTimer = setTimeout(() => this.clearStatus(), 1000 * 60 * 1)
	}

	/**
	 * Clear status
	 */
	clearStatus() {
		if (this.autoHideTimer) {
			clearTimeout(this.autoHideTimer)
			this.autoHideTimer = null
		}

		this.updateState({
			type: 'idle',
			content: {
				text: 'Tars',
				tooltip: 'Tars AI assistant is ready'
			},
			data: undefined
		})
	}

	/**
	 * Log an error to the error buffer
	 */
	logError(type: ErrorLogType, message: string, error?: Error, context?: Record<string, any>) {
		const logEntry: ErrorLogEntry = {
			id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date(),
			type,
			message,
			name: error?.name,
			stack: error?.stack,
			context
		}

		// Add to log
		this.errorLog.unshift(logEntry)

		// Maintain max size (ring buffer)
		if (this.errorLog.length > this.maxErrorLogSize) {
			this.errorLog = this.errorLog.slice(0, this.maxErrorLogSize)
		}
	}

	/**
	 * Get all logged errors
	 */
	getErrorLog(): ErrorLogEntry[] {
		return [...this.errorLog]
	}

	/**
	 * Clear error log
	 */
	clearErrorLog() {
		this.errorLog = []
	}

	/**
	 * Remove error log entry
	 */
	private removeErrorLogEntry(logId: string) {
		this.errorLog = this.errorLog.filter((entry) => entry.id !== logId)
	}

	/**
	 * Get current state
	 */
	getState(): Readonly<StatusBarState> {
		return { ...this.state }
	}

	/**
	 * Get the status bar element for other components to use
	 */
	getStatusBarElement(): HTMLElement {
		return this.statusBarItem
	}

	/**
	 * Update settings (called when feature flags change)
	 * This method is kept for backward compatibility but settings changes are automatically detected
	 */
	updateSettings(settings: PluginSettings) {
		this.loggingService.debug('updateSettings called, updating settings through DI service')

		// Update all settings at once
		this.settingsService.setAll(settings as Record<string, any>)

		// Re-initialize status bar with new settings (will also be triggered by watcher)
		this.initializeReactStatusBar()

		this.loggingService.debug('Settings updated successfully')
	}

	/**
	 * Dispose of resources
	 */
	dispose() {
		this.loggingService.debug('Disposing StatusBarReactManager')

		// Clear auto-hide timer
		if (this.autoHideTimer) {
			clearTimeout(this.autoHideTimer)
			this.autoHideTimer = null
		}

		// Unmount React component
		if (this.reactRootContainer && this.reactBridge) {
			this.reactBridge.unmount(this.reactRootContainer)
			this.reactRootContainer = null
		}

		// Clean up settings watcher
		if (this.settingsUnsubscribe) {
			this.settingsUnsubscribe()
			this.settingsUnsubscribe = undefined
		}

		this.loggingService.debug('StatusBarReactManager disposed successfully')
	}
}
