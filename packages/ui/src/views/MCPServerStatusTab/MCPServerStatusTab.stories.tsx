import type { Meta, StoryObj } from '@storybook/react-vite'
import { MCPServerStatusTab } from './MCPServerStatusTab'

const meta = {
	title: 'Views/MCPServerStatusTab',
	component: MCPServerStatusTab,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs']
} satisfies Meta<typeof MCPServerStatusTab>

export default meta
type Story = StoryObj<typeof meta>

// Mock status data
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
	},
	servers: [
		{
			id: 'server-1',
			name: 'Claude Code Server',
			enabled: true,
			isConnected: true,
			toolCount: 12
		},
		{
			id: 'server-2',
			name: 'Filesystem Server',
			enabled: true,
			isConnected: true,
			toolCount: 8
		},
		{
			id: 'server-3',
			name: 'Database Server',
			enabled: true,
			isConnected: true,
			toolCount: 5
		}
	]
}

const mixedStatus = {
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
	},
	servers: [
		{
			id: 'server-1',
			name: 'Claude Code Server',
			enabled: true,
			isConnected: true,
			toolCount: 12
		},
		{
			id: 'server-2',
			name: 'Filesystem Server',
			enabled: true,
			isConnected: false,
			toolCount: 8,
			isRetrying: true,
			retryAttempt: 2,
			nextRetryAt: Date.now() + 15000
		},
		{
			id: 'server-3',
			name: 'Database Server',
			enabled: false,
			isConnected: false,
			toolCount: 6
		},
		{
			id: 'server-4',
			name: 'Legacy Server',
			enabled: true,
			isConnected: false,
			toolCount: 3
		}
	]
}

const noServersStatus = {
	runningServers: 0,
	totalServers: 0,
	availableTools: 0,
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
	},
	servers: []
}

const manyServersStatus = {
	runningServers: 5,
	totalServers: 8,
	availableTools: 75,
	retryingServers: 2,
	failedServers: 1,
	activeExecutions: 7,
	currentDocumentSessions: 9,
	sessionLimit: 10,
	cacheStats: {
		hits: 450,
		misses: 150,
		size: 85,
		hitRate: 75.0,
		oldestEntryAge: 600000
	},
	servers: [
		{
			id: 'server-1',
			name: 'Claude Code Server',
			enabled: true,
			isConnected: true,
			toolCount: 12
		},
		{
			id: 'server-2',
			name: 'Filesystem Server',
			enabled: true,
			isConnected: true,
			toolCount: 8
		},
		{
			id: 'server-3',
			name: 'Database Server',
			enabled: true,
			isConnected: true,
			toolCount: 15
		},
		{
			id: 'server-4',
			name: 'Web Server',
			enabled: true,
			isConnected: false,
			toolCount: 6,
			isRetrying: true,
			retryAttempt: 1,
			nextRetryAt: Date.now() + 30000
		},
		{
			id: 'server-5',
			name: 'API Server',
			enabled: false,
			isConnected: false,
			toolCount: 10
		},
		{
			id: 'server-6',
			name: 'Cache Server',
			enabled: true,
			isConnected: true,
			toolCount: 8
		},
		{
			id: 'server-7',
			name: 'Email Server',
			enabled: true,
			isConnected: false,
			toolCount: 4
		},
		{
			id: 'server-8',
			name: 'Analytics Server',
			enabled: true,
			isConnected: true,
			toolCount: 12
		}
	]
}

// Mock refresh function
const mockRefreshSuccess = async (updateStatus: (message: string) => void) => {
	updateStatus('Connecting to servers...')
	await new Promise((resolve) => setTimeout(resolve, 500))
	updateStatus('Refreshing server status...')
	await new Promise((resolve) => setTimeout(resolve, 500))
	updateStatus('Updating cache statistics...')
	await new Promise((resolve) => setTimeout(resolve, 300))
}

const mockRefreshError = async (updateStatus: (message: string) => void) => {
	updateStatus('Connecting to servers...')
	await new Promise((resolve) => setTimeout(resolve, 300))
	throw new Error('Failed to connect to MCP servers')
}

export const Healthy: Story = {
	args: {
		mcpStatus: healthyStatus
	}
}

export const MixedStates: Story = {
	args: {
		mcpStatus: mixedStatus
	}
}

export const NoServers: Story = {
	args: {
		mcpStatus: noServersStatus
	}
}

export const ManyServers: Story = {
	args: {
		mcpStatus: manyServersStatus
	}
}

export const WithRefreshSuccess: Story = {
	args: {
		mcpStatus: healthyStatus,
		onRefresh: mockRefreshSuccess
	}
}

export const WithRefreshError: Story = {
	args: {
		mcpStatus: healthyStatus,
		onRefresh: mockRefreshError
	}
}

export const NoRefreshFunction: Story = {
	args: {
		mcpStatus: healthyStatus,
		onRefresh: undefined
	}
}

export const SessionWarning: Story = {
	args: {
		mcpStatus: {
			runningServers: 2,
			totalServers: 3,
			availableTools: 15,
			retryingServers: 0,
			failedServers: 1,
			activeExecutions: 0,
			currentDocumentSessions: 8,
			sessionLimit: 10,
			cacheStats: {
				hits: 80,
				misses: 20,
				size: 25,
				hitRate: 80.0,
				oldestEntryAge: 60000
			},
			servers: healthyStatus.servers.slice(0, 2)
		}
	}
}

export const HighActivity: Story = {
	args: {
		mcpStatus: {
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
			},
			servers: healthyStatus.servers
		}
	}
}
