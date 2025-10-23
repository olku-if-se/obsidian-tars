import { describe, it, expect, beforeEach } from 'vitest'
import {
	adaptObsidianToReact,
	adaptReactToObsidian,
	mergeReactChanges,
	validateAdapterTransformation
} from '../../src/adapters/reactSettingsAdapter'

// Mock DEFAULT_SETTINGS to avoid external dependencies
const mockDefaultSettings = {
	newChatTags: ['#NewChat'],
	userTags: ['#User'],
	systemTags: ['#System'],
	roleEmojis: {
		newChat: '🆕',
		user: '👤',
		system: '⚙️',
		assistant: '✨'
	},
	confirmRegenerate: true,
	enableInternalLink: true,
	enableInternalLinkForAssistantMsg: false,
	answerDelayInMilliseconds: 500,
	enableReplaceTag: false,
	enableExportToJSONL: false,
	enableTagSuggest: true,
	enableDefaultSystemMsg: false,
	defaultSystemMsg: '',
	providers: [],
	mcpServers: [],
	mcpConcurrentLimit: 5,
	mcpSessionLimit: 20,
	mcpGlobalTimeout: 30,
	mcpParallelExecution: false,
	mcpMaxParallelTools: 3,
	features: {
		reactSettingsTab: false,
		reactStatusBar: false,
		reactModals: false,
		reactMcpUI: false
	}
}

describe('React Settings Adapter - Unit Tests', () => {
	let mockObsidianSettings: any

	beforeEach(() => {
		// Create a minimal mock Obsidian settings object
		mockObsidianSettings = {
			...mockDefaultSettings,
			providers: [
				{
					tag: 'claude',
					vendor: 'Claude',
					options: {
						apiKey: 'test-claude-key',
						model: 'claude-3-5-sonnet-20241022',
						parameters: {
							thinkingMode: 'auto',
							budget_tokens: 1600,
							max_tokens: 4096,
							temperature: 0.7,
							top_p: 0.9
						}
					}
				},
				{
					tag: 'openai',
					vendor: 'OpenAI',
					options: {
						apiKey: 'test-openai-key',
						baseURL: 'https://api.openai.com/v1',
						model: 'gpt-4',
						parameters: {
							organization: 'test-org',
							project: 'test-project',
							max_tokens: 4096,
							temperature: 0.7,
							top_p: 1.0
						}
					}
				}
			],
			features: {
				reactSettingsTab: true,
				reactStatusBar: false,
				reactModals: false,
				reactMcpUI: false
			}
		}
	})

	describe('Basic Adapter Functions', () => {
		it('should adapt Obsidian settings to React state', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			expect(reactState).toBeDefined()
			expect(reactState.providers).toHaveLength(2)
			expect(reactState.availableVendors).toEqual(['Claude', 'OpenAI'])
			expect(reactState.messageTags).toBeDefined()
			expect(reactState.systemMessage).toBeDefined()
			expect(reactState.basicSettings).toBeDefined()
			expect(reactState.reactFeatures.reactSettingsTab).toBe(true)
		})

		it('should adapt React state back to Obsidian settings', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates).toBeDefined()
			expect(obsidianUpdates.providers).toHaveLength(2)
			expect(obsidianUpdates.newChatTags).toEqual(mockObsidianSettings.newChatTags)
			expect(obsidianUpdates.userTags).toEqual(mockObsidianSettings.userTags)
			expect(obsidianUpdates.systemTags).toEqual(mockObsidianSettings.systemTags)
			expect(obsidianUpdates.features?.reactSettingsTab).toBe(true)
		})

		it('should handle empty provider list', () => {
			const emptySettings = { ...mockDefaultSettings, providers: [] }
			const reactState = adaptObsidianToReact(emptySettings)

			expect(reactState.providers).toHaveLength(0)
			expect(reactState.availableVendors).toHaveLength(0)
		})

		it('should validate adapter transformation', () => {
			const validation = validateAdapterTransformation(mockObsidianSettings)

			expect(validation.isValid).toBe(true)
			expect(validation.errors).toHaveLength(0)
		})
	})

	describe('Provider Configuration Transformation', () => {
		it('should transform Claude provider correctly', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)
			const claudeProvider = reactState.providers.find((p) => p.name === 'Claude')

			expect(claudeProvider).toBeDefined()
			expect(claudeProvider?.id).toMatch(/claude-\d+-\d+/)
			expect(claudeProvider?.tag).toBe('claude')
			expect(claudeProvider?.apiKey).toBe('test-claude-key')
			expect(claudeProvider?.model).toBe('claude-3-5-sonnet-20241022')
			expect(claudeProvider?.vendorConfig?.claude).toEqual({
				thinkingMode: 'auto',
				budgetTokens: 1600,
				maxTokens: 4096,
				temperature: 0.7,
				topP: 0.9,
				topK: undefined
			})
		})

		it('should transform OpenAI provider correctly', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)
			const openaiProvider = reactState.providers.find((p) => p.name === 'OpenAI')

			expect(openaiProvider).toBeDefined()
			expect(openaiProvider?.id).toMatch(/openai-\d+-\d+/)
			expect(openaiProvider?.tag).toBe('openai')
			expect(openaiProvider?.apiKey).toBe('test-openai-key')
			expect(openaiProvider?.model).toBe('gpt-4')
			expect(openaiProvider?.vendorConfig?.openai).toEqual({
				baseURL: 'https://api.openai.com/v1',
				organization: 'test-org',
				project: 'test-project',
				maxTokens: 4096,
				temperature: 0.7,
				topP: 1.0,
				frequencyPenalty: undefined,
				presencePenalty: undefined
			})
		})

		it('should transform Azure provider correctly', () => {
			const azureSettings = {
				...mockDefaultSettings,
				providers: [
					{
						tag: 'azure',
						vendor: 'Azure',
						options: {
							apiKey: 'test-azure-key',
							model: 'gpt-4',
							endpoint: 'https://test.openai.azure.com/',
							parameters: {
								apiVersion: '2024-02-01-preview'
							}
						}
					}
				]
			}

			const reactState = adaptObsidianToReact(azureSettings)
			const azureProvider = reactState.providers.find((p) => p.name === 'Azure')

			expect(azureProvider).toBeDefined()
			expect(azureProvider?.vendorConfig?.azure).toEqual({
				endpoint: 'https://test.openai.azure.com/',
				apiVersion: '2024-02-01-preview'
			})
		})
	})

	describe('Settings Merging', () => {
		it('should merge React changes with original settings', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Make some changes in React state
			reactState.providers[0].apiKey = 'updated-claude-key'
			reactState.providers[0].vendorConfig!.claude!.thinkingMode = 'enabled'
			reactState.messageTags.userTags = ['#User', '#Human']

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			// Check that changes are applied
			const updatedClaude = mergedSettings.providers.find((p) => p.tag === 'claude')
			expect(updatedClaude?.options.apiKey).toBe('updated-claude-key')
			expect(updatedClaude?.options.parameters.thinkingMode).toBe('enabled')
			expect(mergedSettings.userTags).toEqual(['#User', '#Human'])

			// Check that original values are preserved
			const unchangedOpenAI = mergedSettings.providers.find((p) => p.vendor === 'OpenAI')
			expect(unchangedOpenAI?.options.apiKey).toBe('test-openai-key')
		})

		it('should handle new provider addition', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Add a new provider in React state
			reactState.providers.push({
				id: 'new-provider-123',
				name: 'Ollama',
				tag: 'ollama',
				model: 'llama3.1',
				apiKey: '',
				capabilities: [],
				vendorConfig: {
					ollama: {
						baseURL: 'http://127.0.0.1:11434',
						model: 'llama3.1'
					}
				}
			})

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			expect(mergedSettings.providers).toHaveLength(3)
			const newProvider = mergedSettings.providers.find((p) => p.tag === 'ollama')
			expect(newProvider).toBeDefined()
			expect(newProvider?.vendor).toBe('Ollama')
			expect(newProvider?.options.model).toBe('llama3.1')
		})
	})

	describe('Data Integrity', () => {
		it('should maintain data integrity through round-trip conversion', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)
			const backToReact = adaptObsidianToReact(obsidianUpdates)

			// Check that critical fields are preserved
			const originalClaude = mockObsidianSettings.providers[0]
			const finalClaude = backToReact.providers.find((p) => p.name === 'Claude')

			expect(finalClaude?.tag).toBe(originalClaude.tag)
			expect(finalClaude?.apiKey).toBe(originalClaude.options.apiKey)
			expect(finalClaude?.vendorConfig?.claude?.budgetTokens).toBe(originalClaude.options.parameters.budget_tokens)
		})

		it('should preserve message tags correctly', () => {
			const customTags = {
				...mockDefaultSettings,
				newChatTags: ['#NewChat', '#Start'],
				userTags: ['#User', '#Human'],
				systemTags: ['#System', '#Instructions']
			}

			const reactState = adaptObsidianToReact(customTags)
			expect(reactState.messageTags.newChatTags).toEqual(['#NewChat', '#Start'])
			expect(reactState.messageTags.userTags).toEqual(['#User', '#Human'])
			expect(reactState.messageTags.systemTags).toEqual(['#System', '#Instructions'])
		})

		it('should preserve feature flags', () => {
			const customFeatures = {
				reactSettingsTab: true,
				reactStatusBar: true,
				reactModals: true,
				reactMcpUI: true
			}

			const settingsWithFeatures = {
				...mockDefaultSettings,
				features: customFeatures
			}

			const reactState = adaptObsidianToReact(settingsWithFeatures)
			expect(reactState.reactFeatures).toEqual(customFeatures)

			const obsidianUpdates = adaptReactToObsidian(reactState)
			expect(obsidianUpdates.features).toEqual(customFeatures)
		})
	})

	describe('Error Handling', () => {
		it('should handle malformed provider configurations gracefully', () => {
			const malformedSettings = {
				...mockDefaultSettings,
				providers: [
					{
						tag: 'broken',
						vendor: 'OpenAI',
						options: {
							apiKey: 'test-key',
							// Missing model field
							parameters: 'invalid-json-string' // Should be object
						}
					}
				]
			}

			// Should not throw error
			expect(() => {
				const reactState = adaptObsidianToReact(malformedSettings)
				expect(reactState.providers).toHaveLength(1)
			}).not.toThrow()
		})

		it('should handle missing parameters safely', () => {
			const minimalSettings = {
				...mockDefaultSettings,
				providers: [
					{
						tag: 'minimal',
						vendor: 'OpenAI',
						options: {
							apiKey: 'test-key',
							model: 'gpt-4'
							// No parameters field
						}
					}
				]
			}

			const reactState = adaptObsidianToReact(minimalSettings)
			const provider = reactState.providers[0]
			expect(provider.vendorConfig).toBeDefined()
			expect(provider.vendorConfig?.openai).toEqual({})
		})

		it('should handle empty vendor configurations', () => {
			const emptyVendorSettings = {
				...mockDefaultSettings,
				providers: [
					{
						...mockObsidianSettings.providers[0],
						options: {
							...mockObsidianSettings.providers[0].options,
							parameters: {}
						}
					}
				]
			}

			const reactState = adaptObsidianToReact(emptyVendorSettings)
			const provider = reactState.providers[0]
			expect(provider.vendorConfig).toBeDefined()
			expect(Object.keys(provider.vendorConfig!)).toEqual(['claude'])
		})
	})

	describe('Performance', () => {
		it('should handle large provider lists efficiently', () => {
			const largeSettings = {
				...mockDefaultSettings,
				providers: Array.from({ length: 50 }, (_, index) => ({
					tag: `provider-${index}`,
					vendor: index % 2 === 0 ? 'Claude' : 'OpenAI',
					options: {
						apiKey: `key-${index}`,
						model: 'model',
						parameters: {}
					}
				}))
			}

			const startTime = Date.now()
			const reactState = adaptObsidianToReact(largeSettings)
			const endTime = Date.now()

			expect(reactState.providers).toHaveLength(50)
			expect(endTime - startTime).toBeLessThan(100) // Should be fast
		})
	})
})
