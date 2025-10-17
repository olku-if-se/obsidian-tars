import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import type { MCPServerConfig } from '../SectionMcpServers/MCPServersSection'
import type { MCPServerCardProps } from './MCPServerCard'
import { MCPServerCard } from './MCPServerCard'
import storyStyles from './MCPServerCard.stories.module.css'

const meta: Meta<typeof MCPServerCard> = {
	title: 'Settings/MCPServerCard',
	component: MCPServerCard,
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component: [
					'# MCPServerCard',
					'',
					"Displays a collapsible MCP server configuration card composed of four stacked SettingRow components that mirror Obsidian's native settings layout.",
					'',
					'1. **Controls** – enable toggle plus Test and Delete buttons.',
					'2. **Server Name** – editable display name field.',
					'3. **Configuration** – format-aware input with a toggle cycling URL/command/JSON formats.',
					'4. **Status** – derived message, format details, failure counts, and validation feedback.'
				].join('\n')
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
		}
	}
}

export default meta

type Story = StoryObj<typeof meta>

const createValidationState = (
	overrides?: Partial<MCPServerConfig['validationState']>
): MCPServerConfig['validationState'] => ({
	isValid: overrides?.isValid ?? true,
	errors: overrides?.errors ?? [],
	warnings: overrides?.warnings ?? [],
	formatCompatibility: {
		canShowAsUrl: overrides?.formatCompatibility?.canShowAsUrl ?? true,
		canShowAsCommand: overrides?.formatCompatibility?.canShowAsCommand ?? true,
		canShowAsJson: overrides?.formatCompatibility?.canShowAsJson ?? true
	}
})

const managedServerConfig: MCPServerConfig = {
	id: 'filesystem-server',
	name: 'Filesystem Server',
	enabled: true,
	configInput: 'npx @modelcontextprotocol/server-filesystem /Users/documents',
	displayMode: 'command',
	validationState: createValidationState({
		formatCompatibility: {
			canShowAsUrl: false,
			canShowAsCommand: true,
			canShowAsJson: true
		}
	}),
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

const externalServerConfig: MCPServerConfig = {
	id: 'exa-search',
	name: 'Exa Search',
	enabled: true,
	configInput: 'https://api.exa.ai/mcp',
	displayMode: 'url',
	validationState: createValidationState({
		warnings: ['This external server requires API key configuration'],
		formatCompatibility: {
			canShowAsUrl: true,
			canShowAsCommand: false,
			canShowAsJson: true
		}
	}),
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

const invalidJsonServerConfig: MCPServerConfig = {
	id: 'custom-server',
	name: 'Custom Server',
	enabled: true,
	configInput: '{"mcpServers": {"custom": {"command": "invalid-command", "args": []}}}',
	displayMode: 'json',
	validationState: createValidationState({
		isValid: false,
		errors: ['Invalid JSON configuration', 'Command not found: invalid-command'],
		warnings: ['This server configuration may not work properly'],
		formatCompatibility: {
			canShowAsUrl: false,
			canShowAsCommand: false,
			canShowAsJson: true
		}
	}),
	failureCount: 5,
	autoDisabled: false,
	deploymentType: 'managed',
	transport: 'stdio',
	dockerConfig: {
		image: 'custom/mcp:1.0.0'
	},
	retryPolicy: {
		maxRetries: 2,
		backoffMs: 1500
	},
	timeout: 60
}

const autoDisabledServerConfig: MCPServerConfig = {
	id: 'filesystem-auto-disabled',
	name: 'Filesystem Server (Auto Disabled)',
	enabled: false,
	configInput: 'npx @modelcontextprotocol/server-filesystem /Users/documents',
	displayMode: 'command',
	validationState: createValidationState({
		warnings: ['Server disabled until manual review completes'],
		formatCompatibility: {
			canShowAsUrl: false,
			canShowAsCommand: true,
			canShowAsJson: true
		}
	}),
	failureCount: 7,
	autoDisabled: true,
	deploymentType: 'managed',
	transport: 'stdio',
	dockerConfig: {
		image: 'mcp/filesystem:latest',
		name: 'filesystem-mcp'
	},
	retryPolicy: {
		maxRetries: 3,
		backoffMs: 2000
	},
	timeout: 30
}

type CardHandlers = Pick<MCPServerCardProps, 'onToggle' | 'onUpdate' | 'onTest' | 'onRemove'>

const createActionHandlers = (): CardHandlers => ({
	onToggle: fn(),
	onUpdate: fn(),
	onTest: fn(),
	onRemove: fn()
})

export const ManagedServer: Story = {
	args: {
		server: managedServerConfig,
		isSelected: false,
		testLoading: false,
		...createActionHandlers()
	}
}

export const CommandFormat: Story = {
	args: {
		server: managedServerConfig,
		isSelected: false,
		testLoading: false,
		...createActionHandlers()
	},
	parameters: {
		docs: {
			description: {
				story:
					'Shows a managed server using the command format. The configuration row exposes the format toggle while the status row defaults to the built-in "Ready" message.'
			}
		}
	}
}

export const UrlFormat: Story = {
	args: {
		server: externalServerConfig,
		isSelected: false,
		testLoading: false,
		statusMessage: 'Connected successfully',
		...createActionHandlers()
	},
	parameters: {
		docs: {
			description: {
				story:
					'Demonstrates a URL-driven server, including the "Show as JSON" toggle label and a success status message when connectivity tests pass.'
			}
		}
	}
}

export const JsonFormat: Story = {
	args: {
		server: invalidJsonServerConfig,
		isSelected: false,
		testLoading: false,
		...createActionHandlers()
	},
	parameters: {
		docs: {
			description: {
				story:
					'Highlights validation feedback when parsing fails. The status section surfaces the error banner and lists individual validation errors and warnings.'
			}
		}
	}
}

export const TestingConnection: Story = {
	args: {
		server: managedServerConfig,
		isSelected: false,
		testLoading: true,
		...createActionHandlers()
	},
	parameters: {
		docs: {
			description: {
				story:
					'Toggles the loading state so the Test button is disabled and the status row switches to the built-in "Testing..." label.'
			}
		}
	}
}

export const DisabledServer: Story = {
	args: {
		server: autoDisabledServerConfig,
		isSelected: false,
		testLoading: false,
		...createActionHandlers()
	},
	parameters: {
		docs: {
			description: {
				story:
					'Shows a server that has been auto-disabled after repeated failures. The status row communicates the lockout state and the accumulated failure count.'
			}
		}
	}
}

export const Interactive: Story = {
	args: {
		server: managedServerConfig,
		isSelected: false,
		testLoading: false,
		...createActionHandlers()
	},
	parameters: {
		docs: {
			description: {
				story:
					"Use this playground story to exercise every handler: toggle enablement, edit the name, switch configuration formats, run tests, and request removal. Each interaction is logged in Storybook's Actions panel."
			}
		}
	}
}

export const MultipleServers: Story = {
	render: () => {
		const managedHandlers = createActionHandlers()
		const externalHandlers = createActionHandlers()
		const invalidHandlers = createActionHandlers()

		return (
			<div className={storyStyles.stack}>
				<MCPServerCard server={managedServerConfig} isSelected testLoading={false} {...managedHandlers} />
				<MCPServerCard
					server={externalServerConfig}
					isSelected={false}
					testLoading={false}
					statusMessage="Connected successfully"
					{...externalHandlers}
				/>
				<MCPServerCard server={invalidJsonServerConfig} isSelected={false} testLoading={false} {...invalidHandlers} />
			</div>
		)
	},
	parameters: {
		docs: {
			description: {
				story:
					'Stacks multiple MCPServerCard components to validate consistent spacing, selection styling, and the interplay of success, warning, and error states.'
			}
		}
	}
}
