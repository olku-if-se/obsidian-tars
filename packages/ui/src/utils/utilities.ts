/**
 * Utility functions for status bar components
 * These functions are kept separate to make them easily testable and reusable
 */
import type { MCPServerInfo } from '~/types'

// Error handling utilities
export const getErrorTypeIcon = (type: string): string => {
	switch (type) {
		case 'generation':
			return '🤖'
		case 'mcp':
			return '🔌'
		case 'tool':
			return '🔧'
		case 'system':
			return '⚙️'
		default:
			return '❌'
	}
}

// Time and duration formatting utilities
export const formatDuration = (duration: string): string => {
	// If duration is already formatted, return as is
	if (duration.includes('s') || duration.includes('ms')) {
		return duration
	}

	// If it's just a number in milliseconds, format it
	const ms = parseInt(duration, 10)
	if (Number.isNaN(ms)) {
		return duration
	}

	if (ms < 1000) {
		return `${ms}ms`
	} else {
		return `${(ms / 1000).toFixed(1)}s`
	}
}

export const formatTimestamp = (date: Date): string => {
	return date.toLocaleString()
}

// MCP server status utilities
export interface SessionStatus {
	text: string
	className: string
}

export const formatSessionStatus = (sessions: number, limit: number, styles: Record<string, string>): SessionStatus => {
	const percentage = (sessions / limit) * 100
	const text = `${sessions} / ${limit}`
	let className = styles.sessionsNormal
	let icon = '📊'

	if (percentage >= 100) {
		className = styles.sessionsCritical
		icon = '🔴'
	} else if (percentage >= 80) {
		className = styles.sessionsWarning
		icon = '⚠️'
	}

	return { text: `${icon} Document Sessions: ${text}`, className }
}

export const formatRetryInfo = (server: MCPServerInfo): string => {
	if (!server.nextRetryAt) {
		return 'Retrying...'
	}
	const nextRetryIn = Math.max(0, Math.round((server.nextRetryAt - Date.now()) / 1000))
	return `Retrying (attempt ${server.retryAttempt || 0}) in ${nextRetryIn}s`
}

// Server status icon utility
export const getServerStatusIcon = (server: MCPServerInfo): string => {
	if (server.isConnected) {
		return '🟢'
	}
	if (server.enabled) {
		return '🔴'
	}
	return '⚪'
}

// Server status text utility
export const getServerStatusText = (server: MCPServerInfo, formatRetry: (s: MCPServerInfo) => string): string => {
	if (server.isConnected) {
		return 'Connected'
	}
	if (server.enabled) {
		return server.isRetrying ? formatRetry(server) : 'Disconnected'
	}
	return 'Disabled'
}
