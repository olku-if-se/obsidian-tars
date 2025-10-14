import { AdvancedSection } from '../../components/AdvancedSection/AdvancedSection'
import { MessageTagsSection } from '../../components/MessageTagsSection/MessageTagsSection'
import { ProviderSection } from '../../components/ProviderSection/ProviderSection'
import { SystemMessageSection } from '../../components/SystemMessageSection/SystemMessageSection'
import { Section } from '../../atoms/section/Section'
import { Toggle } from '../../atoms'
import styles from './SettingsTab.module.css'

// Types - these should match your existing plugin settings
interface Provider {
  id: string
  name: string
  tag: string
  model?: string
  apiKey?: string
  capabilities?: string[]
}

interface MessageTagsData {
  newChatTags: string[]
  userTags: string[]
  systemTags: string[]
  roleEmojis: {
    newChat: string
    user: string
    system: string
  }
}

interface SettingsTabProps {
  // Provider settings
  providers: Provider[]
  availableVendors: string[]

  // Message tags
  messageTags: MessageTagsData
  defaultTags: MessageTagsData

  // System message
  enableDefaultSystemMsg: boolean
  defaultSystemMsg: string

  // Basic settings
  confirmRegenerate: boolean
  enableInternalLink: boolean

  // Advanced settings
  enableInternalLinkForAssistantMsg: boolean
  answerDelayInMilliseconds: number
  enableReplaceTag: boolean
  enableExportToJSONL: boolean
  enableTagSuggest: boolean

  // UI state
  systemMessageExpanded?: boolean
  advancedExpanded?: boolean

  // Event handlers
  onAddProvider: (vendor: string) => void
  onUpdateProvider: (id: string, updates: Partial<Provider>) => void
  onRemoveProvider: (id: string) => void
  onMessageTagsChange: (tags: Partial<MessageTagsData>) => void
  onToggleDefaultSystemMsg: (enabled: boolean) => void
  onDefaultSystemMsgChange: (message: string) => void
  onToggleConfirmRegenerate: (enabled: boolean) => void
  onToggleInternalLink: (enabled: boolean) => void
  onToggleInternalLinkForAssistant: (enabled: boolean) => void
  onDelayChange: (delay: number) => void
  onToggleReplaceTag: (enabled: boolean) => void
  onToggleExportToJSONL: (enabled: boolean) => void
  onToggleTagSuggest: (enabled: boolean) => void
  onToggleSection: (section: 'system' | 'advanced', open: boolean) => void
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  providers = [],
  availableVendors = [],
  messageTags = {
    newChatTags: [],
    userTags: [],
    systemTags: [],
    roleEmojis: {
      newChat: '🆕',
      user: '👤',
      system: '⚙️'
    }
  },
  defaultTags = {
    newChatTags: ['#NewChat'],
    userTags: ['#User'],
    systemTags: ['#System'],
    roleEmojis: {
      newChat: '🆕',
      user: '👤',
      system: '⚙️'
    }
  },
  enableDefaultSystemMsg = false,
  defaultSystemMsg = '',
  confirmRegenerate = false,
  enableInternalLink = true,
  enableInternalLinkForAssistantMsg = false,
  answerDelayInMilliseconds = 2000,
  enableReplaceTag = false,
  enableExportToJSONL = false,
  enableTagSuggest = true,
  systemMessageExpanded = false,
  advancedExpanded = false,
  onAddProvider,
  onUpdateProvider,
  onRemoveProvider,
  onMessageTagsChange,
  onToggleDefaultSystemMsg,
  onDefaultSystemMsgChange,
  onToggleConfirmRegenerate,
  onToggleInternalLink,
  onToggleInternalLinkForAssistant,
  onDelayChange,
  onToggleReplaceTag,
  onToggleExportToJSONL,
  onToggleTagSuggest,
  onToggleSection
}) => {
  const handleAddProvider = (vendor: string) => {
    if (onAddProvider) onAddProvider(vendor)
  }

  const handleUpdateProvider = (id: string, updates: Partial<Provider>) => {
    if (onUpdateProvider) onUpdateProvider(id, updates)
  }

  const handleRemoveProvider = (id: string) => {
    if (onRemoveProvider) onRemoveProvider(id)
  }

  const handleMessageTagsChange = (tags: Partial<MessageTagsData>) => {
    if (onMessageTagsChange) onMessageTagsChange(tags)
  }

  const handleToggleDefaultSystemMsg = (enabled: boolean) => {
    if (onToggleDefaultSystemMsg) onToggleDefaultSystemMsg(enabled)
  }

  const handleDefaultSystemMsgChange = (message: string) => {
    if (onDefaultSystemMsgChange) onDefaultSystemMsgChange(message)
  }

  const handleToggleConfirmRegenerate = (enabled: boolean) => {
    if (onToggleConfirmRegenerate) onToggleConfirmRegenerate(enabled)
  }

  const handleToggleInternalLink = (enabled: boolean) => {
    if (onToggleInternalLink) onToggleInternalLink(enabled)
  }

  const handleToggleInternalLinkForAssistant = (enabled: boolean) => {
    if (onToggleInternalLinkForAssistant) onToggleInternalLinkForAssistant(enabled)
  }

  const handleDelayChange = (delay: number) => {
    if (onDelayChange) onDelayChange(delay)
  }

  const handleToggleReplaceTag = (enabled: boolean) => {
    if (onToggleReplaceTag) onToggleReplaceTag(enabled)
  }

  const handleToggleExportToJSONL = (enabled: boolean) => {
    if (onToggleExportToJSONL) onToggleExportToJSONL(enabled)
  }

  const handleToggleTagSuggest = (enabled: boolean) => {
    if (onToggleTagSuggest) onToggleTagSuggest(enabled)
  }

  const handleToggleSection = (section: 'system' | 'advanced', open: boolean) => {
    if (onToggleSection) onToggleSection(section, open)
  }

  return (
    <div className={styles.settingsTab}>
      {/* AI Assistants Section */}
      <ProviderSection
        providers={providers}
        availableVendors={availableVendors}
        onAddProvider={handleAddProvider}
        onUpdateProvider={handleUpdateProvider}
        onRemoveProvider={handleRemoveProvider}
      />

      {/* Message Tags Section */}
      <MessageTagsSection
        tags={messageTags}
        onTagsChange={handleMessageTagsChange}
        defaultTags={defaultTags}
      />

      {/* System Message Section */}
      <SystemMessageSection
        enableDefaultSystemMsg={enableDefaultSystemMsg}
        defaultSystemMsg={defaultSystemMsg}
        onToggleEnable={handleToggleDefaultSystemMsg}
        onMessageChange={handleDefaultSystemMsgChange}
        defaultOpen={systemMessageExpanded}
        onToggleSection={(open) => handleToggleSection('system', open)}
      />

      {/* Basic Settings Section */}
      <Section title="Basic Settings">
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <div className={styles.settingName}>Confirm before regeneration</div>
            <div className={styles.settingDesc}>
              Confirm before replacing existing assistant responses when using assistant commands
            </div>
          </div>
          <div className={styles.settingControl}>
            <Toggle
              checked={confirmRegenerate}
              onChange={(e) => handleToggleConfirmRegenerate(e.target.checked)}
            />
          </div>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <div className={styles.settingName}>Internal links</div>
            <div className={styles.settingDesc}>
              Internal links in user and system messages will be replaced with their referenced content. When disabled, only the original text of the links will be used.
            </div>
          </div>
          <div className={styles.settingControl}>
            <Toggle
              checked={enableInternalLink}
              onChange={(e) => handleToggleInternalLink(e.target.checked)}
            />
          </div>
        </div>
      </Section>

      {/* Advanced Section */}
      <AdvancedSection
        enableInternalLinkForAssistantMsg={enableInternalLinkForAssistantMsg}
        answerDelayInMilliseconds={answerDelayInMilliseconds}
        enableReplaceTag={enableReplaceTag}
        enableExportToJSONL={enableExportToJSONL}
        enableTagSuggest={enableTagSuggest}
        onToggleInternalLinkForAssistant={handleToggleInternalLinkForAssistant}
        onDelayChange={handleDelayChange}
        onToggleReplaceTag={handleToggleReplaceTag}
        onToggleExportToJSONL={handleToggleExportToJSONL}
        onToggleTagSuggest={handleToggleTagSuggest}
        defaultOpen={advancedExpanded}
        onToggleSection={(open) => handleToggleSection('advanced', open)}
      />
    </div>
  )
}
