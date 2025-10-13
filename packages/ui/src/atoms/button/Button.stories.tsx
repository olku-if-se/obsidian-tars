import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'

const meta = {
	title: 'Atoms/Button',
	component: Button,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs']
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		children: 'Click me'
	}
}

export const Primary: Story = {
	args: {
		children: 'Primary Button',
		variant: 'primary'
	}
}

export const Danger: Story = {
	args: {
		children: 'Danger Button',
		variant: 'danger'
	}
}

export const Small: Story = {
	args: {
		children: 'Small Button',
		size: 'sm'
	}
}

export const Large: Story = {
	args: {
		children: 'Large Button',
		size: 'lg'
	}
}

export const Disabled: Story = {
	args: {
		children: 'Disabled Button',
		disabled: true
	}
}

export const WithIcon: Story = {
	args: {
		children: '⚡ Button',
		variant: 'primary'
	}
}
