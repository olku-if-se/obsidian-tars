import { useState } from 'react'
import { Button, CollapsibleSection, SettingRow, Slider, Toggle } from '../../atoms'
import styles from './AdvancedSection.module.css'

export interface SectionSettings {
	enableInternalLinkForAssistantMsg: boolean
	answerDelayInMilliseconds: number
	enableReplaceTag: boolean
	enableExportToJSONL: boolean
	enableTagSuggest: boolean
}

interface AdvancedSectionProps {
	initialSettings?: Partial<SectionSettings>
	defaultOpen?: boolean
	onToggleSection?: (open: boolean) => void
	onSettingsChange?: (settings: Partial<SectionSettings>) => void
}

export const AdvancedSection = ({
	initialSettings,
	defaultOpen = false,
	onToggleSection,
	onSettingsChange
}: AdvancedSectionProps) => {
	// Internal state management with initial values from props
	const [settings, setSettings] = useState<Partial<SectionSettings>>(() => ({
		enableInternalLinkForAssistantMsg: false,
		answerDelayInMilliseconds: 2000,
		enableReplaceTag: false,
		enableExportToJSONL: false,
		enableTagSuggest: true,
		...initialSettings
	}))

	const delayInSeconds = settings.answerDelayInMilliseconds! / 1000

	// Handle setting changes and notify parent
	const updateSetting = <K extends keyof SectionSettings>(key: K, value: SectionSettings[K]) => {
		const newSettings = { ...settings, [key]: value }
		setSettings(newSettings)
		onSettingsChange?.(newSettings)
	}

	// Externalized strings for i18n support
	const strings = {
		title: 'Advanced',
		internalLinksTitle: 'Internal links for assistant messages',
		internalLinksDescription:
			'Replace internal links in assistant messages with their referenced content. Note: This feature is generally not recommended as assistant-generated content may contain non-existent links.',
		delayTitle: 'Delay before answer (Seconds)',
		delayDescription:
			'If you encounter errors with missing user messages when executing assistant commands on selected text, it may be due to the need for more time to parse the messages. Please slightly increase the delay time.',
		resetButtonText: 'Reset',
		replaceTagTitle: 'Replace tag Command',
		replaceTagDescription: 'Replace the names of the two most frequently occurring speakers with tag format.',
		exportToJsonlTitle: 'Export to JSONL Command',
		exportToJsonlDescription: 'Export conversations to JSONL',
		tagSuggestTitle: 'Tag suggest',
		tagSuggestDescription:
			'If you only use commands without needing tag suggestions, you can disable this feature. Changes will take effect after restarting the plugin.'
	}

	// Constants for default values
	const DEFAULT_DELAY_MS = 2000
	const _DEFAULT_DELAY_SECONDS = 2
	_DEFAULT_DELAY_SECONDS
	// Only pack complex props (5+ properties) into objects
	const sliderProps = {
		min: 1.5,
		max: 4,
		step: 0.5,
		value: delayInSeconds,
		showValue: true as const,
		valueFormatter: (value: number) => `${value}s`,
		className: styles.delaySlider
	}

	// Event handlers using internal state management
	const handleToggleInternalLink = () => {
		const newValue = !settings.enableInternalLinkForAssistantMsg
		updateSetting('enableInternalLinkForAssistantMsg', newValue)
	}

	const handleDelayChange = (delayMs: number) => {
		updateSetting('answerDelayInMilliseconds', delayMs)
	}

	const handleResetDelay = () => {
		updateSetting('answerDelayInMilliseconds', DEFAULT_DELAY_MS)
	}

	const handleToggleReplaceTag = () => {
		const newValue = !settings.enableReplaceTag
		updateSetting('enableReplaceTag', newValue)
	}

	const handleToggleExportToJsonl = () => {
		const newValue = !settings.enableExportToJSONL
		updateSetting('enableExportToJSONL', newValue)
	}

	const handleToggleTagSuggest = () => {
		const newValue = !settings.enableTagSuggest
		updateSetting('enableTagSuggest', newValue)
	}

	return (
		<CollapsibleSection
			title={strings.title}
			defaultOpen={defaultOpen}
			onToggle={onToggleSection || (() => {
				// Optional callback - no action needed by default
			})}
			className={styles.advancedSection}
		>
			<SettingRow name={strings.internalLinksTitle} description={strings.internalLinksDescription}>
				<Toggle checked={settings.enableInternalLinkForAssistantMsg} onChange={() => handleToggleInternalLink()} />
			</SettingRow>

			<SettingRow name={strings.delayTitle} description={strings.delayDescription}>
				<div className={styles.delayControls}>
					<Button variant="default" size="sm" onClick={handleResetDelay}>
						{strings.resetButtonText}
					</Button>
					<Slider {...sliderProps} onChange={(e) => handleDelayChange(Math.round(parseFloat(e.target.value) * 1000))} />
					<div className={styles.delayValueDisplay}>{delayInSeconds}s</div>
				</div>
			</SettingRow>

			<SettingRow name={strings.replaceTagTitle} description={strings.replaceTagDescription}>
				<Toggle checked={settings.enableReplaceTag} onChange={() => handleToggleReplaceTag()} />
			</SettingRow>

			<SettingRow name={strings.exportToJsonlTitle} description={strings.exportToJsonlDescription}>
				<Toggle checked={settings.enableExportToJSONL} onChange={() => handleToggleExportToJsonl()} />
			</SettingRow>

			<SettingRow name={strings.tagSuggestTitle} description={strings.tagSuggestDescription}>
				<Toggle checked={settings.enableTagSuggest} onChange={() => handleToggleTagSuggest()} />
			</SettingRow>
		</CollapsibleSection>
	)
}
