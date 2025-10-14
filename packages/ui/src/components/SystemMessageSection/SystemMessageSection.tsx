import clsx from 'clsx'
import { TextArea, Toggle } from '../../atoms'
import { CollapsibleSection } from '../../atoms/section/CollapsibleSection'
import { SettingRow } from '../../atoms/setting/SettingRow'
import styles from './SystemMessageSection.module.css'

// Type alias for better readability
type SystemMessageSectionProps = {
  enableDefaultSystemMsg: boolean
  defaultSystemMsg: string
  onToggleEnable: (enabled: boolean) => void
  onMessageChange: (message: string) => void
  defaultOpen?: boolean
  onToggleSection?: (open: boolean) => void
}

// i18n strings object
const strings = {
  title: 'System message',
  enableDefaultSystemMsg: 'Enable default system message',
  enableDefaultSystemMsgDescription: 'Automatically add a system message when none exists in the conversation',
  defaultSystemMsg: 'Default system message',
  defaultMessagePlaceholder: 'Enter your default system message...'
} as const

export const SystemMessageSection = ({
  enableDefaultSystemMsg,
  defaultSystemMsg,
  onToggleEnable,
  onMessageChange,
  defaultOpen = false,
  onToggleSection = () => {}
}: SystemMessageSectionProps) => {
  // Props object pattern for better organization
  const textAreaProps = {
    value: defaultSystemMsg,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => onMessageChange(e.target.value),
    disabled: !enableDefaultSystemMsg,
    placeholder: strings.defaultMessagePlaceholder,
    rows: 6,
    className: styles.textArea
  }

  const toggleProps = {
    checked: enableDefaultSystemMsg,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onToggleEnable(e.target.checked)
  }

  const collapsibleSectionProps = {
    title: strings.title,
    defaultOpen,
    onToggle: onToggleSection,
    className: styles.systemMessageSection
  }

  return (
    <CollapsibleSection {...collapsibleSectionProps}>
      <SettingRow
        name={strings.enableDefaultSystemMsg}
        description={strings.enableDefaultSystemMsgDescription}
      >
        <Toggle {...toggleProps} />
      </SettingRow>

      <SettingRow
        name={strings.defaultSystemMsg}
        vertical={true}
      >
        <TextArea {...textAreaProps} />
      </SettingRow>
    </CollapsibleSection>
  )
}