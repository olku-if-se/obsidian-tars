import { TextArea, Toggle } from '../../atoms'
import { CollapsibleSection } from '../../atoms/section/CollapsibleSection'
import styles from './SystemMessageSection.module.css'

interface SystemMessageSectionProps {
  enableDefaultSystemMsg: boolean
  defaultSystemMsg: string
  onToggleEnable: (enabled: boolean) => void
  onMessageChange: (message: string) => void
  defaultOpen?: boolean
  onToggleSection?: (open: boolean) => void
}

export const SystemMessageSection = ({
  enableDefaultSystemMsg,
  defaultSystemMsg,
  onToggleEnable,
  onMessageChange,
  defaultOpen = false,
  onToggleSection
}: SystemMessageSectionProps) => {
  return (
    <CollapsibleSection
      title="System message"
      defaultOpen={defaultOpen}
      onToggle={onToggleSection || (() => {})}
      className={styles.systemMessageSection}
    >
      <div className={styles.settingRow}>
        <div className={styles.settingInfo}>
          <div className={styles.settingName}>Enable default system message</div>
          <div className={styles.settingDesc}>
            Automatically add a system message when none exists in the conversation
          </div>
        </div>
        <div className={styles.settingControl}>
          <Toggle
            checked={enableDefaultSystemMsg}
            onChange={(e) => onToggleEnable(e.target.checked)}
          />
        </div>
      </div>

      <div className={styles.settingRow}>
        <div className={styles.settingInfo}>
          <div className={styles.settingName}>Default system message</div>
        </div>
        <div className={styles.settingControl}>
          <TextArea
            value={defaultSystemMsg}
            onChange={(e) => onMessageChange(e.target.value)}
            disabled={!enableDefaultSystemMsg}
            placeholder="Enter your default system message..."
            rows={6}
            className={styles.textArea}
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}