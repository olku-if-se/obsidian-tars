import clsx from 'clsx'
import { AdvancedSection } from '../../components/AdvancedSection/AdvancedSection'
import { MessageTagsSection } from '../../components/MessageTagsSection/MessageTagsSection'
import { ProviderSection } from '../../components/ProviderSection/ProviderSection'
import { SystemMessageSection } from '../../components/SystemMessageSection/SystemMessageSection'
import { Section } from '../../atoms/section/Section'
import { SettingRow } from '../../atoms/setting/SettingRow'
import { Toggle } from '../../atoms'
import styles from './SettingsTab.module.css'

// Type aliases for better readability
type Provider = {
  id: string
  name: string
  tag: string
  model?: string
  apiKey?: string
  capabilities?: string[]
}

type MessageTagsData = {
  newChatTags: string[]
  userTags: string[]
  systemTags: string[]
  roleEmojis: {
    newChat: string
    user: string
    system: string
  }
}

// Bundled data props
type SettingsTabData = {
  providers: Provider[]
  availableVendors: string[]
  messageTags: MessageTagsData
  defaultTags: MessageTagsData
  systemMessage: {
    enabled: boolean
    message: string
  }
  basicSettings: {
    confirmRegenerate: boolean
    enableInternalLink: boolean
  }
}

// Bundled UI state props
type SettingsTabUI = {
  systemMessageExpanded?: boolean
  advancedExpanded?: boolean
}

// Bundled event handlers
type SettingsTabEvents = {
  onAddProvider: (vendor: string) => void
  onUpdateProvider: (id: string, updates: Partial<Provider>) => void
  onRemoveProvider: (id: string) => void
  onMessageTagsChange: (tags: Partial<MessageTagsData>) => void
  onSystemMessageChange: (enabled: boolean, message: string) => void
  onBasicSettingsChange: (settings: Partial<SettingsTabData['basicSettings']>) => void
  onToggleSection: (section: 'system' | 'advanced', open: boolean) => void
}

// Advanced settings props (passed through to AdvancedSection)
type AdvancedSettingsProps = {
  enableInternalLinkForAssistantMsg: boolean
  answerDelayInMilliseconds: number
  enableReplaceTag: boolean
  enableExportToJSONL: boolean
  enableTagSuggest: boolean
  onToggleInternalLinkForAssistant: (enabled: boolean) => void
  onDelayChange: (delay: number) => void
  onToggleReplaceTag: (enabled: boolean) => void
  onToggleExportToJSONL: (enabled: boolean) => void
  onToggleTagSuggest: (enabled: boolean) => void
}

type SettingsTabProps = SettingsTabData & SettingsTabUI & SettingsTabEvents & AdvancedSettingsProps

// i18n strings object
const strings = {
  basicSettings: 'Basic Settings',
  confirmRegenerate: 'Confirm before regeneration',
  confirmRegenerateDesc: 'Confirm before replacing existing assistant responses when using assistant commands',
  internalLinks: 'Internal links',
  internalLinksDesc: 'Internal links in user and system messages will be replaced with their referenced content. When disabled, only the original text of the links will be used.'
} as const

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
  systemMessage = {
    enabled: false,
    message: ''
  },
  basicSettings = {
    confirmRegenerate: false,
    enableInternalLink: true
  },
  systemMessageExpanded = false,
  advancedExpanded = false,
  onAddProvider,
  onUpdateProvider,
  onRemoveProvider,
  onMessageTagsChange,
  onSystemMessageChange,
  onBasicSettingsChange,
  onToggleSection,
  // Advanced settings props (pass through)
  enableInternalLinkForAssistantMsg,
  answerDelayInMilliseconds,
  enableReplaceTag,
  enableExportToJSONL,
  enableTagSuggest,
  onToggleInternalLinkForAssistant,
  onDelayChange,
  onToggleReplaceTag,
  onToggleExportToJSONL,
  onToggleTagSuggest
}) => {
  // Event handlers that work with bundled props
  const eventHandlers = {
    provider: {
      onAddProvider: (vendor: string) => {
        if (onAddProvider) onAddProvider(vendor)
      },
      onUpdateProvider: (id: string, updates: Partial<Provider>) => {
        if (onUpdateProvider) onUpdateProvider(id, updates)
      },
      onRemoveProvider: (id: string) => {
        if (onRemoveProvider) onRemoveProvider(id)
      }
    },
    messageTags: (tags: Partial<MessageTagsData>) => {
      if (onMessageTagsChange) onMessageTagsChange(tags)
    },
    systemMessage: {
      onToggleEnable: (enabled: boolean) => {
        if (onSystemMessageChange) onSystemMessageChange(enabled, systemMessage.message)
      },
      onMessageChange: (message: string) => {
        if (onSystemMessageChange) onSystemMessageChange(systemMessage.enabled, message)
      }
    },
    basicSettings: (setting: keyof SettingsTabData['basicSettings'], value: boolean) => {
      if (onBasicSettingsChange) onBasicSettingsChange({ [setting]: value })
    },
    onToggleSection: (section: 'system' | 'advanced', open: boolean) => {
      if (onToggleSection) onToggleSection(section, open)
    }
  }

  return (
    <div className={styles.settingsTab}>
      {/* AI Assistants Section */}
      <ProviderSection
        providers={providers}
        availableVendors={availableVendors}
        {...eventHandlers.provider}
      />

      {/* Message Tags Section */}
      <MessageTagsSection
        tags={messageTags}
        onTagsChange={eventHandlers.messageTags}
        defaultTags={defaultTags}
      />

      {/* System Message Section */}
      <SystemMessageSection
        enableDefaultSystemMsg={systemMessage.enabled}
        defaultSystemMsg={systemMessage.message}
        onToggleEnable={eventHandlers.systemMessage.onToggleEnable}
        onMessageChange={eventHandlers.systemMessage.onMessageChange}
        defaultOpen={systemMessageExpanded}
        onToggleSection={(open) => eventHandlers.onToggleSection('system', open)}
      />

      {/* Basic Settings Section */}
      <Section title={strings.basicSettings}>
        <SettingRow
          name={strings.confirmRegenerate}
          description={strings.confirmRegenerateDesc}
        >
          <Toggle
            checked={basicSettings.confirmRegenerate}
            onChange={(e) => eventHandlers.basicSettings('confirmRegenerate', e.target.checked)}
          />
        </SettingRow>

        <SettingRow
          name={strings.internalLinks}
          description={strings.internalLinksDesc}
        >
          <Toggle
            checked={basicSettings.enableInternalLink}
            onChange={(e) => eventHandlers.basicSettings('enableInternalLink', e.target.checked)}
          />
        </SettingRow>
      </Section>

      {/* Advanced Section */}
      <AdvancedSection
        enableInternalLinkForAssistantMsg={enableInternalLinkForAssistantMsg}
        answerDelayInMilliseconds={answerDelayInMilliseconds}
        enableReplaceTag={enableReplaceTag}
        enableExportToJSONL={enableExportToJSONL}
        enableTagSuggest={enableTagSuggest}
        onToggleInternalLinkForAssistant={onToggleInternalLinkForAssistant}
        onDelayChange={onDelayChange}
        onToggleReplaceTag={onToggleReplaceTag}
        onToggleExportToJSONL={onToggleExportToJSONL}
        onToggleTagSuggest={onToggleTagSuggest}
        defaultOpen={advancedExpanded}
        onToggleSection={(open) => eventHandlers.onToggleSection('advanced', open)}
      />
    </div>
  )
}
