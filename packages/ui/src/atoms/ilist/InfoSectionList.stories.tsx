import type { Meta, StoryObj } from '@storybook/react'
import { InfoSectionList } from './InfoSectionList'

const meta = {
	title: 'Atoms/InfoSectionList',
	component: InfoSectionList,
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component:
					'Renders multiple info sections using consistent styling. Following DRY principles for grouped information display.'
			}
		}
	},
	tags: ['autodocs'],
	argTypes: {
		sections: {
			control: 'object',
			description: 'Array of section objects with content and optional className'
		},
		containerClassName: {
			control: 'text',
			description: 'CSS class for the container element'
		}
	}
} satisfies Meta<typeof InfoSectionList>

export default meta
type Story = StoryObj<typeof meta>

export const SingleSection: Story = {
	args: {
		sections: [{ content: 'Status: Online' }]
	}
}

export const MultipleSections: Story = {
	args: {
		sections: [{ content: '🟢 Server 1' }, { content: 'Tools: 12' }, { content: 'Status: Healthy' }]
	}
}

export const ServerInfo: Story = {
	args: {
		sections: [
			{ content: '🟢 claude-server', className: 'server-name' },
			{ content: '| Tools: 8', className: 'tools-count' },
			{ content: '| Status: Connected', className: 'server-status' }
		],
		containerClassName: 'server-info'
	}
}

export const StatusSummary: Story = {
	args: {
		sections: [
			{ content: 'Running: 5 / 8 servers' },
			{ content: 'Active Executions: 2', className: 'active-executions' },
			{ content: 'Available Tools: 45' },
			{ content: '📦 Cache: 120 entries, 85.2% hit rate', className: 'cache-stats' }
		],
		containerClassName: 'status-summary'
	}
}

export const MixedContent: Story = {
	args: {
		sections: [
			{ content: '⚡ Processing' },
			{ content: '| Queue: 3 items' },
			{ content: '| ETA: 30s' },
			{ content: '| Success Rate: 98.5%', className: 'success-rate' }
		]
	}
}
