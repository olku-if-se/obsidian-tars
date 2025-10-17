import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { ModelSelector, type ConnectionResult } from './ModelSelector'

const meta = {
	title: 'Components/ModelSelector',
	component: ModelSelector,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs']
} satisfies Meta<typeof ModelSelector>

export default meta
type Story = StoryObj<typeof meta>

// Mock connection test functions
const mockSuccessTest = async (): Promise<ConnectionResult> => {
	await new Promise((resolve) => setTimeout(resolve, 1500))
	return {
		success: true,
		message: 'Connection successful',
		latency: 245,
		models: ['gpt-4', 'gpt-3.5-turbo', 'text-davinci-003']
	}
}

const mockFailureTest = async (): Promise<ConnectionResult> => {
	await new Promise((resolve) => setTimeout(resolve, 1000))
	return {
		success: false,
		message: 'Authentication failed: Invalid API key',
		latency: 892
	}
}

// Default OpenAI selector
export const Default: Story = {
	args: {
		vendor: 'OpenAI',
		selectedModel: 'gpt-4',
		onModelChange: (model) => console.log('Model changed:', model)
	}
}

// With API key
export const WithApiKey: Story = {
	args: {
		vendor: 'OpenAI',
		apiKey: 'sk-test-key-123456789',
		selectedModel: 'gpt-4',
		onModelChange: (model) => console.log('Model changed:', model)
	}
}

// Claude selector
export const ClaudeSelector: Story = {
	args: {
		vendor: 'Claude',
		selectedModel: 'claude-3-5-sonnet-20241022',
		onModelChange: (model) => console.log('Model changed:', model)
	}
}

// Ollama selector (static models)
export const OllamaSelector: Story = {
	args: {
		vendor: 'Ollama',
		selectedModel: 'llama3.2:3b',
		onModelChange: (model) => console.log('Model changed:', model)
	}
}

// Azure selector
export const AzureSelector: Story = {
	args: {
		vendor: 'Azure',
		selectedModel: 'gpt-4o',
		onModelChange: (model) => console.log('Model changed:', model)
	}
}

// Dynamic model fetching vendor (SiliconFlow)
export const SiliconFlowSelector: Story = {
	args: {
		vendor: 'SiliconFlow',
		apiKey: 'test-api-key',
		selectedModel: 'deepseek-chat',
		onModelChange: (model) => console.log('Model changed:', model)
	}
}

// Vendor without API key
export const WithoutApiKey: Story = {
	args: {
		vendor: 'SiliconFlow',
		selectedModel: 'gpt-4',
		onModelChange: (model) => console.log('Model changed:', model)
	}
}

// With connection test
export const WithConnectionTest: Story = {
	args: {
		vendor: 'OpenAI',
		apiKey: 'sk-test-key',
		selectedModel: 'gpt-4',
		onModelChange: (model) => console.log('Model changed:', model),
		onTestConnection: mockSuccessTest
	}
}

// With failed connection test
export const WithFailedConnectionTest: Story = {
	args: {
		vendor: 'OpenAI',
		apiKey: 'invalid-key',
		selectedModel: 'gpt-4',
		onModelChange: (model) => console.log('Model changed:', model),
		onTestConnection: mockFailureTest
	}
}

// Disabled state
export const Disabled: Story = {
	args: {
		vendor: 'OpenAI',
		selectedModel: 'gpt-4',
		onModelChange: (model) => console.log('Model changed:', model),
		disabled: true
	}
}

// Custom placeholder
export const CustomPlaceholder: Story = {
	args: {
		vendor: 'OpenAI',
		selectedModel: '',
		placeholder: 'Choose your AI model...',
		onModelChange: (model) => console.log('Model changed:', model)
	}
}

// Interactive demo with multiple vendors
export const InteractiveDemo: Story = {
	render: () => {
		const [selectedVendor, setSelectedVendor] = useState('OpenAI')
		const [apiKey, setApiKey] = useState('sk-test-key-123456789')
		const [selectedModel, setSelectedModel] = useState('gpt-4')

		const vendors = [
			{ name: 'OpenAI', supportsDynamic: false, requiresKey: true },
			{ name: 'Claude', supportsDynamic: false, requiresKey: true },
			{ name: 'Ollama', supportsDynamic: false, requiresKey: false },
			{ name: 'Azure', supportsDynamic: false, requiresKey: true },
			{ name: 'SiliconFlow', supportsDynamic: true, requiresKey: true },
			{ name: 'OpenRouter', supportsDynamic: true, requiresKey: false },
			{ name: 'Kimi', supportsDynamic: true, requiresKey: true },
			{ name: 'Grok', supportsDynamic: true, requiresKey: true }
		]

		const currentVendor = vendors.find((v) => v.name === selectedVendor)

		return (
			<div style={{ maxWidth: '700px' }}>
				<div style={{ marginBottom: '24px' }}>
					<h3>Select Vendor:</h3>
					<select
						value={selectedVendor}
						onChange={(e) => {
							setSelectedVendor(e.target.value)
							setSelectedModel('') // Reset model when vendor changes
						}}
						style={{
							padding: '8px 12px',
							fontSize: '14px',
							border: '1px solid #ddd',
							borderRadius: '4px',
							minWidth: '200px'
						}}
					>
						{vendors.map((vendor) => (
							<option key={vendor.name} value={vendor.name}>
								{vendor.name} {vendor.supportsDynamic ? '(Dynamic)' : '(Static)'}{' '}
								{vendor.requiresKey ? '(API Key)' : ''}
							</option>
						))}
					</select>

					{currentVendor?.requiresKey && (
						<div style={{ marginTop: '12px' }}>
							<label htmlFor='api-key'>
								<strong>API Key:</strong>
							</label>
							<br />
							<input
								id='api-key'
								type='password'
								value={apiKey}
								onChange={(e) => setApiKey(e.target.value)}
								placeholder='Enter API key'
								style={{
									marginTop: '8px',
									padding: '8px 12px',
									fontSize: '14px',
									border: '1px solid #ddd',
									borderRadius: '4px',
									width: '300px'
								}}
							/>
						</div>
					)}
				</div>

				<ModelSelector
					vendor={selectedVendor}
					apiKey={currentVendor?.requiresKey ? apiKey : undefined}
					selectedModel={selectedModel}
					onModelChange={setSelectedModel}
					onTestConnection={currentVendor?.requiresKey ? mockSuccessTest : undefined}
					placeholder='Select a model'
				/>

				<div
					style={{
						marginTop: '24px',
						padding: '16px',
						backgroundColor: '#f5f5f5',
						borderRadius: '4px'
					}}
				>
					<h4>Selected Configuration:</h4>
					<ul>
						<li>
							<strong>Vendor:</strong> {selectedVendor}
						</li>
						<li>
							<strong>Model:</strong> {selectedModel || 'None selected'}
						</li>
						<li>
							<strong>Dynamic Fetching:</strong> {currentVendor?.supportsDynamic ? 'Yes' : 'No'}
						</li>
						<li>
							<strong>API Key Required:</strong> {currentVendor?.requiresKey ? 'Yes' : 'No'}
						</li>
						<li>
							<strong>API Key Provided:</strong> {currentVendor?.requiresKey ? (apiKey ? 'Yes' : 'No') : 'N/A'}
						</li>
					</ul>
				</div>
			</div>
		)
	}
}

// Custom model input demo
export const CustomModelDemo: Story = {
	render: () => {
		const [selectedModel, setSelectedModel] = useState('custom-llm-v2')
		const [isCustom, setIsCustom] = useState(true)

		return (
			<div style={{ maxWidth: '600px' }}>
				<h3>Custom Model Input</h3>
				<p>
					This demo shows how the ModelSelector handles custom model names. Try selecting from the dropdown or entering
					a custom model name.
				</p>

				<ModelSelector
					vendor='OpenAI'
					apiKey='sk-test-key'
					selectedModel={selectedModel}
					onModelChange={(model) => {
						setSelectedModel(model)
						setIsCustom(model === 'custom-llm-v2')
					}}
					onTestConnection={mockSuccessTest}
				/>

				<div
					style={{
						marginTop: '24px',
						padding: '16px',
						backgroundColor: '#e9ecef',
						borderRadius: '4px'
					}}
				>
					<h4>Model Selection:</h4>
					<p>
						<strong>Current Model:</strong> {selectedModel}
					</p>
					<p>
						<strong>Is Custom:</strong> {isCustom ? 'Yes' : 'No'}
					</p>
					<p>
						<strong>Status:</strong> {isCustom ? 'Using custom model name' : 'Using predefined model'}
					</p>
				</div>
			</div>
		)
	}
}

// Error states demo
export const ErrorStatesDemo: Story = {
	render: () => {
		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '700px' }}>
				<h3>Error States Demo</h3>

				<div
					style={{
						padding: '16px',
						border: '1px solid #e0e0e0',
						borderRadius: '8px',
						backgroundColor: '#fafafa'
					}}
				>
					<h4>No API Key Provided</h4>
					<ModelSelector
						vendor='SiliconFlow'
						selectedModel='gpt-4'
						onModelChange={(model) => console.log('Model changed:', model)}
					/>
				</div>

				<div
					style={{
						padding: '16px',
						border: '1px solid #e0e0e0',
						borderRadius: '8px',
						backgroundColor: '#fafafa'
					}}
				>
					<h4>Network Error Simulation</h4>
					<ModelSelector
						vendor='SiliconFlow'
						apiKey='test-key'
						selectedModel='gpt-4'
						onModelChange={(model) => console.log('Model changed:', model)}
					/>
					<p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
						Note: This simulates a network error when trying to fetch models.
					</p>
				</div>

				<div
					style={{
						padding: '16px',
						border: '1px solid #e0e0e0',
						borderRadius: '8px',
						backgroundColor: '#fafafa'
					}}
				>
					<h4>Failed Connection Test</h4>
					<ModelSelector
						vendor='OpenAI'
						apiKey='invalid-key'
						selectedModel='gpt-4'
						onModelChange={(model) => console.log('Model changed:', model)}
						onTestConnection={mockFailureTest}
					/>
					<p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
						Click the 🔗 button to test the failed connection.
					</p>
				</div>
			</div>
		)
	}
}

// Different use cases
export const UseCases: Story = {
	render: () => {
		const useCases = [
			{
				title: 'Production Setup',
				description: 'Configured for production use with API key and connection testing',
				props: {
					vendor: 'OpenAI',
					apiKey: 'sk-prod-key-xyz',
					selectedModel: 'gpt-4o',
					onTestConnection: mockSuccessTest
				}
			},
			{
				title: 'Development Setup',
				description: 'Basic development configuration without API key',
				props: {
					vendor: 'Ollama',
					selectedModel: 'llama3.2:3b'
				}
			},
			{
				title: 'Alternative Vendor',
				description: 'Using alternative vendor with dynamic model fetching',
				props: {
					vendor: 'OpenRouter',
					selectedModel: 'anthropic/claude-3.5-sonnet'
				}
			}
		]

		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
				<h3>Model Selector Use Cases</h3>
				{useCases.map((useCase, index) => (
					<div
						key={index}
						style={{
							padding: '16px',
							border: '1px solid #e0e0e0',
							borderRadius: '8px',
							backgroundColor: '#fafafa'
						}}
					>
						<h4 style={{ marginTop: 0, marginBottom: '8px' }}>{useCase.title}</h4>
						<p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>{useCase.description}</p>
						<ModelSelector
							{...useCase.props}
							onModelChange={(model) => console.log(`${useCase.title} model changed:`, model)}
							onTestConnection={useCase.props.onTestConnection || undefined}
						/>
					</div>
				))}
			</div>
		)
	}
}
