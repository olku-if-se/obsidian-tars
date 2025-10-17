import { Button, CollapsibleSection, Section, SettingRow, Toggle } from '../../atoms'
import styles from './ReactFeaturesSection.module.css'

// Type aliases for better readability (exported for use in other components)
export type ReactFeatures = {
	reactSettingsTab: boolean
	reactStatusBar: boolean
	reactModals: boolean
	reactMcpUI: boolean
}

type ReactFeaturesSectionData = {
	features: ReactFeatures
}

type ReactFeaturesSectionUI = {
	expanded?: boolean
}

type ReactFeaturesSectionEvents = {
	onToggleFeature: (feature: keyof ReactFeatures, enabled: boolean) => void
	onToggleSection: (open: boolean) => void
	onEnableAll: () => void
	onDisableAll: () => void
}

type ReactFeaturesSectionProps = ReactFeaturesSectionData & ReactFeaturesSectionUI & ReactFeaturesSectionEvents

// i18n strings object
const strings = {
	title: 'React UI Features (Experimental)',
	description: 'Experimental React-based UI components. Restart Obsidian after changing these settings.',
	settingsTab: 'React Settings Tab',
	settingsTabDesc: 'Use React-based settings interface',
	statusBar: 'React Status Bar',
	statusBarDesc: 'Use React-based status bar',
	modals: 'React Modals',
	modalsDesc: 'Use React-based modal dialogs',
	mcpUI: 'React MCP UI',
	mcpUIDesc: 'Use React-based MCP interface components',
	enableAll: 'Enable All',
	disableAll: 'Disable All',
	restartNotice: 'Changes to React features will take effect after restarting Obsidian.',
	experimentalWarning: 'These features are experimental and may change in future versions.'
} as const

export const ReactFeaturesSection: React.FC<ReactFeaturesSectionProps> = ({
	features = {
		reactSettingsTab: false,
		reactStatusBar: false,
		reactModals: false,
		reactMcpUI: false
	},
	expanded = false,
	onToggleFeature,
	onToggleSection,
	onEnableAll,
	onDisableAll
}) => {
	const handleFeatureToggle = (feature: keyof ReactFeatures, enabled: boolean) => {
		onToggleFeature(feature, enabled)
		// In real implementation, this would show a notice
		console.log(strings.restartNotice)
	}

	const allEnabled = Object.values(features).every(Boolean)
	const anyEnabled = Object.values(features).some(Boolean)

	return (
		<CollapsibleSection title={strings.title} open={expanded} onToggle={onToggleSection}>
			<div className={styles.experimentalWarning}>⚠️ {strings.experimentalWarning}</div>

			<div className={styles.description}>{strings.description}</div>

			<Section title="Feature Toggles">
				<SettingRow name={strings.settingsTab} description={strings.settingsTabDesc}>
					<Toggle
						checked={features.reactSettingsTab}
						onChange={(e) => handleFeatureToggle('reactSettingsTab', e.target.checked)}
					/>
				</SettingRow>

				<SettingRow name={strings.statusBar} description={strings.statusBarDesc}>
					<Toggle
						checked={features.reactStatusBar}
						onChange={(e) => handleFeatureToggle('reactStatusBar', e.target.checked)}
					/>
				</SettingRow>

				<SettingRow name={strings.modals} description={strings.modalsDesc}>
					<Toggle
						checked={features.reactModals}
						onChange={(e) => handleFeatureToggle('reactModals', e.target.checked)}
					/>
				</SettingRow>

				<SettingRow name={strings.mcpUI} description={strings.mcpUIDesc}>
					<Toggle checked={features.reactMcpUI} onChange={(e) => handleFeatureToggle('reactMcpUI', e.target.checked)} />
				</SettingRow>
			</Section>

			<Section title="Quick Actions">
				<div className={styles.actionButtons}>
					<Button variant="primary" onClick={onEnableAll} disabled={allEnabled}>
						{strings.enableAll}
					</Button>
					<Button variant="default" onClick={onDisableAll} disabled={!anyEnabled}>
						{strings.disableAll}
					</Button>
				</div>
			</Section>

			{anyEnabled && <div className={styles.restartNotice}>{strings.restartNotice}</div>}
		</CollapsibleSection>
	)
}
