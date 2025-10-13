import type { Meta, StoryObj } from '@storybook/react-vite'
import { MCPStatusSummary } from './MCPStatusSummary'

const meta = {
	title: 'Atoms/MCPStatusSummary',
	component: MCPStatusSummary,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs']
} satisfies Meta<typeof MCPStatusSummary>

export default meta
type Story = StoryObj<typeof meta>

// Base healthy status
const healthyStatus = {
	runningServers: 3,
	totalServers: 3,
	availableTools: 25,
	retryingServers: 0,
	failedServers: 0,
	activeExecutions: 0,
	currentDocumentSessions: 2,
	sessionLimit: 10,
	cacheStats: {
		hits: 150,
		misses: 50,
		size: 45,
		hitRate: 75.0,
		oldestEntryAge: 120000
	}
}

// Status with active executions
const activeExecutionsStatus = {
	runningServers: 2,
	totalServers: 4,
	availableTools: 18,
	retryingServers: 1,
	failedServers: 1,
	activeExecutions: 3,
	currentDocumentSessions: 8,
	sessionLimit: 10,
	cacheStats: {
		hits: 200,
		misses: 100,
		size: 32,
		hitRate: 66.7,
		oldestEntryAge: 300000
	}
}

// Status with session warning
const sessionWarningStatus = {
	runningServers: 2,
	totalServers: 3,
	availableTools: 15,
	retryingServers: 0,
	failedServers: 1,
	activeExecutions: 0,
	currentDocumentSessions: 8,
	sessionLimit: 10, // 80% usage - warning level
	cacheStats: {
		hits: 80,
		misses: 20,
		size: 25,
		hitRate: 80.0,
		oldestEntryAge: 60000
	}
}

// Status with session critical
const sessionCriticalStatus = {
	runningServers: 1,
	totalServers: 3,
	availableTools: 12,
	retryingServers: 1,
	failedServers: 1,
	activeExecutions: 0,
	currentDocumentSessions: 10,
	sessionLimit: 10, // 100% usage - critical level
	cacheStats: {
		hits: 120,
		misses: 80,
		size: 40,
		hitRate: 60.0,
		oldestEntryAge: 90000
	}
}

// Status with multiple failed servers
const manyFailedStatus = {
	runningServers: 1,
	totalServers: 5,
	availableTools: 8,
	retryingServers: 2,
	failedServers: 2,
	activeExecutions: 0,
	currentDocumentSessions: 3,
	sessionLimit: 10,
	cacheStats: {
		hits: 45,
		misses: 55,
		size: 15,
		hitRate: 45.0,
		oldestEntryAge: 180000
	}
}

// Minimal status without optional fields
const minimalStatus = {
	runningServers: 1,
	totalServers: 2,
	availableTools: 5,
	retryingServers: 1
}

// Status with high cache hit rate
const highCachePerformance = {
	runningServers: 4,
	totalServers: 4,
	availableTools: 50,
	retryingServers: 0,
	failedServers: 0,
	activeExecutions: 0,
	currentDocumentSessions: 5,
	sessionLimit: 15,
	cacheStats: {
		hits: 450,
		misses: 50,
		size: 75,
		hitRate: 90.0,
		oldestEntryAge: 240000
	}
}

// Status with many active executions
const highActivityStatus = {
	runningServers: 3,
	totalServers: 4,
	availableTools: 30,
	retryingServers: 0,
	failedServers: 1,
	activeExecutions: 12,
	currentDocumentSessions: 6,
	sessionLimit: 10,
	cacheStats: {
		hits: 300,
		misses: 150,
		size: 60,
		hitRate: 66.7,
		oldestEntryAge: 15000
	}
}

export const Healthy: Story = {
	args: {
		status: healthyStatus
	}
}

export const ActiveExecutions: Story = {
	args: {
		status: activeExecutionsStatus
	}
}

export const SessionWarning: Story = {
	args: {
		status: sessionWarningStatus
	}
}

export const SessionCritical: Story = {
	args: {
		status: sessionCriticalStatus
	}
}

export const ManyFailed: Story = {
	args: {
		status: manyFailedStatus
	}
}

export const Minimal: Story = {
	args: {
		status: minimalStatus
	}
}

export const HighCachePerformance: Story = {
	args: {
		status: highCachePerformance
	}
}

export const HighActivity: Story = {
	args: {
		status: highActivityStatus
	}
}

export const NoCacheStats: Story = {
	args: {
		status: {
			runningServers: 2,
			totalServers: 3,
			availableTools: 15,
			retryingServers: 0,
			failedServers: 1,
			activeExecutions: 1,
			currentDocumentSessions: 4,
			sessionLimit: 8
		}
	}
}

export const ZeroSessions: Story = {
	args: {
		status: {
			runningServers: 2,
			totalServers: 2,
			availableTools: 20,
			retryingServers: 0,
			failedServers: 0,
			activeExecutions: 0,
			currentDocumentSessions: 0,
			sessionLimit: 10,
			cacheStats: {
				hits: 0,
				misses: 0,
				size: 0,
				hitRate: 0.0,
				oldestEntryAge: null
			}
		}
	}
}
