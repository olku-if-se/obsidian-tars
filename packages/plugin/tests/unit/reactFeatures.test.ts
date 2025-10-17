import { describe, it, expect, beforeEach } from 'vitest'
import { adaptObsidianToReact, adaptReactToObsidian, mergeReactChanges } from '../../src/adapters/reactSettingsAdapter'

describe('React Features - Unit Tests', () => {
	let mockObsidianSettings: any

	beforeEach(() => {
		// Create a mock Obsidian settings object with feature flags
		mockObsidianSettings = {
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
			confirmRegenerate: false,
			enableInternalLink: false,
			enableDefaultSystemMsg: false,
			defaultSystemMsg: '',
			enableInternalLinkForAssistantMsg: false,
			answerDelayInMilliseconds: 0,
			enableReplaceTag: false,
			enableExportToJSONL: false,
			enableTagSuggest: true,
			mcpServers: [],
			mcpConcurrentLimit: 5,
			mcpSessionLimit: 20,
			mcpGlobalTimeout: 30000,
			mcpParallelExecution: false,
			mcpMaxParallelTools: 10,
			features: {
				reactSettingsTab: true,
				reactStatusBar: false,
				reactModals: false,
				reactMcpUI: false
			},
			uiState: {
				systemMessageExpanded: false,
				advancedExpanded: false,
				mcpServersExpanded: false
			}
		}
	})

	describe('Obsidian to React Features Transformation', () => {
		it('should transform React features correctly', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			expect(reactState.reactFeatures).toBeDefined()
			expect(reactState.reactFeatures.reactSettingsTab).toBe(true)
			expect(reactState.reactFeatures.reactStatusBar).toBe(false)
			expect(reactState.reactFeatures.reactModals).toBe(false)
			expect(reactState.reactFeatures.reactMcpUI).toBe(false)
		})

		it('should handle missing features field', () => {
			const settingsWithoutFeatures = {
				...mockObsidianSettings,
				features: undefined
			}

			const reactState = adaptObsidianToReact(settingsWithoutFeatures)

			expect(reactState.reactFeatures).toBeDefined()
			expect(reactState.reactFeatures.reactSettingsTab).toBe(false)
			expect(reactState.reactFeatures.reactStatusBar).toBe(false)
			expect(reactState.reactFeatures.reactModals).toBe(false)
			expect(reactState.reactFeatures.reactMcpUI).toBe(false)
		})

		it('should handle empty features object', () => {
			const settingsWithEmptyFeatures = {
				...mockObsidianSettings,
				features: {}
			}

			const reactState = adaptObsidianToReact(settingsWithEmptyFeatures)

			expect(reactState.reactFeatures).toBeDefined()
			expect(reactState.reactFeatures.reactSettingsTab).toBe(false)
			expect(reactState.reactFeatures.reactStatusBar).toBe(false)
			expect(reactState.reactFeatures.reactModals).toBe(false)
			expect(reactState.reactFeatures.reactMcpUI).toBe(false)
		})

		it('should handle partially defined features', () => {
			const settingsWithPartialFeatures = {
				...mockObsidianSettings,
				features: {
					reactSettingsTab: true,
					reactMcpUI: true
					// Missing reactStatusBar and reactModals
				}
			}

			const reactState = adaptObsidianToReact(settingsWithPartialFeatures)

			expect(reactState.reactFeatures).toBeDefined()
			expect(reactState.reactFeatures.reactSettingsTab).toBe(true)
			expect(reactState.reactFeatures.reactStatusBar).toBe(false)
			expect(reactState.reactFeatures.reactModals).toBe(false)
			expect(reactState.reactFeatures.reactMcpUI).toBe(true)
		})

		it('should handle all features enabled', () => {
			const settingsWithAllFeatures = {
				...mockObsidianSettings,
				features: {
					reactSettingsTab: true,
					reactStatusBar: true,
					reactModals: true,
					reactMcpUI: true
				}
			}

			const reactState = adaptObsidianToReact(settingsWithAllFeatures)

			expect(reactState.reactFeatures).toBeDefined()
			expect(reactState.reactFeatures.reactSettingsTab).toBe(true)
			expect(reactState.reactFeatures.reactStatusBar).toBe(true)
			expect(reactState.reactFeatures.reactModals).toBe(true)
			expect(reactState.reactFeatures.reactMcpUI).toBe(true)
		})
	})

	describe('React to Obsidian Features Transformation', () => {
		it('should transform React features back to Obsidian format', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.features).toBeDefined()
			expect(obsidianUpdates.features?.reactSettingsTab).toBe(true)
			expect(obsidianUpdates.features?.reactStatusBar).toBe(false)
			expect(obsidianUpdates.features?.reactModals).toBe(false)
			expect(obsidianUpdates.features?.reactMcpUI).toBe(false)
		})

		it('should handle updated React features', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Update React features
			reactState.reactFeatures.reactSettingsTab = false
			reactState.reactFeatures.reactStatusBar = true
			reactState.reactFeatures.reactModals = true
			reactState.reactFeatures.reactMcpUI = true

			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.features?.reactSettingsTab).toBe(false)
			expect(obsidianUpdates.features?.reactStatusBar).toBe(true)
			expect(obsidianUpdates.features?.reactModals).toBe(true)
			expect(obsidianUpdates.features?.reactMcpUI).toBe(true)
		})

		it('should preserve other settings when updating features', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Update React features
			reactState.reactFeatures.reactStatusBar = true

			// Also update some other settings
			reactState.basicSettings.confirmRegenerate = true
			reactState.systemMessage.enabled = true

			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Verify both features and other settings are updated
			expect(obsidianUpdates.features?.reactStatusBar).toBe(true)
			expect(obsidianUpdates.confirmRegenerate).toBe(true)
			expect(obsidianUpdates.enableDefaultSystemMsg).toBe(true)
		})
	})

	describe('React Features Settings Merging', () => {
		it('should merge React feature changes with original settings', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Make changes in React state
			reactState.reactFeatures.reactStatusBar = true
			reactState.reactFeatures.reactModals = true

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			// Check that changes are applied
			expect(mergedSettings.features?.reactStatusBar).toBe(true)
			expect(mergedSettings.features?.reactModals).toBe(true)

			// Check that other features are preserved
			expect(mergedSettings.features?.reactSettingsTab).toBe(true) // unchanged
			expect(mergedSettings.features?.reactMcpUI).toBe(false) // unchanged
		})

		it('should handle partial feature updates', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Only update one feature
			reactState.reactFeatures.reactMcpUI = true

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			// Check that only the specified feature is updated
			expect(mergedSettings.features?.reactMcpUI).toBe(true)
			expect(mergedSettings.features?.reactSettingsTab).toBe(true) // unchanged
			expect(mergedSettings.features?.reactStatusBar).toBe(false) // unchanged
			expect(mergedSettings.features?.reactModals).toBe(false) // unchanged
		})

		it('should preserve other settings when updating features', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Update React features
			reactState.reactFeatures.reactSettingsTab = false
			reactState.reactFeatures.reactStatusBar = true

			// Also update some other settings
			reactState.basicSettings.confirmRegenerate = true
			reactState.systemMessage.enabled = true

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			// Check that all changes are applied
			expect(mergedSettings.features?.reactSettingsTab).toBe(false)
			expect(mergedSettings.features?.reactStatusBar).toBe(true)
			expect(mergedSettings.confirmRegenerate).toBe(true)
			expect(mergedSettings.enableDefaultSystemMsg).toBe(true)
		})

		it('should handle all features being disabled', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Disable all features
			reactState.reactFeatures.reactSettingsTab = false
			reactState.reactFeatures.reactStatusBar = false
			reactState.reactFeatures.reactModals = false
			reactState.reactFeatures.reactMcpUI = false

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			expect(mergedSettings.features?.reactSettingsTab).toBe(false)
			expect(mergedSettings.features?.reactStatusBar).toBe(false)
			expect(mergedSettings.features?.reactModals).toBe(false)
			expect(mergedSettings.features?.reactMcpUI).toBe(false)
		})

		it('should handle all features being enabled', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Enable all features
			reactState.reactFeatures.reactSettingsTab = true
			reactState.reactFeatures.reactStatusBar = true
			reactState.reactFeatures.reactModals = true
			reactState.reactFeatures.reactMcpUI = true

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			expect(mergedSettings.features?.reactSettingsTab).toBe(true)
			expect(mergedSettings.features?.reactStatusBar).toBe(true)
			expect(mergedSettings.features?.reactModals).toBe(true)
			expect(mergedSettings.features?.reactMcpUI).toBe(true)
		})
	})

	describe('React Features Data Integrity', () => {
		it('should maintain data integrity through round-trip conversion', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)
			const backToReact = adaptObsidianToReact(obsidianUpdates)

			// Check that React features are preserved
			expect(backToReact.reactFeatures).toEqual(reactState.reactFeatures)
		})

		it('should handle complex feature configurations through round-trip', () => {
			const complexFeatures = {
				reactSettingsTab: true,
				reactStatusBar: true,
				reactModals: false,
				reactMcpUI: true
			}

			const settingsWithComplexFeatures = {
				...mockObsidianSettings,
				features: complexFeatures
			}

			const reactState = adaptObsidianToReact(settingsWithComplexFeatures)
			const obsidianUpdates = adaptReactToObsidian(reactState)
			const backToReact = adaptObsidianToReact(obsidianUpdates)

			expect(backToReact.reactFeatures.reactSettingsTab).toBe(complexFeatures.reactSettingsTab)
			expect(backToReact.reactFeatures.reactStatusBar).toBe(complexFeatures.reactStatusBar)
			expect(backToReact.reactFeatures.reactModals).toBe(complexFeatures.reactModals)
			expect(backToReact.reactFeatures.reactMcpUI).toBe(complexFeatures.reactMcpUI)
		})

		it('should handle features with all boolean values through round-trip', () => {
			// Test all combinations of true/false values
			const allCombinations = [
				{ reactSettingsTab: false, reactStatusBar: false, reactModals: false, reactMcpUI: false },
				{ reactSettingsTab: true, reactStatusBar: false, reactModals: false, reactMcpUI: false },
				{ reactSettingsTab: false, reactStatusBar: true, reactModals: false, reactMcpUI: false },
				{ reactSettingsTab: false, reactStatusBar: false, reactModals: true, reactMcpUI: false },
				{ reactSettingsTab: false, reactStatusBar: false, reactModals: false, reactMcpUI: true },
				{ reactSettingsTab: true, reactStatusBar: true, reactModals: true, reactMcpUI: true }
			]

			for (const features of allCombinations) {
				const settingsWithFeatures = {
					...mockObsidianSettings,
					features
				}

				const reactState = adaptObsidianToReact(settingsWithFeatures)
				const obsidianUpdates = adaptReactToObsidian(reactState)
				const backToReact = adaptObsidianToReact(obsidianUpdates)

				expect(backToReact.reactFeatures.reactSettingsTab).toBe(features.reactSettingsTab)
				expect(backToReact.reactFeatures.reactStatusBar).toBe(features.reactStatusBar)
				expect(backToReact.reactFeatures.reactModals).toBe(features.reactModals)
				expect(backToReact.reactFeatures.reactMcpUI).toBe(features.reactMcpUI)
			}
		})
	})

	describe('React Features Edge Cases', () => {
		it('should handle null and undefined feature values gracefully', () => {
			const nullUndefinedSettings = {
				...mockObsidianSettings,
				features: {
					reactSettingsTab: null,
					reactStatusBar: undefined,
					reactModals: false,
					reactMcpUI: true
				}
			}

			const reactState = adaptObsidianToReact(nullUndefinedSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Should handle null/undefined values gracefully
			expect(typeof obsidianUpdates.features?.reactSettingsTab).toBe('boolean')
			expect(typeof obsidianUpdates.features?.reactStatusBar).toBe('boolean')
			expect(typeof obsidianUpdates.features?.reactModals).toBe('boolean')
			expect(typeof obsidianUpdates.features?.reactMcpUI).toBe('boolean')
		})

		it('should handle string boolean values in features', () => {
			const stringBooleanSettings = {
				...mockObsidianSettings,
				features: {
					reactSettingsTab: 'true',
					reactStatusBar: 'false',
					reactModals: true,
					reactMcpUI: false
				}
			}

			const reactState = adaptObsidianToReact(stringBooleanSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Should convert string booleans to actual booleans where applicable
			expect(typeof obsidianUpdates.features?.reactSettingsTab).toBe('boolean')
			expect(typeof obsidianUpdates.features?.reactStatusBar).toBe('boolean')
		})

		it('should handle numeric values in features', () => {
			const numericSettings = {
				...mockObsidianSettings,
				features: {
					reactSettingsTab: 1,
					reactStatusBar: 0,
					reactModals: true,
					reactMcpUI: false
				}
			}

			const reactState = adaptObsidianToReact(numericSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Should handle numeric values gracefully
			expect(typeof obsidianUpdates.features?.reactSettingsTab).toBe('boolean')
			expect(typeof obsidianUpdates.features?.reactStatusBar).toBe('boolean')
		})

		it('should handle extremely rapid feature toggling', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Rapidly toggle features
			for (let i = 0; i < 20; i++) {
				reactState.reactFeatures.reactSettingsTab = i % 2 === 0
				reactState.reactFeatures.reactStatusBar = i % 3 === 0
				reactState.reactFeatures.reactModals = i % 4 === 0
				reactState.reactFeatures.reactMcpUI = i % 5 === 0

				const obsidianUpdates = adaptReactToObsidian(reactState)
				expect(typeof obsidianUpdates.features?.reactSettingsTab).toBe('boolean')
				expect(typeof obsidianUpdates.features?.reactStatusBar).toBe('boolean')
				expect(typeof obsidianUpdates.features?.reactModals).toBe('boolean')
				expect(typeof obsidianUpdates.features?.reactMcpUI).toBe('boolean')
			}
		})
	})

	describe('React Features Integration with Other Features', () => {
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

			// Verify both features and providers are preserved
			expect(obsidianUpdates.features?.reactSettingsTab).toBe(true)
			expect(obsidianUpdates.providers).toHaveLength(1)
			expect(obsidianUpdates.providers[0].tag).toBe('claude')
		})

		it('should work correctly with MCP servers', () => {
			const settingsWithMcpServers = {
				...mockObsidianSettings,
				mcpServers: [
					{
						id: 'test-server',
						name: 'Test Server',
						enabled: true,
						deploymentType: 'managed',
						transport: 'stdio',
						configInput: '{"command": "test"}'
					}
				]
			}

			const reactState = adaptObsidianToReact(settingsWithMcpServers)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Verify both features and MCP servers are preserved
			expect(obsidianUpdates.features?.reactMcpUI).toBe(false)
			expect(obsidianUpdates.mcpServers).toHaveLength(1)
			expect(obsidianUpdates.mcpServers[0].id).toBe('test-server')
		})

		it('should work correctly with UI state', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Update React features and UI state
			reactState.reactFeatures.reactSettingsTab = false
			reactState.uiState.systemMessageExpanded = true
			reactState.uiState.mcpServersExpanded = true

			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.features?.reactSettingsTab).toBe(false)
			expect(obsidianUpdates.uiState?.systemMessageExpanded).toBe(true)
			expect(obsidianUpdates.uiState?.mcpServersExpanded).toBe(true)
		})

		it('should work correctly with basic settings', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Update both React features and basic settings
			reactState.reactFeatures.reactModals = true
			reactState.basicSettings.confirmRegenerate = true

			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.features?.reactModals).toBe(true)
			expect(obsidianUpdates.confirmRegenerate).toBe(true)
		})

		it('should work correctly with system message settings', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Update both React features and system message
			reactState.reactFeatures.reactStatusBar = true
			reactState.systemMessage.enabled = true
			reactState.systemMessage.message = 'New system message'

			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.features?.reactStatusBar).toBe(true)
			expect(obsidianUpdates.enableDefaultSystemMsg).toBe(true)
			expect(obsidianUpdates.defaultSystemMsg).toBe('New system message')
		})
	})

	describe('React Features Default Values', () => {
		it('should use correct default values when features are missing', () => {
			const emptySettings = {
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
				mcpServers: [],
				mcpConcurrentLimit: 5,
				mcpSessionLimit: 20,
				mcpGlobalTimeout: 30000,
				mcpParallelExecution: false,
				mcpMaxParallelTools: 10
				// No features field
			}

			const reactState = adaptObsidianToReact(emptySettings)

			expect(reactState.reactFeatures.reactSettingsTab).toBe(false)
			expect(reactState.reactFeatures.reactStatusBar).toBe(false)
			expect(reactState.reactFeatures.reactModals).toBe(false)
			expect(reactState.reactFeatures.reactMcpUI).toBe(false)
		})

		it('should preserve existing feature values when updating other settings', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Update non-feature settings
			reactState.basicSettings.confirmRegenerate = true
			reactState.systemMessage.enabled = true
			reactState.messageTags.userTags = ['#User', '#Human']

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			// Verify features are unchanged
			expect(mergedSettings.features?.reactSettingsTab).toBe(true)
			expect(mergedSettings.features?.reactStatusBar).toBe(false)
			expect(mergedSettings.features?.reactModals).toBe(false)
			expect(mergedSettings.features?.reactMcpUI).toBe(false)

			// Verify other settings are updated
			expect(mergedSettings.confirmRegenerate).toBe(true)
			expect(mergedSettings.enableDefaultSystemMsg).toBe(true)
			expect(mergedSettings.userTags).toEqual(['#User', '#Human'])
		})
	})
})