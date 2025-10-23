import { Button, CollapsibleSection, Input, SettingRow, TextArea } from '~/atoms'
import { t } from '~/locales/i18n'
import type { Provider } from '../types'
import styles from './ProviderCard.module.css'

export const strings = {
	assistantMessageTag: t('providerSection.assistantMessageTag'),
	assistantMessageTagDesc: t('providerSection.assistantMessageTagDesc'),
	model: t('providerSection.model'),
	modelPlaceholder: t('providerSection.modelPlaceholder'),
	supportedFeatures: t('providerSection.supportedFeatures'),
	select: t('providerSection.select'),
	apiKey: t('providerSection.apiKey'),
	apiKeyDescription: t('providerSection.apiKeyDescription'),
	apiKeyPlaceholder: t('providerSection.apiKeyPlaceholder'),
	controlsTitle: t('providerSection.controlsTitle'),
	controlsDescription: t('providerSection.controlsDescription'),
	disableButton: t('providerSection.disable'),
	testButton: t('providerSection.test'),
	removeButton: t('providerSection.remove'),
	sectionTitle: t('providerSection.sectionTitle'),
	baseUrl: t('providerSection.baseUrl'),
	baseUrlDescription: t('providerSection.baseUrlDescription'),
	baseUrlPlaceholder: t('providerSection.baseUrlPlaceholder'),
	override: t('providerSection.override'),
	overrideDescription: t('providerSection.overrideDescription'),
	overridePlaceholder: t('providerSection.overridePlaceholder')
} as const

type ProviderCardProps = {
	provider: Provider
	isExpanded: boolean
	onUpdateProvider: (id: string, updates: Partial<Provider>) => void
	onRemoveProvider: (id: string) => void
}

export function ProviderCard({
	provider,
	isExpanded,
	onUpdateProvider,
	onRemoveProvider
}: ProviderCardProps): JSX.Element {
	const capabilitiesDescription = provider.capabilities?.length
		? provider.capabilities.join(' • ')
		: strings.supportedFeatures

	return (
		<CollapsibleSection
			title={`${provider.tag ?? provider.name ?? strings.sectionTitle} (${provider.name ?? strings.sectionTitle})`}
			defaultOpen={isExpanded}
		>
			<div className={styles.providerContent}>
				<SettingRow
					name={strings.assistantMessageTag}
					description={strings.assistantMessageTagDesc}
					layoutRatio={[1, 1]}
				>
					<Input
						value={provider.tag || ''}
						onChange={(e) => onUpdateProvider(provider.id, { tag: e.target.value })}
						placeholder={provider.name || strings.assistantMessageTag}
						className={styles.settingControl}
					/>
				</SettingRow>

				<SettingRow name={strings.model} description={capabilitiesDescription} layoutRatio={[1, 1]}>
					<div className={styles.settingModelsRow}>
						<Input
							value={provider.model || ''}
							onChange={(e) => onUpdateProvider(provider.id, { model: e.target.value })}
							placeholder={strings.modelPlaceholder}
							className={styles.settingModels}
						/>
						<Button variant='default'>{strings.select}</Button>
					</div>
				</SettingRow>

				<SettingRow name={strings.baseUrl} description={strings.baseUrlDescription} layoutRatio={[1, 1]}>
					<Input
						value={provider.baseUrl || ''}
						onChange={(e) => onUpdateProvider(provider.id, { baseUrl: e.target.value })}
						placeholder={strings.baseUrlPlaceholder}
						className={styles.settingApiKey}
					/>
				</SettingRow>

				<SettingRow name={strings.apiKey} description={strings.apiKeyDescription} layoutRatio={[1, 1]}>
					<Input
						type='password'
						value={provider.apiKey || ''}
						onChange={(e) => onUpdateProvider(provider.id, { apiKey: e.target.value })}
						placeholder={strings.apiKeyPlaceholder}
						className={styles.settingApiKey}
					/>
				</SettingRow>

				<SettingRow name={strings.override} description={strings.overrideDescription} vertical={true}>
					<TextArea
						value={provider.override || ''}
						onChange={(e) => onUpdateProvider(provider.id, { override: e.target.value })}
						placeholder={strings.overridePlaceholder}
						className={styles.settingApiKey}
					/>
				</SettingRow>

				<SettingRow name={strings.controlsTitle} layoutRatio={[1, 1]}>
					<Button variant='primary'>{strings.disableButton}</Button>
					<Button variant='primary'>{strings.testButton}</Button>
					<Button variant='danger' onClick={() => onRemoveProvider(provider.id)}>
						{strings.removeButton}
					</Button>
				</SettingRow>
			</div>
		</CollapsibleSection>
	)
}
