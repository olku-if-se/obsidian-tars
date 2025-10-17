import { describe, it, expect, beforeEach } from 'vitest'
import { adaptObsidianToReact, adaptReactToObsidian, mergeReactChanges } from '../../src/adapters/reactSettingsAdapter'

describe('Basic Settings - Unit Tests', () => {
	let mockObsidianSettings: any

	beforeEach(() => {
		// Create a mock Obsidian settings object with basic settings
		mockObsidianSettings = {
			confirmRegenerate: true,
			enableInternalLink: true,
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

	describe('Obsidian to React Basic Settings Transformation', () => {
		it('should transform basic settings correctly', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			expect(reactState.basicSettings).toBeDefined()
			expect(reactState.basicSettings.confirmRegenerate).toBe(true)
			expect(reactState.basicSettings.enableInternalLink).toBe(true)
		})

		it('should handle disabled confirm regenerate', () => {
			const disabledSettings = {
				...mockObsidianSettings,
				confirmRegenerate: false
			}

			const reactState = adaptObsidianToReact(disabledSettings)

			expect(reactState.basicSettings.confirmRegenerate).toBe(false)
		})

		it('should handle disabled internal links', () => {
			const disabledSettings = {
				...mockObsidianSettings,
				enableInternalLink: false
			}

			const reactState = adaptObsidianToReact(disabledSettings)

			expect(reactState.basicSettings.enableInternalLink).toBe(false)
		})

		it('should handle both settings disabled', () => {
			const bothDisabledSettings = {
				...mockObsidianSettings,
				confirmRegenerate: false,
				enableInternalLink: false
			}

			const reactState = adaptObsidianToReact(bothDisabledSettings)

			expect(reactState.basicSettings.confirmRegenerate).toBe(false)
			expect(reactState.basicSettings.enableInternalLink).toBe(false)
		})

		it('should handle missing basic settings', () => {
			const settingsWithoutBasic = {
				...mockObsidianSettings,
				confirmRegenerate: undefined,
				enableInternalLink: undefined
			}

			const reactState = adaptObsidianToReact(settingsWithoutBasic)

			expect(typeof reactState.basicSettings.confirmRegenerate).toBe('boolean')
			expect(typeof reactState.basicSettings.enableInternalLink).toBe('boolean')
		})
	})

	describe('React to Obsidian Basic Settings Transformation', () => {
		it('should transform React basic settings back to Obsidian format', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.confirmRegenerate).toBe(true)
			expect(obsidianUpdates.enableInternalLink).toBe(true)
		})

		it('should handle updated basic settings from React', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Update basic settings in React state
			reactState.basicSettings.confirmRegenerate = false
			reactState.basicSettings.enableInternalLink = false

			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.confirmRegenerate).toBe(false)
			expect(obsidianUpdates.enableInternalLink).toBe(false)
		})

		it('should handle toggling basic settings independently', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Toggle only confirmRegenerate
			reactState.basicSettings.confirmRegenerate = false
			let obsidianUpdates = adaptReactToObsidian(reactState)
			expect(obsidianUpdates.confirmRegenerate).toBe(false)
			expect(obsidianUpdates.enableInternalLink).toBe(true) // unchanged

			// Toggle only enableInternalLink
			reactState.basicSettings.confirmRegenerate = true
			reactState.basicSettings.enableInternalLink = false
			obsidianUpdates = adaptReactToObsidian(reactState)
			expect(obsidianUpdates.confirmRegenerate).toBe(true) // unchanged
			expect(obsidianUpdates.enableInternalLink).toBe(false)
		})
	})

	describe('Basic Settings Merging', () => {
		it('should merge React basic settings changes with original settings', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Make changes in React state
			reactState.basicSettings.confirmRegenerate = false
			reactState.basicSettings.enableInternalLink = false

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			// Check that changes are applied
			expect(mergedSettings.confirmRegenerate).toBe(false)
			expect(mergedSettings.enableInternalLink).toBe(false)

			// Check that other settings are preserved
			expect(mergedSettings.newChatTags).toEqual(['#NewChat'])
			expect(mergedSettings.userTags).toEqual(['#User'])
		})

		it('should handle partial basic settings updates', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Only update one setting
			reactState.basicSettings.confirmRegenerate = false

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			// Check that only confirmRegenerate is updated
			expect(mergedSettings.confirmRegenerate).toBe(false)
			expect(mergedSettings.enableInternalLink).toBe(true) // unchanged
		})

		it('should preserve other settings when updating basic settings', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Update basic settings
			reactState.basicSettings.confirmRegenerate = false
			reactState.basicSettings.enableInternalLink = false

			// Also update some other settings
			reactState.systemMessage.enabled = true
			reactState.systemMessage.message = 'Updated system message'

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			// Check that all changes are applied
			expect(mergedSettings.confirmRegenerate).toBe(false)
			expect(mergedSettings.enableInternalLink).toBe(false)
			expect(mergedSettings.enableDefaultSystemMsg).toBe(true)
			expect(mergedSettings.defaultSystemMsg).toBe('Updated system message')
		})
	})

	describe('Basic Settings Data Integrity', () => {
		it('should maintain data integrity through round-trip conversion', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)
			const backToReact = adaptObsidianToReact(obsidianUpdates)

			// Check that basic settings are preserved
			expect(backToReact.basicSettings.confirmRegenerate).toBe(mockObsidianSettings.confirmRegenerate)
			expect(backToReact.basicSettings.enableInternalLink).toBe(mockObsidianSettings.enableInternalLink)
		})

		it('should preserve boolean values correctly', () => {
			const booleanCombinations = [
				{ confirmRegenerate: true, enableInternalLink: true },
				{ confirmRegenerate: true, enableInternalLink: false },
				{ confirmRegenerate: false, enableInternalLink: true },
				{ confirmRegenerate: false, enableInternalLink: false }
			]

			for (const combination of booleanCombinations) {
				const settingsWithCombo = { ...mockObsidianSettings, ...combination }
				const reactState = adaptObsidianToReact(settingsWithCombo)
				const obsidianUpdates = adaptReactToObsidian(reactState)
				const backToReact = adaptObsidianToReact(obsidianUpdates)

				expect(backToReact.basicSettings.confirmRegenerate).toBe(combination.confirmRegenerate)
				expect(backToReact.basicSettings.enableInternalLink).toBe(combination.enableInternalLink)
			}
		})

		it('should handle all boolean states consistently', () => {
			// Test all possible combinations
			const testCases = [
				{ confirmRegenerate: true, enableInternalLink: true, name: 'both true' },
				{ confirmRegenerate: true, enableInternalLink: false, name: 'confirm true, internal false' },
				{ confirmRegenerate: false, enableInternalLink: true, name: 'confirm false, internal true' },
				{ confirmRegenerate: false, enableInternalLink: false, name: 'both false' }
			]

			for (const testCase of testCases) {
				const settings = { ...mockObsidianSettings, ...testCase }
				const reactState = adaptObsidianToReact(settings)
				const obsidianUpdates = adaptReactToObsidian(reactState)

				expect(obsidianUpdates.confirmRegenerate).toBe(testCase.confirmRegenerate, `Failed for ${testCase.name}`)
				expect(obsidianUpdates.enableInternalLink).toBe(testCase.enableInternalLink, `Failed for ${testCase.name}`)
			}
		})
	})

	describe('Basic Settings Edge Cases', () => {
		it('should handle null and undefined values gracefully', () => {
			const nullUndefinedSettings = {
				...mockObsidianSettings,
				confirmRegenerate: null,
				enableInternalLink: undefined
			}

			const reactState = adaptObsidianToReact(nullUndefinedSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Should handle null values gracefully
			expect(typeof obsidianUpdates.confirmRegenerate).toBe('boolean')
			expect(typeof obsidianUpdates.enableInternalLink).toBe('boolean')
		})

		it('should handle string values that should be boolean', () => {
			const stringBooleanSettings = {
				...mockObsidianSettings,
				confirmRegenerate: 'true' as any,
				enableInternalLink: 'false' as any
			}

			const reactState = adaptObsidianToReact(stringBooleanSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Should preserve the original type (string in this case)
			expect(typeof obsidianUpdates.confirmRegenerate).toBe('string')
			expect(typeof obsidianUpdates.enableInternalLink).toBe('string')
		})

		it('should handle numeric values that should be boolean', () => {
			const numericBooleanSettings = {
				...mockObsidianSettings,
				confirmRegenerate: 1 as any,
				enableInternalLink: 0 as any
			}

			const reactState = adaptObsidianToReact(numericBooleanSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Should preserve the original type (number in this case)
			expect(typeof obsidianUpdates.confirmRegenerate).toBe('number')
			expect(typeof obsidianUpdates.enableInternalLink).toBe('number')
		})

		it('should maintain consistency with other settings during updates', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Update basic settings
			reactState.basicSettings.confirmRegenerate = false
			reactState.basicSettings.enableInternalLink = true

			// Update message tags
			reactState.messageTags.userTags = ['#User', '#Human']

			// Update system message
			reactState.systemMessage.enabled = false

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			// Verify all settings are correctly updated
			expect(mergedSettings.confirmRegenerate).toBe(false)
			expect(mergedSettings.enableInternalLink).toBe(true)
			expect(mergedSettings.userTags).toEqual(['#User', '#Human'])
			expect(mergedSettings.enableDefaultSystemMsg).toBe(false)
		})

		it('should handle rapid toggling of settings', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Rapidly toggle settings
			for (let i = 0; i < 10; i++) {
				reactState.basicSettings.confirmRegenerate = i % 2 === 0
				reactState.basicSettings.enableInternalLink = i % 3 === 0

				const obsidianUpdates = adaptReactToObsidian(reactState)
				expect(obsidianUpdates.confirmRegenerate).toBe(i % 2 === 0)
				expect(obsidianUpdates.enableInternalLink).toBe(i % 3 === 0)
			}
		})
	})

	describe('Basic Settings Integration with Other Features', () => {
		it('should work correctly with provider settings', () => {
			const settingsWithProviders = {
				...mockObsidianSettings,
				providers: [
					{
						tag: 'claude',
						vendor: 'Claude',
						options: {
							apiKey: 'test-key',
							model: 'claude-3-5-sonnet-20241022',
							parameters: { temperature: 0.7 }
						}
					}
				]
			}

			const reactState = adaptObsidianToReact(settingsWithProviders)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Verify both basic settings and providers are preserved
			expect(obsidianUpdates.confirmRegenerate).toBe(true)
			expect(obsidianUpdates.enableInternalLink).toBe(true)
			expect(obsidianUpdates.providers).toHaveLength(1)
			expect(obsidianUpdates.providers[0].tag).toBe('claude')
		})

		it('should work correctly with feature flags', () => {
			const settingsWithFeatures = {
				...mockObsidianSettings,
				features: {
					reactSettingsTab: true,
					reactStatusBar: true,
					reactModals: true,
					reactMcpUI: true
				}
			}

			const reactState = adaptObsidianToReact(settingsWithFeatures)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Verify both basic settings and features are preserved
			expect(obsidianUpdates.confirmRegenerate).toBe(true)
			expect(obsidianUpdates.enableInternalLink).toBe(true)
			expect(obsidianUpdates.features?.reactSettingsTab).toBe(true)
			expect(obsidianUpdates.features?.reactStatusBar).toBe(true)
		})

		it('should work correctly with MCP settings', () => {
			const settingsWithMCP = {
				...mockObsidianSettings,
				mcpServers: [
					{
						id: 'test-server',
						name: 'Test Server',
						enabled: true,
						configInput: '{"command": "test"}'
					}
				],
				mcpConcurrentLimit: 5,
				mcpSessionLimit: 20
			}

			const reactState = adaptObsidianToReact(settingsWithMCP)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Verify both basic settings and MCP settings are preserved
			expect(obsidianUpdates.confirmRegenerate).toBe(true)
			expect(obsidianUpdates.enableInternalLink).toBe(true)
			expect(obsidianUpdates.mcpServers).toHaveLength(1)
			expect(obsidianUpdates.mcpConcurrentLimit).toBe(5)
		})
	})
})