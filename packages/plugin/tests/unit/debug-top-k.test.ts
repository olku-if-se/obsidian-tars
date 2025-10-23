import { describe, it, expect } from 'vitest'
import { adaptObsidianToReact, adaptReactToObsidian } from '../../src/adapters/reactSettingsAdapter'

describe('Debug top_k parameter issue', () => {
	it('should preserve top_k parameter through round-trip conversion', () => {
		// Create test settings with top_k parameter - exactly matching the comprehensive test
		const testSettings = {
			providers: [
				{
					tag: 'claude',
					vendor: 'Claude',
					options: {
						apiKey: 'sk-ant-api-test-key-12345',
						model: 'claude-3-5-sonnet-20241022',
						baseURL: 'https://api.anthropic.com',
						parameters: {
							temperature: 0.7,
							max_tokens: 4000,
							top_p: 0.9,
							top_k: 250, // This is the parameter that's getting lost
							thinkingMode: 'auto',
							budget_tokens: 8000,
							stop: ['</response>', '<END>']
						}
					}
				}
			],
			newChatTags: ['#NewChat', '#Start', '#Fresh', '#Begin'],
			userTags: ['#User', '#Human', '#Person', '#Individual', '#Me'],
			systemTags: ['#System', '#Instructions', '#Setup', '#Context'],
			roleEmojis: {
				newChat: '🆕',
				user: '👤',
				system: '⚙️',
				assistant: '✨'
			},
			confirmRegenerate: true,
			enableInternalLink: true,
			enableDefaultSystemMsg: true,
			defaultSystemMsg: 'You are a helpful AI assistant. Please respond thoughtfully and accurately to user queries.',
			enableInternalLinkForAssistantMsg: true,
			answerDelayInMilliseconds: 750,
			enableReplaceTag: true,
			enableExportToJSONL: true,
			enableTagSuggest: true,
			mcpServers: [],
			mcpConcurrentLimit: 15,
			mcpSessionLimit: 75,
			mcpGlobalTimeout: 90000,
			mcpParallelExecution: true,
			mcpMaxParallelTools: 25,
			features: {
				reactSettingsTab: true,
				reactStatusBar: true,
				reactModals: true,
				reactMcpUI: true
			},
			uiState: {
				systemMessageExpanded: true,
				advancedExpanded: true,
				mcpServersExpanded: true
			}
		}

		console.log('Original top_k value:', testSettings.providers[0].options.parameters.top_k)

		const reactState = adaptObsidianToReact(testSettings)
		console.log('React vendorConfig claude.topK value:', reactState.providers[0].vendorConfig.claude.topK)

		const obsidianUpdates = adaptReactToObsidian(reactState)
		console.log('Converted back top_k value:', obsidianUpdates.providers[0].options.parameters.top_k)

		// Replicate the exact check from the failing test
		const claudeParams = obsidianUpdates.providers?.find((p) => p.vendor === 'Claude')?.options.parameters
		console.log('Claude params from find():', claudeParams)
		console.log('typeof claudeParams?.top_k:', typeof claudeParams?.top_k)
		console.log('claudeParams?.top_k value:', claudeParams?.top_k)

		expect(claudeParams?.top_k).toBe(250)
		expect(typeof claudeParams?.top_k).toBe('number')
	})
})
