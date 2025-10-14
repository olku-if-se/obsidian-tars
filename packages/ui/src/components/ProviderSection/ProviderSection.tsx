import { Button, Input } from '../../atoms'
import { CollapsibleSection } from '../../atoms/section/CollapsibleSection'
import styles from './ProviderSection.module.css'

interface Provider {
  id: string
  name: string
  tag: string
  model?: string
  apiKey?: string
  capabilities?: string[]
}

interface ProviderSectionProps {
  providers: Provider[]
  availableVendors: string[]
  onAddProvider: (vendor: string) => void
  onUpdateProvider: (id: string, updates: Partial<Provider>) => void
  onRemoveProvider: (id: string) => void
}

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
        <h2>AI Assistants</h2>
        <div className={styles.addProviderButton}>
          <Button
            variant="primary"
            onClick={handleAddProvider}
          >
            Add AI Provider
          </Button>
        </div>
      </div>

      {providers.length === 0 && (
        <div className={styles.emptyState}>
          Please add at least one AI assistant to start using the plugin.
        </div>
      )}

      {providers.map((provider, index) => (
        <CollapsibleSection
          key={provider.id || `provider-${index}`}
          title={`${provider.tag || provider.name || 'Unknown'} (${provider.name || 'Unknown'})`}
          defaultOpen={index === providers.length - 1}
        >
          <div className={styles.providerContent}>
            {/* Provider settings will be rendered here */}
            <div className={styles.providerSetting}>
              <div className={styles.settingName}>✨ Assistant message tag</div>
              <div className={styles.settingDesc}>Tag used to trigger AI text generation</div>
              <div className={styles.settingControl}>
                <Input
                  value={provider.tag || ''}
                  onChange={(e) => handleUpdateProvider(provider.id, { tag: e.target.value })}
                  placeholder={provider.name || 'Tag'}
                />
              </div>
            </div>

            <div className={styles.providerSetting}>
              <div className={styles.settingName}>Model</div>
              <div className={styles.settingDesc}>
                {provider.capabilities?.map(cap => `${cap}`).join(' • ') || 'Supported features'}
              </div>
              <div className={styles.settingControl}>
                <Input
                  value={provider.model || ''}
                  onChange={(e) => handleUpdateProvider(provider.id, { model: e.target.value })}
                  placeholder="Select the model to use"
                />
                <Button variant="default">Select</Button>
              </div>
            </div>

            <div className={styles.providerSetting}>
              <div className={styles.settingName}>API key</div>
              <div className={styles.settingControl}>
                <Input
                  type="password"
                  value={provider.apiKey || ''}
                  onChange={(e) => handleUpdateProvider(provider.id, { apiKey: e.target.value })}
                  placeholder="API key (required)"
                />
              </div>
            </div>

            <div className={styles.providerSetting}>
              <div className={styles.settingName}>Test connection</div>
              <div className={styles.settingDesc}>Verify API key and network connectivity</div>
              <div className={styles.settingControl}>
                <Button variant="primary">Test</Button>
              </div>
            </div>

            <div className={styles.removeSection}>
              <div className={styles.settingName}>Remove {provider.name || 'Provider'}</div>
              <div className={styles.settingControl}>
                <Button variant="danger" onClick={() => handleRemoveProvider(provider.id)}>
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      ))}
    </div>
  )
}