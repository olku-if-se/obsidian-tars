import { Button, Input, Section, SettingRow } from '../../atoms'
import styles from './MessageTagsSection.module.css'

// Type alias for better readability
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

interface MessageTagsSectionProps {
	tags: Partial<MessageTagsData>
	onTagsChange: (tags: Partial<MessageTagsData>) => void
	defaultTags: MessageTagsData
}

// i18n keys - could be moved to a separate i18n file
const strings = {
	title: 'Message tags',
	newChatTags: 'New chat tags',
	newChatTagsDescription: 'Keywords for tags in the text box are separated by spaces. Default: #NewChat',
	userTags: 'User message tags',
	userTagsDescription: 'Keywords for tags in the text box are separated by spaces. Default: #User',
	systemTags: 'System message tags',
	systemTagsDescription: 'Keywords for tags in the text box are separated by spaces. Default: #System',
	resetButton: 'Reset'
} as const

export const MessageTagsSection = ({ tags, onTagsChange, defaultTags }: MessageTagsSectionProps) => {
	// Add safety checks with default values
	const roleEmojis = tags.roleEmojis ||
		defaultTags.roleEmojis || {
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

	const handleTagChange = (tagType: keyof MessageTagsData, value: string) => {
		const tagArray = value.split(' ').filter((tag) => tag.length > 0)
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

	// Common props object pattern for better organization
	const tagControlProps = {
		className: styles.tagControl
	}

	return (
		<Section title={strings.title}>
			<div className={styles.tagGroup}>
				<SettingRow name={`${roleEmojis.newChat} ${strings.newChatTags}`} description={strings.newChatTagsDescription}>
					<div {...tagControlProps}>
						<Button variant="default" size="sm" onClick={() => handleReset('newChatTags')}>
							{strings.resetButton}
						</Button>
						<Input
							value={newChatTags.join(' ')}
							onChange={(e) => handleTagChange('newChatTags', e.target.value)}
							placeholder={defaultNewChatTags.join(' ')}
						/>
					</div>
				</SettingRow>

				<SettingRow name={`${roleEmojis.user} ${strings.userTags}`} description={strings.userTagsDescription}>
					<div {...tagControlProps}>
						<Button variant="default" size="sm" onClick={() => handleReset('userTags')}>
							{strings.resetButton}
						</Button>
						<Input
							value={userTags.join(' ')}
							onChange={(e) => handleTagChange('userTags', e.target.value)}
							placeholder={defaultUserTags.join(' ')}
						/>
					</div>
				</SettingRow>

				<SettingRow name={`${roleEmojis.system} ${strings.systemTags}`} description={strings.systemTagsDescription}>
					<div {...tagControlProps}>
						<Button variant="default" size="sm" onClick={() => handleReset('systemTags')}>
							{strings.resetButton}
						</Button>
						<Input
							value={systemTags.join(' ')}
							onChange={(e) => handleTagChange('systemTags', e.target.value)}
							placeholder={defaultSystemTags.join(' ')}
						/>
					</div>
				</SettingRow>
			</div>
		</Section>
	)
}
