import type { Meta, StoryObj } from '@storybook/react'
import type { ErrorInfo, MCPStatusInfo } from '~/types'
import type { StatusBarState } from './StatusBar'
import { StatusBar } from './StatusBar'

const meta: Meta<typeof StatusBar> = {
	title: 'Components/StatusBar',
	component: StatusBar,
	parameters: {
		layout: {
			constrainWidth: true,
			center: true
		},
		docs: {
			description: {
				component: 'React StatusBar component for Obsidian TARS plugin with click handling and modal triggering.'
			}
		}
	},
	tags: ['autodocs'],
	argTypes: {
		state: {
			description: 'Current status bar state including type, content, and optional MCP status',
			control: 'object'
		},
		onStateChange: {
			description: 'Callback when status state changes',
			action: 'stateChanged'
		},
		onClick: {
			description: 'Callback when status bar is clicked',
			action: 'clicked'
		},
		onOpenModal: {
			description: 'Callback to open a modal (mcp, stats, or error)',
			action: 'modalOpened'
		}
	}
}

export default meta
type Story = StoryObj<typeof StatusBar>

// Mock app object
const mockApp = {
	vault: { getName: () => 'Test Vault' },
	workspace: { activeLeaf: () => null }
} as const

// Sample MCP status for testing
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
			id: 'server-1',
			name: 'Claude Desktop',
			isConnected: true,
			enabled: true,
			toolCount: 12
		},
		{
			id: 'server-2',
			name: 'Filesystem',
			isConnected: false,
			enabled: true,
			isRetrying: true,
			retryAttempt: 2,
			nextRetryAt: Date.now() + 30000,
			toolCount: 8
		},
		{
			id: 'server-3',
			name: 'Database',
			isConnected: false,
			enabled: false,
			toolCount: 4
		}
	],
	cacheStats: {
		size: 150,
		hitRate: 85.2
	}
}

// Sample error info
const sampleError: ErrorInfo = {
	name: 'GenerationError',
	message: 'Failed to generate response: Rate limit exceeded',
	timestamp: new Date(),
	stack:
		'Error: Failed to generate response\n    at GenerationService.generate (generation.js:123:45)\n    at async processGeneration (main.js:67:89)'
}

// Base idle state
const idleState: StatusBarState = {
	type: 'idle',
	content: {
		text: 'Tars',
		tooltip: 'Tars AI assistant is ready'
	},
	timestamp: new Date()
}

// Generating state
const generatingState: StatusBarState = {
	type: 'generating',
	content: {
		text: 'Generating...',
		tooltip: 'Generating response with Claude...'
	},
	timestamp: new Date()
}

// Success state
const successState: StatusBarState = {
	type: 'success',
	content: {
		text: 'Generated 1,234 chars',
		tooltip: 'Response generated successfully'
	},
	timestamp: new Date()
}

// Error state
const errorState: StatusBarState = {
	type: 'error',
	content: {
		text: 'Generation failed',
		tooltip: 'Click to view error details'
	},
	timestamp: new Date(),
	currentError: sampleError
}

// MCP status state
const mcpState: StatusBarState = {
	type: 'idle',
	content: {
		text: '3/5 Servers',
		tooltip: '3 of 5 MCP servers running'
	},
	timestamp: new Date(),
	mcpStatus: sampleMCPStatus
}

export const Idle: Story = {
	args: {
		app: mockApp,
		state: idleState,
		onStateChange: (newState) => console.log('State changed:', newState),
		onClick: () => console.log('Status bar clicked'),
		onOpenModal: (type) => console.log('Opening modal:', type)
	}
}

export const Generating: Story = {
	args: {
		app: mockApp,
		state: generatingState,
		onStateChange: (newState) => console.log('State changed:', newState),
		onClick: () => console.log('Status bar clicked'),
		onOpenModal: (type) => console.log('Opening modal:', type)
	}
}

export const Success: Story = {
	args: {
		app: mockApp,
		state: successState,
		onStateChange: (newState) => console.log('State changed:', newState),
		onClick: () => console.log('Status bar clicked'),
		onOpenModal: (type) => console.log('Opening modal:', type)
	}
}

export const ErrorState: Story = {
	args: {
		app: mockApp,
		state: errorState,
		onStateChange: (newState) => console.log('State changed:', newState),
		onClick: () => console.log('Status bar clicked'),
		onOpenModal: (type) => console.log('Opening modal:', type)
	}
}

export const WithMCPStatus: Story = {
	args: {
		app: mockApp,
		state: mcpState,
		onStateChange: (newState) => console.log('State changed:', newState),
		onClick: () => console.log('Status bar clicked'),
		onOpenModal: (type) => console.log('Opening modal:', type)
	}
}

export const Interactive: Story = {
	args: {
		app: mockApp,
		state: idleState,
		onStateChange: (newState) => console.log('State changed:', newState),
		onClick: () => console.log('Status bar clicked'),
		onOpenModal: (type) => console.log('Opening modal:', type)
	},
	parameters: {
		docs: {
			description: {
				story: 'Interactive status bar that responds to clicks and triggers modal callbacks.'
			}
		}
	}
}

// Responsive layout story showing StatusBar in different contexts
export const ResponsiveStatusBar: Story = {
	render: () => (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: '1rem',
				width: '100%',
				padding: '1rem',
				border: '1px solid var(--color-accent-2)',
				borderRadius: '8px'
			}}
		>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					padding: '0.5rem',
					backgroundColor: 'var(--color-background-secondary)'
				}}
			>
				<span>Header Content</span>
				<StatusBar app={mockApp} state={idleState} onClick={() => console.log('Status clicked')} />
			</div>

			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					padding: '0.5rem',
					backgroundColor: 'var(--color-background-secondary)'
				}}
			>
				<span>Generating State</span>
				<StatusBar app={mockApp} state={generatingState} onClick={() => console.log('Status clicked')} />
			</div>

			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					padding: '0.5rem',
					backgroundColor: 'var(--color-background-secondary)'
				}}
			>
				<span>Error State</span>
				<StatusBar
					app={mockApp}
					state={errorState}
					onClick={() => console.log('Status clicked')}
					onOpenModal={(type) => console.log('Opening modal:', type)}
				/>
			</div>
		</div>
	),
	parameters: {
		layout: {
			constrainWidth: true,
			center: true
		},
		docs: {
			description: {
				story:
					'StatusBar shown in responsive layout contexts, demonstrating how it adapts to different container widths.'
			}
		}
	}
}
