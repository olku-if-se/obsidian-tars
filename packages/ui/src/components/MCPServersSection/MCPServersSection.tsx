import { Button, CollapsibleSection, Input, LabelValueList, Section, SettingRow, Toggle } from '../../atoms'
import styles from './MCPServersSection.module.css'

// Type aliases for better readability (exported for use in other components)
export type MCPServerConfig = {
	id: string
	name: string
	enabled: boolean
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
	sessionLimitDesc: 'Maximum tool executions per document (prevents infinite loops)',
	defaultTimeout: 'Default Timeout (seconds)',
	defaultTimeoutDesc: 'Default timeout for individual tool executions',
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
		defaultTimeout: 30
	},
	expanded = false,
	selectedServerId,
	onAddServer,
	onRemoveServer,
	onUpdateServer,
	onToggleServer,
	onTestConnection,
	onToggleSection,
	onUpdateGlobalLimits
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

	const globalSettingsRows = [
		{
			label: strings.concurrentExecutions,
			value: globalLimits.concurrentExecutions.toString()
		},
		{
			label: strings.sessionLimit,
			value: globalLimits.sessionLimitPerDocument.toString()
		},
		{
			label: strings.defaultTimeout,
			value: `${globalLimits.defaultTimeout}s`
		}
	]

	return (
		<CollapsibleSection title={strings.title} open={expanded} onToggle={onToggleSection}>
			{/* Global Settings */}
			<Section title={strings.globalSettings}>
				<div className={styles.globalSettings}>
					<LabelValueList rows={globalSettingsRows} />
				</div>

				<SettingRow name={strings.concurrentExecutions} description={strings.concurrentExecutionsDesc}>
					<Input
						type="number"
						value={globalLimits.concurrentExecutions.toString()}
						onChange={(e) =>
							onUpdateGlobalLimits({
								concurrentExecutions: parseInt(e.target.value, 10) || 1
							})
						}
						min="1"
						max="20"
					/>
				</SettingRow>

				<SettingRow name={strings.sessionLimit} description={strings.sessionLimitDesc}>
					<Input
						type="number"
						value={globalLimits.sessionLimitPerDocument.toString()}
						onChange={(e) =>
							onUpdateGlobalLimits({
								sessionLimitPerDocument: parseInt(e.target.value, 10) || 1
							})
						}
						min="1"
						max="200"
					/>
				</SettingRow>

				<SettingRow name={strings.defaultTimeout} description={strings.defaultTimeoutDesc}>
					<Input
						type="number"
						value={globalLimits.defaultTimeout.toString()}
						onChange={(e) =>
							onUpdateGlobalLimits({
								defaultTimeout: parseInt(e.target.value, 10) || 10
							})
						}
						min="5"
						max="300"
					/>
				</SettingRow>
			</Section>

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

// Server Card Component
type MCPServerCardProps = {
	server: MCPServerConfig
	isSelected: boolean
	onToggle: (enabled: boolean) => void
	onUpdate: (updates: Partial<MCPServerConfig>) => void
	onTest: () => void
	onRemove: () => void
}

const MCPServerCard: React.FC<MCPServerCardProps> = ({ server, isSelected, onToggle, onUpdate, onTest, onRemove }) => {
	const serverInfoRows: { label: string; value: string }[] = [
		{ label: 'Status', value: server.enabled ? strings.enabled : strings.disabled },
		{ label: strings.deploymentType, value: server.deploymentType },
		{ label: strings.transport, value: server.transport }
	]

	if (server.dockerConfig) {
		serverInfoRows.push({ label: strings.dockerImage, value: server.dockerConfig.image })
	}

	return (
		<div className={`${styles.serverCard} ${isSelected ? styles.selected : ''}`}>
			<div className={styles.serverHeader}>
				<div className={styles.serverInfo}>
					<h3 className={styles.serverName}>{server.name}</h3>
					<LabelValueList rows={serverInfoRows} />
				</div>
				<div className={styles.serverControls}>
					<Toggle checked={server.enabled} onChange={(e) => onToggle(e.target.checked)} />
					<Button variant="default" size="sm" onClick={onTest}>
						{strings.testConnection}
					</Button>
					<Button variant="danger" size="sm" onClick={onRemove}>
						{strings.remove}
					</Button>
				</div>
			</div>

			{/* Configuration Details */}
			<div className={styles.serverConfiguration}>
				<SettingRow name="Server ID">
					<Input
						value={server.id}
						onChange={(e) => onUpdate({ id: e.target.value })}
						placeholder="Unique server identifier"
					/>
				</SettingRow>

				<SettingRow name="Server Name">
					<Input
						value={server.name}
						onChange={(e) => onUpdate({ name: e.target.value })}
						placeholder="Display name for server"
					/>
				</SettingRow>

				{server.dockerConfig && (
					<SettingRow name={strings.dockerImage}>
						<Input
							value={server.dockerConfig.image}
							onChange={(e) =>
								onUpdate({
									dockerConfig: { ...server.dockerConfig, image: e.target.value }
								})
							}
							placeholder="docker/image:tag"
						/>
					</SettingRow>
				)}

				{server.sseConfig && (
					<SettingRow name="SSE URL">
						<Input
							value={server.sseConfig.url}
							onChange={(e) =>
								onUpdate({
									sseConfig: { ...server.sseConfig, url: e.target.value }
								})
							}
							placeholder="https://server.example.com/sse"
						/>
					</SettingRow>
				)}
			</div>
		</div>
	)
}
