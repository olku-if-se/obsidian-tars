import { Button, Input } from '../../atoms'
import { Section } from '../../atoms/section/Section'
import styles from './MessageTagsSection.module.css'

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

interface MessageTagsSectionProps {
  tags: MessageTagsData
  onTagsChange: (tags: Partial<MessageTagsData>) => void
  defaultTags: MessageTagsData
}

export const MessageTagsSection = ({
  tags,
  onTagsChange,
  defaultTags
}: MessageTagsSectionProps) => {
  // Add safety checks with default values
  const roleEmojis = tags.roleEmojis || defaultTags.roleEmojis || {
    newChat: '🆕',
    user: '👤',
    system: '⚙️'
  }

  const newChatTags = tags.newChatTags || []
  const userTags = tags.userTags || []
  const systemTags = tags.systemTags || []
  const defaultNewChatTags = defaultTags.newChatTags || []
  const defaultUserTags = defaultTags.userTags || []
  const defaultSystemTags = defaultTags.systemTags || []

  const handleTagChange = (
    tagType: keyof MessageTagsData,
    value: string
  ) => {
    const tagArray = value.split(' ').filter(tag => tag.length > 0)
    onTagsChange({
      ...tags,
      [tagType]: tagArray
    })
  }

  const handleReset = (tagType: keyof MessageTagsData) => {
    onTagsChange({
      ...tags,
      [tagType]: defaultTags[tagType]
    })
  }

  return (
    <Section title="Message tags">
      <div className={styles.sectionDesc}>
        Keywords for tags in the text box are separated by spaces
      </div>

      <div className={styles.tagGroup}>
        <div className={styles.tagSetting}>
          <div className={styles.tagHeader}>
            <span className={styles.tagName}>
              {roleEmojis.newChat} New chat tags
            </span>
          </div>
          <div className={styles.tagControl}>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleReset('newChatTags')}
            >
              Reset
            </Button>
            <Input
              value={newChatTags.join(' ')}
              onChange={(e) => handleTagChange('newChatTags', e.target.value)}
              placeholder={defaultNewChatTags.join(' ')}
            />
          </div>
        </div>

        <div className={styles.tagSetting}>
          <div className={styles.tagHeader}>
            <span className={styles.tagName}>
              {roleEmojis.user} User message tags
            </span>
          </div>
          <div className={styles.tagControl}>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleReset('userTags')}
            >
              Reset
            </Button>
            <Input
              value={userTags.join(' ')}
              onChange={(e) => handleTagChange('userTags', e.target.value)}
              placeholder={defaultUserTags.join(' ')}
            />
          </div>
        </div>

        <div className={styles.tagSetting}>
          <div className={styles.tagHeader}>
            <span className={styles.tagName}>
              {roleEmojis.system} System message tags
            </span>
          </div>
          <div className={styles.tagControl}>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleReset('systemTags')}
            >
              Reset
            </Button>
            <Input
              value={systemTags.join(' ')}
              onChange={(e) => handleTagChange('systemTags', e.target.value)}
              placeholder={defaultSystemTags.join(' ')}
            />
          </div>
        </div>
      </div>
    </Section>
  )
}