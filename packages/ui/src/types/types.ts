import type { MCPServerInfo } from '../utils/utilities'

// Local type definitions
export interface MCPStatusInfo {
	runningServers: number
	totalServers: number
	availableTools: number
	retryingServers: number
	failedServers?: number
	activeExecutions?: number
	currentDocumentSessions?: number
	sessionLimit?: number
	cacheStats?: {
		hits: number
		misses: number
		size: number
		hitRate: number
		oldestEntryAge: number | null
	}
	servers: MCPServerInfo[]
}

export interface ErrorLogEntry {
	id: string
	timestamp: Date
	type: 'generation' | 'mcp' | 'tool' | 'system'
	message: string
	name?: string
	stack?: string
	context?: Record<string, unknown>
}

export interface ErrorInfo {
	message: string
	name?: string | undefined
	stack?: string | undefined
	timestamp: Date
}
