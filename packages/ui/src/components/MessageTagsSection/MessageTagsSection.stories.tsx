import type { Meta, StoryObj } from '@storybook/react-vite'
import { MessageTagsSection } from './MessageTagsSection'

const meta = {
	title: 'Components/MessageTagsSection',
	component: MessageTagsSection,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs']
} satisfies Meta<typeof MessageTagsSection>

export default meta
type Story = StoryObj<typeof meta>

const defaultTags = {
	newChatTags: ['newchat', '#new'],
	userTags: ['user', '#user'],
	systemTags: ['system', '#system'],
	roleEmojis: {
		newChat: '🆕',
		user: '👤',
		system: '⚙️'
	}
}

export const DefaultTags: Story = {
	args: {
		tags: defaultTags,
		defaultTags: defaultTags,
		onTagsChange: (tags: any) => console.log('tags-change', tags)
	}
}

export const CustomTags: Story = {
	args: {
		tags: {
			newChatTags: ['new', '#start', 'begin'],
			userTags: ['human', '#person', 'me'],
			systemTags: ['sys', '#instructions', 'context'],
			roleEmojis: {
				newChat: '🚀',
				user: '😊',
				system: '🤖'
			}
		},
		defaultTags: defaultTags,
		onTagsChange: (tags: any) => console.log('tags-change', tags)
	}
}

export const MinimalTags: Story = {
	args: {
		tags: {
			newChatTags: ['#new'],
			userTags: ['#user'],
			systemTags: ['#system'],
			roleEmojis: {
				newChat: '🆕',
				user: '👤',
				system: '⚙️'
			}
		},
		defaultTags: defaultTags,
		onTagsChange: (tags: any) => console.log('tags-change', tags)
	}
}

export const ExtendedTags: Story = {
	args: {
		tags: {
			newChatTags: ['newchat', '#new', 'start', 'begin', 'reset', '#start'],
			userTags: ['user', '#user', 'human', '#person', 'me', '#me', 'question'],
			systemTags: ['system', '#system', 'context', 'instructions', '#context', 'prompt'],
			roleEmojis: {
				newChat: '🆕',
				user: '👤',
				system: '⚙️'
			}
		},
		defaultTags: defaultTags,
		onTagsChange: (tags: any) => console.log('tags-change', tags)
	}
}

export const CustomEmojis: Story = {
	args: {
		tags: {
			newChatTags: ['newchat', '#new'],
			userTags: ['user', '#user'],
			systemTags: ['system', '#system'],
			roleEmojis: {
				newChat: '🌟',
				user: '💬',
				system: '📋'
			}
		},
		defaultTags: defaultTags,
		onTagsChange: (tags: any) => console.log('tags-change', tags)
	}
}

export const EmptyTags: Story = {
	args: {
		tags: {
			newChatTags: [],
			userTags: [],
			systemTags: [],
			roleEmojis: {
				newChat: '🆕',
				user: '👤',
				system: '⚙️'
			}
		},
		defaultTags: defaultTags,
		onTagsChange: (tags: any) => console.log('tags-change', tags)
	}
}

export const SingleTagPerCategory: Story = {
	args: {
		tags: {
			newChatTags: ['#start'],
			userTags: ['#ask'],
			systemTags: ['#instruct'],
			roleEmojis: {
				newChat: '🎯',
				user: '❓',
				system: '📝'
			}
		},
		defaultTags: defaultTags,
		onTagsChange: (tags: any) => console.log('tags-change', tags)
	}
}

export const ProfessionalEmojis: Story = {
	args: {
		tags: {
			newChatTags: ['session', '#session'],
			userTags: ['request', '#request'],
			systemTags: ['configuration', '#config'],
			roleEmojis: {
				newChat: '📁',
				user: '📨',
				system: '⚙️'
			}
		},
		defaultTags: defaultTags,
		onTagsChange: (tags: any) => console.log('tags-change', tags)
	}
}

export const CreativeEmojis: Story = {
	args: {
		tags: {
			newChatTags: ['spark', '#spark'],
			userTags: ['wonder', '#wonder'],
			systemTags: ['magic', '#magic'],
			roleEmojis: {
				newChat: '✨',
				user: '🤔',
				system: '🎩'
			}
		},
		defaultTags: defaultTags,
		onTagsChange: (tags: any) => console.log('tags-change', tags)
	}
}