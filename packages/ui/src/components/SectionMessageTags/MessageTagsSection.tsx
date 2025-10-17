import { Button, Input, Section, SettingRow } from '~/atoms'
import { t } from '../../locales/i18n'
import styles from './MessageTagsSection.module.css'

type MessageTagsData = {
	newChatTags: string[]
	userTags: string[]
	systemTags: string[]
}

interface MessageTagsSectionProps {
	tags: Partial<MessageTagsData>
	onTagsChange: (tags: Partial<MessageTagsData>) => void
	defaultTags: MessageTagsData
}

const strings = {
	title: t('messageTags.title'),
	newChatTagsLabel: t('messageTags.newChatTagsLabel'),
	newChatTagsDescription: t('messageTags.newChatTagsDescription'),
	userTagsLabel: t('messageTags.userTagsLabel'),
	userTagsDescription: t('messageTags.userTagsDescription'),
	systemTagsLabel: t('messageTags.systemTagsLabel'),
	systemTagsDescription: t('messageTags.systemTagsDescription'),
	resetButton: t('messageTags.resetButton')
}

export const MessageTagsSection = ({ tags, onTagsChange, defaultTags }: MessageTagsSectionProps) => {
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

	return (
		<Section title={strings.title}>
			<div className={styles.tagGroup}>
				<SettingRow name={strings.newChatTagsLabel} description={strings.newChatTagsDescription}>
					<div className={styles.tagControl}>
						<Button size='sm' onClick={() => handleReset('newChatTags')}>
							{strings.resetButton}
						</Button>
						<Input
							value={newChatTags.join(' ')}
							onChange={(e) => handleTagChange('newChatTags', e.target.value)}
							placeholder={defaultNewChatTags.join(' ')}
							className={styles.tagInput}
						/>
					</div>
				</SettingRow>

				<SettingRow name={strings.userTagsLabel} description={strings.userTagsDescription}>
					<div className={styles.tagControl}>
						<Button size='sm' onClick={() => handleReset('userTags')}>
							{strings.resetButton}
						</Button>
						<Input
							value={userTags.join(' ')}
							onChange={(e) => handleTagChange('userTags', e.target.value)}
							placeholder={defaultUserTags.join(' ')}
							className={styles.tagInput}
						/>
					</div>
				</SettingRow>

				<SettingRow name={strings.systemTagsLabel} description={strings.systemTagsDescription}>
					<div className={styles.tagControl}>
						<Button size='sm' onClick={() => handleReset('systemTags')}>
							{strings.resetButton}
						</Button>
						<Input
							value={systemTags.join(' ')}
							onChange={(e) => handleTagChange('systemTags', e.target.value)}
							placeholder={defaultSystemTags.join(' ')}
							className={styles.tagInput}
						/>
					</div>
				</SettingRow>
			</div>
		</Section>
	)
}
