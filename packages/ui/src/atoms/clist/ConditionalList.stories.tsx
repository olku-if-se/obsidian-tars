import type { Meta, StoryObj } from '@storybook/react'
import { ConditionalList } from './ConditionalList'

const meta = {
	title: 'Atoms/ConditionalList',
	component: ConditionalList,
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component:
					'Atomic element for conditionally rendering items based on data. The smallest conditional rendering unit for dynamic UI elements.'
			}
		}
	},
	tags: ['autodocs'],
	argTypes: {
		items: {
			control: 'object',
			description: 'Array of items to conditionally render'
		},
		containerClassName: {
			control: 'text',
			description: 'CSS class for the container element'
		}
	}
} satisfies Meta<typeof ConditionalList>

export default meta
type Story = StoryObj<typeof meta>

export const ItemsVisible: Story = {
	args: {
		items: [
			{ content: 'First item', className: 'item-first' },
			{ content: 'Second item', className: 'item-second', condition: false },
			{ content: 'Third item' }
		],
		containerClassName: 'conditional-list'
	}
}

export const ItemsHidden: Story = {
	args: {
		items: [
			{ content: 'This will not render', className: 'hidden', condition: false },
			{ content: 'This also will not render', condition: false }
		],
		containerClassName: 'conditional-list'
	}
}

export const EmptyItems: Story = {
	args: {
		items: [],
		containerClassName: 'conditional-list'
	}
}

export const DynamicStatus: Story = {
	args: {
		items: [
			{ content: '🟢 Server is running', className: 'status-running' },
			{ content: '📊 Processing 3 requests', className: 'status-processing' },
			{ content: '⏱️ Average response time: 150ms', className: 'status-timing' }
		],
		containerClassName: 'server-status'
	}
}

export const ErrorMessages: Story = {
	args: {
		items: [
			{ content: '❌ Connection failed', className: 'error-critical' },
			{ content: '🔄 Retrying in 5 seconds...', className: 'error-retry' }
		],
		containerClassName: 'error-messages'
	}
}

export const NoErrors: Story = {
	args: {
		items: [{ content: '✅ All systems operational', className: 'success' }],
		containerClassName: 'error-messages'
	}
}

export const SessionInformation: Story = {
	args: {
		items: [
			{ content: 'Sessions: 8 / 10', className: 'session-count' },
			{ content: '⚠️ Approaching limit', className: 'session-warning' }
		],
		containerClassName: 'session-info'
	}
}

export const NoSessions: Story = {
	args: {
		items: [{ content: 'No active sessions', className: 'no-sessions' }],
		containerClassName: 'session-info'
	}
}
