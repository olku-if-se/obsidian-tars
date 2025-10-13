import type { Meta, StoryObj } from '@storybook/react'
import type { ErrorInfo, ErrorLogEntry, MCPStatusInfo } from '../../types'
import { MCPStatusModal } from './MCPStatusModal'

const meta: Meta<typeof MCPStatusModal> = {
	title: 'Views/MCPStatusModal',
	component: MCPStatusModal,
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component: 'Modal for displaying MCP server status, error logs, and server details with tabbed interface.'
			}
		}
	},
	tags: ['autodocs'],
	argTypes: {
		mcpStatus: {
			description: 'MCP server status information including servers, stats, and health',
			control: 'object'
		},
		errorLog: {
			description: 'Array of error log entries',
			control: 'array'
		},
		currentError: {
			description: 'Current active error information',
			control: 'object'
		},
		onClearLogs: {
			description: 'Callback to clear all error logs',
			action: 'logsCleared'
		},
		onRemoveLog: {
			description: 'Callback to remove a specific error log entry',
			action: 'logRemoved'
		},
		onRefresh: {
			description: 'Callback to refresh MCP server status',
			action: 'refreshRequested'
		},
		onClose: {
			description: 'Callback to close the modal',
			action: 'modalClosed'
		}
	}
}

export default meta
type Story = StoryObj<typeof MCPStatusModal>

// Mock app object
const mockApp = {
	vault: { getName: () => 'Test Vault' },
	workspace: { activeLeaf: () => null }
} as const

// Sample MCP status
const sampleMCPStatus: MCPStatusInfo = {
	runningServers: 3,
	totalServers: 5,
	activeExecutions: 2,
	currentDocumentSessions: 8,
	sessionLimit: 10,
	retryingServers: 1,
	failedServers: 1,
	availableTools: 24,
	servers: [
		{
			id: 'claude-desktop',
			name: 'Claude Desktop',
			isConnected: true,
			enabled: true,
			toolCount: 12
		},
		{
			id: 'filesystem',
			name: 'Filesystem',
			isConnected: false,
			enabled: true,
			isRetrying: true,
			retryAttempt: 2,
			nextRetryAt: Date.now() + 30000,
			toolCount: 8
		},
		{
			id: 'database',
			name: 'Database',
			isConnected: false,
			enabled: false,
			toolCount: 4
		},
		{
			id: 'web-search',
			name: 'Web Search',
			isConnected: true,
			enabled: true,
			toolCount: 6
		},
		{
			id: 'code-executor',
			name: 'Code Executor',
			isConnected: true,
			enabled: true,
			toolCount: 10
		}
	],
	cacheStats: {
		size: 150,
		hitRate: 85.2
	}
}

// Sample error logs
const sampleErrorLogs: ErrorLogEntry[] = [
	{
		id: 'error-1',
		type: 'mcp',
		name: 'ConnectionError',
		message: 'Failed to connect to Filesystem server: Connection timeout',
		timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
		context: {
			serverId: 'filesystem',
			attempts: 3,
			lastError: 'ECONNREFUSED'
		},
		stack:
			'Error: Failed to connect to Filesystem server\n    at MCPServerManager.connect (manager.js:123:45)\n    at async retryConnection (retry.js:67:89)'
	},
	{
		id: 'error-2',
		type: 'tool',
		name: 'ToolExecutionError',
		message: 'Tool execution timeout: read_file',
		timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
		context: {
			toolName: 'read_file',
			serverId: 'filesystem',
			timeout: 30000
		},
		stack:
			'Error: Tool execution timeout\n    at ToolExecutor.execute (executor.js:234:56)\n    at async processToolCall (coordinator.js:78:90)'
	},
	{
		id: 'error-3',
		type: 'generation',
		name: 'RateLimitError',
		message: 'Claude API rate limit exceeded',
		timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
		context: {
			provider: 'claude',
			requestId: 'req_abc123',
			rateLimitRemaining: 0
		},
		stack:
			'Error: Rate limit exceeded\n    at ClaudeProvider.sendRequest (claude.js:345:67)\n    at async generateResponse (editor.js:89:123)'
	}
]

// Sample current error
const sampleCurrentError: ErrorInfo = {
	name: 'ConnectionError',
	message: 'Failed to connect to Database server: Container not found',
	timestamp: new Date(),
	stack:
		'Error: Container not found\n    at DockerManager.getContainer (docker.js:156:78)\n    at async MCPServerManager.startServer (manager.js:234:90)'
}

export const BasicStatus: Story = {
	args: {
		app: mockApp,
		mcpStatus: sampleMCPStatus,
		errorLog: [],
		onClearLogs: () => console.log('Logs cleared'),
		onRemoveLog: (id) => console.log('Log removed:', id),
		onRefresh: async (updateStatus) => {
			updateStatus('Checking server status...')
			await new Promise((resolve) => setTimeout(resolve, 2000))
			updateStatus('Servers refreshed')
		},
		onClose: () => console.log('Modal closed')
	}
}

export const WithErrors: Story = {
	args: {
		app: mockApp,
		mcpStatus: sampleMCPStatus,
		errorLog: sampleErrorLogs,
		currentError: sampleCurrentError,
		onClearLogs: () => console.log('Logs cleared'),
		onRemoveLog: (id) => console.log('Log removed:', id),
		onRefresh: async (updateStatus) => {
			updateStatus('Checking server status...')
			await new Promise((resolve) => setTimeout(resolve, 2000))
			updateStatus('Servers refreshed')
		},
		onClose: () => console.log('Modal closed')
	}
}

export const AllServersFailed: Story = {
	args: {
		app: mockApp,
		mcpStatus: {
			...sampleMCPStatus,
			runningServers: 0,
			totalServers: 3,
			retryingServers: 2,
			failedServers: 1,
			servers: [
				{
					id: 'server-1',
					name: 'Claude Desktop',
					isConnected: false,
					enabled: true,
					isRetrying: true,
					retryAttempt: 3,
					nextRetryAt: Date.now() + 45000,
					toolCount: 12
				},
				{
					id: 'server-2',
					name: 'Filesystem',
					isConnected: false,
					enabled: true,
					isRetrying: true,
					retryAttempt: 1,
					nextRetryAt: Date.now() + 15000,
					toolCount: 8
				},
				{
					id: 'server-3',
					name: 'Database',
					isConnected: false,
					enabled: false,
					toolCount: 4
				}
			]
		},
		errorLog: sampleErrorLogs.slice(0, 1),
		onClearLogs: () => console.log('Logs cleared'),
		onRemoveLog: (id) => console.log('Log removed:', id),
		onRefresh: async (updateStatus) => {
			updateStatus('Attempting to restart failed servers...')
			await new Promise((resolve) => setTimeout(resolve, 3000))
			updateStatus('Restart complete')
		},
		onClose: () => console.log('Modal closed')
	}
}

export const HighSessionUsage: Story = {
	args: {
		app: mockApp,
		mcpStatus: {
			...sampleMCPStatus,
			currentDocumentSessions: 9,
			sessionLimit: 10,
			activeExecutions: 5
		},
		errorLog: [],
		onClearLogs: () => console.log('Logs cleared'),
		onRemoveLog: (id) => console.log('Log removed:', id),
		onRefresh: async (updateStatus) => {
			updateStatus('Checking session usage...')
			await new Promise((resolve) => setTimeout(resolve, 1000))
			updateStatus('Session status updated')
		},
		onClose: () => console.log('Modal closed')
	}
}

export const Interactive: Story = {
	args: {
		app: mockApp,
		mcpStatus: sampleMCPStatus,
		errorLog: sampleErrorLogs,
		onClearLogs: () => console.log('Logs cleared'),
		onRemoveLog: (id) => console.log('Log removed:', id),
		onRefresh: async (updateStatus) => {
			updateStatus('Refreshing server status...')
			await new Promise((resolve) => setTimeout(resolve, 2000))
			updateStatus('Status refreshed successfully')
		},
		onClose: () => console.log('Modal closed')
	},
	parameters: {
		docs: {
			description: {
				story: 'Fully interactive modal with working tabs, refresh functionality, and error log management.'
			}
		}
	}
}
