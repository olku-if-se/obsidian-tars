import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { MCPServerCard } from './MCPServerCard'
import type { MCPServerConfig } from '../MCPServersSection/MCPServersSection'

const meta: Meta<typeof MCPServerCard> = {
	title: 'Components/MCPServerCard',
	component: MCPServerCard,
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component: `
# MCPServerCard Component

A MCP server configuration card that displays 5 vertical SettingRow components matching the original Obsidian settings UI.

## Structure

The component consists of exactly 5 SettingRow components stacked vertically:

1. **Row 1 - Controls**: Enable/Disable toggle, Test button, Delete button
2. **Row 2 - Server Name**: Editable input field for server display name
3. **Row 3 - Configuration**: Title and description only (configuration entered below)
4. **Row 4 - Configuration Format**: Button to cycle through URL, command, and JSON formats
5. **Row 5 - Status**: Multiple labels showing error messages, shell commands, or parsing status

## Features

- **Exact UI Parity**: Matches the original MCPServerSettings.ts layout exactly
- **Format Cycling**: Click format button to toggle between URL, shell command, and JSON representations
- **Status Management**: Shows validation errors, connection status, and parsing information
- **Responsive Design**: Adapts to mobile and desktop layouts
- **Loading States**: Visual feedback during connection testing
- **Accessibility**: Proper focus management and keyboard navigation

## Architecture

Follows the atomic design principles as a **Component** that composes multiple **Atoms**:
- \`SettingRow\` for each of the 5 rows
- \`Toggle\` for enable/disable functionality
- \`Button\` for actions (test, delete, format toggle)
- \`Input\` for server name editing
- Custom status displays for validation and connection feedback
				`
			}
		}
	},
	tags: ['autodocs'],
	argTypes: {
		server: {
			description: 'The MCP server configuration object',
			control: 'object'
		},
		isSelected: {
			description: 'Whether this server card is currently selected',
			control: 'boolean'
		},
		testLoading: {
			description: 'Whether a connection test is currently in progress',
			control: 'boolean'
		},
		statusMessage: {
			description: 'Custom status message to display',
			control: 'text'
		},
		formatType: {
			description: 'Current configuration format type',
			control: 'select',
			options: ['url', 'shell', 'json']
		},
		validationError: {
			description: 'Validation error message to display',
			control: 'text'
		},
		onToggle: {
			description: 'Callback when server enable/disable toggle is changed',
			action: 'toggled'
		},
		onUpdate: {
			description: 'Callback when server configuration is updated',
			action: 'updated'
		},
		onTest: {
			description: 'Callback when connection test is requested',
			action: 'tested'
		},
		onRemove: {
			description: 'Callback when server removal is requested',
			action: 'removed'
		},
		onToggleFormat: {
			description: 'Callback when format toggle is clicked',
			action: 'formatToggled'
		}
	}
}

export default meta
type Story = StoryObj<typeof meta>

// Sample server configurations for stories
const sampleManagedServer: MCPServerConfig = {
	id: 'filesystem-server',
	name: 'Filesystem Server',
	enabled: true,
	configInput: 'npx @modelcontextprotocol/server-filesystem /Users/documents',
	displayMode: 'command',
	validationState: {
		isValid: true,
		errors: [],
		warnings: []
	},
	failureCount: 0,
	autoDisabled: false,
	deploymentType: 'managed',
	transport: 'stdio',
	dockerConfig: {
		image: 'mcp/filesystem:latest',
		name: 'filesystem-mcp',
		env: {
			ALLOWED_PATHS: '/Users/documents'
		}
	},
	retryPolicy: {
		maxRetries: 3,
		backoffMs: 1000
	},
	timeout: 30
}

const sampleExternalServer: MCPServerConfig = {
	id: 'exa-search',
	name: 'Exa Search',
	enabled: false,
	configInput: 'https://api.exa.ai/mcp',
	displayMode: 'url',
	validationState: {
		isValid: true,
		errors: [],
		warnings: ['This external server requires API key configuration']
	},
	failureCount: 2,
	autoDisabled: false,
	deploymentType: 'external',
	transport: 'sse',
	sseConfig: {
		url: 'https://api.exa.ai/mcp'
	},
	retryPolicy: {
		maxRetries: 5,
		backoffMs: 2000
	},
	timeout: 45
}

const sampleDisabledServer: MCPServerConfig = {
	id: 'custom-server',
	name: 'Custom Server',
	enabled: false,
	configInput: '{"mcpServers": {"custom": {"command": "invalid-command", "args": []}}}',
	displayMode: 'json',
	validationState: {
		isValid: false,
		errors: ['Invalid JSON configuration', 'Command not found: invalid-command'],
		warnings: ['This server configuration may not work properly']
	},
	failureCount: 5,
	autoDisabled: true,
	deploymentType: 'managed',
	transport: 'stdio',
	dockerConfig: {
		image: 'custom/mcp:1.0.0'
	}
}

// Basic story with a managed server
export const ManagedServer: Story = {
	args: {
		server: sampleManagedServer,
		isSelected: false,
		testLoading: false,
		formatType: 'shell',
		onToggle: fn(),
		onUpdate: fn(),
		onTest: fn(),
		onRemove: fn(),
		onToggleFormat: fn()
	}
}

// Story showing shell command format
export const ShellFormat: Story = {
	args: {
		server: sampleManagedServer,
		isSelected: false,
		testLoading: false,
		formatType: 'shell',
		statusMessage: 'Ready',
		onToggle: fn(),
		onUpdate: fn(),
		onTest: fn(),
		onRemove: fn(),
		onToggleFormat: fn()
	},
	parameters: {
		docs: {
			description: {
				story: `
Shows the server card in shell command format:

- **Row 1**: Controls with toggle, test, and delete buttons
- **Row 2**: Editable server name input
- **Row 3**: Configuration title and description
- **Row 4**: Format toggle button showing next format ("Show as URL")
- **Row 5**: Status showing "Ready" and current shell command
				`
			}
		}
	}
}

// Story showing URL format
export const UrlFormat: Story = {
	args: {
		server: sampleExternalServer,
		isSelected: false,
		testLoading: false,
		formatType: 'url',
		statusMessage: 'Connected successfully',
		onToggle: fn(),
		onUpdate: fn(),
		onTest: fn(),
		onRemove: fn(),
		onToggleFormat: fn()
	},
	parameters: {
		docs: {
			description: {
				story: `
Shows the server card in URL format:

- **Row 1**: Controls with toggle, test, and delete buttons
- **Row 2**: Editable server name input
- **Row 3**: Configuration title and description
- **Row 4**: Format toggle button showing next format ("Show as JSON")
- **Row 5**: Status showing connection success and current URL
				`
			}
		}
	}
}

// Story showing JSON format
export const JsonFormat: Story = {
	args: {
		server: sampleDisabledServer,
		isSelected: false,
		testLoading: false,
		formatType: 'json',
		validationError: 'Invalid JSON configuration',
		onToggle: fn(),
		onUpdate: fn(),
		onTest: fn(),
		onRemove: fn(),
		onToggleFormat: fn()
	},
	parameters: {
		docs: {
			description: {
				story: `
Shows the server card in JSON format with validation error:

- **Row 1**: Controls with toggle, test, and delete buttons
- **Row 2**: Editable server name input
- **Row 3**: Configuration title and description
- **Row 4**: Format toggle button showing next format ("Show as URL")
- **Row 5**: Status showing validation error in red and current format type
				`
			}
		}
	}
}

// Story showing loading state during connection test
export const TestingConnection: Story = {
	args: {
		server: sampleManagedServer,
		isSelected: false,
		testLoading: true,
		formatType: 'shell',
		statusMessage: 'Testing connection...',
		onToggle: fn(),
		onUpdate: fn(),
		onTest: fn(),
		onRemove: fn(),
		onToggleFormat: fn()
	}
}

// Story showing disabled server
export const DisabledServer: Story = {
	args: {
		server: sampleDisabledServer,
		isSelected: false,
		testLoading: false,
		formatType: 'shell',
		statusMessage: 'Server disabled',
		onToggle: fn(),
		onUpdate: fn(),
		onTest: fn(),
		onRemove: fn(),
		onToggleFormat: fn()
	}
}

// Interactive story for testing user interactions
export const Interactive: Story = {
	args: {
		server: sampleManagedServer,
		isSelected: false,
		testLoading: false,
		formatType: 'shell',
		onToggle: fn(),
		onUpdate: fn(),
		onTest: fn(),
		onRemove: fn(),
		onToggleFormat: fn()
	},
	parameters: {
		docs: {
			description: {
				story: `
Interactive story that demonstrates all user interactions:

- **Toggle Enable/Disable**: Click the toggle switch to enable or disable the server
- **Test Connection**: Click the "Test" button to simulate a connection test
- **Remove Server**: Click the "Delete" button to trigger server removal
- **Edit Server Name**: Modify the server name input field
- **Toggle Format**: Click "Show as URL/Command/JSON" to cycle between formats
- **Select Card**: The card can be selected/deselected programmatically

All interactions are logged in the Actions panel at the bottom of the Storybook interface.
				`
			}
		}
	}
}

// Multiple servers story for layout testing
export const MultipleServers: Story = {
	render: () => (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			<MCPServerCard
				server={sampleManagedServer}
				isSelected={true}
				testLoading={false}
				formatType="shell"
				statusMessage="Ready"
				onToggle={fn()}
				onUpdate={fn()}
				onTest={fn()}
				onRemove={fn()}
				onToggleFormat={fn()}
			/>
			<MCPServerCard
				server={sampleExternalServer}
				isSelected={false}
				testLoading={false}
				formatType="url"
				statusMessage="Connected successfully"
				onToggle={fn()}
				onUpdate={fn()}
				onTest={fn()}
				onRemove={fn()}
				onToggleFormat={fn()}
			/>
			<MCPServerCard
				server={sampleDisabledServer}
				isSelected={false}
				testLoading={true}
				formatType="json"
				validationError="Invalid JSON configuration"
				onToggle={fn()}
				onUpdate={fn()}
				onTest={fn()}
				onRemove={fn()}
				onToggleFormat={fn()}
			/>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: `
Demonstrates how multiple MCPServerCard components look when used together, showing:
- Different server types (managed vs external)
- Various states (enabled, disabled, selected, loading)
- Different format types (shell, url, json)
- Different status messages and validation errors
- Proper vertical SettingRow layout
- Consistent spacing and visual hierarchy
				`
			}
		}
	}
}