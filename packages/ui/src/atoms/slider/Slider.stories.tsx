import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Slider } from './Slider'

const meta = {
	title: 'Atoms/Slider',
	component: Slider,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs'],
	decorators: [
		(Story) => {
			const [value, setValue] = useState(50)
			return <Story args={{ value, onChange: (e) => setValue(Number(e.target.value)) }} />
		}
	]
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		min: 0,
		max: 100,
		step: 1
	}
}

export const WithLabel: Story = {
	args: {
		label: 'Volume',
		min: 0,
		max: 100,
		step: 1
	}
}

export const WithValueDisplay: Story = {
	args: {
		label: 'Temperature',
		description: 'Controls response randomness (higher = more creative)',
		min: 0,
		max: 2,
		step: 0.1,
		showValue: true,
		valueFormatter: (value) => value.toFixed(1)
	}
}

export const DelayControl: Story = {
	args: {
		label: 'Answer Delay',
		description: 'Delay before assistant responds in seconds',
		min: 1.5,
		max: 4,
		step: 0.5,
		showValue: true,
		valueFormatter: (value) => `${value}s`
	}
}

export const PercentageControl: Story = {
	args: {
		label: 'Token Limit',
		description: 'Maximum response length as percentage of default',
		min: 10,
		max: 200,
		step: 10,
		showValue: true,
		valueFormatter: (value) => `${value}%`
	}
}

export const DiscreteSteps: Story = {
	args: {
		label: 'Response Quality',
		description: 'Choose the quality level for AI responses',
		min: 1,
		max: 5,
		step: 1,
		showValue: true,
		valueFormatter: (value) => {
			const labels = ['', 'Basic', 'Good', 'Better', 'Best', 'Premium']
			return labels[value] || value.toString()
		}
	}
}

export const SmallRange: Story = {
	args: {
		label: 'Retry Attempts',
		description: 'Number of times to retry failed requests',
		min: 0,
		max: 5,
		step: 1,
		showValue: true
	}
}

export const Disabled: Story = {
	args: {
		label: 'Configuration',
		description: 'This setting is currently disabled',
		min: 0,
		max: 100,
		step: 1,
		showValue: true,
		disabled: true
	}
}

export const Uncontrolled: Story = {
	args: {
		label: 'Brightness',
		description: 'Adjust the interface brightness',
		min: 0,
		max: 100,
		step: 5,
		showValue: true,
		valueFormatter: (value) => `${value}%`
	},
	decorators: []
}

export const CustomFormatting: Story = {
	args: {
		label: 'Model Cost Limit',
		description: 'Set maximum cost per request in USD',
		min: 0,
		max: 1,
		step: 0.01,
		showValue: true,
		valueFormatter: (value) => `$${value.toFixed(2)}`
	}
}
