import type { Meta, StoryObj } from '@storybook/react'
import { Toggle } from './Toggle'

const meta = {
	title: 'Atoms/Toggle',
	component: Toggle,
	parameters: {
		layout: 'centered'
	},
	tags: ['autodocs'],
	argTypes: {
		checked: {
			control: 'boolean',
			description: 'Whether the toggle is checked'
		},
		disabled: {
			control: 'boolean',
			description: 'Whether the toggle is disabled'
		},
		label: {
			control: 'text',
			description: 'Label text for the toggle'
		},
		description: {
			control: 'text',
			description: 'Additional descriptive text'
		}
	}
} satisfies Meta<typeof Toggle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		checked: false,
		label: 'Enable notifications'
	}
}

export const Checked: Story = {
	args: {
		checked: true,
		label: 'Enable notifications'
	}
}

export const WithDescription: Story = {
	args: {
		checked: false,
		label: 'Enable dark mode',
		description: 'Use dark theme across the application'
	}
}

export const Disabled: Story = {
	args: {
		checked: false,
		disabled: true,
		label: 'Disabled option',
		description: 'This toggle is disabled'
	}
}

export const DisabledChecked: Story = {
	args: {
		checked: true,
		disabled: true,
		label: 'Disabled checked option',
		description: 'This toggle is disabled but checked'
	}
}

export const Interactive: Story = {
	args: {
		checked: false,
		label: 'Interactive demo',
		description: 'Click to toggle the switch'
	},
	play: async ({ canvasElement }) => {
		const toggle = canvasElement.querySelector('input[type="checkbox"]') as HTMLInputElement
		if (toggle) {
			toggle.click()
			await new Promise((resolve) => setTimeout(resolve, 200))
		}
	}
}
