import { Button } from '~/atoms'
import { t } from '~/locales/i18n'
import { ProviderCard } from '../providers/CardAiProvider'
import type { Provider } from '../providers/types'
import styles from './ProviderSection.module.css'

type ProviderSectionProps = {
	providers: Provider[]
	availableVendors: string[]
	onAddProvider: (vendor: string) => void
	onUpdateProvider: (id: string, updates: Partial<Provider>) => void
	onRemoveProvider: (id: string) => void
}

const strings = {
	title: t('providerSection.title'),
	addProvider: t('providerSection.addProvider'),
	emptyState: t('providerSection.emptyState'),
	assistantMessageTag: t('providerSection.assistantMessageTag'),
	assistantMessageTagDesc: t('providerSection.assistantMessageTagDesc'),
	model: t('providerSection.model'),
	modelPlaceholder: t('providerSection.modelPlaceholder'),
	apiKey: t('providerSection.apiKey'),
	apiKeyPlaceholder: t('providerSection.apiKeyPlaceholder'),
	select: t('providerSection.select'),
	supportedFeatures: t('providerSection.supportedFeatures'),
	disableButton: t('providerSection.disable'),
	testButton: t('providerSection.test'),
	removeButton: t('providerSection.remove'),
	sectionTitle: t('providerSection.sectionTitle'),
	controlsTitle: t('providerSection.controlsTitle'),
	controlsDescription: t('providerSection.controlsDescription')
} as const

export const ProviderSection = ({
	providers = [],
	availableVendors = [],
	onAddProvider,
	onUpdateProvider,
	onRemoveProvider
}: ProviderSectionProps) => {
	const handleAddProvider = () => {
		// For now, just add first available vendor
		// In real implementation, this would open a modal
		const vendor = availableVendors[0]
		if (vendor && onAddProvider) {
			onAddProvider(vendor)
		}
	}

	const handleUpdateProvider = (id: string, updates: Partial<Provider>) => {
		if (onUpdateProvider) {
			onUpdateProvider(id, updates)
		}
	}

	const handleRemoveProvider = (id: string) => {
		if (onRemoveProvider) {
			onRemoveProvider(id)
		}
	}

	return (
		<div className={styles.providerSection}>
			<div className={styles.sectionHeader}>
				<h2>{strings.title}</h2>
				<div className={styles.addProviderButton}>
					<Button variant='primary' onClick={handleAddProvider}>
						{strings.addProvider}
					</Button>
				</div>
			</div>

			{providers.length === 0 && <div className={styles.emptyState}>{strings.emptyState}</div>}

			{providers.map((provider, index) => (
				<ProviderCard
					key={provider.id || `provider-${index}`}
					provider={provider}
					isExpanded={index === providers.length - 1}
					onUpdateProvider={handleUpdateProvider}
					onRemoveProvider={handleRemoveProvider}
				/>
			))}
		</div>
	)
}
