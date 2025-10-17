import type { Meta, StoryObj } from '@storybook/react'
import { ValidationMessage } from './ValidationMessage'

const meta = {
	title: 'Atoms/ValidationMessage',
	component: ValidationMessage,
	parameters: {
		layout: 'centered'
	},
	tags: ['autodocs']
} satisfies Meta<typeof ValidationMessage>

export default meta
type Story = StoryObj<typeof meta>

export const Error: Story = {
	args: {
		message: 'This field is required and cannot be empty',
		type: 'error'
	}
}

export const Warning: Story = {
	args: {
		message: 'This URL may not be secure, please verify before proceeding',
		type: 'warning'
	}
}

export const Info: Story = {
	args: {
		message: 'This configuration will be applied to all new servers',
		type: 'info'
	}
}

export const LongMessage: Story = {
	args: {
		message:
			'The JSON configuration is invalid. Please check for missing commas, unclosed brackets, or other syntax errors. You can use a JSON validator to ensure the format is correct.',
		type: 'error'
	}
}

export const MultipleMessages: Story = {
	render: () => (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
			<ValidationMessage message='Invalid URL format' type='error' />
			<ValidationMessage message='This server may be slow to respond' type='warning' />
			<ValidationMessage message='Configuration saved successfully' type='info' />
		</div>
	)
}

export const Dismissible: Story = {
	args: {
		message: 'Configuration has been updated',
		type: 'info',
		onDismiss: () => console.log('Message dismissed')
	}
}

export const WithCustomAction: Story = {
	args: {
		message: 'Connection test failed',
		type: 'error',
		actionLabel: 'Retry',
		onAction: () => console.log('Retry clicked')
	}
}
