/**
 * Obsidian-specific status reporter implementation
 * Implements IStatusReporter interface using Obsidian's status bar
 */

import type { IStatusReporter } from '@tars/mcp-hosting'
import type { StatusBarManager } from '../../statusBarManager'

export class StatusBarReporter implements IStatusReporter {
	constructor(private statusBarManager: StatusBarManager) {}

	reportServerStatus(_serverId: string, _status: 'connected' | 'disconnected' | 'error' | 'retrying'): void {
		// This will be handled by the status bar manager's refresh mechanism
		// The actual status reporting happens when updateMCPStatus() is called
	}

	reportActiveExecutions(_count: number): void {
		// This will be handled by the status bar manager's refresh mechanism
		// The actual status reporting happens when updateMCPStatus() is called
	}

	reportSessionCount(_documentPath: string, _count: number, _limit: number): void {
		// This will be handled by the status bar manager's refresh mechanism
		// The actual status reporting happens when updateMCPStatus() is called
	}

	reportError(
		type: 'generation' | 'mcp' | 'tool' | 'system',
		message: string,
		error: Error,
		context?: Record<string, unknown>
	): void {
		this.statusBarManager.logError(type, message, error, context)
	}
}
