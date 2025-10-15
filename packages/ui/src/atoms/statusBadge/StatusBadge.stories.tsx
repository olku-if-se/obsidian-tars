import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatusBadge } from './StatusBadge'

const meta = {
	title: 'Atoms/StatusBadge',
	component: StatusBadge,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs'],
	argTypes: {
		status: {
			control: 'select',
			options: ['idle', 'generating', 'success', 'error', 'warning', 'info']
		},
		variant: {
			control: 'select',
			options: ['default', 'subtle', 'filled']
		},
		size: {
			control: 'select',
			options: ['sm', 'md', 'lg']
		},
		showIcon: {
			control: 'boolean'
		}
	}
} satisfies Meta<typeof StatusBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		status: 'idle'
	}
}

export const Generating: Story = {
	args: {
		status: 'generating'
	}
}

export const Success: Story = {
	args: {
		status: 'success'
	}
}

export const Error: Story = {
	args: {
		status: 'error'
	}
}

export const Warning: Story = {
	args: {
		status: 'warning'
	}
}

export const Info: Story = {
	args: {
		status: 'info'
	}
}

export const CustomText: Story = {
	args: {
		status: 'generating',
		children: 'Processing your request...'
	}
}

export const Subtle: Story = {
	args: {
		status: 'success',
		variant: 'subtle'
	}
}

export const Filled: Story = {
	args: {
		status: 'error',
		variant: 'filled'
	}
}

export const Small: Story = {
	args: {
		status: 'info',
		size: 'sm'
	}
}

export const Large: Story = {
	args: {
		status: 'warning',
		size: 'lg'
	}
}

export const WithoutIcon: Story = {
	args: {
		status: 'success',
		showIcon: false
	}
}

export const AllStatuses: Story = {
	render: () => (
		<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
			<StatusBadge status="idle" />
			<StatusBadge status="generating" />
			<StatusBadge status="success" />
			<StatusBadge status="error" />
			<StatusBadge status="warning" />
			<StatusBadge status="info" />
		</div>
	)
}