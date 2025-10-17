import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { AzureConfigPanel, type AzureOptions } from './AzureConfigPanel'

const meta = {
	title: 'Providers/AzureConfigPanel',
	component: AzureConfigPanel,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs']
} satisfies Meta<typeof AzureConfigPanel>

export default meta
type Story = StoryObj<typeof meta>

// Default state with empty configuration
export const Default: Story = {
	args: {
		options: {},
		onChange: (updates) => console.log('Azure config changed:', updates)
	}
}

// With valid configuration
export const WithValidConfig: Story = {
	args: {
		options: {
			endpoint: 'https://test-resource.openai.azure.com/',
			apiVersion: '2024-02-01-preview'
		},
		onChange: (updates) => console.log('Azure config changed:', updates)
	}
}

// With invalid endpoint (no https)
export const WithInvalidEndpoint: Story = {
	args: {
		options: {
			endpoint: 'http://insecure-endpoint.com',
			apiVersion: '2024-02-01-preview'
		},
		onChange: (updates) => console.log('Azure config changed:', updates)
	}
}

// With invalid API version
export const WithInvalidApiVersion: Story = {
	args: {
		options: {
			endpoint: 'https://test-resource.openai.azure.com/',
			apiVersion: 'invalid-version'
		},
		onChange: (updates) => console.log('Azure config changed:', updates)
	}
}

// Disabled state
export const Disabled: Story = {
	args: {
		options: {
			endpoint: 'https://test-resource.openai.azure.com/',
			apiVersion: '2024-02-01-preview'
		},
		onChange: (updates) => console.log('Azure config changed:', updates),
		disabled: true
	}
}

// Interactive story with state management
export const Interactive: Story = {
	render: () => {
		const [azureOptions, setAzureOptions] = useState<AzureOptions>({
			endpoint: '',
			apiVersion: ''
		})

		const handleChange = (updates: Partial<AzureOptions>) => {
			setAzureOptions((prev) => ({ ...prev, ...updates }))
		}

		return (
			<div style={{ maxWidth: '600px' }}>
				<AzureConfigPanel options={azureOptions} onChange={handleChange} />
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
					<pre>{JSON.stringify(azureOptions, null, 2)}</pre>
				</div>
			</div>
		)
	}
}

// With different API versions
export const DifferentApiVersions: Story = {
	render: () => {
		const [selectedVersion, setSelectedVersion] = useState('2024-02-01-preview')

		const apiVersions = ['2024-02-01-preview', '2023-12-01-preview', '2023-07-01-preview', '2023-05-15']

		return (
			<div style={{ maxWidth: '600px' }}>
				<div style={{ marginBottom: '16px' }}>
					<label htmlFor='api-version-select'>
						<strong>Select API Version:</strong>
					</label>
					<br />
					<select
						id='api-version-select'
						value={selectedVersion}
						onChange={(e) => setSelectedVersion(e.target.value)}
						style={{
							marginTop: '8px',
							padding: '4px 8px',
							fontSize: '14px'
						}}
					>
						{apiVersions.map((version) => (
							<option key={version} value={version}>
								{version}
							</option>
						))}
					</select>
				</div>

				<AzureConfigPanel
					options={{
						endpoint: 'https://test-resource.openai.azure.com/',
						apiVersion: selectedVersion
					}}
					onChange={(updates) => console.log('Config changed:', updates)}
				/>
			</div>
		)
	}
}

// Partial configuration (only endpoint)
export const PartialEndpointConfig: Story = {
	args: {
		options: {
			endpoint: 'https://partial-config.openai.azure.com/'
		},
		onChange: (updates) => console.log('Azure config changed:', updates)
	}
}

// Partial configuration (only API version)
export const PartialApiVersionConfig: Story = {
	args: {
		options: {
			apiVersion: '2024-02-01-preview'
		},
		onChange: (updates) => console.log('Azure config changed:', updates)
	}
}
