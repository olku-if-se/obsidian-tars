import type { Meta, StoryObj } from '@storybook/react-vite'
import { Select } from './Select'

const meta = {
	title: 'Atoms/Select',
	component: Select,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs']
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		options: [
			{ value: 'claude', label: 'Claude' },
			{ value: 'gpt', label: 'GPT-4' },
			{ value: 'gemini', label: 'Gemini' }
		]
	}
}

export const WithLabelAndDescription: Story = {
	args: {
		label: 'AI Assistant',
		description: 'Choose your preferred AI assistant for conversations',
		options: [
			{ value: 'claude', label: 'Claude' },
			{ value: 'gpt', label: 'GPT-4' },
			{ value: 'gemini', label: 'Gemini' }
		]
	}
}

export const WithEmptyOption: Story = {
	args: {
		label: 'AI Model',
		description: 'Select the AI model to use for generating responses',
		options: [
			{ value: 'claude-3-opus', label: 'Claude 3 Opus' },
			{ value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
			{ value: 'claude-3-haiku', label: 'Claude 3 Haiku' }
		],
		emptyOption: 'Select a model...'
	}
}

export const WithDisabledOptions: Story = {
	args: {
		label: 'Available Models',
		description: 'Some models may be temporarily unavailable',
		options: [
			{ value: 'claude-3-opus', label: 'Claude 3 Opus' },
			{ value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
			{ value: 'claude-3-haiku', label: 'Claude 3 Haiku', disabled: true },
			{ value: 'gpt-4', label: 'GPT-4', disabled: true }
		],
		emptyOption: 'Select a model...'
	}
}

export const Disabled: Story = {
	args: {
		label: 'AI Assistant',
		description: 'This selection is currently disabled',
		options: [
			{ value: 'claude', label: 'Claude' },
			{ value: 'gpt', label: 'GPT-4' }
		],
		disabled: true,
		value: 'claude'
	}
}

export const Required: Story = {
	args: {
		label: 'API Provider',
		description: 'Choose your API provider (required)',
		options: [
			{ value: 'anthropic', label: 'Anthropic Claude' },
			{ value: 'openai', label: 'OpenAI GPT' },
			{ value: 'google', label: 'Google Gemini' }
		],
		emptyOption: 'Select provider...',
		required: true
	}
}

export const LongOptions: Story = {
	args: {
		label: 'Conversation Style',
		description: 'Choose how detailed you want the AI responses to be',
		options: [
			{ value: 'concise', label: 'Concise and to the point' },
			{ value: 'detailed', label: 'Detailed with explanations' },
			{ value: 'comprehensive', label: 'Comprehensive with examples and additional context' },
			{ value: 'academic', label: 'Academic style with citations and formal structure' }
		],
		emptyOption: 'Select response style...'
	}
}