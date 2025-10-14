import { Button, Input, Slider, Toggle } from '../../atoms'
import { CollapsibleSection } from '../../atoms/section/CollapsibleSection'
import styles from './AdvancedSection.module.css'

interface AdvancedSectionProps {
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
  defaultOpen?: boolean
  onToggleSection?: (open: boolean) => void
}

export const AdvancedSection = ({
  enableInternalLinkForAssistantMsg,
  answerDelayInMilliseconds,
  enableReplaceTag,
  enableExportToJSONL,
  enableTagSuggest,
  onToggleInternalLinkForAssistant,
  onDelayChange,
  onToggleReplaceTag,
  onToggleExportToJSONL,
  onToggleTagSuggest,
  defaultOpen = false,
  onToggleSection
}: AdvancedSectionProps) => {
  const delayInSeconds = answerDelayInMilliseconds / 1000

  return (
    <CollapsibleSection
      title="Advanced"
      defaultOpen={defaultOpen}
      onToggle={onToggleSection || (() => {})}
      className={styles.advancedSection}
    >
      <div className={styles.settingRow}>
        <div className={styles.settingInfo}>
          <div className={styles.settingName}>Internal links for assistant messages</div>
          <div className={styles.settingDesc}>
            Replace internal links in assistant messages with their referenced content. Note: This feature is generally not recommended as assistant-generated content may contain non-existent links.
          </div>
        </div>
        <div className={styles.settingControl}>
          <Toggle
            checked={enableInternalLinkForAssistantMsg}
            onChange={(e) => onToggleInternalLinkForAssistant(e.target.checked)}
          />
        </div>
      </div>

      <div className={styles.settingRow}>
        <div className={styles.settingInfo}>
          <div className={styles.settingName}>Delay before answer (Seconds)</div>
          <div className={styles.settingDesc}>
            If you encounter errors with missing user messages when executing assistant commands on selected text, it may be due to the need for more time to parse the messages. Please slightly increase the delay time.
          </div>
        </div>
        <div className={styles.settingControl}>
          <Button
            variant="default"
            size="sm"
            onClick={() => onDelayChange(2000)}
          >
            Reset
          </Button>
          <Slider
            min={1.5}
            max={4}
            step={0.5}
            value={delayInSeconds}
            onChange={(e) => onDelayChange(Math.round(parseFloat(e.target.value) * 1000))}
            showValue
            valueFormatter={(value) => `${value}s`}
            className={styles.delaySlider}
          />
        </div>
      </div>

      <div className={styles.settingRow}>
        <div className={styles.settingInfo}>
          <div className={styles.settingName}>Replace tag Command</div>
          <div className={styles.settingDesc}>
            Replace the names of the two most frequently occurring speakers with tag format.
          </div>
        </div>
        <div className={styles.settingControl}>
          <Toggle
            checked={enableReplaceTag}
            onChange={(e) => onToggleReplaceTag(e.target.checked)}
          />
        </div>
      </div>

      <div className={styles.settingRow}>
        <div className={styles.settingInfo}>
          <div className={styles.settingName}>Export to JSONL Command</div>
          <div className={styles.settingDesc}>
            Export conversations to JSONL
          </div>
        </div>
        <div className={styles.settingControl}>
          <Toggle
            checked={enableExportToJSONL}
            onChange={(e) => onToggleExportToJSONL(e.target.checked)}
          />
        </div>
      </div>

      <div className={styles.settingRow}>
        <div className={styles.settingInfo}>
          <div className={styles.settingName}>Tag suggest</div>
          <div className={styles.settingDesc}>
            If you only use commands without needing tag suggestions, you can disable this feature. Changes will take effect after restarting the plugin.
          </div>
        </div>
        <div className={styles.settingControl}>
          <Toggle
            checked={enableTagSuggest}
            onChange={(e) => onToggleTagSuggest(e.target.checked)}
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}