import { Button, CollapsibleSection, Input, Section, SettingRow, Toggle } from '../../atoms'
import { MCPServerCard } from '../MCPServerCard'
import styles from './MCPServersSection.module.css'

import type { ValidationResult } from '../../utilities/validation'

// Enhanced server configuration type for new MCP settings UI
export type MCPServerConfig = {
	id: string
	name: string
	enabled: boolean
	configInput: string
	displayMode: 'url' | 'command' | 'json'
	validationState: ValidationResult
	failureCount: number
	autoDisabled: boolean
	// Legacy fields for backward compatibility
	deploymentType: 'managed' | 'external'
	transport: 'stdio' | 'sse'
	dockerConfig?: {
		image: string
		name?: string
		ports?: string[]
		env?: Record<string, string>
	}
	sseConfig?: {
		url: string
	}
	retryPolicy?: {
		maxRetries: number
		backoffMs: number
	}
	timeout?: number
}

type MCPServersSectionData = {
	servers: MCPServerConfig[]
	globalLimits: {
		concurrentExecutions: number
		sessionLimitPerDocument: number
		defaultTimeout: number
		parallelExecutionEnabled: boolean
		llmUtilityEnabled: boolean
		maxParallelTools: number
	}
}

type MCPServersSectionUI = {
	expanded?: boolean
	selectedServerId?: string
}

type MCPServersSectionEvents = {
	onAddServer: () => void
	onRemoveServer: (id: string) => void
	onUpdateServer: (id: string, updates: Partial<MCPServerConfig>) => void
	onToggleServer: (id: string, enabled: boolean) => void
	onTestConnection: (id: string) => Promise<{ success: boolean; message: string; latency?: number }>
	onToggleSection: (open: boolean) => void
	onUpdateGlobalLimits: (limits: Partial<MCPServersSectionData['globalLimits']>) => void
}

type MCPServersSectionProps = MCPServersSectionData & MCPServersSectionUI & MCPServersSectionEvents

// i18n strings object
const strings = {
	title: 'MCP Servers',
	addServer: 'Add MCP Server',
	noServers: 'No MCP servers configured. Add a server to enable AI tool calling.',
	globalSettings: 'Global Settings',
	concurrentExecutions: 'Concurrent Executions',
	concurrentExecutionsDesc: 'Maximum number of simultaneous tool executions across all servers',
	sessionLimit: 'Session Limit per Document',
	sessionLimitDesc: 'Maximum tool executions per document (prevents infinite loops, -1 for unlimited)',
	defaultTimeout: 'Default Timeout (ms)',
	defaultTimeoutDesc: 'Default timeout for individual tool executions',
	parallelExecution: 'Parallel Execution',
	parallelExecutionDesc: 'Enable parallel execution of multiple tools simultaneously',
	llmUtility: 'LLM Utility Integration',
	llmUtilityDesc: 'Enable LLM providers to access MCP tools directly',
	maxParallelTools: 'Max Parallel Tools',
	maxParallelToolsDesc: 'Maximum number of tools that can run in parallel (when parallel execution is enabled)',
	serverName: 'Server Name',
	serverStatus: 'Status',
	enabled: 'Enabled',
	disabled: 'Disabled',
	deploymentType: 'Deployment Type',
	transport: 'Transport',
	testConnection: 'Test Connection',
	remove: 'Remove',
	configure: 'Configure',
	managed: 'Managed (Tars controls lifecycle)',
	external: 'External (you manage lifecycle)',
	stdio: 'Stdio (stdin/stdout)',
	sse: 'SSE (HTTP/SSE)',
	dockerImage: 'Docker Image',
	connectionTestSuccessful: 'Connection successful',
	connectionTestFailed: 'Connection failed'
} as const

export const MCPServersSection: React.FC<MCPServersSectionProps> = ({
	servers = [],
	globalLimits = {
		concurrentExecutions: 5,
		sessionLimitPerDocument: 50,
		defaultTimeout: 30000,
		parallelExecutionEnabled: false,
		llmUtilityEnabled: false,
		maxParallelTools: 3
	},
	expanded = false,
	selectedServerId,
	onAddServer,
	onRemoveServer,
	onUpdateServer,
	onToggleServer,
	onTestConnection,
	onToggleSection,
	onUpdateGlobalLimits,
}) => {
	const handleTestConnection = async (serverId: string) => {
		try {
			const result = await onTestConnection(serverId)
			// In real implementation, this would show a notice or update UI
			console.log(`Test result for ${serverId}:`, result)
		} catch (error) {
			console.error(`Test failed for ${serverId}:`, error)
		}
	}

	return (
		<CollapsibleSection title={strings.title} open={expanded} onToggle={onToggleSection}>
			{/* Global Settings */}
			<SettingRow name={strings.concurrentExecutions} description={strings.concurrentExecutionsDesc}>
				<Input
					type="number"
					value={globalLimits.concurrentExecutions}
					onChange={(e) =>
						onUpdateGlobalLimits({
							concurrentExecutions: parseInt(e.target.value, 10) || 1
						})
					}
					min="1"
					max="10"
				/>
			</SettingRow>

			<SettingRow name={strings.sessionLimit} description={strings.sessionLimitDesc}>
				<Input
					type="number"
					value={globalLimits.sessionLimitPerDocument}
					onChange={(e) =>
						onUpdateGlobalLimits({
							sessionLimitPerDocument: parseInt(e.target.value, 10) || -1
						})
					}
					min="-1"
					max="100"
				/>
			</SettingRow>

			<SettingRow name={strings.defaultTimeout} description={strings.defaultTimeoutDesc}>
				<Input
					type="number"
					value={globalLimits.defaultTimeout}
					onChange={(e) =>
						onUpdateGlobalLimits({
							defaultTimeout: parseInt(e.target.value, 10) || 1000
						})
					}
					min="1000"
					max="300000"
				/>
			</SettingRow>

			<SettingRow name={strings.parallelExecution} description={strings.parallelExecutionDesc}>
				<Toggle
					checked={globalLimits.parallelExecutionEnabled}
					onChange={(e) =>
						onUpdateGlobalLimits({
							parallelExecutionEnabled: e.target.checked
						})
					}
				/>
			</SettingRow>

			<SettingRow name={strings.llmUtility} description={strings.llmUtilityDesc}>
				<Toggle
					checked={globalLimits.llmUtilityEnabled}
					onChange={(e) =>
						onUpdateGlobalLimits({
							llmUtilityEnabled: e.target.checked
						})
					}
				/>
			</SettingRow>

			<SettingRow name={strings.maxParallelTools} description={strings.maxParallelToolsDesc}>
				<Input
					type="number"
					value={globalLimits.maxParallelTools}
					onChange={(e) =>
						onUpdateGlobalLimits({
							maxParallelTools: parseInt(e.target.value, 10) || 1
						})
					}
					min="1"
					max="5"
					disabled={!globalLimits.parallelExecutionEnabled}
				/>
			</SettingRow>

			{/* Add Server Button */}
			<div className={styles.addServerContainer}>
				<Button variant="primary" onClick={onAddServer}>
					{strings.addServer}
				</Button>
			</div>

			{/* Server List */}
			{servers.length === 0 ? (
				<div className={styles.noServers}>{strings.noServers}</div>
			) : (
				<div className={styles.serverList}>
					{servers.map((server) => (
						<MCPServerCard
							key={server.id}
							server={server}
							isSelected={selectedServerId === server.id}
							onToggle={(enabled) => onToggleServer(server.id, enabled)}
							onUpdate={(updates) => onUpdateServer(server.id, updates)}
							onTest={() => handleTestConnection(server.id)}
							onRemove={() => onRemoveServer(server.id)}
						/>
					))}
				</div>
			)}
		</CollapsibleSection>
	)
}
