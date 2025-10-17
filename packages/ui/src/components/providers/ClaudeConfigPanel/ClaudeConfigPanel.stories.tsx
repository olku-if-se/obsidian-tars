import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { ClaudeConfigPanel, type ClaudeOptions } from './ClaudeConfigPanel'

const meta = {
	title: 'Providers/ClaudeConfigPanel',
	component: ClaudeConfigPanel,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs']
} satisfies Meta<typeof ClaudeConfigPanel>

export default meta
type Story = StoryObj<typeof meta>

// Default state with empty configuration
export const Default: Story = {
	args: {
		options: {},
		onChange: (updates) => console.log('Claude config changed:', updates)
	}
}

// With thinking mode enabled
export const WithThinkingEnabled: Story = {
	args: {
		options: {
			enableThinking: true,
			budget_tokens: 1600,
			max_tokens: 4096
		},
		onChange: (updates) => console.log('Claude config changed:', updates)
	}
}

// With default values
export const WithDefaults: Story = {
	args: {
		options: {
			enableThinking: false,
			budget_tokens: 1600,
			max_tokens: 4096
		},
		onChange: (updates) => console.log('Claude config changed:', updates)
	}
}

// With high token limits
export const HighTokenLimits: Story = {
	args: {
		options: {
			enableThinking: true,
			budget_tokens: 5000,
			max_tokens: 8192
		},
		onChange: (updates) => console.log('Claude config changed:', updates)
	}
}

// With low token limits (showing validation)
export const LowTokenLimits: Story = {
	args: {
		options: {
			enableThinking: true,
			budget_tokens: 500, // Below minimum 1024
			max_tokens: 100 // Below minimum 256
		},
		onChange: (updates) => console.log('Claude config changed:', updates)
	}
}

// Disabled state
export const Disabled: Story = {
	args: {
		options: {
			enableThinking: true,
			budget_tokens: 1600,
			max_tokens: 4096
		},
		onChange: (updates) => console.log('Claude config changed:', updates),
		disabled: true
	}
}

// Interactive story with state management
export const Interactive: Story = {
	render: () => {
		const [claudeOptions, setClaudeOptions] = useState<ClaudeOptions>({
			enableThinking: false,
			budget_tokens: 1600,
			max_tokens: 4096
		})

		const handleChange = (updates: Partial<ClaudeOptions>) => {
			setClaudeOptions((prev) => ({ ...prev, ...updates }))
		}

		return (
			<div style={{ maxWidth: '600px' }}>
				<ClaudeConfigPanel options={claudeOptions} onChange={handleChange} />
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
					<pre>{JSON.stringify(claudeOptions, null, 2)}</pre>
				</div>
			</div>
		)
	}
}

// Story showing different configurations side by side
export const ConfigurationComparison: Story = {
	render: () => {
		const configurations = [
			{
				title: 'Basic Configuration',
				options: {
					enableThinking: false,
					budget_tokens: 1600,
					max_tokens: 4096
				} as ClaudeOptions
			},
			{
				title: 'Thinking Mode Enabled',
				options: {
					enableThinking: true,
					budget_tokens: 2000,
					max_tokens: 6144
				} as ClaudeOptions
			},
			{
				title: 'Power User Configuration',
				options: {
					enableThinking: true,
					budget_tokens: 8000,
					max_tokens: 12800
				} as ClaudeOptions
			}
		]

		return (
			<div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
				{configurations.map((config, index) => (
					<div
						key={index}
						style={{
							flex: '1',
							minWidth: '300px',
							border: '1px solid #e0e0e0',
							borderRadius: '8px',
							padding: '16px'
						}}
					>
						<h3 style={{ marginTop: 0, marginBottom: '16px' }}>{config.title}</h3>
						<ClaudeConfigPanel
							options={config.options}
							onChange={(updates) => console.log(`${config.title} changed:`, updates)}
						/>
					</div>
				))}
			</div>
		)
	}
}

// Empty configuration (only default values will be shown)
export const EmptyConfig: Story = {
	args: {
		options: {},
		onChange: (updates) => console.log('Claude config changed:', updates)
	}
}

// Only thinking mode configured
export const ThinkingOnly: Story = {
	args: {
		options: {
			enableThinking: true
		},
		onChange: (updates) => console.log('Claude config changed:', updates)
	}
}

// Only token limits configured
export const TokenLimitsOnly: Story = {
	args: {
		options: {
			budget_tokens: 2000,
			max_tokens: 4096
		},
		onChange: (updates) => console.log('Claude config changed:', updates)
	}
}
