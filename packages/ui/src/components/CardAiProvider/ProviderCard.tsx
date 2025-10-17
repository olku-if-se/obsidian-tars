import { Button, CollapsibleSection, Input, SettingRow } from '~/atoms'
import { t } from '../../locales/i18n'
import styles from './ProviderCard.module.css'
import type { Provider } from './types'

export const strings = {
	assistantMessageTag: t('providerSection.assistantMessageTag'),
	assistantMessageTagDesc: t('providerSection.assistantMessageTagDesc'),
	model: t('providerSection.model'),
	modelPlaceholder: t('providerSection.modelPlaceholder'),
	supportedFeatures: t('providerSection.supportedFeatures'),
	select: t('providerSection.select'),
	apiKey: t('providerSection.apiKey'),
	apiKeyPlaceholder: t('providerSection.apiKeyPlaceholder'),
	controlsTitle: t('providerSection.controlsTitle'),
	controlsDescription: t('providerSection.controlsDescription'),
	disableButton: t('providerSection.disable'),
	testButton: t('providerSection.test'),
	removeButton: t('providerSection.remove'),
	sectionTitle: t('providerSection.sectionTitle')
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
				<SettingRow name={strings.assistantMessageTag} description={strings.assistantMessageTagDesc}>
					<Input
						value={provider.tag || ''}
						onChange={(e) => onUpdateProvider(provider.id, { tag: e.target.value })}
						placeholder={provider.name || strings.assistantMessageTag}
					/>
				</SettingRow>

				<SettingRow name={strings.model} description={capabilitiesDescription}>
					<div className={styles.settingControl}>
						<Input
							value={provider.model || ''}
							onChange={(e) => onUpdateProvider(provider.id, { model: e.target.value })}
							placeholder={strings.modelPlaceholder}
						/>
						<Button variant='default'>{strings.select}</Button>
					</div>
				</SettingRow>

				<SettingRow name={strings.apiKey}>
					<Input
						type='password'
						value={provider.apiKey || ''}
						onChange={(e) => onUpdateProvider(provider.id, { apiKey: e.target.value })}
						placeholder={strings.apiKeyPlaceholder}
					/>
				</SettingRow>

				<SettingRow name={strings.controlsTitle} description={strings.controlsDescription}>
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
