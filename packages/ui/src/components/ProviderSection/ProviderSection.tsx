import { Button, CollapsibleSection, Input, SettingRow } from '../../atoms'
import styles from './ProviderSection.module.css'

// Type alias for better readability
type Provider = {
	id: string
	name: string
	tag: string
	model?: string
	apiKey?: string
	capabilities?: string[]
}

type ProviderSectionProps = {
	providers: Provider[]
	availableVendors: string[]
	onAddProvider: (vendor: string) => void
	onUpdateProvider: (id: string, updates: Partial<Provider>) => void
	onRemoveProvider: (id: string) => void
}

// i18n strings object
const strings = {
	title: 'AI Assistants',
	addProvider: 'Add AI Provider',
	emptyState: 'Please add at least one AI assistant to start using the plugin.',
	assistantMessageTag: '✨ Assistant message tag',
	assistantMessageTagDesc: 'Tag used to trigger AI text generation',
	model: 'Model',
	modelPlaceholder: 'Select the model to use',
	apiKey: 'API key',
	apiKeyPlaceholder: 'API key (required)',
	testConnection: 'Test connection',
	testConnectionDesc: 'Verify API key and network connectivity',
	testButton: 'Test',
	disableButton: 'Disable',
	remove: 'Delete',
	controlProvider: 'Controls',
	controls: 'Test connection or remove this provider',
	select: 'Select',
	supportedFeatures: 'Supported features'
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
					<Button variant="primary" onClick={handleAddProvider}>
						{strings.addProvider}
					</Button>
				</div>
			</div>

			{providers.length === 0 && <div className={styles.emptyState}>{strings.emptyState}</div>}

			{providers.map((provider, index) => (
				<CollapsibleSection
					key={provider.id || `provider-${index}`}
					title={`${provider.tag || provider.name || 'Unknown'} (${provider.name || 'Unknown'})`}
					defaultOpen={index === providers.length - 1}
				>
					<div className={styles.providerContent}>
						{/* Provider settings using SettingRow pattern */}
						<SettingRow name={strings.assistantMessageTag} description={strings.assistantMessageTagDesc}>
							<Input
								value={provider.tag || ''}
								onChange={(e) => handleUpdateProvider(provider.id, { tag: e.target.value })}
								placeholder={provider.name || 'Tag'}
							/>
						</SettingRow>

						<SettingRow
							name={strings.model}
							description={provider.capabilities?.map((cap) => `${cap}`).join(' • ') || strings.supportedFeatures}
						>
							<div className={styles.settingControl}>
								<Input
									value={provider.model || ''}
									onChange={(e) => handleUpdateProvider(provider.id, { model: e.target.value })}
									placeholder={strings.modelPlaceholder}
								/>
								<Button variant="default">{strings.select}</Button>
							</div>
						</SettingRow>

						<SettingRow name={strings.apiKey}>
							<Input
								type="password"
								value={provider.apiKey || ''}
								onChange={(e) => handleUpdateProvider(provider.id, { apiKey: e.target.value })}
								placeholder={strings.apiKeyPlaceholder}
							/>
						</SettingRow>

						<SettingRow name={strings.controlProvider.replace('{name}', provider.name || 'Provider')}
							description={strings.controls}>
							<Button variant="primary">{strings.disableButton}</Button>
							<Button variant="primary">{strings.testButton}</Button>
							<Button variant="danger" onClick={() => handleRemoveProvider(provider.id)}>
								{strings.remove}
							</Button>
						</SettingRow>
					</div>
				</CollapsibleSection>
			))}
		</div>
	)
}
