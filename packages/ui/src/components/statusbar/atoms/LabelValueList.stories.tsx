import type { Meta, StoryObj } from '@storybook/react'
import { LabelValueList } from './LabelValue'

const meta = {
	title: 'Atoms/LabelValueList',
	component: LabelValueList,
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component: 'Renders multiple label-value pairs using the same template. Following DRY principles for consistent UI patterns.'
			}
		}
	},
	tags: ['autodocs'],
	argTypes: {
		rows: {
			control: 'object',
			description: 'Array of label-value objects to render'
		},
		rowClassName: {
			control: 'text',
			description: 'CSS class for each row'
		},
		labelClassName: {
			control: 'text',
			description: 'CSS class for all label elements'
		},
		valueClassName: {
			control: 'text',
			description: 'CSS class for all value elements'
		}
	}
} satisfies Meta<typeof LabelValueList>

export default meta
type Story = StoryObj<typeof meta>

export const SingleRow: Story = {
	args: {
		rows: [
			{ label: 'Round:', value: '1' }
		]
	}
}

export const MultipleRows: Story = {
	args: {
		rows: [
			{ label: 'Round:', value: '1' },
			{ label: 'Model:', value: 'Claude-3.5-Sonnet' },
			{ label: 'Vendor:', value: 'Anthropic' },
			{ label: 'Characters:', value: '1,234' },
			{ label: 'Duration:', value: '3.2s' }
		]
	}
}

export const StatsDisplay: Story = {
	args: {
		rows: [
			{ label: 'Round:', value: '3' },
			{ label: 'Model:', value: 'GPT-4' },
			{ label: 'Vendor:', value: 'OpenAI' },
			{ label: 'Characters:', value: '15,678' },
			{ label: 'Duration:', value: '5.1s' },
			{ label: 'Start Time:', value: '2:34:56 PM' },
			{ label: 'End Time:', value: '2:35:01 PM' }
		],
		rowClassName: 'stat-row',
		labelClassName: 'stat-label',
		valueClassName: 'stat-value'
	}
}

export const MixedContent: Story = {
	args: {
		rows: [
			{ label: 'Status:', value: '✅ Active' },
			{ label: 'Servers:', value: '5 / 8' },
			{ label: 'Tools:', value: '23' },
			{ label: 'Cache Hit Rate:', value: '87.3%' },
			{ label: 'Last Update:', value: 'Just now' }
		]
	}
}