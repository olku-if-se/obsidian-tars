import { describe, it, expect, beforeEach } from 'vitest'
import {
	adaptObsidianToReact,
	adaptReactToObsidian,
	mergeReactChanges,
	validateAdapterTransformation
} from '../../src/adapters/reactSettingsAdapter'
import { DEFAULT_SETTINGS } from '../../src/settings'
// Mock available vendors for testing
const availableVendors = [
	{ name: 'Claude' },
	{ name: 'OpenAI' },
	{ name: 'Azure' },
	{ name: 'DeepSeek' },
	{ name: 'Ollama' },
	{ name: 'GPT Image' }
]

describe('React Settings Adapter Integration', () => {
	let mockObsidianSettings: any

	beforeEach(() => {
		// Create a mock Obsidian settings object
		mockObsidianSettings = {
			...DEFAULT_SETTINGS,
			providers: [
				{
					tag: 'claude',
					vendor: 'Claude',
					options: {
						apiKey: 'test-claude-key',
						model: 'claude-3-5-sonnet-20241022',
						thinkingMode: 'auto',
						budget_tokens: 1600,
						max_tokens: 4096,
						parameters: {
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
							project: 'test-project'
						}
					}
				},
				{
					tag: 'azure',
					vendor: 'Azure',
					options: {
						apiKey: 'test-azure-key',
						model: 'gpt-4',
						endpoint: 'https://test.openai.azure.com/',
						apiVersion: '2024-02-01-preview',
						parameters: {}
					}
				},
				{
					tag: 'ollama',
					vendor: 'Ollama',
					options: {
						model: 'llama3.1',
						baseURL: 'http://127.0.0.1:11434',
						parameters: {
							keepAlive: '5m',
							stream: true
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

	describe('Obsidian to React Transformation', () => {
		it('should transform provider configurations correctly', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Check that providers are transformed
			expect(reactState.providers).toHaveLength(4)
			expect(reactState.availableVendors).toEqual(['Claude', 'OpenAI', 'Azure', 'Ollama'])

			// Check Claude provider transformation
			const claudeProvider = reactState.providers.find((p) => p.name === 'Claude')
			expect(claudeProvider).toBeDefined()
			expect(claudeProvider.id).toMatch(/claude-\d+-\d+/)
			expect(claudeProvider.tag).toBe('claude')
			expect(claudeProvider.apiKey).toBe('test-claude-key')
			expect(claudeProvider.vendorConfig?.claude).toEqual({
				thinkingMode: 'auto',
				budgetTokens: 1600,
				maxTokens: 4096,
				temperature: 0.7,
				topP: 0.9,
				topK: undefined
			})

			// Check Azure provider transformation
			const azureProvider = reactState.providers.find((p) => p.name === 'Azure')
			expect(azureProvider).toBeDefined()
			expect(azureProvider.vendorConfig?.azure).toEqual({
				endpoint: 'https://test.openai.azure.com/',
				apiVersion: '2024-02-01-preview'
			})

			// Check Ollama provider transformation
			const ollamaProvider = reactState.providers.find((p) => p.name === 'Ollama')
			expect(ollamaProvider).toBeDefined()
			expect(ollamaProvider.vendorConfig?.ollama).toEqual({
				baseURL: 'http://127.0.0.1:11434',
				model: 'llama3.1',
				keepAlive: '5m',
				stream: true
			})
		})

		it('should transform message tags correctly', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			expect(reactState.messageTags.newChatTags).toEqual(mockObsidianSettings.newChatTags)
			expect(reactState.messageTags.userTags).toEqual(mockObsidianSettings.userTags)
			expect(reactState.messageTags.systemTags).toEqual(mockObsidianSettings.systemTags)
			expect(reactState.messageTags.roleEmojis).toEqual(mockObsidianSettings.roleEmojis)
		})

		it('should transform feature flags correctly', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			expect(reactState.reactFeatures.reactSettingsTab).toBe(true)
			expect(reactState.reactFeatures.reactStatusBar).toBe(false)
			expect(reactState.reactFeatures.reactModals).toBe(false)
			expect(reactState.reactFeatures.reactMcpUI).toBe(false)
		})

		it('should handle empty provider list', () => {
			const emptySettings = { ...DEFAULT_SETTINGS, providers: [] }
			const reactState = adaptObsidianToReact(emptySettings)

			expect(reactState.providers).toHaveLength(0)
			expect(reactState.availableVendors).toHaveLength(0)
		})
	})

	describe('React to Obsidian Transformation', () => {
		it('should transform React state back to Obsidian format', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Check provider transformation
			expect(obsidianUpdates.providers).toHaveLength(4)

			// Check Claude provider
			const claudeUpdate = obsidianUpdates.providers.find((p) => p.vendor === 'Claude')
			expect(claudeUpdate).toBeDefined()
			expect(claudeUpdate.tag).toBe('claude')
			expect(claudeUpdate.options.apiKey).toBe('test-claude-key')
			expect(claudeUpdate.options.parameters).toEqual({
				thinkingMode: 'auto',
				budget_tokens: 1600,
				max_tokens: 4096,
				temperature: 0.7,
				top_p: 0.9
			})

			// Check Azure provider with endpoint mapping
			const azureUpdate = obsidianUpdates.providers.find((p) => p.vendor === 'Azure')
			expect(azureUpdate).toBeDefined()
			expect(azureUpdate.options.baseURL).toBe('https://test.openai.azure.com/')
			expect(azureUpdate.options.parameters).toEqual({
				endpoint: 'https://test.openai.azure.com/',
				apiVersion: '2024-02-01-preview'
			})
		})

		it('should preserve feature flags', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.features).toEqual({
				reactSettingsTab: true,
				reactStatusBar: false,
				reactModals: false,
				reactMcpUI: false
			})
		})
	})

	describe('Settings Merging', () => {
		it('should merge React changes with original Obsidian settings', () => {
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

			// Check that original values are preserved
			const unchangedOpenAI = mergedSettings.providers.find((p) => p.vendor === 'OpenAI')
			expect(unchangedOpenAI?.options.apiKey).toBe('test-openai-key')
		})

		it('should handle vendor configuration updates correctly', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Update Claude configuration
			reactState.providers[0].vendorConfig!.claude!.budgetTokens = 2000
			reactState.providers[0].vendorConfig!.claude!.temperature = 0.8

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			const claudeProvider = mergedSettings.providers.find((p) => p.tag === 'claude')
			expect(claudeProvider?.options.parameters.budget_tokens).toBe(2000)
			expect(claudeProvider?.options.parameters.temperature).toBe(0.8)
		})

		it('should preserve MCP server configurations', () => {
			const mcpServers = [
				{
					id: 'test-server',
					name: 'Test MCP Server',
					enabled: true,
					configInput: '{"command": "test-command"}',
					displayMode: 'command' as const,
					validationState: { isValid: true, errors: [], warnings: [] },
					failureCount: 0,
					autoDisabled: false
				}
			]

			const settingsWithMCP = { ...mockObsidianSettings, mcpServers }
			const reactState = adaptObsidianToReact(settingsWithMCP)
			const mergedSettings = mergeReactChanges(settingsWithMCP, reactState)

			expect(mergedSettings.mcpServers).toEqual(mcpServers)
		})
	})

	describe('Round-trip Validation', () => {
		it('should maintain data integrity through round-trip conversion', () => {
			const validation = validateAdapterTransformation(mockObsidianSettings)

			expect(validation.isValid).toBe(true)
			expect(validation.errors).toHaveLength(0)
		})

		it('should preserve provider configurations in round-trip', () => {
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

		it('should handle complex vendor configurations', () => {
			// Test with all vendor configurations
			const validation = validateAdapterTransformation(mockObsidianSettings)

			expect(validation.isValid).toBe(true)
			expect(validation.errors).toHaveLength(0)

			// Verify round-trip for each vendor
			const reactState = adaptObsidianToReact(mockObsidianSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)
			const backToReact = adaptObsidianToReact(obsidianUpdates)

			// Check Azure specific configuration
			const azureProvider = backToReact.providers.find((p) => p.name === 'Azure')
			expect(azureProvider?.vendorConfig?.azure?.endpoint).toBe('https://test.openai.azure.com/')

			// Check Ollama specific configuration
			const ollamaProvider = backToReact.providers.find((p) => p.name === 'Ollama')
			expect(ollamaProvider?.vendorConfig?.ollama?.keepAlive).toBe('5m')
		})
	})

	describe('Error Handling', () => {
		it('should handle invalid URL configurations gracefully', () => {
			const invalidSettings = {
				...mockObsidianSettings,
				providers: [
					{
						...mockObsidianSettings.providers[0],
						options: {
							...mockObsidianSettings.providers[0].options,
							baseURL: 'invalid-url-without-protocol'
						}
					}
				]
			}

			const reactState = adaptObsidianToReact(invalidSettings)
			expect(reactState.providers).toHaveLength(1)
		})

		it('should handle missing vendor configurations', () => {
			const minimalSettings = {
				...DEFAULT_SETTINGS,
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

		it('should handle malformed parameters safely', () => {
			const malformedSettings = {
				...mockObsidianSettings,
				providers: [
					{
						...mockObsidianSettings.providers[0],
						options: {
							...mockObsidianSettings.providers[0].options,
							parameters: 'invalid-json-string'
						}
					}
				]
			}

			// Should not throw error
			expect(() => {
				adaptObsidianToReact(malformedSettings)
			}).not.toThrow()
		})
	})

	describe('Performance and Edge Cases', () => {
		it('should handle large provider lists efficiently', () => {
			// Create a settings object with many providers
			const largeSettings = {
				...DEFAULT_SETTINGS,
				providers: Array.from({ length: 100 }, (_, index) => ({
					tag: `provider-${index}`,
					vendor: availableVendors[index % availableVendors.length].name,
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

			expect(reactState.providers).toHaveLength(100)
			expect(endTime - startTime).toBeLessThan(100) // Should be fast
		})

		it('should handle empty vendor config objects', () => {
			const emptyVendorConfigSettings = {
				...mockObsidianSettings,
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

			const reactState = adaptObsidianToReact(emptyVendorConfigSettings)
			const provider = reactState.providers[0]
			expect(provider.vendorConfig).toBeDefined()
			expect(Object.keys(provider.vendorConfig!)).toEqual(['claude'])
		})

		it('should preserve data types for numeric values', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)
			const backToReact = adaptObsidianToReact(obsidianUpdates)

			const claudeProvider = backToReact.providers.find((p) => p.name === 'Claude')
			expect(typeof claudeProvider?.vendorConfig?.claude?.budgetTokens).toBe('number')
			expect(typeof claudeProvider?.vendorConfig?.claude?.temperature).toBe('number')
			expect(claudeProvider?.vendorConfig?.claude?.topK).toBe('undefined')
		})
	})
})
