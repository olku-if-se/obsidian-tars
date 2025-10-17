import { Section, SettingRow, Toggle } from '../../atoms'
import {
	AdvancedSection,
	MCPServersSection,
	MessageTagsSection,
	ProviderSection,
	ReactFeaturesSection,
	SystemMessageSection
} from '../../components'
import {
	useAdvancedSettings,
	useBasicSettings,
	useMCPServers,
	useMessageTags,
	useProviders,
	useReactFeatures,
	useSystemMessage,
	useUIState
} from '../../providers/settings/SettingsProvider'
import { t } from '../../utilities/i18n'
import styles from './SettingsTab.module.css'

type SettingsTabProps = {
	onTestMCPConnection?: (id: string) => Promise<{ success: boolean; message: string; latency?: number }>
}

export function SettingsTab({ onTestMCPConnection }: SettingsTabProps): JSX.Element {
	// Use custom hooks to access different parts of the settings state
	const { providers, availableVendors, addProvider, updateProvider, removeProvider } = useProviders()
	const { tags, defaultTags, updateTags } = useMessageTags()
	const { systemMessage, updateMessage } = useSystemMessage()
	const { settings: basicSettings, updateSettings: updateBasicSettings } = useBasicSettings()
	const { uiState, toggleSection } = useUIState()
	const { servers, globalLimits, addServer, removeServer, updateServer, toggleServer, updateGlobalLimits } =
		useMCPServers()
	const { features, toggleFeature, enableAll, disableAll } = useReactFeatures()
	const { settings: advancedSettings, updateSettings: updateAdvancedSettings } = useAdvancedSettings()

	// Event handlers that work with hook-based actions
	const eventHandlers = {
		provider: {
			onAddProvider: addProvider,
			onUpdateProvider: updateProvider,
			onRemoveProvider: removeProvider
		},
		messageTags: updateTags,
		systemMessage: {
			onToggleEnable: (enabled: boolean) => {
				updateMessage({ ...systemMessage, enabled })
			},
			onMessageChange: (message: string) => {
				updateMessage({ ...systemMessage, message })
			}
		},
		basicSettings: (setting: 'confirmRegenerate' | 'enableInternalLink', value: boolean) => {
			updateBasicSettings({ [setting]: value })
		},
		onToggleSection: toggleSection,
		mcp: {
			onAddServer: addServer,
			onRemoveServer: removeServer,
			onUpdateServer: updateServer,
			onToggleServer: toggleServer,
			onTestConnection: async (id: string) => {
				if (onTestMCPConnection) {
					return await onTestMCPConnection(id)
				}
				return { success: false, message: 'Test handler not available' }
			},
			onUpdateGlobalLimits: updateGlobalLimits
		},
		reactFeatures: {
			onToggleFeature: toggleFeature,
			onEnableAll: enableAll,
			onDisableAll: disableAll
		},
		advancedSettings: (settings: Partial<typeof advancedSettings>) => {
			updateAdvancedSettings(settings)
		}
	}

	return (
		<div className={styles.settingsTab}>
			{/* AI Assistants Section */}
			<ProviderSection providers={providers} availableVendors={availableVendors} {...eventHandlers.provider} />

			{/* Message Tags Section */}
			<MessageTagsSection tags={tags} onTagsChange={eventHandlers.messageTags} defaultTags={defaultTags} />

			{/* System Message Section */}
			<SystemMessageSection
				enableDefaultSystemMsg={systemMessage.enabled}
				defaultSystemMsg={systemMessage.message}
				onToggleEnable={eventHandlers.systemMessage.onToggleEnable}
				onMessageChange={eventHandlers.systemMessage.onMessageChange}
				defaultOpen={uiState.systemMessageExpanded}
				onToggleSection={(open) => eventHandlers.onToggleSection('systemMessageExpanded', open)}
			/>

			{/* Basic Settings Section */}
			<Section title={t('settingsTab.basicSettings')}>
				<SettingRow name={t('settingsTab.confirmRegenerate')} description={t('settingsTab.confirmRegenerateDesc')}>
					<Toggle
						checked={basicSettings.confirmRegenerate}
						onChange={(e) => eventHandlers.basicSettings('confirmRegenerate', e.target.checked)}
					/>
				</SettingRow>

				<SettingRow name={t('settingsTab.internalLinks')} description={t('settingsTab.internalLinksDesc')}>
					<Toggle
						checked={basicSettings.enableInternalLink}
						onChange={(e) => eventHandlers.basicSettings('enableInternalLink', e.target.checked)}
					/>
				</SettingRow>
			</Section>

			{/* Advanced Section */}
			<AdvancedSection
				initialSettings={advancedSettings}
				defaultOpen={uiState.advancedExpanded}
				onToggleSection={(open) => eventHandlers.onToggleSection('advancedExpanded', open)}
				onSettingsChange={eventHandlers.advancedSettings}
			/>

			{/* MCP Servers Section */}
			<MCPServersSection
				servers={servers}
				globalLimits={globalLimits}
				expanded={uiState.mcpServersExpanded}
				onToggleSection={() => eventHandlers.onToggleSection('mcpServersExpanded', !uiState.mcpServersExpanded)}
				{...eventHandlers.mcp}
			/>

			{/* React Features Section */}
			<ReactFeaturesSection
				features={features}
				expanded={uiState.reactFeaturesExpanded}
				onToggleSection={() => eventHandlers.onToggleSection('reactFeaturesExpanded', !uiState.reactFeaturesExpanded)}
				{...eventHandlers.reactFeatures}
			/>
		</div>
	)
}
