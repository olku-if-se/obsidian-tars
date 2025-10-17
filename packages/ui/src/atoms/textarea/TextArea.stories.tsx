import type { Meta, StoryObj } from '@storybook/react-vite'
import { TextArea } from './TextArea'

const meta = {
	title: 'Atoms/TextArea',
	component: TextArea,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs']
} satisfies Meta<typeof TextArea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		placeholder: 'Enter your text here...',
		rows: 4
	}
}

export const WithLabel: Story = {
	args: {
		label: 'System Message',
		placeholder: 'Enter the default system message for conversations...',
		rows: 6
	}
}

export const WithDescription: Story = {
	args: {
		label: 'API Configuration',
		description: 'Enter your API configuration in JSON format',
		placeholder: '{\n  "apiKey": "your-api-key",\n  "endpoint": "https://api.example.com"\n}',
		rows: 8
	}
}

export const WithContent: Story = {
	args: {
		label: 'Default System Message',
		description: 'This message will be automatically added to all conversations',
		rows: 6,
		value:
			'You are a helpful assistant that provides accurate, concise, and well-structured responses. Always be clear and professional.'
	}
}

export const WithError: Story = {
	args: {
		label: 'API Key',
		error: 'API key is required and must be a valid format',
		placeholder: 'Enter your API key...',
		rows: 2
	}
}

export const Disabled: Story = {
	args: {
		label: 'Configuration',
		description: 'This configuration is currently locked',
		value: '{\n  "enabled": true,\n  "version": "1.0.0"\n}',
		rows: 4,
		disabled: true
	}
}

export const NonResizable: Story = {
	args: {
		label: 'Read-only Configuration',
		description: 'Fixed size text area for configuration display',
		value:
			'This is a fixed-size text area that cannot be resized by the user. It maintains its dimensions regardless of content.',
		rows: 3,
		resizable: false
	}
}

export const LargeContent: Story = {
	args: {
		label: 'Conversation Template',
		description: 'Template for structuring AI conversations',
		value: `#System: You are a helpful AI assistant.

#User: Hello! I need help with understanding the best practices for software development.

#Assistant: I'd be happy to help you with software development best practices! Here are some key areas to focus on:

1. **Code Quality**: Write clean, readable, and maintainable code
2. **Testing**: Implement comprehensive testing strategies
3. **Version Control**: Use Git effectively for collaboration
4. **Documentation**: Document your code and decisions
5. **Security**: Follow security best practices

Would you like me to elaborate on any of these areas?`,
		rows: 12
	}
}

export const CharacterCount: Story = {
	args: {
		label: 'Short Description',
		description: 'Brief description for your AI assistant (max 200 characters)',
		placeholder: 'Describe your assistant in one sentence...',
		rows: 2,
		value: 'A helpful AI assistant specialized in software development and technical writing.'
	}
}

export const CodeBlock: Story = {
	args: {
		label: 'Custom Function',
		description: 'Enter custom JavaScript function for processing responses',
		value: `function processResponse(response) {
  // Custom processing logic here
  return response
    .replace(/\\s+/g, ' ')
    .trim();
}`,
		rows: 6
	}
}

export const EmptyWithPlaceholder: Story = {
	args: {
		label: 'Notes',
		description: 'Add any additional notes or context for this conversation',
		placeholder: 'Type your notes here...',
		rows: 4
	}
}

export const RequiredField: Story = {
	args: {
		label: 'Terms of Service',
		description: 'Please read and agree to the terms',
		placeholder: 'Enter your agreement confirmation...',
		rows: 3,
		required: true
	}
}
