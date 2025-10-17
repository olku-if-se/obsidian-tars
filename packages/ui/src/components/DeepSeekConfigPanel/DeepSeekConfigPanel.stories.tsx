import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { DeepSeekConfigPanel, type DeepSeekOptions } from './DeepSeekConfigPanel'

const meta = {
	title: 'Components/DeepSeekConfigPanel',
	component: DeepSeekConfigPanel,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof DeepSeekConfigPanel>

export default meta
type Story = StoryObj<typeof meta>

// Default state with empty configuration
export const Default: Story = {
	args: {
		options: {},
		onChange: (updates) => console.log('DeepSeek config changed:', updates),
	},
}

// With chat model configuration
export const ChatModelConfig: Story = {
	args: {
		options: {
			model: 'deepseek-chat',
			maxTokens: 4096,
			temperature: 1.0,
			topP: 1.0,
		},
		onChange: (updates) => console.log('DeepSeek config changed:', updates),
	},
}

// With reasoner model configuration
export const ReasonerModelConfig: Story = {
	args: {
		options: {
			model: 'deepseek-reasoner',
			reasoningEffort: 'medium',
			maxTokens: 8192,
			temperature: 0.7,
			topP: 0.95,
		},
		onChange: (updates) => console.log('DeepSeek config changed:', updates),
	},
}

// With high reasoning effort
export const HighReasoningEffort: Story = {
	args: {
		options: {
			model: 'deepseek-reasoner',
			reasoningEffort: 'high',
			maxTokens: 8192,
			temperature: 0.5,
		},
		onChange: (updates) => console.log('DeepSeek config changed:', updates),
	},
}

// With custom base URL
export const CustomBaseURL: Story = {
	args: {
		options: {
			baseURL: 'https://custom-api.deepseek.com',
			model: 'deepseek-chat',
		},
		onChange: (updates) => console.log('DeepSeek config changed:', updates),
	},
}

// With invalid base URL (showing validation)
export const InvalidBaseURL: Story = {
	args: {
		options: {
			baseURL: 'invalid-url-without-protocol',
			model: 'deepseek-chat',
		},
		onChange: (updates) => console.log('DeepSeek config changed:', updates),
	},
}

// With validation errors
export const WithValidationErrors: Story = {
	args: {
		options: {
			baseURL: 'invalid-url',
			temperature: 3.0, // Above max 2.0
			topP: 1.5, // Above max 1.0
		},
		onChange: (updates) => console.log('DeepSeek config changed:', updates),
	},
}

// With penalties configured
export const WithPenalties: Story = {
	args: {
		options: {
			model: 'deepseek-chat',
			frequencyPenalty: 0.5,
			presencePenalty: 0.3,
			temperature: 0.8,
		},
		onChange: (updates) => console.log('DeepSeek config changed:', updates),
	},
}

// Disabled state
export const Disabled: Story = {
	args: {
		options: {
			model: 'deepseek-reasoner',
			reasoningEffort: 'high',
			maxTokens: 4096,
		},
		onChange: (updates) => console.log('DeepSeek config changed:', updates),
		disabled: true,
	},
}

// Interactive story with state management
export const Interactive: Story = {
	render: () => {
		const [deepseekOptions, setDeepseekOptions] = useState<DeepSeekOptions>({
			model: 'deepseek-chat',
			maxTokens: 4096,
			temperature: 1.0,
		})

		const handleChange = (updates: Partial<DeepSeekOptions>) => {
			setDeepseekOptions((prev) => ({ ...prev, ...updates }))
		}

		return (
			<div style={{ maxWidth: '700px' }}>
				<DeepSeekConfigPanel
					options={deepseekOptions}
					onChange={handleChange}
				/>
				<div
					style={{
						marginTop: '24px',
						padding: '16px',
						backgroundColor: '#f5f5f5',
						borderRadius: '4px',
						fontFamily: 'monospace',
						fontSize: '14px',
					}}
				>
					<h4>Current Configuration:</h4>
					<pre>{JSON.stringify(deepseekOptions, null, 2)}</pre>
				</div>
			</div>
		)
	},
}

// Model comparison story
export const ModelComparison: Story = {
	render: () => {
		const [selectedModel, setSelectedModel] = useState<'chat' | 'reasoner'>('chat')

		const chatConfig: DeepSeekOptions = {
			model: 'deepseek-chat',
			maxTokens: 4096,
			temperature: 1.0,
			topP: 1.0,
		}

		const reasonerConfig: DeepSeekOptions = {
			model: 'deepseek-reasoner',
			reasoningEffort: 'medium',
			maxTokens: 8192,
			temperature: 0.7,
			topP: 0.95,
		}

		const currentConfig = selectedModel === 'chat' ? chatConfig : reasonerConfig

		return (
			<div style={{ maxWidth: '700px' }}>
				<div style={{ marginBottom: '24px' }}>
					<h3>Select Model Type:</h3>
					<div style={{ display: 'flex', gap: '12px' }}>
						<button
							onClick={() => setSelectedModel('chat')}
							style={{
								padding: '8px 16px',
								backgroundColor: selectedModel === 'chat' ? '#007bff' : '#f8f9fa',
								color: selectedModel === 'chat' ? 'white' : 'black',
								border: '1px solid #dee2e6',
								borderRadius: '4px',
								cursor: 'pointer',
							}}
						>
							Chat Model
						</button>
						<button
							onClick={() => setSelectedModel('reasoner')}
							style={{
								padding: '8px 16px',
								backgroundColor: selectedModel === 'reasoner' ? '#007bff' : '#f8f9fa',
								color: selectedModel === 'reasoner' ? 'white' : 'black',
								border: '1px solid #dee2e6',
								borderRadius: '4px',
								cursor: 'pointer',
							}}
						>
							Reasoner Model
						</button>
					</div>
				</div>

				<DeepSeekConfigPanel
					options={currentConfig}
					onChange={(updates) => console.log('Config changed:', updates)}
				/>

				<div
					style={{
						marginTop: '24px',
						padding: '16px',
						backgroundColor: '#e9ecef',
						borderRadius: '4px',
					}}
				>
					<h4>Model Characteristics:</h4>
					{selectedModel === 'chat' ? (
						<ul>
							<li><strong>Fast responses</strong> for quick conversations</li>
							<li><strong>Temperature: 1.0</strong> for balanced creativity</li>
							<li><strong>Best for:</strong> General chat, creative writing, simple Q&A</li>
						</ul>
					) : (
						<ul>
							<li><strong>Step-by-step reasoning</strong> with callout blocks</li>
							<li><strong>Temperature: 0.7</strong> for more focused thinking</li>
							<li><strong>Best for:</strong> Complex problems, math, code debugging</li>
						</ul>
					)}
				</div>
			</div>
		)
	},
}

// Complete configuration
export const CompleteConfig: Story = {
	args: {
		options: {
			baseURL: 'https://api.deepseek.com',
			model: 'deepseek-reasoner',
			reasoningEffort: 'high',
			maxTokens: 8192,
			temperature: 0.5,
			topP: 0.9,
			frequencyPenalty: 0.2,
			presencePenalty: 0.1,
		},
		onChange: (updates) => console.log('DeepSeek config changed:', updates),
	},
}

// Minimal configuration
export const MinimalConfig: Story = {
	args: {
		options: {
			model: 'deepseek-chat',
		},
		onChange: (updates) => console.log('DeepSeek config changed:', updates),
	},
}