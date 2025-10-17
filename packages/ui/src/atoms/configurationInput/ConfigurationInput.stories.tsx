import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { ConfigurationInput } from './ConfigurationInput'

const meta = {
	title: 'Atoms/ConfigurationInput',
	component: ConfigurationInput,
	parameters: {
		layout: 'centered'
	},
	tags: ['autodocs']
} satisfies Meta<typeof ConfigurationInput>

export default meta
type Story = StoryObj<typeof meta>

export const URLFormat: Story = {
	args: {
		value: 'https://api.example.com/mcp',
		format: 'url',
		placeholder: 'https://mcp.example.com?token=value',
		onChange: (value) => console.log('Value changed:', value),
		onFormatChange: (format) => console.log('Format changed:', format)
	}
}

export const CommandFormat: Story = {
	args: {
		value: 'npx @modelcontextprotocol/server-memory',
		format: 'command',
		placeholder: 'npx @modelcontextprotocol/server-memory',
		onChange: (value) => console.log('Value changed:', value),
		onFormatChange: (format) => console.log('Format changed:', format)
	}
}

export const JSONFormat: Story = {
	args: {
		value: JSON.stringify(
			{
				mcpServers: {
					memory: {
						command: 'npx',
						args: ['@modelcontextprotocol/server-memory']
					}
				}
			},
			null,
			2
		),
		format: 'json',
		placeholder: '{"mcpServers": {"server-name": {"command": "...", "args": []}}}',
		onChange: (value) => console.log('Value changed:', value),
		onFormatChange: (format) => console.log('Format changed:', format)
	}
}

export const WithValidationErrors: Story = {
	args: {
		value: 'invalid-url',
		format: 'url',
		onChange: (value) => console.log('Value changed:', value),
		onFormatChange: (format) => console.log('Format changed:', format)
	}
}

export const WithValidationWarnings: Story = {
	args: {
		value: 'http://unsecured-api.example.com',
		format: 'url',
		onChange: (value) => console.log('Value changed:', value),
		onFormatChange: (format) => console.log('Format changed:', format)
	}
}

export const Disabled: Story = {
	args: {
		value: 'https://api.example.com/mcp',
		format: 'url',
		disabled: true,
		onChange: (value) => console.log('Value changed:', value),
		onFormatChange: (format) => console.log('Format changed:', format)
	}
}

export const WithoutFormatToggle: Story = {
	args: {
		value: 'npx @modelcontextprotocol/server-memory',
		format: 'command',
		showFormatToggle: false,
		onChange: (value) => console.log('Value changed:', value),
		onFormatChange: (format) => console.log('Format changed:', format)
	}
}

export const NonResizableJSON: Story = {
	args: {
		value: JSON.stringify(
			{
				mcpServers: {
					filesystem: {
						command: 'npx',
						args: ['@modelcontextprotocol/server-filesystem', '/tmp']
					}
				}
			},
			null,
			2
		),
		format: 'json',
		resizable: false,
		onChange: (value) => console.log('Value changed:', value),
		onFormatChange: (format) => console.log('Format changed:', format)
	}
}

export const Interactive: Story = {
	render: () => {
		const [value, setValue] = useState('https://api.example.com/mcp')
		const [format, setFormat] = useState<'url' | 'command' | 'json'>('url')

		return (
			<div style={{ width: '500px' }}>
				<ConfigurationInput value={value} format={format} onChange={setValue} onFormatChange={setFormat} />
				<div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
					Current value: {value}
					<br />
					Current format: {format}
				</div>
			</div>
		)
	}
}

export const CompleteExample: Story = {
	render: () => {
		const [value, setValue] = useState('')
		const [format, setFormat] = useState<'url' | 'command' | 'json'>('url')

		return (
			<div style={{ width: '600px' }}>
				<h3>MCP Server Configuration</h3>
				<p>Enter your MCP server configuration in URL, command, or JSON format:</p>
				<ConfigurationInput
					value={value}
					format={format}
					onChange={setValue}
					onFormatChange={setFormat}
					autoFocus={true}
				/>
				<div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
					<strong>Formats:</strong>
					<ul>
						<li>
							<strong>URL:</strong> HTTP endpoint for SSE transport
						</li>
						<li>
							<strong>Command:</strong> Shell command for stdio transport
						</li>
						<li>
							<strong>JSON:</strong> Claude Desktop configuration format
						</li>
					</ul>
				</div>
			</div>
		)
	}
}
