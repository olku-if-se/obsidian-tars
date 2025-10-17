import type { Meta, StoryObj } from '@storybook/react'
import type { ErrorInfo, ErrorLogEntry } from '../../types'
import { ErrorDetailView } from './ErrorDetailView'

const meta: Meta<typeof ErrorDetailView> = {
	title: 'Components/ErrorDetailView',
	component: ErrorDetailView,
	parameters: {
		layout: 'centered',
		docs: {
			description: 'Component for displaying error details with error log management and context information.'
		}
	},
	tags: ['autodocs'],
	argTypes: {
		currentError: {
			description: 'Current error information to display',
			control: 'object'
		},
		errorLog: {
			description: 'Array of error log entries',
			control: 'array'
		},
		onClearLogs: {
			description: 'Callback to clear all error logs',
			action: 'logsCleared'
		},
		onRemoveLog: {
			description: 'Callback to remove a specific error log entry',
			action: 'logRemoved'
		}
	}
}

export default meta
type Story = StoryObj<typeof ErrorDetailView>

// Mock app object
const mockApp = {
	vault: { getName: () => 'Test Vault' },
	workspace: { activeLeaf: () => null }
} as const

// Sample current error
const sampleCurrentError: ErrorInfo = {
	name: 'GenerationError',
	message: 'Failed to generate response: Rate limit exceeded',
	timestamp: new Date(),
	stack:
		'Error: Rate limit exceeded\n    at GenerationService.generate (generation.js:123:45)\n    at async processGeneration (main.js:67:89)'
}

// Sample error logs
const sampleErrorLogs: ErrorLogEntry[] = [
	{
		id: 'error-1',
		type: 'mcp',
		name: 'ConnectionError',
		message: 'Failed to connect to Filesystem server: Connection timeout',
		timestamp: new Date(Date.now() - 5 * 60 * 1000),
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
		timestamp: new Date(Date.now() - 15 * 60 * 1000),
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
		timestamp: new Date(Date.now() - 30 * 60 * 1000),
		context: {
			provider: 'claude',
			requestId: 'req_abc123',
			rateLimitRemaining: 0
		},
		stack:
			'Error: Rate limit exceeded\n    at ClaudeProvider.sendRequest (claude.js:345:67)\n    at async generateResponse (editor.js:89:123)'
	}
]

export const WithCurrentError: Story = {
	args: {
		app: mockApp,
		currentError: sampleCurrentError,
		errorLog: [],
		onClearLogs: () => console.log('Logs cleared'),
		onRemoveLog: (id) => console.log('Log removed:', id)
	}
}

export const WithErrorLog: Story = {
	args: {
		app: mockApp,
		errorLog: sampleErrorLogs,
		onClearLogs: () => console.log('Logs cleared'),
		onRemoveLog: (id) => console.log('Log removed:', id)
	}
}

export const WithBoth: Story = {
	args: {
		app: mockApp,
		currentError: sampleCurrentError,
		errorLog: sampleErrorLogs,
		onClearLogs: () => console.log('Logs cleared'),
		onRemoveLog: (id) => console.log('Log removed:', id)
	}
}

export const Empty: Story = {
	args: {
		app: mockApp,
		errorLog: [],
		onClearLogs: () => console.log('Logs cleared'),
		onRemoveLog: (id) => console.log('Log removed:', id)
	}
}
