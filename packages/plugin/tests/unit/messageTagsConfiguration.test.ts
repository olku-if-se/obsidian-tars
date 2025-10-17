import { describe, it, expect, beforeEach } from 'vitest'
import { adaptObsidianToReact, adaptReactToObsidian, mergeReactChanges } from '../../src/adapters/reactSettingsAdapter'

describe('Message Tags Configuration - Unit Tests', () => {
	let mockObsidianSettings: any

	beforeEach(() => {
		// Create a mock Obsidian settings object with message tags
		mockObsidianSettings = {
			newChatTags: ['#NewChat', '#Start'],
			userTags: ['#User', '#Human'],
			systemTags: ['#System', '#Instructions'],
			roleEmojis: {
				newChat: '🆕',
				user: '👤',
				system: '⚙️',
				assistant: '✨'
			},
			providers: [],
			features: {
				reactSettingsTab: true,
				reactStatusBar: false,
				reactModals: false,
				reactMcpUI: false
			}
		}
	})

	describe('Obsidian to React Message Tags Transformation', () => {
		it('should transform message tags correctly', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			expect(reactState.messageTags).toBeDefined()
			expect(reactState.messageTags.newChatTags).toEqual(['#NewChat', '#Start'])
			expect(reactState.messageTags.userTags).toEqual(['#User', '#Human'])
			expect(reactState.messageTags.systemTags).toEqual(['#System', '#Instructions'])
			expect(reactState.messageTags.roleEmojis).toEqual({
				newChat: '🆕',
				user: '👤',
				system: '⚙️',
				assistant: '✨'
			})
		})

		it('should handle empty message tags', () => {
			const emptySettings = {
				...mockObsidianSettings,
				newChatTags: [],
				userTags: [],
				systemTags: []
			}

			const reactState = adaptObsidianToReact(emptySettings)

			expect(reactState.messageTags.newChatTags).toEqual([])
			expect(reactState.messageTags.userTags).toEqual([])
			expect(reactState.messageTags.systemTags).toEqual([])
		})

		it('should handle default role emojis when not provided', () => {
			const settingsWithoutEmojis = {
				...mockObsidianSettings,
				roleEmojis: undefined
			}

			const reactState = adaptObsidianToReact(settingsWithoutEmojis)

			expect(reactState.messageTags.roleEmojis).toBeDefined()
		})

		it('should preserve tag formats during transformation', () => {
			const customTags = {
				...mockObsidianSettings,
				newChatTags: ['#custom-start', '#new-session'],
				userTags: ['#person', '#human-writer'],
				systemTags: ['#ai-instructions', '#prompt']
			}

			const reactState = adaptObsidianToReact(customTags)

			expect(reactState.messageTags.newChatTags).toEqual(['#custom-start', '#new-session'])
			expect(reactState.messageTags.userTags).toEqual(['#person', '#human-writer'])
			expect(reactState.messageTags.systemTags).toEqual(['#ai-instructions', '#prompt'])
		})
	})

	describe('React to Obsidian Message Tags Transformation', () => {
		it('should transform React message tags back to Obsidian format', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.newChatTags).toEqual(['#NewChat', '#Start'])
			expect(obsidianUpdates.userTags).toEqual(['#User', '#Human'])
			expect(obsidianUpdates.systemTags).toEqual(['#System', '#Instructions'])
			expect(obsidianUpdates.roleEmojis).toEqual({
				newChat: '🆕',
				user: '👤',
				system: '⚙️',
				assistant: '✨'
			})
		})

		it('should handle updated message tags from React', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Update tags in React state
			reactState.messageTags.newChatTags = ['#NewChat', '#Start', '#Begin']
			reactState.messageTags.userTags = ['#User', '#Human', '#Writer']
			reactState.messageTags.roleEmojis.newChat = '🚀'

			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.newChatTags).toEqual(['#NewChat', '#Start', '#Begin'])
			expect(obsidianUpdates.userTags).toEqual(['#User', '#Human', '#Writer'])
			expect(obsidianUpdates.roleEmojis.newChat).toBe('🚀')
		})
	})

	describe('Message Tags Settings Merging', () => {
		it('should merge React message tag changes with original settings', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Make changes in React state
			reactState.messageTags.userTags = ['#User', '#Human', '#Writer']
			reactState.messageTags.roleEmojis.system = '🤖'

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			// Check that changes are applied
			expect(mergedSettings.userTags).toEqual(['#User', '#Human', '#Writer'])
			expect(mergedSettings.roleEmojis.system).toBe('🤖')

			// Check that original values are preserved
			expect(mergedSettings.newChatTags).toEqual(['#NewChat', '#Start'])
			expect(mergedSettings.systemTags).toEqual(['#System', '#Instructions'])
		})

		it('should handle partial message tag updates', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Only update one type of tags
			reactState.messageTags.newChatTags = ['#Begin']

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			// Check that only newChatTags is updated
			expect(mergedSettings.newChatTags).toEqual(['#Begin'])
			expect(mergedSettings.userTags).toEqual(['#User', '#Human']) // unchanged
			expect(mergedSettings.systemTags).toEqual(['#System', '#Instructions']) // unchanged
		})
	})

	describe('Message Tags Data Integrity', () => {
		it('should maintain data integrity through round-trip conversion', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)
			const backToReact = adaptObsidianToReact(obsidianUpdates)

			// Check that all message tags are preserved
			expect(backToReact.messageTags.newChatTags).toEqual(mockObsidianSettings.newChatTags)
			expect(backToReact.messageTags.userTags).toEqual(mockObsidianSettings.userTags)
			expect(backToReact.messageTags.systemTags).toEqual(mockObsidianSettings.systemTags)
			expect(backToReact.messageTags.roleEmojis).toEqual(mockObsidianSettings.roleEmojis)
		})

		it('should handle complex tag configurations', () => {
			const complexSettings = {
				...mockObsidianSettings,
				newChatTags: ['#Start', '#Begin', '#New', '#Fresh'],
				userTags: ['#User', '#Human', '#Writer', '#Author'],
				systemTags: ['#System', '#Instructions', '#Prompt', '#Context'],
				roleEmojis: {
					newChat: '🚀',
					user: '✍️',
					system: '⚙️',
					assistant: '🤖'
				}
			}

			const reactState = adaptObsidianToReact(complexSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.newChatTags).toEqual(['#Start', '#Begin', '#New', '#Fresh'])
			expect(obsidianUpdates.userTags).toEqual(['#User', '#Human', '#Writer', '#Author'])
			expect(obsidianUpdates.systemTags).toEqual(['#System', '#Instructions', '#Prompt', '#Context'])
			expect(obsidianUpdates.roleEmojis).toEqual({
				newChat: '🚀',
				user: '✍️',
				system: '⚙️',
				assistant: '🤖'
			})
		})

		it('should handle Unicode emojis correctly', () => {
			const unicodeSettings = {
				...mockObsidianSettings,
				roleEmojis: {
					newChat: '🎯',
					user: '👨‍💻',
					system: '🔧',
					assistant: '🎨'
				}
			}

			const reactState = adaptObsidianToReact(unicodeSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.roleEmojis).toEqual({
				newChat: '🎯',
				user: '👨‍💻',
				system: '🔧',
				assistant: '🎨'
			})
		})
	})

	describe('Message Tags Edge Cases', () => {
		it('should handle single-character tags', () => {
			const singleCharSettings = {
				...mockObsidianSettings,
				newChatTags: ['#A'],
				userTags: ['#B'],
				systemTags: ['#C']
			}

			const reactState = adaptObsidianToReact(singleCharSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.newChatTags).toEqual(['#A'])
			expect(obsidianUpdates.userTags).toEqual(['#B'])
			expect(obsidianUpdates.systemTags).toEqual(['#C'])
		})

		it('should handle tags with special characters', () => {
			const specialCharSettings = {
				...mockObsidianSettings,
				newChatTags: ['#Start-New', '#Chat_2024', '#Session@1'],
				userTags: ['#User.Name', '#Human-Writer', '#Person_123']
			}

			const reactState = adaptObsidianToReact(specialCharSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.newChatTags).toEqual(['#Start-New', '#Chat_2024', '#Session@1'])
			expect(obsidianUpdates.userTags).toEqual(['#User.Name', '#Human-Writer', '#Person_123'])
		})

		it('should handle empty string tags', () => {
			const emptyTagSettings = {
				...mockObsidianSettings,
				newChatTags: [''],
				userTags: ['#User', ''],
				systemTags: []
			}

			const reactState = adaptObsidianToReact(emptyTagSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.newChatTags).toEqual([''])
			expect(obsidianUpdates.userTags).toEqual(['#User', ''])
		})
	})
})