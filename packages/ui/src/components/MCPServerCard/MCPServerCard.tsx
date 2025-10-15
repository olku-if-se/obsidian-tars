import { Button, SettingRow, Toggle, ConfigurationInput } from '../../atoms'
import type { MCPServerConfig } from '../MCPServersSection/MCPServersSection'
import { useDebouncedCallbackWithCleanup } from '../../hooks/useDebouncedCallback'
import styles from './MCPServerCard.module.css'

// Type aliases following React rules (bundled props for >5 props)
type MCPServerCardData = {
	server: MCPServerConfig
	isSelected: boolean
}

type MCPServerCardUI = {
	testLoading?: boolean
	statusMessage?: string
}

type MCPServerCardEvents = {
	onToggle: (enabled: boolean) => void
	onUpdate: (updates: Partial<MCPServerConfig>) => void
	onTest: () => void
	onRemove: () => void
}

export type MCPServerCardProps = MCPServerCardData & MCPServerCardUI & MCPServerCardEvents

// i18n strings object - externalized for i18n compliance
const strings = {
	controls: 'Controls',
	serverName: 'Server Name',
	serverNameDesc: 'Display name for the MCP server',
	configuration: 'Configuration',
	configurationDesc: 'Server configuration in URL, command, or JSON format',
	status: 'Status',
	enable: 'Enable',
	disable: 'Disable',
	test: 'Test',
	delete: 'Delete',
	testing: 'Testing...',
	connected: 'Connected successfully',
	connectionFailed: 'Connection failed',
	invalidConfig: 'Invalid configuration',
	ready: 'Ready',
	serverDisabled: 'Server disabled',
	serverAutoDisabled: 'Server auto-disabled due to failures',
	formatUrl: 'URL Format',
	formatCommand: 'Command Format',
	formatJson: 'JSON Format'
} as const

export const MCPServerCard: React.FC<MCPServerCardProps> = ({
	server,
	isSelected,
	testLoading = false,
	statusMessage,
	onToggle,
	onUpdate,
	onTest,
	onRemove
}) => {
	// Debounced update handlers to prevent excessive re-renders
	const debouncedOnUpdate = useDebouncedCallbackWithCleanup(onUpdate, 500)

	// Event handlers with proper typing
	const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
		onToggle(event.target.checked)
	}

	const handleServerNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		debouncedOnUpdate({ name: event.target.value })
	}

	const handleConfigChange = (configInput: string) => {
		debouncedOnUpdate({ configInput })
	}

	const handleFormatChange = (displayMode: 'url' | 'command' | 'json') => {
		onUpdate({ displayMode })
	}

	const handleValidationChange = (validationState: MCPServerConfig['validationState']) => {
		onUpdate({ validationState })
	}

	// Status display logic
	const getStatusInfo = () => {
		// Priority order: auto-disabled > validation errors > test status > ready
		if (server.autoDisabled) {
			return {
				text: strings.serverAutoDisabled,
				type: 'error' as const,
				showDetails: true
			}
		}

		if (!server.enabled) {
			return {
				text: strings.serverDisabled,
				type: 'warning' as const,
				showDetails: false
			}
		}

		if (!server.validationState.isValid) {
			return {
				text: strings.invalidConfig,
				type: 'error' as const,
				showDetails: true
			}
		}

		if (statusMessage) {
			if (statusMessage.includes(strings.connected) || statusMessage.includes('success')) {
				return {
					text: statusMessage,
					type: 'success' as const,
					showDetails: false
				}
			}
			return {
				text: statusMessage,
				type: 'info' as const,
				showDetails: false
			}
		}

		if (testLoading) {
			return {
				text: strings.testing,
				type: 'loading' as const,
				showDetails: false
			}
		}

		return {
			text: strings.ready,
			type: 'success' as const,
			showDetails: false
		}
	}

	const statusInfo = getStatusInfo()

	// Get format display name
	const getFormatDisplayName = () => {
		switch (server.displayMode) {
			case 'url':
				return strings.formatUrl
			case 'command':
				return strings.formatCommand
			case 'json':
				return strings.formatJson
		}
	}

	// Memoize objects to prevent unnecessary re-renders
	const controlsContainerClass = [
		styles.controlsContainer,
		testLoading && styles.loading
	].filter(Boolean).join(' ')

	const serverCardClass = [
		styles.serverCard,
		isSelected && styles.selected,
		testLoading && styles.loading,
		statusInfo.type && styles[statusInfo.type]
	].filter(Boolean).join(' ')

	return (
		<div className={serverCardClass}>
			{/* Row 1: Controls - Enable/Disable, Test, Delete */}
			<SettingRow name={strings.controls} description="">
				<div className={controlsContainerClass}>
					<Toggle
						checked={server.enabled}
						onChange={handleToggle}
						disabled={testLoading}
					/>
					<Button
						variant="default"
						size="sm"
						onClick={onTest}
						disabled={testLoading || !server.enabled || !server.validationState.isValid}
					>
						{testLoading ? strings.testing : strings.test}
					</Button>
					<Button
						variant="danger"
						size="sm"
						onClick={onRemove}
						disabled={testLoading}
					>
						{strings.delete}
					</Button>
				</div>
			</SettingRow>

			{/* Row 2: Server Name */}
			<SettingRow name={strings.serverName} description={strings.serverNameDesc}>
				<input
					type="text"
					value={server.name}
					onChange={handleServerNameChange}
					placeholder="my-mcp-server"
					className={styles.serverNameInput}
					disabled={testLoading}
				/>
			</SettingRow>

			{/* Row 3: Configuration Input */}
			<SettingRow name={strings.configuration} description={strings.configurationDesc} vertical={true}>
				<ConfigurationInput
					value={server.configInput}
					format={server.displayMode}
					onChange={handleConfigChange}
					onFormatChange={handleFormatChange}
					onValidationChange={handleValidationChange}
					disabled={testLoading || !server.enabled}
					showFormatToggle={true}
					resizable={true}
				/>
			</SettingRow>

			{/* Row 4: Status Display */}
			<SettingRow name={strings.status} description="" vertical={true}>
				<div className={styles.statusContainer}>
					<div className={`${styles.statusMessage} ${styles[statusInfo.type]}`}>
						{statusInfo.text}
					</div>

					{/* Show format information */}
					<div className={styles.statusDetail}>
						<span className={styles.statusLabel}>Format:</span>
						<span className={styles.statusValue}>{getFormatDisplayName()}</span>
					</div>

					{/* Show failure count if applicable */}
					{server.failureCount > 0 && (
						<div className={styles.statusDetail}>
							<span className={styles.statusLabel}>Failures:</span>
							<span className={styles.statusValue}>{server.failureCount}</span>
						</div>
					)}

					{/* Show validation details if there are errors */}
					{statusInfo.showDetails && server.validationState.errors.length > 0 && (
						<div className={styles.validationErrors}>
							{server.validationState.errors.map((error) => (
								<div key={`error-${error.slice(0, 20)}`} className={styles.errorMessage}>
									{error}
								</div>
							))}
						</div>
					)}

					{/* Show validation warnings */}
					{statusInfo.showDetails && server.validationState.warnings.length > 0 && (
						<div className={styles.validationWarnings}>
							{server.validationState.warnings.map((warning) => (
								<div key={`warning-${warning.slice(0, 20)}`} className={styles.warningMessage}>
									{warning}
								</div>
							))}
						</div>
					)}
				</div>
			</SettingRow>
		</div>
	)
}