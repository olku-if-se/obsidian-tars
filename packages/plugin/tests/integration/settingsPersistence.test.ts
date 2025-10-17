import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TarsPlugin } from '../../src/main'
import { PluginSettings } from '../../src/settings'
import { adaptObsidianToReact, adaptReactToObsidian, mergeReactChanges } from '../../src/adapters/reactSettingsAdapter'

// Mock Obsidian API
const mockApp = {
	vault: {
		configDir: '/mock/vault/.obsidian',
		config: {}
	},
	workspace: {
		onLayoutReady: vi.fn()
	}
}

const mockPlugin = {
	app: mockApp,
	settings: {} as PluginSettings,
	saveSettings: vi.fn().mockResolvedValue(undefined),
	loadSettings: vi.fn().mockResolvedValue({}),
	addSettingTab: vi.fn(),
	registerEvent: vi.fn(),
	registerView: vi.fn(),
	addRibbonIcon: vi.fn(),
	addCommand: vi.fn()
}

describe('Settings Persistence - Integration Tests', () => {
	let originalSettings: PluginSettings
	let reactState: any

	beforeEach(() => {
		// Reset mocks
		vi.clearAllMocks()

		// Create comprehensive original settings
		originalSettings = {
			providers: [
				{
					tag: 'claude',
					vendor: 'Claude',
					options: {
						apiKey: 'sk-ant-test-key',
						model: 'claude-3-5-sonnet-20241022',
						parameters: {
							temperature: 0.7,
							max_tokens: 4000,
							thinkingMode: 'auto'
						}
					}
				},
				{
					tag: 'openai',
					vendor: 'OpenAI',
					options: {
						apiKey: 'sk-test-key',
						model: 'gpt-4',
						baseURL: 'https://api.openai.com/v1',
						parameters: {
							temperature: 0.5,
							max_tokens: 2000
						}
					}
				}
			],
			newChatTags: ['#NewChat', '#Start'],
			userTags: ['#User', '#Human'],
			systemTags: ['#System', '#Instructions'],
			roleEmojis: {
				newChat: '🆕',
				user: '👤',
				system: '⚙️',
				assistant: '✨'
			},
			confirmRegenerate: true,
			enableInternalLink: true,
			enableDefaultSystemMsg: true,
			defaultSystemMsg: 'You are a helpful AI assistant.',
			enableInternalLinkForAssistantMsg: true,
			answerDelayInMilliseconds: 500,
			enableReplaceTag: true,
			enableExportToJSONL: false,
			enableTagSuggest: true,
			mcpServers: [
				{
					id: 'file-operations',
					name: 'File Operations',
					enabled: true,
					deploymentType: 'managed',
					transport: 'stdio',
					dockerConfig: {
						image: 'mcp/file-ops:latest',
						containerName: 'file-ops-server',
						ports: ['3000:3000'],
						volumes: ['/data:/app/data']
					},
					retryConfig: {
						maxAttempts: 3,
						backoffMultiplier: 2,
						initialDelay: 1000
					},
					configInput: '{"workingDirectory": "/data"}'
				},
				{
					id: 'web-search',
					name: 'Web Search',
					enabled: false,
					deploymentType: 'external',
					transport: 'sse',
					sseConfig: {
						url: 'http://localhost:8080/sse'
					},
					retryConfig: {
						maxAttempts: 5,
						backoffMultiplier: 1.5,
						initialDelay: 500
					},
					configInput: '{"apiKey": "search-api-key"}'
				}
			],
			mcpConcurrentLimit: 10,
			mcpSessionLimit: 50,
			mcpGlobalTimeout: 60000,
			mcpParallelExecution: true,
			mcpMaxParallelTools: 20,
			features: {
				reactSettingsTab: true,
				reactStatusBar: true,
				reactModals: false,
				reactMcpUI: true
			},
			uiState: {
				systemMessageExpanded: true,
				advancedExpanded: false,
				mcpServersExpanded: true
			}
		}

		// Create React state from original settings
		reactState = adaptObsidianToReact(originalSettings)
	})

	describe('Complete Settings Round-trip Persistence', () => {
		it('should preserve all settings through complete round-trip conversion', () => {
			// Convert to React state and back
			const obsidianUpdates = adaptReactToObsidian(reactState)
			const backToReact = adaptObsidianToReact(obsidianUpdates)

			// Verify all major sections are preserved
			expect(obsidianUpdates.providers).toHaveLength(2)
			expect(obsidianUpdates.mcpServers).toHaveLength(2)
			expect(obsidianUpdates.newChatTags).toEqual(['#NewChat', '#Start'])
			expect(obsidianUpdates.userTags).toEqual(['#User', '#Human'])
			expect(obsidianUpdates.systemTags).toEqual(['#System', '#Instructions'])
			expect(obsidianUpdates.confirmRegenerate).toBe(true)
			expect(obsidianUpdates.enableInternalLink).toBe(true)
			expect(obsidianUpdates.enableDefaultSystemMsg).toBe(true)
			expect(obsidianUpdates.defaultSystemMsg).toBe('You are a helpful AI assistant.')

			// Verify React state consistency
			expect(backToReact.providers).toHaveLength(2)
			expect(backToReact.mcpServers).toHaveLength(2)
			expect(backToReact.messageTags.newChatTags).toEqual(['#NewChat', '#Start'])
			expect(backToReact.messageTags.userTags).toEqual(['#User', '#Human'])
			expect(backToReact.messageTags.systemTags).toEqual(['#System', '#Instructions'])
			expect(backToReact.basicSettings.confirmRegenerate).toBe(true)
			expect(backToReact.basicSettings.enableInternalLink).toBe(true)
			expect(backToReact.systemMessage.enabled).toBe(true)
			expect(backToReact.systemMessage.message).toBe('You are a helpful AI assistant.')
		})

		it('should preserve complex nested configurations through round-trip', () => {
			const obsidianUpdates = adaptReactToObsidian(reactState)
			const backToReact = adaptObsidianToReact(obsidianUpdates)

			// Verify provider configurations are preserved
			const claudeProvider = obsidianUpdates.providers?.find(p => p.vendor === 'Claude')
			expect(claudeProvider?.options.apiKey).toBe('sk-ant-test-key')
			expect(claudeProvider?.options.model).toBe('claude-3-5-sonnet-20241022')
			expect(claudeProvider?.options.parameters?.temperature).toBe(0.7)
			expect(claudeProvider?.options.parameters?.max_tokens).toBe(4000)

			// Verify MCP server configurations are preserved
			const fileOpsServer = obsidianUpdates.mcpServers?.find(s => s.id === 'file-operations')
			expect(fileOpsServer?.dockerConfig?.image).toBe('mcp/file-ops:latest')
			expect(fileOpsServer?.retryConfig?.maxAttempts).toBe(3)
			expect(fileOpsServer?.configInput).toBe('{"workingDirectory": "/data"}')

			// Verify feature flags are preserved
			expect(obsidianUpdates.features?.reactSettingsTab).toBe(true)
			expect(obsidianUpdates.features?.reactStatusBar).toBe(true)
			expect(obsidianUpdates.features?.reactModals).toBe(false)
			expect(obsidianUpdates.features?.reactMcpUI).toBe(true)

			// Verify UI state is preserved
			expect(obsidianUpdates.uiState?.systemMessageExpanded).toBe(true)
			expect(obsidianUpdates.uiState?.advancedExpanded).toBe(false)
			expect(obsidianUpdates.uiState?.mcpServersExpanded).toBe(true)
		})
	})

	describe('Incremental Settings Updates Persistence', () => {
		it('should handle incremental changes with proper merging', () => {
			// Make selective changes in React state
			reactState.providers[0].apiKey = 'sk-ant-updated-key'
			reactState.providers[0].model = 'claude-3-5-haiku-20241022'
			reactState.messageTags.userTags = ['#User', '#Human', '#Person']
			reactState.basicSettings.confirmRegenerate = false
			reactState.systemMessage.message = 'Updated system message'
			reactState.mcpServers[0].enabled = false
			reactState.globalLimits.concurrentExecutions = 15
			reactState.reactFeatures.reactModals = true
			reactState.uiState.advancedExpanded = true

			// Merge changes with original settings
			const mergedSettings = mergeReactChanges(originalSettings, reactState)

			// Verify only intended changes were applied
			expect(mergedSettings.providers[0].options.apiKey).toBe('sk-ant-updated-key')
			expect(mergedSettings.providers[0].options.model).toBe('claude-3-5-haiku-20241022')
			expect(mergedSettings.userTags).toEqual(['#User', '#Human', '#Person'])
			expect(mergedSettings.confirmRegenerate).toBe(false)
			expect(mergedSettings.defaultSystemMsg).toBe('Updated system message')
			expect(mergedSettings.mcpServers?.[0].enabled).toBe(false)
			expect(mergedSettings.mcpConcurrentLimit).toBe(15)
			expect(mergedSettings.features?.reactModals).toBe(true)
			expect(mergedSettings.uiState?.advancedExpanded).toBe(true)

			// Verify other settings are preserved unchanged
			expect(mergedSettings.providers[1].options.apiKey).toBe('sk-test-key') // unchanged
			expect(mergedSettings.newChatTags).toEqual(['#NewChat', '#Start']) // unchanged
			expect(mergedSettings.systemTags).toEqual(['#System', '#Instructions']) // unchanged
			expect(mergedSettings.enableInternalLink).toBe(true) // unchanged
			expect(mergedSettings.mcpServers?.[1].enabled).toBe(false) // unchanged
			expect(mergedSettings.mcpSessionLimit).toBe(50) // unchanged
			expect(mergedSettings.features?.reactSettingsTab).toBe(true) // unchanged
		})

		it('should handle array additions and removals correctly', () => {
			// Add new provider
			const newProvider = {
				id: 'new-provider',
				name: 'DeepSeek',
				tag: 'deepseek',
				model: 'deepseek-chat',
				apiKey: 'sk-deepseek-key',
				capabilities: [],
				vendorConfig: {
					deepseek: {
						baseURL: 'https://api.deepseek.com',
						maxTokens: 4000,
						temperature: 0.7
					}
				}
			}
			reactState.providers.push(newProvider)

			// Remove second MCP server
			reactState.mcpServers.splice(1, 1)

			// Add new tag to user tags
			reactState.messageTags.userTags.push('#Individual')

			// Merge changes
			const mergedSettings = mergeReactChanges(originalSettings, reactState)

			// Verify array changes
			expect(mergedSettings.providers).toHaveLength(3)
			expect(mergedSettings.providers[2].tag).toBe('deepseek')
			expect(mergedSettings.mcpServers).toHaveLength(1)
			expect(mergedSettings.mcpServers[0].id).toBe('file-operations')
			expect(mergedSettings.userTags).toEqual(['#User', '#Human', '#Individual'])
		})
	})

	describe('Settings Corruption Prevention', () => {
		it('should prevent data corruption with invalid inputs', () => {
			// Create corrupted React state
			const corruptedState = adaptObsidianToReact(originalSettings)

			// Add invalid data
			;(corruptedState as any).providers[0].apiKey = null
			;(corruptedState as any).providers[0].model = undefined
			;(corruptedState as any).systemMessage.message = 12345 // wrong type
			;(corruptedState as any).globalLimits.concurrentExecutions = 'invalid' // wrong type
			;(corruptedState as any).reactFeatures.reactSettingsTab = 'yes' // string instead of boolean

			// Should not throw errors and should handle gracefully
			expect(() => {
				const obsidianUpdates = adaptReactToObsidian(corruptedState)
				const mergedSettings = mergeReactChanges(originalSettings, corruptedState)
			}).not.toThrow()
		})

		it('should maintain settings integrity during multiple save/load cycles', () => {
			let currentSettings = { ...originalSettings }

			// Simulate multiple save/load cycles with changes
			for (let i = 0; i < 5; i++) {
				// Convert to React state
				const reactState = adaptObsidianToReact(currentSettings)

				// Make some changes
				reactState.globalLimits.concurrentExecutions = 10 + i * 2
				reactState.basicSettings.confirmRegenerate = i % 2 === 0
				reactState.systemMessage.message = `System message v${i}`

				// Convert back and merge
				const obsidianUpdates = adaptReactToObsidian(reactState)
				currentSettings = mergeReactChanges(currentSettings, reactState)
			}

			// Verify final state is consistent
			const finalReactState = adaptObsidianToReact(currentSettings)
			expect(finalReactState.globalLimits.concurrentExecutions).toBe(18) // 10 + 4*2
			expect(finalReactState.basicSettings.confirmRegenerate).toBe(true) // 4 % 2 === 0
			expect(finalReactState.systemMessage.message).toBe('System message v4')

			// Verify other settings are preserved
			expect(finalReactState.providers).toHaveLength(2)
			expect(finalReactState.mcpServers).toHaveLength(2)
			expect(finalReactState.messageTags.newChatTags).toEqual(['#NewChat', '#Start'])
		})
	})

	describe('Performance with Large Settings', () => {
		it('should handle large provider lists efficiently', () => {
			// Create settings with many providers
			const largeSettings = { ...originalSettings }
			largeSettings.providers = []

			for (let i = 0; i < 50; i++) {
				largeSettings.providers.push({
					tag: `provider-${i}`,
					vendor: ['Claude', 'OpenAI', 'DeepSeek', 'Ollama'][i % 4],
					options: {
						apiKey: `sk-key-${i}`,
						model: `model-${i}`,
						parameters: {
							temperature: i % 10 / 10,
							max_tokens: 1000 + i * 100
						}
					}
				})
			}

			// Measure performance
			const startTime = Date.now()
			const reactState = adaptObsidianToReact(largeSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)
			const mergedSettings = mergeReactChanges(largeSettings, reactState)
			const endTime = Date.now()

			// Should complete within reasonable time (less than 1 second)
			expect(endTime - startTime).toBeLessThan(1000)

			// Verify data integrity
			expect(obsidianUpdates.providers).toHaveLength(50)
			expect(mergedSettings.providers).toHaveLength(50)
			expect(mergedSettings.providers[0].tag).toBe('provider-0')
			expect(mergedSettings.providers[49].tag).toBe('provider-49')
		})

		it('should handle large MCP server lists efficiently', () => {
			// Create settings with many MCP servers
			const largeSettings = { ...originalSettings }
			largeSettings.mcpServers = []

			for (let i = 0; i < 100; i++) {
				largeSettings.mcpServers.push({
					id: `server-${i}`,
					name: `Server ${i}`,
					enabled: i % 2 === 0,
					deploymentType: i % 3 === 0 ? 'managed' : 'external',
					transport: i % 2 === 0 ? 'stdio' : 'sse',
					configInput: JSON.stringify({ serverId: i }),
					retryConfig: {
						maxAttempts: 3 + i % 5,
						backoffMultiplier: 1 + i % 3,
						initialDelay: 500 + i * 100
					}
				})
			}

			// Measure performance
			const startTime = Date.now()
			const reactState = adaptObsidianToReact(largeSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)
			const mergedSettings = mergeReactChanges(largeSettings, reactState)
			const endTime = Date.now()

			// Should complete within reasonable time (less than 2 seconds for 100 servers)
			expect(endTime - startTime).toBeLessThan(2000)

			// Verify data integrity
			expect(obsidianUpdates.mcpServers).toHaveLength(100)
			expect(mergedSettings.mcpServers).toHaveLength(100)
			expect(mergedSettings.mcpServers[0].id).toBe('server-0')
			expect(mergedSettings.mcpServers[99].id).toBe('server-99')
		})
	})

	describe('Edge Cases and Error Handling', () => {
		it('should handle completely empty settings', () => {
			const emptySettings: PluginSettings = {
				providers: [],
				newChatTags: [],
				userTags: [],
				systemTags: [],
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
				mcpMaxParallelTools: 10
			}

			const reactState = adaptObsidianToReact(emptySettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)
			const mergedSettings = mergeReactChanges(emptySettings, reactState)

			// Should handle empty settings gracefully
			expect(reactState.providers).toHaveLength(0)
			expect(reactState.mcpServers).toHaveLength(0)
			expect(obsidianUpdates.providers).toHaveLength(0)
			expect(obsidianUpdates.mcpServers).toHaveLength(0)
			expect(mergedSettings.providers).toHaveLength(0)
			expect(mergedSettings.mcpServers).toHaveLength(0)
		})

		it('should handle settings with missing optional fields', () => {
			const minimalSettings: Partial<PluginSettings> = {
				providers: [],
				newChatTags: ['#NewChat'],
				userTags: ['#User'],
				systemTags: ['#System'],
				confirmRegenerate: false,
				enableInternalLink: false,
				mcpServers: [],
				mcpConcurrentLimit: 5,
				mcpSessionLimit: 20,
				mcpGlobalTimeout: 30000,
				mcpParallelExecution: false,
				mcpMaxParallelTools: 10
			}

			// Should not throw errors with minimal settings
			expect(() => {
				const reactState = adaptObsidianToReact(minimalSettings as PluginSettings)
				const obsidianUpdates = adaptReactToObsidian(reactState)
				const mergedSettings = mergeReactChanges(minimalSettings as PluginSettings, reactState)
			}).not.toThrow()
		})

		it('should maintain consistent JSON serialization', () => {
			const obsidianUpdates = adaptReactToObsidian(reactState)
			const serialized = JSON.stringify(obsidianUpdates)
			const deserialized = JSON.parse(serialized) as PluginSettings

			// Should be able to deserialize and use settings
			expect(() => {
				const reactStateFromDeserialized = adaptObsidianToReact(deserialized)
				const backToObsidian = adaptReactToObsidian(reactStateFromDeserialized)
			}).not.toThrow()

			// Critical fields should match after round-trip serialization
			const reactStateFromDeserialized = adaptObsidianToReact(deserialized)
			expect(reactStateFromDeserialized.providers).toHaveLength(2)
			expect(reactStateFromDeserialized.mcpServers).toHaveLength(2)
			expect(reactStateFromDeserialized.messageTags.newChatTags).toEqual(['#NewChat', '#Start'])
		})
	})

	describe('Real-world Simulation', () => {
		it('should simulate typical user session with multiple setting changes', () => {
			let currentSettings = { ...originalSettings }
			let currentReactState = adaptObsidianToReact(currentSettings)

			// Simulate user making various setting changes throughout a session
			const sessionChanges = [
				// Change API key
				() => {
					currentReactState.providers[0].apiKey = 'sk-ant-new-session-key'
				},
				// Toggle feature
				() => {
					currentReactState.reactFeatures.reactStatusBar = false
				},
				// Update tags
				() => {
					currentReactState.messageTags.userTags.push('#Participant')
				},
				// Change system message
				() => {
					currentReactState.systemMessage.message = 'You are an AI assistant for this session.'
				},
				// Add MCP server
				() => {
					currentReactState.mcpServers.push({
						id: 'session-server',
						name: 'Session Server',
						enabled: true,
						deploymentType: 'external',
						transport: 'stdio',
						configInput: '{"session": true}'
					})
				},
				// Update limits
				() => {
					currentReactState.globalLimits.concurrentExecutions = 25
					currentReactState.globalLimits.sessionLimitPerDocument = 100
				},
				// Toggle advanced setting
				() => {
					currentReactState.advancedSettings.enableReplaceTag = true
				},
				// Change UI state
				() => {
					currentReactState.uiState.systemMessageExpanded = false
					currentReactState.uiState.mcpServersExpanded = true
				}
			]

			// Apply changes sequentially
			for (const change of sessionChanges) {
				change()
				currentSettings = mergeReactChanges(currentSettings, currentReactState)
				currentReactState = adaptObsidianToReact(currentSettings)
			}

			// Verify final state reflects all changes
			expect(currentSettings.providers[0].options.apiKey).toBe('sk-ant-new-session-key')
			expect(currentSettings.features?.reactStatusBar).toBe(false)
			expect(currentSettings.userTags).toEqual(['#User', '#Human', '#Participant'])
			expect(currentSettings.defaultSystemMsg).toBe('You are an AI assistant for this session.')
			expect(currentSettings.mcpServers).toHaveLength(3)
			expect(currentSettings.mcpServers[2].id).toBe('session-server')
			expect(currentSettings.mcpConcurrentLimit).toBe(25)
			expect(currentSettings.mcpSessionLimit).toBe(100)
			expect(currentSettings.enableReplaceTag).toBe(true)
			expect(currentSettings.uiState?.systemMessageExpanded).toBe(false)
			expect(currentSettings.uiState?.mcpServersExpanded).toBe(true)

			// Verify other settings are preserved
			expect(currentSettings.providers[1].options.apiKey).toBe('sk-test-key')
			expect(currentSettings.newChatTags).toEqual(['#NewChat', '#Start'])
			expect(currentSettings.confirmRegenerate).toBe(true)
		})
	})
})