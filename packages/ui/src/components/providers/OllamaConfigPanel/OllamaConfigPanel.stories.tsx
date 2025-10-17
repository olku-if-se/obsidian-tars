import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { OllamaConfigPanel, type OllamaOptions } from './OllamaConfigPanel'

const meta = {
	title: 'Providers/OllamaConfigPanel',
	component: OllamaConfigPanel,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs']
} satisfies Meta<typeof OllamaConfigPanel>

export default meta
type Story = StoryObj<typeof meta>

// Default state with empty configuration
export const Default: Story = {
	args: {
		options: {},
		onChange: (updates) => console.log('Ollama config changed:', updates)
	}
}

// Basic configuration
export const BasicConfig: Story = {
	args: {
		options: {
			baseURL: 'http://127.0.0.1:11434',
			model: 'llama3.1',
			stream: true
		},
		onChange: (updates) => console.log('Ollama config changed:', updates)
	}
}

// Complete configuration
export const CompleteConfig: Story = {
	args: {
		options: {
			baseURL: 'http://127.0.0.1:11434',
			model: 'llama3.1:8b',
			keepAlive: '10m',
			stream: true,
			numCtx: 4096,
			numPredict: 512,
			temperature: 0.7,
			topP: 0.9,
			topK: 40,
			repeatPenalty: 1.1,
			stop: ['User:', 'Human:']
		},
		onChange: (updates) => console.log('Ollama config changed:', updates)
	}
}

// With advanced parameters
export const WithAdvancedParams: Story = {
	args: {
		options: {
			baseURL: 'http://127.0.0.1:11434',
			model: 'codellama',
			keepAlive: '1h',
			stream: true,
			numCtx: 8192,
			temperature: 0.5,
			topP: 0.95,
			topK: 50,
			repeatPenalty: 1.2,
			tfsZ: 1.5,
			mirostat: 1,
			mirostatTau: 5.0,
			mirostatEta: 0.1
		},
		onChange: (updates) => console.log('Ollama config changed:', updates)
	}
}

// With validation errors
export const WithValidationErrors: Story = {
	args: {
		options: {
			baseURL: 'invalid-url-without-protocol',
			temperature: 3.0, // Above max 2.0
			topP: 1.5 // Above max 1.0
		},
		onChange: (updates) => console.log('Ollama config changed:', updates)
	}
}

// Remote server configuration
export const RemoteServer: Story = {
	args: {
		options: {
			baseURL: 'https://my-ollama-server.example.com:11434',
			model: 'mixtral:8x7b',
			keepAlive: '30m',
			stream: true
		},
		onChange: (updates) => console.log('Ollama config changed:', updates)
	}
}

// Disabled state
export const Disabled: Story = {
	args: {
		options: {
			baseURL: 'http://127.0.0.1:11434',
			model: 'llama3.1',
			stream: true
		},
		onChange: (updates) => console.log('Ollama config changed:', updates),
		disabled: true
	}
}

// Interactive story with state management
export const Interactive: Story = {
	render: () => {
		const [ollamaOptions, setOllamaOptions] = useState<OllamaOptions>({
			baseURL: 'http://127.0.0.1:11434',
			model: 'llama3.1',
			stream: true
		})

		const handleChange = (updates: Partial<OllamaOptions>) => {
			setOllamaOptions((prev) => ({ ...prev, ...updates }))
		}

		return (
			<div style={{ maxWidth: '800px' }}>
				<OllamaConfigPanel options={ollamaOptions} onChange={handleChange} />
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
					<pre>{JSON.stringify(ollamaOptions, null, 2)}</pre>
				</div>
			</div>
		)
	}
}

// Model presets story
export const ModelPresets: Story = {
	render: () => {
		const [selectedPreset, setSelectedPreset] = useState('general')

		const presets = {
			general: {
				name: 'General Purpose',
				description: 'Balanced configuration for general chat',
				config: {
					model: 'llama3.1:8b',
					temperature: 0.7,
					topP: 0.9,
					numCtx: 4096
				} as OllamaOptions
			},
			creative: {
				name: 'Creative Writing',
				description: 'Higher temperature for creative responses',
				config: {
					model: 'llama3.1:8b',
					temperature: 1.2,
					topP: 0.95,
					topK: 50,
					numCtx: 4096
				} as OllamaOptions
			},
			analytical: {
				name: 'Analytical',
				description: 'Lower temperature for focused, analytical responses',
				config: {
					model: 'codellama:7b',
					temperature: 0.3,
					topP: 0.8,
					repeatPenalty: 1.1,
					numCtx: 8192
				} as OllamaOptions
			},
			technical: {
				name: 'Technical/Coding',
				description: 'Optimized for code generation and technical tasks',
				config: {
					model: 'codellama:7b',
					temperature: 0.1,
					topP: 0.95,
					topK: 20,
					repeatPenalty: 1.15,
					numCtx: 8192
				} as OllamaOptions
			}
		}

		const currentConfig = presets[selectedPreset as keyof typeof presets].config

		return (
			<div style={{ maxWidth: '700px' }}>
				<div style={{ marginBottom: '24px' }}>
					<h3>Select Model Preset:</h3>
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

				<OllamaConfigPanel options={currentConfig} onChange={(updates) => console.log('Config changed:', updates)} />

				<div
					style={{
						marginTop: '24px',
						padding: '16px',
						backgroundColor: '#e9ecef',
						borderRadius: '4px'
					}}
				>
					<h4>Preset Configuration Details:</h4>
					<ul>
						<li>
							<strong>Model:</strong> {currentConfig.model}
						</li>
						<li>
							<strong>Temperature:</strong> {currentConfig.temperature}
						</li>
						<li>
							<strong>Top P:</strong> {currentConfig.topP}
						</li>
						<li>
							<strong>Context Size:</strong> {currentConfig.numCtx}
						</li>
						{currentConfig.topK && (
							<li>
								<strong>Top K:</strong> {currentConfig.topK}
							</li>
						)}
						{currentConfig.repeatPenalty && (
							<li>
								<strong>Repeat Penalty:</strong> {currentConfig.repeatPenalty}
							</li>
						)}
					</ul>
				</div>
			</div>
		)
	}
}

// Performance comparison story
export const PerformanceComparison: Story = {
	render: () => {
		const configs = [
			{
				title: 'Low Memory Usage',
				description: 'Conservative settings for resource-constrained environments',
				config: {
					model: 'llama3.2:1b',
					keepAlive: '5m',
					numCtx: 1024,
					numPredict: 64,
					temperature: 0.7
				} as OllamaOptions
			},
			{
				title: 'Balanced Performance',
				description: 'Good balance of speed and quality',
				config: {
					model: 'llama3.1:8b',
					keepAlive: '10m',
					numCtx: 4096,
					numPredict: 256,
					temperature: 0.7,
					topP: 0.9
				} as OllamaOptions
			},
			{
				title: 'High Quality',
				description: 'Maximum quality settings for best results',
				config: {
					model: 'llama3.1:70b',
					keepAlive: '30m',
					numCtx: 8192,
					numPredict: 512,
					temperature: 0.5,
					topP: 0.95,
					repeatPenalty: 1.1
				} as OllamaOptions
			}
		]

		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
				<h3>Performance Configuration Comparison</h3>
				{configs.map((config, index) => (
					<div
						key={index}
						style={{
							padding: '16px',
							border: '1px solid #e0e0e0',
							borderRadius: '8px',
							backgroundColor: '#fafafa'
						}}
					>
						<h4 style={{ marginTop: 0, marginBottom: '8px' }}>{config.title}</h4>
						<p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>{config.description}</p>
						<OllamaConfigPanel
							options={config.config}
							onChange={(updates) => console.log(`${config.title} changed:`, updates)}
						/>
					</div>
				))}
			</div>
		)
	}
}

// Advanced parameters showcase
export const AdvancedParametersShowcase: Story = {
	render: () => {
		const [showAdvanced, setShowAdvanced] = useState(false)

		const basicConfig: OllamaOptions = {
			baseURL: 'http://127.0.0.1:11434',
			model: 'llama3.1',
			temperature: 0.7,
			topP: 0.9
		}

		const advancedConfig: OllamaOptions = {
			...basicConfig,
			keepAlive: '15m',
			stream: true,
			numCtx: 4096,
			numPredict: 256,
			topK: 40,
			repeatPenalty: 1.1,
			stop: ['User:', 'Human:'],
			tfsZ: 1.2,
			mirostat: 1,
			mirostatTau: 5.0,
			mirostatEta: 0.1
		}

		return (
			<div style={{ maxWidth: '700px' }}>
				<div style={{ marginBottom: '24px' }}>
					<h3>Basic vs Advanced Configuration</h3>
					<button
						onClick={() => setShowAdvanced(!showAdvanced)}
						style={{
							padding: '8px 16px',
							backgroundColor: showAdvanced ? '#007bff' : '#f8f9fa',
							color: showAdvanced ? 'white' : 'black',
							border: '1px solid #dee2e6',
							borderRadius: '4px',
							cursor: 'pointer'
						}}
					>
						{showAdvanced ? 'Show Basic' : 'Show Advanced'}
					</button>
					<p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
						{showAdvanced
							? 'Showing advanced parameters including Mirostat sampling, TFS Z, and custom stop sequences.'
							: 'Showing basic configuration with essential parameters only.'}
					</p>
				</div>

				<OllamaConfigPanel
					options={showAdvanced ? advancedConfig : basicConfig}
					onChange={(updates) => console.log('Config changed:', updates)}
				/>

				<div
					style={{
						marginTop: '24px',
						padding: '16px',
						backgroundColor: '#e9ecef',
						borderRadius: '4px'
					}}
				>
					<h4>{showAdvanced ? 'Advanced' : 'Basic'} Parameters:</h4>
					<ul>
						{Object.entries(showAdvanced ? advancedConfig : basicConfig).map(([key, value]) => (
							<li key={key}>
								<strong>{key}:</strong> {Array.isArray(value) ? value.join(', ') : value?.toString()}
							</li>
						))}
					</ul>
				</div>
			</div>
		)
	}
}

// Minimal configuration
export const MinimalConfig: Story = {
	args: {
		options: {
			model: 'llama3.1'
		},
		onChange: (updates) => console.log('Ollama config changed:', updates)
	}
}
