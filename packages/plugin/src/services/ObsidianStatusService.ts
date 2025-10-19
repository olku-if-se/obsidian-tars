import { injectable } from '@needle-di/core'
import { StatusBarManager } from '@tars/contracts/providers'
import { IStatusService, StatusInfo, StatusState } from '@tars/contracts/services'

@injectable()
export class ObsidianStatusService implements IStatusService {
	private statusBarManager: StatusBarManager
	private currentStatus: StatusInfo
	private statusCallbacks: Set<(status: StatusInfo) => void> = new Set()

	constructor(statusBarManager: StatusBarManager) {
		this.statusBarManager = statusBarManager
		this.currentStatus = {
			message: 'Ready',
			state: 'ready',
			showingProgress: false,
			lastUpdated: new Date()
		}
	}

	updateStatus(status: string): void {
		this.currentStatus.message = status
		this.currentStatus.state = 'ready'
		this.currentStatus.showingProgress = false
		this.currentStatus.lastUpdated = new Date()
		this.notifyStatusChange()
		this.updateStatusBar(status)
	}

	showProgress(message: string): void {
		this.currentStatus.message = message
		this.currentStatus.state = 'progress'
		this.currentStatus.showingProgress = true
		this.currentStatus.progressMessage = message
		this.currentStatus.lastUpdated = new Date()
		this.notifyStatusChange()
		this.updateStatusBar(`⏳ ${message}`)
	}

	hideProgress(): void {
		this.currentStatus.showingProgress = false
		this.currentStatus.progressMessage = undefined
		this.currentStatus.state = 'ready'
		this.currentStatus.lastUpdated = new Date()
		this.notifyStatusChange()
		this.updateStatusBar(this.currentStatus.message)
	}

	reportError(error: Error): void {
		this.currentStatus.message = `Error: ${error.message}`
		this.currentStatus.state = 'error'
		this.currentStatus.showingProgress = false
		this.currentStatus.lastError = error
		this.currentStatus.lastUpdated = new Date()
		this.notifyStatusChange()
		this.updateStatusBar(`❌ ${error.message}`)
	}

	setReady(): void {
		this.updateStatus('Ready')
	}

	setBusy(message?: string): void {
		this.currentStatus.message = message || 'Working...'
		this.currentStatus.state = 'busy'
		this.currentStatus.showingProgress = false
		this.currentStatus.lastUpdated = new Date()
		this.notifyStatusChange()
		this.updateStatusBar(`🔄 ${this.currentStatus.message}`)
	}

	setError(message: string): void {
		this.currentStatus.message = message
		this.currentStatus.state = 'error'
		this.currentStatus.showingProgress = false
		this.currentStatus.lastUpdated = new Date()
		this.notifyStatusChange()
		this.updateStatusBar(`❌ ${message}`)
	}

	getCurrentStatus(): StatusInfo {
		return { ...this.currentStatus }
	}

	onStatusChange(callback: (status: StatusInfo) => void): () => void {
		this.statusCallbacks.add(callback)

		// Return unsubscribe function
		return () => {
			this.statusCallbacks.delete(callback)
		}
	}

	private notifyStatusChange(): void {
		const statusCopy = { ...this.currentStatus }
		this.statusCallbacks.forEach(callback => callback(statusCopy))
	}

	private updateStatusBar(message: string): void {
		if (this.statusBarManager && this.statusBarManager.updateStatus) {
			this.statusBarManager.updateStatus(message)
		}
	}
}