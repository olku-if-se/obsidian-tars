import { describe, it, expect, beforeEach } from 'vitest'
import { adaptObsidianToReact, adaptReactToObsidian, mergeReactChanges } from '../../src/adapters/reactSettingsAdapter'

describe('Advanced Settings - Unit Tests', () => {
	let mockObsidianSettings: any

	beforeEach(() => {
		// Create a mock Obsidian settings object with advanced settings
		mockObsidianSettings = {
			enableInternalLinkForAssistantMsg: false,
			answerDelayInMilliseconds: 500,
			enableReplaceTag: false,
			enableExportToJSONL: false,
			enableTagSuggest: true,
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

	describe('Obsidian to React Advanced Settings Transformation', () => {
		it('should transform advanced settings correctly', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			expect(reactState.advancedSettings).toBeDefined()
			expect(reactState.advancedSettings.enableInternalLinkForAssistantMsg).toBe(false)
			expect(reactState.advancedSettings.answerDelayInMilliseconds).toBe(500)
			expect(reactState.advancedSettings.enableReplaceTag).toBe(false)
			expect(reactState.advancedSettings.enableExportToJSONL).toBe(false)
			expect(reactState.advancedSettings.enableTagSuggest).toBe(true)
		})

		it('should handle enabled internal link for assistant messages', () => {
			const enabledSettings = {
				...mockObsidianSettings,
				enableInternalLinkForAssistantMsg: true
			}

			const reactState = adaptObsidianToReact(enabledSettings)

			expect(reactState.advancedSettings.enableInternalLinkForAssistantMsg).toBe(true)
		})

		it('should handle different answer delays', () => {
			const delaySettings = {
				...mockObsidianSettings,
				answerDelayInMilliseconds: 1000
			}

			const reactState = adaptObsidianToReact(delaySettings)

			expect(reactState.advancedSettings.answerDelayInMilliseconds).toBe(1000)
		})

		it('should handle enabled replace tag', () => {
			const replaceTagSettings = {
				...mockObsidianSettings,
				enableReplaceTag: true
			}

			const reactState = adaptObsidianToReact(replaceTagSettings)

			expect(reactState.advancedSettings.enableReplaceTag).toBe(true)
		})

		it('should handle enabled export to JSONL', () => {
			const jsonlSettings = {
				...mockObsidianSettings,
				enableExportToJSONL: true
			}

			const reactState = adaptObsidianToReact(jsonlSettings)

			expect(reactState.advancedSettings.enableExportToJSONL).toBe(true)
		})

		it('should handle disabled tag suggest', () => {
			const noTagSuggestSettings = {
				...mockObsidianSettings,
				enableTagSuggest: false
			}

			const reactState = adaptObsidianToReact(noTagSuggestSettings)

			expect(reactState.advancedSettings.enableTagSuggest).toBe(false)
		})

		it('should handle missing advanced settings', () => {
			const settingsWithoutAdvanced = {
				...mockObsidianSettings,
				enableInternalLinkForAssistantMsg: undefined,
				answerDelayInMilliseconds: undefined,
				enableReplaceTag: undefined,
				enableExportToJSONL: undefined,
				enableTagSuggest: undefined
			}

			const reactState = adaptObsidianToReact(settingsWithoutAdvanced)

			expect(typeof reactState.advancedSettings.enableInternalLinkForAssistantMsg).toBe('boolean')
			expect(typeof reactState.advancedSettings.answerDelayInMilliseconds).toBe('number')
			expect(typeof reactState.advancedSettings.enableReplaceTag).toBe('boolean')
			expect(typeof reactState.advancedSettings.enableExportToJSONL).toBe('boolean')
			expect(typeof reactState.advancedSettings.enableTagSuggest).toBe('boolean')
		})

		it('should handle zero answer delay', () => {
			const zeroDelaySettings = {
				...mockObsidianSettings,
				answerDelayInMilliseconds: 0
			}

			const reactState = adaptObsidianToReact(zeroDelaySettings)

			expect(reactState.advancedSettings.answerDelayInMilliseconds).toBe(0)
		})

		it('should handle very large answer delay', () => {
			const largeDelaySettings = {
				...mockObsidianSettings,
				answerDelayInMilliseconds: 60000 // 60 seconds
			}

			const reactState = adaptObsidianToReact(largeDelaySettings)

			expect(reactState.advancedSettings.answerDelayInMilliseconds).toBe(60000)
		})
	})

	describe('React to Obsidian Advanced Settings Transformation', () => {
		it('should transform React advanced settings back to Obsidian format', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.enableInternalLinkForAssistantMsg).toBe(false)
			expect(obsidianUpdates.answerDelayInMilliseconds).toBe(500)
			expect(obsidianUpdates.enableReplaceTag).toBe(false)
			expect(obsidianUpdates.enableExportToJSONL).toBe(false)
			expect(obsidianUpdates.enableTagSuggest).toBe(true)
		})

		it('should handle updated advanced settings from React', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Update advanced settings in React state
			reactState.advancedSettings.enableInternalLinkForAssistantMsg = true
			reactState.advancedSettings.answerDelayInMilliseconds = 2000
			reactState.advancedSettings.enableReplaceTag = true
			reactState.advancedSettings.enableExportToJSONL = true
			reactState.advancedSettings.enableTagSuggest = false

			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.enableInternalLinkForAssistantMsg).toBe(true)
			expect(obsidianUpdates.answerDelayInMilliseconds).toBe(2000)
			expect(obsidianUpdates.enableReplaceTag).toBe(true)
			expect(obsidianUpdates.enableExportToJSONL).toBe(true)
			expect(obsidianUpdates.enableTagSuggest).toBe(false)
		})

		it('should handle toggling advanced settings independently', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Toggle only enableInternalLinkForAssistantMsg
			reactState.advancedSettings.enableInternalLinkForAssistantMsg = true
			let obsidianUpdates = adaptReactToObsidian(reactState)
			expect(obsidianUpdates.enableInternalLinkForAssistantMsg).toBe(true)
			expect(obsidianUpdates.enableReplaceTag).toBe(false) // unchanged
			expect(obsidianUpdates.answerDelayInMilliseconds).toBe(500) // unchanged

			// Toggle only answerDelayInMilliseconds
			reactState.advancedSettings.enableInternalLinkForAssistantMsg = false
			reactState.advancedSettings.answerDelayInMilliseconds = 1000
			obsidianUpdates = adaptReactToObsidian(reactState)
			expect(obsidianUpdates.enableInternalLinkForAssistantMsg).toBe(false) // unchanged
			expect(obsidianUpdates.answerDelayInMilliseconds).toBe(1000)
		})
	})

	describe('Advanced Settings Merging', () => {
		it('should merge React advanced settings changes with original settings', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Make changes in React state
			reactState.advancedSettings.enableInternalLinkForAssistantMsg = true
			reactState.advancedSettings.answerDelayInMilliseconds = 1000
			reactState.advancedSettings.enableReplaceTag = true

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			// Check that changes are applied
			expect(mergedSettings.enableInternalLinkForAssistantMsg).toBe(true)
			expect(mergedSettings.answerDelayInMilliseconds).toBe(1000)
			expect(mergedSettings.enableReplaceTag).toBe(true)

			// Check that other settings are preserved
			expect(mergedSettings.enableExportToJSONL).toBe(false) // unchanged
			expect(mergedSettings.enableTagSuggest).toBe(true) // unchanged
			expect(mergedSettings.newChatTags).toEqual(['#NewChat'])
		})

		it('should handle partial advanced settings updates', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Only update one setting
			reactState.advancedSettings.enableInternalLinkForAssistantMsg = true

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			// Check that only enableInternalLinkForAssistantMsg is updated
			expect(mergedSettings.enableInternalLinkForAssistantMsg).toBe(true)
			expect(mergedSettings.answerDelayInMilliseconds).toBe(500) // unchanged
			expect(mergedSettings.enableReplaceTag).toBe(false) // unchanged
		})

		it('should preserve other settings when updating advanced settings', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Update advanced settings
			reactState.advancedSettings.enableInternalLinkForAssistantMsg = true
			reactState.advancedSettings.answerDelayInMilliseconds = 2000

			// Also update some other settings
			reactState.basicSettings.confirmRegenerate = false
			reactState.systemMessage.enabled = true
			reactState.messageTags.userTags = ['#User', '#Human']

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			// Check that all changes are applied
			expect(mergedSettings.enableInternalLinkForAssistantMsg).toBe(true)
			expect(mergedSettings.answerDelayInMilliseconds).toBe(2000)
			expect(mergedSettings.confirmRegenerate).toBe(false)
			expect(mergedSettings.enableDefaultSystemMsg).toBe(true)
			expect(mergedSettings.userTags).toEqual(['#User', '#Human'])
		})
	})

	describe('Advanced Settings Data Integrity', () => {
		it('should maintain data integrity through round-trip conversion', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)
			const backToReact = adaptObsidianToReact(obsidianUpdates)

			// Check that advanced settings are preserved
			expect(backToReact.advancedSettings.enableInternalLinkForAssistantMsg).toBe(mockObsidianSettings.enableInternalLinkForAssistantMsg)
			expect(backToReact.advancedSettings.answerDelayInMilliseconds).toBe(mockObsidianSettings.answerDelayInMilliseconds)
			expect(backToReact.advancedSettings.enableReplaceTag).toBe(mockObsidianSettings.enableReplaceTag)
			expect(backToReact.advancedSettings.enableExportToJSONL).toBe(mockObsidianSettings.enableExportToJSONL)
			expect(backToReact.advancedSettings.enableTagSuggest).toBe(mockObsidianSettings.enableTagSuggest)
		})

		it('should preserve boolean values correctly', () => {
			const booleanCombinations = [
				{ enableInternalLinkForAssistantMsg: true, enableReplaceTag: true, enableExportToJSONL: true, enableTagSuggest: true },
				{ enableInternalLinkForAssistantMsg: true, enableReplaceTag: true, enableExportToJSONL: true, enableTagSuggest: false },
				{ enableInternalLinkForAssistantMsg: true, enableReplaceTag: true, enableExportToJSONL: false, enableTagSuggest: true },
				{ enableInternalLinkForAssistantMsg: true, enableReplaceTag: true, enableExportToJSONL: false, enableTagSuggest: false },
				{ enableInternalLinkForAssistantMsg: true, enableReplaceTag: false, enableExportToJSONL: true, enableTagSuggest: true },
				{ enableInternalLinkForAssistantMsg: true, enableReplaceTag: false, enableExportToJSONL: true, enableTagSuggest: false },
				{ enableInternalLinkForAssistantMsg: true, enableReplaceTag: false, enableExportToJSONL: false, enableTagSuggest: true },
				{ enableInternalLinkForAssistantMsg: true, enableReplaceTag: false, enableExportToJSONL: false, enableTagSuggest: false },
				{ enableInternalLinkForAssistantMsg: false, enableReplaceTag: true, enableExportToJSONL: true, enableTagSuggest: true },
				{ enableInternalLinkForAssistantMsg: false, enableReplaceTag: true, enableExportToJSONL: true, enableTagSuggest: false },
				{ enableInternalLinkForAssistantMsg: false, enableReplaceTag: true, enableExportToJSONL: false, enableTagSuggest: true },
				{ enableInternalLinkForAssistantMsg: false, enableReplaceTag: true, enableExportToJSONL: false, enableTagSuggest: false },
				{ enableInternalLinkForAssistantMsg: false, enableReplaceTag: false, enableExportToJSONL: true, enableTagSuggest: true },
				{ enableInternalLinkForAssistantMsg: false, enableReplaceTag: false, enableExportToJSONL: true, enableTagSuggest: false },
				{ enableInternalLinkForAssistantMsg: false, enableReplaceTag: false, enableExportToJSONL: false, enableTagSuggest: true },
				{ enableInternalLinkForAssistantMsg: false, enableReplaceTag: false, enableExportToJSONL: false, enableTagSuggest: false }
			]

			for (const combination of booleanCombinations) {
				const settingsWithCombo = { ...mockObsidianSettings, ...combination }
				const reactState = adaptObsidianToReact(settingsWithCombo)
				const obsidianUpdates = adaptReactToObsidian(reactState)
				const backToReact = adaptObsidianToReact(obsidianUpdates)

				expect(backToReact.advancedSettings.enableInternalLinkForAssistantMsg).toBe(combination.enableInternalLinkForAssistantMsg)
				expect(backToReact.advancedSettings.enableReplaceTag).toBe(combination.enableReplaceTag)
				expect(backToReact.advancedSettings.enableExportToJSONL).toBe(combination.enableExportToJSONL)
				expect(backToReact.advancedSettings.enableTagSuggest).toBe(combination.enableTagSuggest)
			}
		})

		it('should preserve numeric values correctly', () => {
			const delayValues = [0, 100, 500, 1000, 2000, 5000, 10000, 60000]

			for (const delay of delayValues) {
				const settingsWithDelay = { ...mockObsidianSettings, answerDelayInMilliseconds: delay }
				const reactState = adaptObsidianToReact(settingsWithDelay)
				const obsidianUpdates = adaptReactToObsidian(reactState)
				const backToReact = adaptObsidianToReact(obsidianUpdates)

				expect(backToReact.advancedSettings.answerDelayInMilliseconds).toBe(delay)
			}
		})
	})

	describe('Advanced Settings Edge Cases', () => {
		it('should handle null and undefined values gracefully', () => {
			const nullUndefinedSettings = {
				...mockObsidianSettings,
				enableInternalLinkForAssistantMsg: null,
				answerDelayInMilliseconds: null,
				enableReplaceTag: undefined,
				enableExportToJSONL: null,
				enableTagSuggest: undefined
			}

			const reactState = adaptObsidianToReact(nullUndefinedSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Should handle null values gracefully
			expect(typeof obsidianUpdates.enableInternalLinkForAssistantMsg).toBe('boolean')
			expect(typeof obsidianUpdates.answerDelayInMilliseconds).toBe('number')
			expect(typeof obsidianUpdates.enableReplaceTag).toBe('boolean')
			expect(typeof obsidianUpdates.enableExportToJSONL).toBe('boolean')
			expect(typeof obsidianUpdates.enableTagSuggest).toBe('boolean')
		})

		it('should handle string values that should be boolean', () => {
			const stringBooleanSettings = {
				...mockObsidianSettings,
				enableInternalLinkForAssistantMsg: 'true' as any,
				enableReplaceTag: 'false' as any,
				enableExportToJSONL: '1' as any,
				enableTagSuggest: '0' as any
			}

			const reactState = adaptObsidianToReact(stringBooleanSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Should preserve the original type (string in this case)
			expect(typeof obsidianUpdates.enableInternalLinkForAssistantMsg).toBe('string')
			expect(typeof obsidianUpdates.enableReplaceTag).toBe('string')
			expect(typeof obsidianUpdates.enableExportToJSONL).toBe('string')
			expect(typeof obsidianUpdates.enableTagSuggest).toBe('string')
		})

		it('should handle negative answer delay values', () => {
			const negativeDelaySettings = {
				...mockObsidianSettings,
				answerDelayInMilliseconds: -100
			}

			const reactState = adaptObsidianToReact(negativeDelaySettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Should preserve negative values
			expect(obsidianUpdates.answerDelayInMilliseconds).toBe(-100)
		})

		it('should maintain consistency with other settings during updates', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Update advanced settings
			reactState.advancedSettings.enableInternalLinkForAssistantMsg = true
			reactState.advancedSettings.answerDelayInMilliseconds = 2000
			reactState.advancedSettings.enableReplaceTag = true

			// Update basic settings
			reactState.basicSettings.confirmRegenerate = false
			reactState.basicSettings.enableInternalLink = false

			// Update message tags
			reactState.messageTags.userTags = ['#User', '#Human']

			// Update system message
			reactState.systemMessage.enabled = false

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			// Verify all settings are correctly updated
			expect(mergedSettings.enableInternalLinkForAssistantMsg).toBe(true)
			expect(mergedSettings.answerDelayInMilliseconds).toBe(2000)
			expect(mergedSettings.enableReplaceTag).toBe(true)
			expect(mergedSettings.confirmRegenerate).toBe(false)
			expect(mergedSettings.enableInternalLink).toBe(false)
			expect(mergedSettings.userTags).toEqual(['#User', '#Human'])
			expect(mergedSettings.enableDefaultSystemMsg).toBe(false)
		})

		it('should handle rapid toggling of settings', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Rapidly toggle settings
			for (let i = 0; i < 10; i++) {
				reactState.advancedSettings.enableInternalLinkForAssistantMsg = i % 2 === 0
				reactState.advancedSettings.enableReplaceTag = i % 3 === 0
				reactState.advancedSettings.answerDelayInMilliseconds = i * 100

				const obsidianUpdates = adaptReactToObsidian(reactState)
				expect(obsidianUpdates.enableInternalLinkForAssistantMsg).toBe(i % 2 === 0)
				expect(obsidianUpdates.enableReplaceTag).toBe(i % 3 === 0)
				expect(obsidianUpdates.answerDelayInMilliseconds).toBe(i * 100)
			}
		})

		it('should handle extreme delay values', () => {
			const extremeSettings = {
				...mockObsidianSettings,
				answerDelayInMilliseconds: Number.MAX_SAFE_INTEGER
			}

			const reactState = adaptObsidianToReact(extremeSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.answerDelayInMilliseconds).toBe(Number.MAX_SAFE_INTEGER)
		})
	})

	describe('Advanced Settings Integration with Other Features', () => {
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

			// Verify both advanced settings and providers are preserved
			expect(obsidianUpdates.enableInternalLinkForAssistantMsg).toBe(false)
			expect(obsidianUpdates.answerDelayInMilliseconds).toBe(500)
			expect(obsidianUpdates.providers).toHaveLength(1)
			expect(obsidianUpdates.providers[0].tag).toBe('claude')
		})

		it('should work correctly with basic settings', () => {
			const settingsWithBasic = {
				...mockObsidianSettings,
				confirmRegenerate: true,
				enableInternalLink: true
			}

			const reactState = adaptObsidianToReact(settingsWithBasic)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Verify both advanced and basic settings are preserved
			expect(obsidianUpdates.enableInternalLinkForAssistantMsg).toBe(false)
			expect(obsidianUpdates.answerDelayInMilliseconds).toBe(500)
			expect(obsidianUpdates.confirmRegenerate).toBe(true)
			expect(obsidianUpdates.enableInternalLink).toBe(true)
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

			// Verify both advanced settings and features are preserved
			expect(obsidianUpdates.enableInternalLinkForAssistantMsg).toBe(false)
			expect(obsidianUpdates.answerDelayInMilliseconds).toBe(500)
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

			// Verify both advanced settings and MCP settings are preserved
			expect(obsidianUpdates.enableInternalLinkForAssistantMsg).toBe(false)
			expect(obsidianUpdates.answerDelayInMilliseconds).toBe(500)
			expect(obsidianUpdates.mcpServers).toHaveLength(1)
			expect(obsidianUpdates.mcpConcurrentLimit).toBe(5)
		})

		it('should work correctly with system message settings', () => {
			const settingsWithSystemMsg = {
				...mockObsidianSettings,
				enableDefaultSystemMsg: true,
				defaultSystemMsg: 'Custom system message'
			}

			const reactState = adaptObsidianToReact(settingsWithSystemMsg)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Verify both advanced settings and system message are preserved
			expect(obsidianUpdates.enableInternalLinkForAssistantMsg).toBe(false)
			expect(obsidianUpdates.answerDelayInMilliseconds).toBe(500)
			expect(obsidianUpdates.enableDefaultSystemMsg).toBe(true)
			expect(obsidianUpdates.defaultSystemMsg).toBe('Custom system message')
		})
	})
	})