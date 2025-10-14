import type { Meta, StoryObj } from '@storybook/react-vite'
import { ErrorLogItem } from './ErrorLogItem'

const meta = {
	title: 'Views/ErrorDetailView/ErrorLogItem',
	component: ErrorLogItem,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs']
} satisfies Meta<typeof ErrorLogItem>

export default meta
type Story = StoryObj<typeof meta>

const createError = (type: string, name: string, message: string, context?: any, stack?: string) => ({
	id: `error-${Math.random().toString(36).substr(2, 9)}`,
	timestamp: new Date(),
	type,
	name,
	message,
	context,
	stack
})

export const GenerationError: Story = {
	args: {
		error: createError(
			'generation',
			'APIError',
			'Failed to connect to Claude API: Connection timeout after 30 seconds',
			{
				endpoint: 'https://api.anthropic.com',
				model: 'claude-3-sonnet-20240229',
				requestId: 'req_123456789',
				retryCount: 2
			},
			`APIError: Failed to connect to Claude API: Connection timeout after 30 seconds
    at APIClient.request (/src/api/client.ts:45:12)
    at ClaudeProvider.sendRequest (/src/providers/claude.ts:78:20)
    at async generate (/src/editor.ts:234:15)
    at async handleTagCommand (/src/commands/asstTag.ts:67:8)`
		),
		index: 0,
		onRemove: (id: string) => console.log('remove-error', id)
	}
}

export const MCPError: Story = {
	args: {
		error: createError(
			'mcp',
			'ServerConnectionError',
			'Failed to connect to MCP server: Container not found',
			{
				serverName: 'filesystem-server',
				containerId: 'fs-server-001',
				image: 'mcp/filesystem:latest',
				deploymentType: 'managed',
				transport: 'stdio'
			},
			`ServerConnectionError: Failed to connect to MCP server: Container not found
    at MCPServerManager.startServer (/src/mcp/managerMCPUse.ts:156:18)
    at ToolExecutor.execute (/src/mcp/executor.ts:89:25)
    at async CodeBlockProcessor.process (/src/mcp/codeBlockProcessor.ts:234:15)`
		),
		index: 0,
		onRemove: (id: string) => console.log('remove-error', id)
	}
}

export const ToolError: Story = {
	args: {
		error: createError(
			'tool',
			'ToolExecutionError',
			'Tool execution failed: Invalid parameter "path" - directory does not exist',
			{
				toolName: 'read_file',
				serverName: 'filesystem-server',
				parameters: {
					path: '/nonexistent/directory/file.txt'
				},
				executionTime: 1250,
				timeout: 30000
			},
			`ToolExecutionError: Tool execution failed: Invalid parameter "path"
    at ToolExecutor.validateParameters (/src/mcp/executor.ts:203:22)
    at ToolExecutor.execute (/src/mcp/executor.ts:178:16)
    at async MCPClient.callTool (/src/mcp/client.ts:89:14)`
		),
		index: 0,
		onRemove: (id: string) => console.log('remove-error', id)
	}
}

export const SystemError: Story = {
	args: {
		error: createError(
			'system',
			'PluginError',
			'Failed to load plugin configuration: Invalid JSON in settings file',
			{
				filePath: '/config/plugin-settings.json',
				operation: 'load-settings',
				errorCode: 'INVALID_JSON'
			},
			`PluginError: Failed to load plugin configuration
    at SettingsManager.load (/src/settings.ts:234:19)
    at TarsPlugin.loadSettings (/src/main.ts:89:22)
    at async onload (/src/main.ts:45:8)`
		),
		index: 0,
		onRemove: (id: string) => console.log('remove-error', id)
	}
}

export const ErrorWithContext: Story = {
	args: {
		error: createError(
			'generation',
			'RateLimitError',
			'API rate limit exceeded: Too many requests per minute',
			{
				provider: 'OpenAI',
				model: 'gpt-4-turbo-preview',
				requestCount: 75,
				limit: 60,
				resetTime: '2024-01-15T10:30:00Z',
				retryAfter: 45
			}
		),
		index: 0,
		onRemove: (id: string) => console.log('remove-error', id)
	}
}

export const ErrorWithStackTrace: Story = {
	args: {
		error: createError(
			'mcp',
			'DockerError',
			'Docker command failed: Container exit code 1',
			{
				containerName: 'mcp-server-redis',
				command: 'docker run -i --rm mcp/redis:latest',
				exitCode: 1,
				stderr: 'Error: Redis connection failed to localhost:6379'
			},
			`DockerError: Docker command failed: Container exit code 1
    at DockerManager.runContainer (/src/mcp/dockerManager.ts:178:24)
    at MCPServerManager.startContainer (/src/mcp/managerMCPUse.ts:234:18)
    at async MCPServerManager.ensureServerRunning (/src/mcp/managerMCPUse.ts:189:12)
    at async ToolExecutor.execute (/src/mcp/executor.ts:89:25)`
		),
		index: 0,
		onRemove: (id: string) => console.log('remove-error', id)
	}
}

export const NetworkError: Story = {
	args: {
		error: createError(
			'generation',
			'NetworkError',
			'Network request failed: Unable to resolve host api.example.com',
			{
				url: 'https://api.example.com/v1/chat/completions',
				method: 'POST',
				timeout: 30000,
				attempts: 3
			},
			`NetworkError: Network request failed
    at fetchWithRetry (/src/utils/network.ts:89:20)
    at APIClient.request (/src/api/client.ts:67:18)
    at OpenAIProvider.sendRequest (/src/providers/openai.ts:123:22)`
		),
		index: 0,
		onRemove: (id: string) => console.log('remove-error', id)
	}
}

export const ValidationError: Story = {
	args: {
		error: createError(
			'system',
			'ValidationError',
			'Invalid plugin configuration: API key format is incorrect',
			{
				field: 'claude.apiKey',
				value: 'invalid-key-format',
				expected: 'sk-ant-api03-*',
				validationRule: 'apiKeyFormat'
			}
		),
		index: 0,
		onRemove: (id: string) => console.log('remove-error', id)
	}
}

export const PermissionError: Story = {
	args: {
		error: createError(
			'tool',
			'PermissionError',
			'Access denied: Insufficient permissions to read file',
			{
				filePath: '/etc/hosts',
				operation: 'read_file',
				requiredPermission: 'file-system-read',
				userPermissions: ['file-system-write']
			}
		),
		index: 0,
		onRemove: (id: string) => console.log('remove-error', id)
	}
}

export const TimeoutError: Story = {
	args: {
		error: createError(
			'tool',
			'TimeoutError',
			'Tool execution timed out after 30 seconds',
			{
				toolName: 'web_search',
				timeout: 30000,
				actualDuration: 30000,
				query: 'latest developments in AI technology'
			}
		),
		index: 0,
		onRemove: (id: string) => console.log('remove-error', id)
	}
}

export const MultipleErrors: Story = {
	render: () => (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
			<ErrorLogItem
				error={createError(
					'generation',
					'APIError',
					'Failed to connect to Claude API'
				)}
				index={0}
				onRemove={(id: string) => console.log('remove-error-1', id)}
			/>
			<ErrorLogItem
				error={createError(
					'mcp',
					'ServerConnectionError',
					'MCP server connection failed'
				)}
				index={1}
				onRemove={(id: string) => console.log('remove-error-2', id)}
			/>
			<ErrorLogItem
				error={createError(
					'tool',
					'ToolExecutionError',
					'Tool execution timeout'
				)}
				index={2}
				onRemove={(id: string) => console.log('remove-error-3', id)}
			/>
		</div>
	)
}