import type { Meta, StoryObj } from '@storybook/react'
import { ConnectionTestButton } from './ConnectionTestButton'
import type { ConnectionResult } from '../ModelSelector/ModelSelector'

const meta = {
	title: 'Components/ConnectionTestButton',
	component: ConnectionTestButton,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof ConnectionTestButton>

export default meta
type Story = StoryObj<typeof meta>

// Mock successful connection test
const mockSuccessTest = async (): Promise<ConnectionResult> => {
	await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate network delay
	return {
		success: true,
		message: 'Connection successful',
		latency: 245,
		models: ['gpt-4', 'gpt-3.5-turbo', 'text-davinci-003'],
	}
}

// Mock failed connection test
const mockFailureTest = async (): Promise<ConnectionResult> => {
	await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate network delay
	return {
		success: false,
		message: 'Authentication failed: Invalid API key',
		latency: 892,
	}
}

// Mock timeout test
const mockTimeoutTest = async (): Promise<ConnectionResult> => {
	await new Promise((resolve) => setTimeout(resolve, 5000)) // Long delay
	return {
		success: false,
		message: 'Connection timeout',
	}
}

// Mock network error test
const mockNetworkErrorTest = async (): Promise<ConnectionResult> => {
	await new Promise((resolve) => setTimeout(resolve, 800))
	throw new Error('Network error: Unable to reach server')
}

// Default button
export const Default: Story = {
	args: {
		onTest: mockSuccessTest,
	},
}

// Successful connection
export const Success: Story = {
	args: {
		onTest: mockSuccessTest,
	},
}

// Failed connection
export const Failure: Story = {
	args: {
		onTest: mockFailureTest,
	},
}

// Disabled state
export const Disabled: Story = {
	args: {
		onTest: mockSuccessTest,
		disabled: true,
	},
}

// Different sizes
export const Small: Story = {
	args: {
		onTest: mockSuccessTest,
		size: 'sm',
	},
}

export const Medium: Story = {
	args: {
		onTest: mockSuccessTest,
		size: 'md',
	},
}

export const Large: Story = {
	args: {
		onTest: mockSuccessTest,
		size: 'lg',
	},
}

// Different variants
export const Primary: Story = {
	args: {
		onTest: mockSuccessTest,
		variant: 'primary',
	},
}

export const Secondary: Story = {
	args: {
		onTest: mockSuccessTest,
		variant: 'secondary',
	},
}

export const DefaultVariant: Story = {
	args: {
		onTest: mockSuccessTest,
		variant: 'default',
	},
}

// Timeout scenario
export const Timeout: Story = {
	args: {
		onTest: mockTimeoutTest,
	},
}

// Network error scenario
export const NetworkError: Story = {
	args: {
		onTest: mockNetworkErrorTest,
	},
}

// Interactive demo with different test scenarios
export const InteractiveDemo: Story = {
	render: () => {
		const scenarios = {
			success: {
				name: 'Successful Connection',
				test: mockSuccessTest,
				description: 'Simulates a successful API connection with latency and model info',
			},
			failure: {
				name: 'Authentication Failed',
				test: mockFailureTest,
				description: 'Simulates a failed connection due to invalid credentials',
			},
			timeout: {
				name: 'Connection Timeout',
				test: mockTimeoutTest,
				description: 'Simulates a connection timeout (5 seconds)',
			},
			network: {
				name: 'Network Error',
				test: mockNetworkErrorTest,
				description: 'Simulates a network connectivity issue',
			},
		}

		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
				<div>
					<h2>Connection Test Button Scenarios</h2>
					<p>
						Click the test buttons to see different connection scenarios in action.
						Success messages auto-hide after 3 seconds, while errors persist.
					</p>
				</div>

				{Object.entries(scenarios).map(([key, scenario]) => (
					<div
						key={key}
						style={{
							padding: '16px',
							border: '1px solid #e0e0e0',
							borderRadius: '8px',
							backgroundColor: '#fafafa',
						}}
					>
						<h3 style={{ marginTop: 0, marginBottom: '8px' }}>
							{scenario.name}
						</h3>
						<p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '14px' }}>
							{scenario.description}
						</p>
						<ConnectionTestButton
							onTest={scenario.test}
							variant="default"
							size="md"
						/>
					</div>
				))}

				<div
					style={{
						padding: '16px',
						border: '1px solid #e0e0e0',
						borderRadius: '8px',
						backgroundColor: '#f5f5f5',
					}}
				>
					<h3 style={{ marginTop: 0, marginBottom: '8px' }}>
						Disabled State
					</h3>
					<p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '14px' }}>
						Button is disabled and cannot be clicked
					</p>
					<ConnectionTestButton
						onTest={mockSuccessTest}
						disabled={true}
						variant="default"
						size="md"
					/>
				</div>
			</div>
		)
	},
}

// Custom styling example
export const CustomStyled: Story = {
	args: {
		onTest: mockSuccessTest,
		variant: 'primary',
		size: 'lg',
		className: 'custom-connection-test',
	},
	parameters: {
		docs: {
			description: {
				story: 'Example with custom className that can be used for additional styling',
			},
		},
	},
}

// Rapid fire testing (multiple buttons)
export const RapidFire: Story = {
	render: () => {
		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
				<h3>Multiple Test Buttons</h3>
				<div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
					<ConnectionTestButton
						onTest={mockSuccessTest}
						size="sm"
						variant="primary"
					/>
					<ConnectionTestButton
						onTest={mockFailureTest}
						size="sm"
						variant="secondary"
					/>
					<ConnectionTestButton
						onTest={mockTimeoutTest}
						size="sm"
						variant="default"
					/>
					<ConnectionTestButton
						onTest={mockNetworkErrorTest}
						size="sm"
						variant="primary"
					/>
				</div>
				<p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
					Test multiple connections simultaneously to see how the component handles concurrent requests.
				</p>
			</div>
		)
	},
}