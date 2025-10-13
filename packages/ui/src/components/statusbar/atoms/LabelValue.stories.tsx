import type { Meta, StoryObj } from '@storybook/react'
import { LabelValue } from './LabelValue'

const meta = {
	title: 'Atoms/LabelValue',
	component: LabelValue,
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component: 'Atomic element for rendering semantic label-value pairs. Used for stats displays, forms, and key-value information.'
			}
		}
	},
	tags: ['autodocs'],
	argTypes: {
		label: {
			control: 'text',
			description: 'The label text to display'
		},
		value: {
			control: 'text',
			description: 'The value text to display'
		},
		className: {
			control: 'text',
			description: 'Additional CSS class names'
		},
		labelClassName: {
			control: 'text',
			description: 'CSS class for the label element'
		},
		valueClassName: {
			control: 'text',
			description: 'CSS class for the value element'
		}
	}
} satisfies Meta<typeof LabelValue>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		label: 'Model:',
		value: 'Claude-3.5-Sonnet'
	}
}

export const WithCustomClasses: Story = {
	args: {
		label: 'Status:',
		value: 'Connected',
		className: 'status-row',
		labelClassName: 'status-label',
		valueClassName: 'status-value-connected'
	}
}

export const LongText: Story = {
	args: {
		label: 'Description:',
		value: 'This is a very long value that demonstrates how the component handles lengthy content that might need to wrap or overflow'
	}
}

export const NumericValue: Story = {
	args: {
		label: 'Characters:',
		value: '42,567'
	}
}

export const TimeValue: Story = {
	args: {
		label: 'Duration:',
		value: '2.3s'
	}
}