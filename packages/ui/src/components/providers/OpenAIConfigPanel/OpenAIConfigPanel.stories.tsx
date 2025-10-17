import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { OpenAIConfigPanel, type OpenAIOptions } from './OpenAIConfigPanel'

const meta = {
	title: 'Providers/OpenAIConfigPanel',
	component: OpenAIConfigPanel,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs']
} satisfies Meta<typeof OpenAIConfigPanel>

export default meta
type Story = StoryObj<typeof meta>

// Default state with empty configuration
export const Default: Story = {
	args: {
		options: {},
		onChange: (updates) => console.log('OpenAI config changed:', updates)
	}
}

// Basic configuration
export const BasicConfig: Story = {
	args: {
		options: {
			maxTokens: 4096,
			temperature: 1.0,
			topP: 1.0
		},
		onChange: (updates) => console.log('OpenAI config changed:', updates)
	}
}

// Complete configuration
export const CompleteConfig: Story = {
	args: {
		options: {
			baseURL: 'https://api.openai.com/v1',
			organization: 'org-1234567890',
			project: 'proj_abcdef123456',
			maxTokens: 8192,
			temperature: 0.7,
			topP: 0.9,
			frequencyPenalty: 0.2,
			presencePenalty: 0.1
		},
		onChange: (updates) => console.log('OpenAI config changed:', updates)
	}
}

// Custom base URL (for compatible services)
export const CustomBaseURL: Story = {
	args: {
		options: {
			baseURL: 'https://api.anthropic.com/v1',
			temperature: 0.8
		},
		onChange: (updates) => console.log('OpenAI config changed:', updates)
	}
}

// With organization and project
export const WithOrganizationAndProject: Story = {
	args: {
		options: {
			organization: 'org-1234567890',
			project: 'proj_abcdef123456',
			maxTokens: 4096
		},
		onChange: (updates) => console.log('OpenAI config changed:', updates)
	}
}

// With validation errors
export const WithValidationErrors: Story = {
	args: {
		options: {
			baseURL: 'invalid-url-without-protocol',
			temperature: 3.0, // Above max 2.0
			topP: 1.5, // Above max 1.0
			frequencyPenalty: 3.0, // Above max 2.0
			presencePenalty: -3.0 // Below min -2.0
		},
		onChange: (updates) => console.log('OpenAI config changed:', updates)
	}
}

// Creative writing configuration
export const CreativeWriting: Story = {
	args: {
		options: {
			maxTokens: 2048,
			temperature: 1.3,
			topP: 0.95,
			frequencyPenalty: 0.5,
			presencePenalty: 0.3
		},
		onChange: (updates) => console.log('OpenAI config changed:', updates)
	}
}

// Code generation configuration
export const CodeGeneration: Story = {
	args: {
		options: {
			maxTokens: 4096,
			temperature: 0.1,
			topP: 0.2,
			frequencyPenalty: 0.0,
			presencePenalty: 0.0
		},
		onChange: (updates) => console.log('OpenAI config changed:', updates)
	}
}

// Analysis configuration
export const Analysis: Story = {
	args: {
		options: {
			maxTokens: 8192,
			temperature: 0.5,
			topP: 0.8,
			frequencyPenalty: 0.1,
			presencePenalty: 0.1
		},
		onChange: (updates) => console.log('OpenAI config changed:', updates)
	}
}

// Disabled state
export const Disabled: Story = {
	args: {
		options: {
			baseURL: 'https://api.openai.com/v1',
			organization: 'org-1234567890',
			maxTokens: 4096,
			temperature: 1.0
		},
		onChange: (updates) => console.log('OpenAI config changed:', updates),
		disabled: true
	}
}

// Interactive story with state management
export const Interactive: Story = {
	render: () => {
		const [openaiOptions, setOpenaiOptions] = useState<OpenAIOptions>({
			maxTokens: 4096,
			temperature: 1.0,
			topP: 1.0
		})

		const handleChange = (updates: Partial<OpenAIOptions>) => {
			setOpenaiOptions((prev) => ({ ...prev, ...updates }))
		}

		return (
			<div style={{ maxWidth: '700px' }}>
				<OpenAIConfigPanel options={openaiOptions} onChange={handleChange} />
				<div
					style={{
						marginTop: '24px',
						padding: '16px',
						backgroundColor: '#f5f5f5',
						borderRadius: '4px',
						fontFamily: 'monospace',
						fontSize: '14px'
					}}
				>
					<h4>Current Configuration:</h4>
					<pre>{JSON.stringify(openaiOptions, null, 2)}</pre>
				</div>
			</div>
		)
	}
}

// Use case presets story
export const UseCasePresets: Story = {
	render: () => {
		const [selectedPreset, setSelectedPreset] = useState('chat')

		const presets = {
			chat: {
				name: 'Chat Conversation',
				description: 'Balanced settings for natural conversation',
				config: {
					maxTokens: 2048,
					temperature: 0.8,
					topP: 0.9,
					frequencyPenalty: 0.1,
					presencePenalty: 0.1
				} as OpenAIOptions
			},
			creative: {
				name: 'Creative Writing',
				description: 'Higher temperature for creative and imaginative responses',
				config: {
					maxTokens: 3072,
					temperature: 1.3,
					topP: 0.95,
					frequencyPenalty: 0.5,
					presencePenalty: 0.3
				} as OpenAIOptions
			},
			technical: {
				name: 'Technical/Code',
				description: 'Lower temperature for accurate, focused responses',
				config: {
					maxTokens: 4096,
					temperature: 0.1,
					topP: 0.2,
					frequencyPenalty: 0.0,
					presencePenalty: 0.0
				} as OpenAIOptions
			},
			analysis: {
				name: 'Data Analysis',
				description: 'Moderate temperature for analytical tasks',
				config: {
					maxTokens: 8192,
					temperature: 0.5,
					topP: 0.8,
					frequencyPenalty: 0.1,
					presencePenalty: 0.1
				} as OpenAIOptions
			}
		}

		const currentConfig = presets[selectedPreset as keyof typeof presets].config

		return (
			<div style={{ maxWidth: '700px' }}>
				<div style={{ marginBottom: '24px' }}>
					<h3>Select Use Case Preset:</h3>
					<select
						value={selectedPreset}
						onChange={(e) => setSelectedPreset(e.target.value)}
						style={{
							padding: '8px 12px',
							fontSize: '14px',
							border: '1px solid #ddd',
							borderRadius: '4px',
							minWidth: '200px',
							marginBottom: '8px'
						}}
					>
						{Object.entries(presets).map(([key, preset]) => (
							<option key={key} value={key}>
								{preset.name}
							</option>
						))}
					</select>
					<p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
						{presets[selectedPreset as keyof typeof presets].description}
					</p>
				</div>

				<OpenAIConfigPanel options={currentConfig} onChange={(updates) => console.log('Config changed:', updates)} />

				<div
					style={{
						marginTop: '24px',
						padding: '16px',
						backgroundColor: '#e9ecef',
						borderRadius: '4px'
					}}
				>
					<h4>Preset Configuration:</h4>
					<ul>
						<li>
							<strong>Max Tokens:</strong> {currentConfig.maxTokens}
						</li>
						<li>
							<strong>Temperature:</strong> {currentConfig.temperature}
						</li>
						<li>
							<strong>Top P:</strong> {currentConfig.topP}
						</li>
						<li>
							<strong>Frequency Penalty:</strong> {currentConfig.frequencyPenalty}
						</li>
						<li>
							<strong>Presence Penalty:</strong> {currentConfig.presencePenalty}
						</li>
					</ul>
				</div>
			</div>
		)
	}
}

// API compatibility demo
export const APICompatibility: Story = {
	render: () => {
		const [selectedService, setSelectedService] = useState('openai')

		const services = {
			openai: {
				name: 'OpenAI Official',
				config: {
					baseURL: 'https://api.openai.com/v1'
				} as OpenAIOptions
			},
			azure: {
				name: 'Azure OpenAI',
				config: {
					baseURL: 'https://your-resource.openai.azure.com/openai/deployments/your-deployment'
				} as OpenAIOptions
			},
			together: {
				name: 'Together AI',
				config: {
					baseURL: 'https://api.together.xyz/v1',
					temperature: 0.7
				} as OpenAIOptions
			},
			anyscale: {
				name: 'Anyscale',
				config: {
					baseURL: 'https://api.endpoints.anyscale.com/v1',
					temperature: 0.8
				} as OpenAIOptions
			}
		}

		const currentConfig = services[selectedService as keyof typeof services].config

		return (
			<div style={{ maxWidth: '700px' }}>
				<div style={{ marginBottom: '24px' }}>
					<h3>API Service Selection:</h3>
					<div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
						{Object.entries(services).map(([key, service]) => (
							<button
								key={key}
								onClick={() => setSelectedService(key)}
								style={{
									padding: '8px 16px',
									backgroundColor: selectedService === key ? '#007bff' : '#f8f9fa',
									color: selectedService === key ? 'white' : 'black',
									border: '1px solid #dee2e6',
									borderRadius: '4px',
									cursor: 'pointer'
								}}
							>
								{service.name}
							</button>
						))}
					</div>
				</div>

				<OpenAIConfigPanel options={currentConfig} onChange={(updates) => console.log('Config changed:', updates)} />

				<div
					style={{
						marginTop: '24px',
						padding: '16px',
						backgroundColor: '#e9ecef',
						borderRadius: '4px'
					}}
				>
					<h4>Service Information:</h4>
					<p>
						<strong>Service:</strong> {services[selectedService as keyof typeof services].name}
					</p>
					<p>
						<strong>Base URL:</strong> {currentConfig.baseURL}
					</p>
					<p>
						<strong>Compatibility:</strong> Compatible with OpenAI API format. Adjust parameters based on the specific
						service's capabilities.
					</p>
				</div>
			</div>
		)
	}
}

// Token optimization story
export const TokenOptimization: Story = {
	render: () => {
		const strategies = [
			{
				title: 'Quick Responses',
				description: 'Short, fast responses for quick interactions',
				config: {
					maxTokens: 256,
					temperature: 0.8
				} as OpenAIOptions
			},
			{
				title: 'Standard Responses',
				description: 'Balanced length for most use cases',
				config: {
					maxTokens: 1024,
					temperature: 0.7
				} as OpenAIOptions
			},
			{
				title: 'Detailed Responses',
				description: 'Longer, more comprehensive responses',
				config: {
					maxTokens: 4096,
					temperature: 0.6
				} as OpenAIOptions
			},
			{
				title: 'Maximum Context',
				description: 'Use full model context window',
				config: {
					maxTokens: 128000,
					temperature: 0.5
				} as OpenAIOptions
			}
		]

		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
				<h3>Token Optimization Strategies</h3>
				{strategies.map((strategy, index) => (
					<div
						key={index}
						style={{
							padding: '16px',
							border: '1px solid #e0e0e0',
							borderRadius: '8px',
							backgroundColor: '#fafafa'
						}}
					>
						<h4 style={{ marginTop: 0, marginBottom: '8px' }}>{strategy.title}</h4>
						<p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>{strategy.description}</p>
						<OpenAIConfigPanel
							options={strategy.config}
							onChange={(updates) => console.log(`${strategy.title} changed:`, updates)}
						/>
					</div>
				))}
			</div>
		)
	}
}

// Minimal configuration
export const MinimalConfig: Story = {
	args: {
		options: {
			temperature: 1.0
		},
		onChange: (updates) => console.log('OpenAI config changed:', updates)
	}
}
