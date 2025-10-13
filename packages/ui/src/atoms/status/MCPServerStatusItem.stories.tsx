import type { Meta, StoryObj } from '@storybook/react-vite'
import { MCPServerStatusItem } from './MCPServerStatusItem'

const meta = {
	title: 'Atoms/MCPServerStatusItem',
	component: MCPServerStatusItem,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs']
} satisfies Meta<typeof MCPServerStatusItem>

export default meta
type Story = StoryObj<typeof meta>

// Mock server data for different states
const connectedServer = {
	id: 'server-1',
	name: 'Claude Code Server',
	enabled: true,
	isConnected: true,
	toolCount: 12
}

const disconnectedServer = {
	id: 'server-2',
	name: 'Filesystem Server',
	enabled: true,
	isConnected: false,
	toolCount: 8
}

const retryingServer = {
	id: 'server-3',
	name: 'Database Server',
	enabled: true,
	isConnected: false,
	toolCount: 6,
	isRetrying: true,
	retryAttempt: 2,
	nextRetryAt: Date.now() + 15000 // 15 seconds from now
}

const disabledServer = {
	id: 'server-4',
	name: 'Legacy Server',
	enabled: false,
	isConnected: false,
	toolCount: 3
}

const serverWithManyTools = {
	id: 'server-5',
	name: 'Super Server',
	enabled: true,
	isConnected: true,
	toolCount: 42
}

export const Connected: Story = {
	args: {
		server: connectedServer
	}
}

export const Disconnected: Story = {
	args: {
		server: disconnectedServer
	}
}

export const Retrying: Story = {
	args: {
		server: retryingServer
	}
}

export const Disabled: Story = {
	args: {
		server: disabledServer
	}
}

export const ManyTools: Story = {
	args: {
		server: serverWithManyTools
	}
}

export const LongName: Story = {
	args: {
		server: {
			id: 'server-6',
			name: 'Very Long Server Name That Might Cause Layout Issues',
			enabled: true,
			isConnected: true,
			toolCount: 15
		}
	}
}

export const NoTools: Story = {
	args: {
		server: {
			id: 'server-7',
			name: 'Empty Server',
			enabled: true,
			isConnected: true,
			toolCount: 0
		}
	}
}

export const RetryAttemptZero: Story = {
	args: {
		server: {
			id: 'server-8',
			name: 'First Retry Server',
			enabled: true,
			isConnected: false,
			toolCount: 5,
			isRetrying: true,
			retryAttempt: 0,
			nextRetryAt: undefined
		}
	}
}
