import type { Meta, StoryObj } from '@storybook/react-vite'
import { ErrorDetailsTab } from './ErrorDetailsTab'

const meta = {
	title: 'Views/ErrorDetailsTab',
	component: ErrorDetailsTab,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs']
} satisfies Meta<typeof ErrorDetailsTab>

export default meta
type Story = StoryObj<typeof meta>

// Mock error data
const mockCurrentError = {
	message: 'Failed to connect to MCP server: Connection timeout',
	name: 'ConnectionError',
	timestamp: new Date('2025-01-13T10:30:00Z'),
	stack:
		'Error: Failed to connect to MCP server\n    at MCPServerManager.connect (server.ts:123)\n    at async ToolExecutor.execute (executor.ts:456)'
}

const mockErrorLog = [
	{
		id: 'error-1',
		timestamp: new Date('2025-01-13T10:35:00Z'),
		type: 'mcp' as const,
		message: 'Server "filesystem" failed to start',
		name: 'ServerStartError',
		context: {
			serverId: 'filesystem-server',
			errorCode: 'TIMEOUT'
		}
	},
	{
		id: 'error-2',
		timestamp: new Date('2025-01-13T10:32:00Z'),
		type: 'tool' as const,
		message: 'Tool execution timeout: read_file',
		name: 'ToolTimeoutError',
		context: {
			toolName: 'read_file',
			timeout: 30000,
			actualDuration: 35000
		}
	},
	{
		id: 'error-3',
		timestamp: new Date('2025-01-13T10:30:00Z'),
		type: 'generation' as const,
		message: 'Claude API rate limit exceeded',
		name: 'RateLimitError',
		stack: 'Error: Rate limit exceeded\n    at ClaudeAPIClient.request (claude.ts:789)',
		context: {
			requestId: 'req-abc123',
			rateLimit: 1000,
			currentUsage: 1050
		}
	},
	{
		id: 'error-4',
		timestamp: new Date('2025-01-13T10:28:00Z'),
		type: 'system' as const,
		message: 'Docker daemon not responding',
		name: 'DockerError',
		context: {
			dockerHost: 'localhost',
			port: 2375
		}
	},
	{
		id: 'error-5',
		timestamp: new Date('2025-01-13T10:25:00Z'),
		type: 'mcp' as const,
		message: 'Invalid server configuration',
		name: 'ConfigurationError',
		context: {
			serverId: 'database-server',
			validationErrors: ['Missing required field: "host"', 'Invalid port number']
		}
	}
]

const emptyErrorLog = []

const singleErrorLog = [mockErrorLog[0]]

// Mock handler functions
const mockOnClearLogs = () => {
	console.log('Clear logs called')
}

const mockOnRemoveLog = (id: string) => {
	console.log('Remove log called for:', id)
}

export const WithCurrentError: Story = {
	args: {
		currentError: mockCurrentError,
		errorLog: mockErrorLog,
		onClearLogs: mockOnClearLogs,
		onRemoveLog: mockOnRemoveLog
	}
}

export const ErrorLogOnly: Story = {
	args: {
		errorLog: mockErrorLog,
		onClearLogs: mockOnClearLogs,
		onRemoveLog: mockOnRemoveLog
	}
}

export const SingleError: Story = {
	args: {
		errorLog: singleErrorLog,
		onClearLogs: mockOnClearLogs,
		onRemoveLog: mockOnRemoveLog
	}
}

export const EmptyState: Story = {
	args: {
		errorLog: emptyErrorLog,
		onClearLogs: mockOnClearLogs,
		onRemoveLog: mockOnRemoveLog
	}
}

export const NoHandlers: Story = {
	args: {
		currentError: mockCurrentError,
		errorLog: mockErrorLog,
		onClearLogs: undefined,
		onRemoveLog: undefined
	}
}

export const GenerationErrors: Story = {
	args: {
		errorLog: [
			{
				id: 'gen-1',
				timestamp: new Date('2025-01-13T10:35:00Z'),
				type: 'generation' as const,
				message: 'OpenAI API error: Invalid API key',
				name: 'AuthenticationError',
				context: {
					provider: 'openai',
					model: 'gpt-4'
				}
			},
			{
				id: 'gen-2',
				timestamp: new Date('2025-01-13T10:32:00Z'),
				type: 'generation' as const,
				message: 'Claude API quota exceeded',
				name: 'QuotaError',
				context: {
					provider: 'claude',
					model: 'claude-3-sonnet',
					quotaUsed: '100%',
					resetTime: '2025-01-14T00:00:00Z'
				}
			},
			{
				id: 'gen-3',
				timestamp: new Date('2025-01-13T10:30:00Z'),
				type: 'generation' as const,
				message: 'DeepSeek API request timeout',
				name: 'TimeoutError',
				stack: 'Error: Request timeout after 30 seconds',
				context: {
					provider: 'deepseek',
					model: 'deepseek-chat',
					timeout: 30000
				}
			}
		],
		onClearLogs: mockOnClearLogs,
		onRemoveLog: mockOnRemoveLog
	}
}

export const ToolErrors: Story = {
	args: {
		errorLog: [
			{
				id: 'tool-1',
				timestamp: new Date('2025-01-13T10:35:00Z'),
				type: 'tool' as const,
				message: 'Tool not found: custom_analyzer',
				name: 'ToolNotFoundError',
				context: {
					toolName: 'custom_analyzer',
					serverId: 'analytics-server'
				}
			},
			{
				id: 'tool-2',
				timestamp: new Date('2025-01-13T10:33:00Z'),
				type: 'tool' as const,
				message: 'Invalid parameters for search_files',
				name: 'InvalidParametersError',
				context: {
					toolName: 'search_files',
					serverId: 'filesystem-server',
					errors: ['Missing required parameter: "pattern"', 'Invalid path: /invalid/path']
				}
			},
			{
				id: 'tool-3',
				timestamp: new Date('2025-01-13T10:31:00Z'),
				type: 'tool' as const,
				message: 'Tool execution cancelled by user',
				name: 'CancellationError',
				context: {
					toolName: 'long_running_task',
					serverId: 'task-server',
					executionTime: '45s'
				}
			}
		],
		onClearLogs: mockOnClearLogs,
		onRemoveLog: mockOnRemoveLog
	}
}

export const SystemErrors: Story = {
	args: {
		errorLog: [
			{
				id: 'sys-1',
				timestamp: new Date('2025-01-13T10:35:00Z'),
				type: 'system' as const,
				message: 'Failed to load plugin configuration',
				name: 'ConfigurationError',
				context: {
					configFile: 'config.json',
					parseError: 'Unexpected token } in JSON at position 123'
				}
			},
			{
				id: 'sys-2',
				timestamp: new Date('2025-01-13T10:33:00Z'),
				type: 'system' as const,
				message: 'Memory usage exceeded threshold',
				name: 'MemoryError',
				context: {
					threshold: '512MB',
					current: '623MB',
					percentage: '121.7%'
				}
			}
		],
		onClearLogs: mockOnClearLogs,
		onRemoveLog: mockOnRemoveLog
	}
}
