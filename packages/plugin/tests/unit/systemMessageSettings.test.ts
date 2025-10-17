import { describe, it, expect, beforeEach } from 'vitest'
import { adaptObsidianToReact, adaptReactToObsidian, mergeReactChanges } from '../../src/adapters/reactSettingsAdapter'

describe('System Message Settings - Unit Tests', () => {
	let mockObsidianSettings: any

	beforeEach(() => {
		// Create a mock Obsidian settings object with system message settings
		mockObsidianSettings = {
			enableDefaultSystemMsg: true,
			defaultSystemMsg: 'You are a helpful AI assistant. Please provide clear and concise responses.',
			providers: [],
			newChatTags: ['#NewChat'],
			userTags: ['#User'],
			systemTags: ['#System'],
			roleEmojis: {
				newChat: '🆕',
				user: '👤',
				system: '⚙️',
				assistant: '✨'
			},
			features: {
				reactSettingsTab: true,
				reactStatusBar: false,
				reactModals: false,
				reactMcpUI: false
			}
		}
	})

	describe('Obsidian to React System Message Transformation', () => {
		it('should transform system message settings correctly', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			expect(reactState.systemMessage).toBeDefined()
			expect(reactState.systemMessage.enabled).toBe(true)
			expect(reactState.systemMessage.message).toBe('You are a helpful AI assistant. Please provide clear and concise responses.')
		})

		it('should handle disabled system message', () => {
			const disabledSettings = {
				...mockObsidianSettings,
				enableDefaultSystemMsg: false
			}

			const reactState = adaptObsidianToReact(disabledSettings)

			expect(reactState.systemMessage.enabled).toBe(false)
		})

		it('should handle empty system message', () => {
			const emptyMessageSettings = {
				...mockObsidianSettings,
				defaultSystemMsg: ''
			}

			const reactState = adaptObsidianToReact(emptyMessageSettings)

			expect(reactState.systemMessage.message).toBe('')
		})

		it('should handle missing system message settings', () => {
			const settingsWithoutSystemMsg = {
				...mockObsidianSettings,
				enableDefaultSystemMsg: undefined,
				defaultSystemMsg: undefined
			}

			const reactState = adaptObsidianToReact(settingsWithoutSystemMsg)

			expect(reactState.systemMessage.enabled).toBe(false) // Default to false
			expect(reactState.systemMessage.message).toBe('')
		})

		it('should handle complex system messages', () => {
			const complexMessageSettings = {
				...mockObsidianSettings,
				defaultSystemMsg: `You are an expert AI assistant with the following guidelines:

1. Always be helpful and accurate
2. Provide detailed explanations when necessary
3. Ask clarifying questions if the prompt is ambiguous
4. Maintain a professional but friendly tone

Your role is to assist with various tasks including writing, analysis, and problem-solving.`
			}

			const reactState = adaptObsidianToReact(complexMessageSettings)

			expect(reactState.systemMessage.enabled).toBe(true)
			expect(reactState.systemMessage.message).toContain('You are an expert AI assistant')
			expect(reactState.systemMessage.message).toContain('1. Always be helpful and accurate')
			expect(reactState.systemMessage.message).toContain('Your role is to assist')
		})

		it('should handle system messages with special characters', () => {
			const specialCharSettings = {
				...mockObsidianSettings,
				defaultSystemMsg: 'Act as a "professional assistant" with these traits: • Punctual • Accurate • Helpful. Use markdown **formatting** and `code snippets` when needed.'
			}

			const reactState = adaptObsidianToReact(specialCharSettings)

			expect(reactState.systemMessage.message).toBe('Act as a "professional assistant" with these traits: • Punctual • Accurate • Helpful. Use markdown **formatting** and `code snippets` when needed.')
		})
	})

	describe('React to Obsidian System Message Transformation', () => {
		it('should transform React system message back to Obsidian format', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.enableDefaultSystemMsg).toBe(true)
			expect(obsidianUpdates.defaultSystemMsg).toBe('You are a helpful AI assistant. Please provide clear and concise responses.')
		})

		it('should handle updated system message from React', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Update system message in React state
			reactState.systemMessage.enabled = false
			reactState.systemMessage.message = 'You are now a creative writing assistant focused on storytelling.'

			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.enableDefaultSystemMsg).toBe(false)
			expect(obsidianUpdates.defaultSystemMsg).toBe('You are now a creative writing assistant focused on storytelling.')
		})

		it('should handle toggling system message on/off', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Toggle off
			reactState.systemMessage.enabled = false
			let obsidianUpdates = adaptReactToObsidian(reactState)
			expect(obsidianUpdates.enableDefaultSystemMsg).toBe(false)

			// Toggle on
			reactState.systemMessage.enabled = true
			obsidianUpdates = adaptReactToObsidian(reactState)
			expect(obsidianUpdates.enableDefaultSystemMsg).toBe(true)
		})
	})

	describe('System Message Settings Merging', () => {
		it('should merge React system message changes with original settings', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Make changes in React state
			reactState.systemMessage.enabled = false
			reactState.systemMessage.message = 'Updated system message for testing.'

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			// Check that changes are applied
			expect(mergedSettings.enableDefaultSystemMsg).toBe(false)
			expect(mergedSettings.defaultSystemMsg).toBe('Updated system message for testing.')

			// Check that other settings are preserved
			expect(mergedSettings.newChatTags).toEqual(['#NewChat'])
			expect(mergedSettings.userTags).toEqual(['#User'])
		})

		it('should handle partial system message updates', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Only update the message, keep enabled state
			reactState.systemMessage.message = 'Only the message is updated.'

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			// Check that only message is updated
			expect(mergedSettings.defaultSystemMsg).toBe('Only the message is updated.')
			expect(mergedSettings.enableDefaultSystemMsg).toBe(true) // unchanged
		})
	})

	describe('System Message Data Integrity', () => {
		it('should maintain data integrity through round-trip conversion', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)
			const backToReact = adaptObsidianToReact(obsidianUpdates)

			// Check that system message settings are preserved
			expect(backToReact.systemMessage.enabled).toBe(mockObsidianSettings.enableDefaultSystemMsg)
			expect(backToReact.systemMessage.message).toBe(mockObsidianSettings.defaultSystemMsg)
		})

		it('should preserve complex system messages through round-trip', () => {
			const complexMessage = `You are a specialized AI assistant for technical documentation.

## Responsibilities:
- Explain complex technical concepts clearly
- Provide code examples when helpful
- Suggest best practices for software development
- Help with debugging and troubleshooting

## Tone:
- Professional but approachable
- Technical but accessible
- Encouraging and supportive`

			const complexSettings = {
				...mockObsidianSettings,
				defaultSystemMsg: complexMessage
			}

			const reactState = adaptObsidianToReact(complexSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)
			const backToReact = adaptObsidianToReact(obsidianUpdates)

			expect(backToReact.systemMessage.message).toBe(complexMessage)
		})

		it('should handle Unicode and emoji characters in system messages', () => {
			const unicodeSettings = {
				...mockObsidianSettings,
				defaultSystemMsg: '🤖 You are an AI assistant! 🎯 Be precise • accurate • helpful. Use proper formatting: 📚 documentation, 💻 code, 🧪 testing.'
			}

			const reactState = adaptObsidianToReact(unicodeSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.defaultSystemMsg).toBe('🤖 You are an AI assistant! 🎯 Be precise • accurate • helpful. Use proper formatting: 📚 documentation, 💻 code, 🧪 testing.')
		})
	})

	describe('System Message Edge Cases', () => {
		it('should handle extremely long system messages', () => {
			const longMessage = 'You are an AI assistant. '.repeat(1000) // Create a very long message
			const longMessageSettings = {
				...mockObsidianSettings,
				defaultSystemMsg: longMessage
			}

			const reactState = adaptObsidianToReact(longMessageSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.defaultSystemMsg).toBe(longMessage)
			expect(obsidianUpdates.defaultSystemMsg.length).toBe(longMessage.length)
		})

		it('should handle system messages with only whitespace', () => {
			const whitespaceSettings = {
				...mockObsidianSettings,
				defaultSystemMsg: '   \n\t   \n\n\t   '
			}

			const reactState = adaptObsidianToReact(whitespaceSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.defaultSystemMsg).toBe('   \n\t   \n\n\t   ')
		})

		it('should handle null and undefined values gracefully', () => {
			const nullUndefinedSettings = {
				...mockObsidianSettings,
				enableDefaultSystemMsg: null,
				defaultSystemMsg: null
			}

			const reactState = adaptObsidianToReact(nullUndefinedSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Should handle null values gracefully
			expect(typeof obsidianUpdates.enableDefaultSystemMsg).toBe('boolean')
			expect(typeof obsidianUpdates.defaultSystemMsg).toBe('string')
		})

		it('should preserve message formatting and structure', () => {
			const formattedMessage = `# System Instructions

You are a helpful AI assistant. Follow these guidelines:

## Do's:
- ✅ Be accurate and helpful
- ✅ Provide clear explanations
- ✅ Ask clarifying questions when needed

## Don'ts:
- ❌ Don't make up information
- ❌ Don't be overly verbose
- ❌ Don't ignore user preferences

**Remember**: Always prioritize user needs and safety.

\`\`\`javascript
// Example code
function respond(userQuery) {
  return helpfulResponse(userQuery);
}
\`\`\``

			const formattedSettings = {
				...mockObsidianSettings,
				defaultSystemMsg: formattedMessage
			}

			const reactState = adaptObsidianToReact(formattedSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.defaultSystemMsg).toBe(formattedMessage)
			expect(obsidianUpdates.defaultSystemMsg).toContain('# System Instructions')
			expect(obsidianUpdates.defaultSystemMsg).toContain('## Don\'ts:')
			expect(obsidianUpdates.defaultSystemMsg).toContain('```javascript')
		})
	})
})