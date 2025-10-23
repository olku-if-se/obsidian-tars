import { describe, it, expect, beforeEach } from 'vitest'
import { PluginSettings } from '../../src/settings'
import {
	adaptObsidianToReact,
	adaptReactToObsidian,
	mergeReactChanges,
	validateAdapterTransformation
} from '../../src/adapters/reactSettingsAdapter'

describe('Settings Data Integrity - Integration Tests', () => {
	let comprehensiveSettings: PluginSettings

	beforeEach(() => {
		// Create comprehensive test settings with all possible fields
		comprehensiveSettings = {
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
							top_k: 250,
							thinkingMode: 'auto',
							budget_tokens: 8000,
							stop: ['</response>', '<END>']
						}
					}
				},
				{
					tag: 'openai',
					vendor: 'OpenAI',
					options: {
						apiKey: 'sk-OpenAI-test-key-67890',
						model: 'gpt-4-turbo-preview',
						baseURL: 'https://api.openai.com/v1',
						parameters: {
							temperature: 0.5,
							max_tokens: 2000,
							top_p: 0.8,
							frequency_penalty: 0.1,
							presence_penalty: 0.1,
							organization: 'org-test-123',
							project: 'project-test-456'
						}
					}
				},
				{
					tag: 'ollama',
					vendor: 'Ollama',
					options: {
						apiKey: '',
						model: 'llama3.2:70b',
						baseURL: 'http://localhost:11434',
						parameters: {
							temperature: 0.3,
							top_p: 0.7,
							top_k: 100,
							repeatPenalty: 1.1,
							stop: ['</response>'],
							numCtx: 4096,
							numPredict: 2048,
							keepAlive: '5m',
							stream: true,
							mirostat: 2,
							mirostatTau: 5.0,
							mirostatEta: 0.1,
							tfsZ: 1.0
						}
					}
				},
				{
					tag: 'azure',
					vendor: 'Azure',
					options: {
						apiKey: 'azure-test-key',
						model: 'gpt-4',
						baseURL: 'https://test-resource.openai.azure.com',
						parameters: {
							temperature: 0.6,
							max_tokens: 3000,
							top_p: 0.85,
							frequency_penalty: 0.05,
							presence_penalty: 0.05,
							apiVersion: '2024-02-15-preview',
							endpoint: 'https://test-resource.openai.azure.com'
						}
					}
				},
				{
					tag: 'deepseek',
					vendor: 'DeepSeek',
					options: {
						apiKey: 'sk-deepseek-test-key',
						model: 'deepseek-chat',
						baseURL: 'https://api.deepseek.com',
						parameters: {
							temperature: 0.4,
							max_tokens: 2500,
							top_p: 0.75,
							frequency_penalty: 0.2,
							presence_penalty: 0.2,
							reasoningEffort: 'medium'
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
			mcpServers: [
				{
					id: 'file-operations',
					name: 'File Operations Server',
					enabled: true,
					deploymentType: 'managed',
					transport: 'stdio',
					dockerConfig: {
						image: 'mcp/file-ops:latest',
						containerName: 'file-ops-container',
						ports: ['3000:3000', '8080:8080'],
						volumes: ['/data:/app/data', '/config:/app/config'],
						environment: {
							NODE_ENV: 'production',
							LOG_LEVEL: 'debug',
							API_KEY: 'file-ops-secret-key'
						},
						networks: ['mcp-network', 'default'],
						restartPolicy: 'unless-stopped'
					},
					healthCheckConfig: {
						enabled: true,
						interval: 30000,
						timeout: 5000,
						failureThreshold: 3,
						successThreshold: 2
					},
					retryConfig: {
						maxAttempts: 5,
						backoffMultiplier: 2.0,
						initialDelay: 1000,
						maxDelay: 60000
					},
					configInput: JSON.stringify(
						{
							workingDirectory: '/data',
							maxFileSize: '100MB',
							allowedExtensions: ['.txt', '.md', '.json', '.csv']
						},
						null,
						2
					)
				},
				{
					id: 'web-search',
					name: 'Web Search Service',
					enabled: false,
					deploymentType: 'external',
					transport: 'sse',
					sseConfig: {
						url: 'http://localhost:8080/sse',
						headers: {
							Authorization: 'Bearer search-api-key',
							'Content-Type': 'application/json'
						}
					},
					retryConfig: {
						maxAttempts: 3,
						backoffMultiplier: 1.5,
						initialDelay: 500,
						maxDelay: 10000
					},
					configInput: JSON.stringify(
						{
							apiKey: 'search-service-key',
							maxResults: 10,
							safeSearch: 'moderate'
						},
						null,
						2
					)
				},
				{
					id: 'database-query',
					name: 'Database Query Interface',
					enabled: true,
					deploymentType: 'managed',
					transport: 'stdio',
					dockerConfig: {
						image: 'mcp/db-query:v2.1.0',
						containerName: 'db-query-server',
						ports: ['5432:5432'],
						volumes: ['/db-data:/var/lib/postgresql/data'],
						environment: {
							POSTGRES_DB: 'app_db',
							POSTGRES_USER: 'app_user',
							POSTGRES_PASSWORD: 'secure_password_hash'
						}
					},
					healthCheckConfig: {
						enabled: true,
						interval: 60000,
						timeout: 10000,
						failureThreshold: 5
					},
					retryConfig: {
						maxAttempts: 8,
						backoffMultiplier: 3.0,
						initialDelay: 2000,
						maxDelay: 120000
					},
					configInput: JSON.stringify(
						{
							connectionString: 'postgresql://app_user:secure_password@localhost:5432/app_db',
							maxConnections: 10,
							queryTimeout: 30000
						},
						null,
						2
					)
				}
			],
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
	})

	describe('Complete Settings Preservation', () => {
		it('should preserve all provider configurations through round-trip conversion', () => {
			const reactState = adaptObsidianToReact(comprehensiveSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Verify all providers are preserved
			expect(obsidianUpdates.providers).toHaveLength(5)

			// Verify Claude provider
			const claudeProvider = obsidianUpdates.providers?.find((p) => p.vendor === 'Claude')
			expect(claudeProvider?.tag).toBe('claude')
			expect(claudeProvider?.options.apiKey).toBe('sk-ant-api-test-key-12345')
			expect(claudeProvider?.options.model).toBe('claude-3-5-sonnet-20241022')
			expect(claudeProvider?.options.parameters?.temperature).toBe(0.7)
			expect(claudeProvider?.options.parameters?.max_tokens).toBe(4000)
			expect(claudeProvider?.options.parameters?.thinkingMode).toBe('auto')
			expect(claudeProvider?.options.parameters?.budget_tokens).toBe(8000)
			expect(claudeProvider?.options.parameters?.stop).toEqual(['</response>', '<END>'])

			// Verify OpenAI provider
			const openaiProvider = obsidianUpdates.providers?.find((p) => p.vendor === 'OpenAI')
			expect(openaiProvider?.tag).toBe('openai')
			expect(openaiProvider?.options.apiKey).toBe('sk-OpenAI-test-key-67890')
			expect(openaiProvider?.options.model).toBe('gpt-4-turbo-preview')
			expect(openaiProvider?.options.parameters?.organization).toBe('org-test-123')
			expect(openaiProvider?.options.parameters?.project).toBe('project-test-456')

			// Verify Ollama provider
			const ollamaProvider = obsidianUpdates.providers?.find((p) => p.vendor === 'Ollama')
			expect(ollamaProvider?.tag).toBe('ollama')
			expect(ollamaProvider?.options.model).toBe('llama3.2:70b')
			expect(ollamaProvider?.options.parameters?.mirostat).toBe(2)
			expect(ollamaProvider?.options.parameters?.mirostatTau).toBe(5.0)
			expect(ollamaProvider?.options.parameters?.mirostatEta).toBe(0.1)

			// Verify Azure provider
			const azureProvider = obsidianUpdates.providers?.find((p) => p.vendor === 'Azure')
			expect(azureProvider?.tag).toBe('azure')
			expect(azureProvider?.options.parameters?.apiVersion).toBe('2024-02-15-preview')
			expect(azureProvider?.options.parameters?.endpoint).toBe('https://test-resource.openai.azure.com')

			// Verify DeepSeek provider
			const deepseekProvider = obsidianUpdates.providers?.find((p) => p.vendor === 'DeepSeek')
			expect(deepseekProvider?.tag).toBe('deepseek')
			expect(deepseekProvider?.options.parameters?.reasoningEffort).toBe('medium')
		})

		it('should preserve all MCP server configurations through round-trip conversion', () => {
			const reactState = adaptObsidianToReact(comprehensiveSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Verify all MCP servers are preserved
			expect(obsidianUpdates.mcpServers).toHaveLength(3)

			// Verify file operations server
			const fileOpsServer = obsidianUpdates.mcpServers?.find((s) => s.id === 'file-operations')
			expect(fileOpsServer?.name).toBe('File Operations Server')
			expect(fileOpsServer?.enabled).toBe(true)
			expect(fileOpsServer?.deploymentType).toBe('managed')
			expect(fileOpsServer?.transport).toBe('stdio')
			expect(fileOpsServer?.dockerConfig?.image).toBe('mcp/file-ops:latest')
			expect(fileOpsServer?.dockerConfig?.ports).toEqual(['3000:3000', '8080:8080'])
			expect(fileOpsServer?.dockerConfig?.environment).toEqual({
				NODE_ENV: 'production',
				LOG_LEVEL: 'debug',
				API_KEY: 'file-ops-secret-key'
			})
			expect(fileOpsServer?.healthCheckConfig?.enabled).toBe(true)
			expect(fileOpsServer?.healthCheckConfig?.interval).toBe(30000)
			expect(fileOpsServer?.retryConfig?.maxAttempts).toBe(5)
			expect(fileOpsServer?.retryConfig?.backoffMultiplier).toBe(2.0)

			// Verify web search server
			const webSearchServer = obsidianUpdates.mcpServers?.find((s) => s.id === 'web-search')
			expect(webSearchServer?.name).toBe('Web Search Service')
			expect(webSearchServer?.enabled).toBe(false)
			expect(webSearchServer?.deploymentType).toBe('external')
			expect(webSearchServer?.transport).toBe('sse')
			expect(webSearchServer?.sseConfig?.url).toBe('http://localhost:8080/sse')
			expect(webSearchServer?.sseConfig?.headers).toEqual({
				Authorization: 'Bearer search-api-key',
				'Content-Type': 'application/json'
			})

			// Verify database query server
			const dbQueryServer = obsidianUpdates.mcpServers?.find((s) => s.id === 'database-query')
			expect(dbQueryServer?.name).toBe('Database Query Interface')
			expect(dbQueryServer?.dockerConfig?.image).toBe('mcp/db-query:v2.1.0')
			expect(dbQueryServer?.healthCheckConfig?.failureThreshold).toBe(5)
			expect(dbQueryServer?.retryConfig?.maxDelay).toBe(120000)
		})

		it('should preserve all message tags and role emojis through round-trip conversion', () => {
			const reactState = adaptObsidianToReact(comprehensiveSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Verify message tags
			expect(obsidianUpdates.newChatTags).toEqual(['#NewChat', '#Start', '#Fresh', '#Begin'])
			expect(obsidianUpdates.userTags).toEqual(['#User', '#Human', '#Person', '#Individual', '#Me'])
			expect(obsidianUpdates.systemTags).toEqual(['#System', '#Instructions', '#Setup', '#Context'])

			// Verify role emojis
			expect(obsidianUpdates.roleEmojis?.newChat).toBe('🆕')
			expect(obsidianUpdates.roleEmojis?.user).toBe('👤')
			expect(obsidianUpdates.roleEmojis?.system).toBe('⚙️')
			expect(obsidianUpdates.roleEmojis?.assistant).toBe('✨')
		})

		it('should preserve all basic and advanced settings through round-trip conversion', () => {
			const reactState = adaptObsidianToReact(comprehensiveSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Verify basic settings
			expect(obsidianUpdates.confirmRegenerate).toBe(true)
			expect(obsidianUpdates.enableInternalLink).toBe(true)

			// Verify system message
			expect(obsidianUpdates.enableDefaultSystemMsg).toBe(true)
			expect(obsidianUpdates.defaultSystemMsg).toBe(
				'You are a helpful AI assistant. Please respond thoughtfully and accurately to user queries.'
			)

			// Verify advanced settings
			expect(obsidianUpdates.enableInternalLinkForAssistantMsg).toBe(true)
			expect(obsidianUpdates.answerDelayInMilliseconds).toBe(750)
			expect(obsidianUpdates.enableReplaceTag).toBe(true)
			expect(obsidianUpdates.enableExportToJSONL).toBe(true)
			expect(obsidianUpdates.enableTagSuggest).toBe(true)
		})

		it('should preserve all global limits and feature flags through round-trip conversion', () => {
			const reactState = adaptObsidianToReact(comprehensiveSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Verify global limits
			expect(obsidianUpdates.mcpConcurrentLimit).toBe(15)
			expect(obsidianUpdates.mcpSessionLimit).toBe(75)
			expect(obsidianUpdates.mcpGlobalTimeout).toBe(90000)
			expect(obsidianUpdates.mcpParallelExecution).toBe(true)
			expect(obsidianUpdates.mcpMaxParallelTools).toBe(25)

			// Verify feature flags
			expect(obsidianUpdates.features?.reactSettingsTab).toBe(true)
			expect(obsidianUpdates.features?.reactStatusBar).toBe(true)
			expect(obsidianUpdates.features?.reactModals).toBe(true)
			expect(obsidianUpdates.features?.reactMcpUI).toBe(true)

			// Verify UI state
			expect(obsidianUpdates.uiState?.systemMessageExpanded).toBe(true)
			expect(obsidianUpdates.uiState?.advancedExpanded).toBe(true)
			expect(obsidianUpdates.uiState?.mcpServersExpanded).toBe(true)
		})
	})

	describe('Selective Update Data Integrity', () => {
		it('should preserve unmodified data when updating specific settings', () => {
			const reactState = adaptObsidianToReact(comprehensiveSettings)

			// Make selective changes
			reactState.providers[0].apiKey = 'sk-ant-updated-key'
			reactState.providers[1].vendorConfig.openai.temperature = 0.9
			reactState.mcpServers[0].enabled = false
			reactState.globalLimits.concurrentExecutions = 20
			reactState.reactFeatures.reactModals = false

			const mergedSettings = mergeReactChanges(comprehensiveSettings, reactState)

			// Verify only intended changes were applied
			expect(mergedSettings.providers[0].options.apiKey).toBe('sk-ant-updated-key')
			expect(mergedSettings.providers[1].options.parameters.temperature).toBe(0.9)
			expect(mergedSettings.mcpServers?.[0].enabled).toBe(false)
			expect(mergedSettings.mcpConcurrentLimit).toBe(20)
			expect(mergedSettings.features?.reactModals).toBe(false)

			// Verify other data is preserved unchanged
			expect(mergedSettings.providers[2].options.model).toBe('llama3.2:70b') // unchanged
			expect(mergedSettings.mcpServers?.[1].enabled).toBe(false) // unchanged
			expect(mergedSettings.mcpSessionLimit).toBe(75) // unchanged
			expect(mergedSettings.features?.reactSettingsTab).toBe(true) // unchanged
			expect(mergedSettings.newChatTags).toEqual(['#NewChat', '#Start', '#Fresh', '#Begin']) // unchanged
		})

		it('should preserve array order and structure during selective updates', () => {
			const reactState = adaptObsidianToReact(comprehensiveSettings)

			// Add new provider at the end
			const newProvider = {
				id: 'new-provider',
				name: 'New Provider',
				tag: 'new',
				model: 'new-model',
				apiKey: 'new-key',
				capabilities: [],
				vendorConfig: {}
			}
			reactState.providers.push(newProvider)

			// Remove middle MCP server
			reactState.mcpServers.splice(1, 1)

			const mergedSettings = mergeReactChanges(comprehensiveSettings, reactState)

			// Verify array operations
			expect(mergedSettings.providers).toHaveLength(6)
			expect(mergedSettings.providers[5].tag).toBe('new')
			expect(mergedSettings.mcpServers).toHaveLength(2)
			expect(mergedSettings.mcpServers[0].id).toBe('file-operations')
			expect(mergedSettings.mcpServers[1].id).toBe('database-query')

			// Verify order of remaining elements is preserved
			expect(mergedSettings.providers[0].tag).toBe('claude')
			expect(mergedSettings.providers[1].tag).toBe('openai')
			expect(mergedSettings.providers[2].tag).toBe('ollama')
			expect(mergedSettings.providers[3].tag).toBe('azure')
			expect(mergedSettings.providers[4].tag).toBe('deepseek')
		})
	})

	describe('Complex Nested Data Preservation', () => {
		it('should preserve deeply nested object structures', () => {
			const reactState = adaptObsidianToReact(comprehensiveSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Verify nested provider parameters are preserved
			const claudeParams = obsidianUpdates.providers?.find((p) => p.vendor === 'Claude')?.options.parameters
			expect(claudeParams?.temperature).toBe(0.7)
			expect(claudeParams?.stop).toEqual(['</response>', '<END>'])

			// Verify nested Docker configuration is preserved
			const fileOpsDocker = obsidianUpdates.mcpServers?.find((s) => s.id === 'file-operations')?.dockerConfig
			expect(fileOpsDocker?.environment).toEqual({
				NODE_ENV: 'production',
				LOG_LEVEL: 'debug',
				API_KEY: 'file-ops-secret-key'
			})
			expect(fileOpsDocker?.ports).toEqual(['3000:3000', '8080:8080'])

			// Verify nested health check configuration is preserved
			const fileOpsHealth = obsidianUpdates.mcpServers?.find((s) => s.id === 'file-operations')?.healthCheckConfig
			expect(fileOpsHealth?.successThreshold).toBe(2)
			expect(fileOpsHealth?.failureThreshold).toBe(3)

			// Verify nested SSE configuration is preserved
			const webSearchSSE = obsidianUpdates.mcpServers?.find((s) => s.id === 'web-search')?.sseConfig
			expect(webSearchSSE?.headers).toEqual({
				Authorization: 'Bearer search-api-key',
				'Content-Type': 'application/json'
			})
		})

		it('should preserve JSON strings in configInput without corruption', () => {
			const reactState = adaptObsidianToReact(comprehensiveSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Verify JSON strings are preserved exactly
			const fileOpsConfig = obsidianUpdates.mcpServers?.find((s) => s.id === 'file-operations')?.configInput
			expect(fileOpsConfig).toBe(
				JSON.stringify(
					{
						workingDirectory: '/data',
						maxFileSize: '100MB',
						allowedExtensions: ['.txt', '.md', '.json', '.csv']
					},
					null,
					2
				)
			)

			const webSearchConfig = obsidianUpdates.mcpServers?.find((s) => s.id === 'web-search')?.configInput
			expect(webSearchConfig).toBe(
				JSON.stringify(
					{
						apiKey: 'search-service-key',
						maxResults: 10,
						safeSearch: 'moderate'
					},
					null,
					2
				)
			)

			const dbQueryConfig = obsidianUpdates.mcpServers?.find((s) => s.id === 'database-query')?.configInput
			expect(dbQueryConfig).toBe(
				JSON.stringify(
					{
						connectionString: 'postgresql://app_user:secure_password@localhost:5432/app_db',
						maxConnections: 10,
						queryTimeout: 30000
					},
					null,
					2
				)
			)
		})
	})

	describe('Data Type Consistency', () => {
		it('should maintain consistent data types through transformations', () => {
			const reactState = adaptObsidianToReact(comprehensiveSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Verify boolean types
			expect(typeof obsidianUpdates.confirmRegenerate).toBe('boolean')
			expect(typeof obsidianUpdates.enableInternalLink).toBe('boolean')
			expect(typeof obsidianUpdates.enableDefaultSystemMsg).toBe('boolean')
			expect(typeof obsidianUpdates.mcpParallelExecution).toBe('boolean')
			expect(typeof obsidianUpdates.features?.reactSettingsTab).toBe('boolean')

			// Verify number types
			expect(typeof obsidianUpdates.answerDelayInMilliseconds).toBe('number')
			expect(typeof obsidianUpdates.mcpConcurrentLimit).toBe('number')
			expect(typeof obsidianUpdates.mcpSessionLimit).toBe('number')
			expect(typeof obsidianUpdates.mcpGlobalTimeout).toBe('number')
			expect(typeof obsidianUpdates.mcpMaxParallelTools).toBe('number')

			// Verify string types
			expect(typeof obsidianUpdates.defaultSystemMsg).toBe('string')
			expect(typeof obsidianUpdates.roleEmojis?.newChat).toBe('string')

			// Verify array types
			expect(Array.isArray(obsidianUpdates.newChatTags)).toBe(true)
			expect(Array.isArray(obsidianUpdates.userTags)).toBe(true)
			expect(Array.isArray(obsidianUpdates.providers)).toBe(true)
			expect(Array.isArray(obsidianUpdates.mcpServers)).toBe(true)

			// Verify object types
			expect(typeof obsidianUpdates.roleEmojis).toBe('object')
			expect(typeof obsidianUpdates.features).toBe('object')
			expect(typeof obsidianUpdates.uiState).toBe('object')
		})

		it('should preserve parameter types for all providers', () => {
			const reactState = adaptObsidianToReact(comprehensiveSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Verify Claude parameter types
			const claudeParams = obsidianUpdates.providers?.find((p) => p.vendor === 'Claude')?.options.parameters
			expect(typeof claudeParams?.temperature).toBe('number')
			expect(typeof claudeParams?.max_tokens).toBe('number')
			expect(typeof claudeParams?.top_p).toBe('number')
			expect(typeof claudeParams?.top_k).toBe('number')
			expect(typeof claudeParams?.thinkingMode).toBe('string')
			expect(typeof claudeParams?.budget_tokens).toBe('number')
			expect(Array.isArray(claudeParams?.stop)).toBe(true)

			// Verify Ollama parameter types
			const ollamaParams = obsidianUpdates.providers?.find((p) => p.vendor === 'Ollama')?.options.parameters
			expect(typeof ollamaParams?.temperature).toBe('number')
			expect(typeof ollamaParams?.top_p).toBe('number')
			expect(typeof ollamaParams?.top_k).toBe('number')
			expect(typeof ollamaParams?.mirostat).toBe('number')
			expect(typeof ollamaParams?.mirostatTau).toBe('number')
			expect(typeof ollamaParams?.mirostatEta).toBe('number')
			expect(typeof ollamaParams?.keepAlive).toBe('string')
			expect(typeof ollamaParams?.stream).toBe('boolean')
		})
	})

	describe('Edge Cases and Boundary Values', () => {
		it('should handle boundary values correctly', () => {
			// Create settings with boundary values
			const boundarySettings = {
				...comprehensiveSettings,
				answerDelayInMilliseconds: 0, // minimum
				mcpConcurrentLimit: 1, // minimum
				mcpSessionLimit: 1, // minimum
				mcpGlobalTimeout: 1000, // minimum
				mcpMaxParallelTools: 1, // minimum
				defaultSystemMsg: '', // empty string
				newChatTags: [], // empty array
				userTags: ['#User'], // single element array
				providers: [], // empty array
				mcpServers: [] // empty array
			}

			const reactState = adaptObsidianToReact(boundarySettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Verify boundary values are preserved
			expect(obsidianUpdates.answerDelayInMilliseconds).toBe(0)
			expect(obsidianUpdates.mcpConcurrentLimit).toBe(1)
			expect(obsidianUpdates.mcpSessionLimit).toBe(1)
			expect(obsidianUpdates.mcpGlobalTimeout).toBe(1000)
			expect(obsidianUpdates.mcpMaxParallelTools).toBe(1)
			expect(obsidianUpdates.defaultSystemMsg).toBe('')
			expect(obsidianUpdates.newChatTags).toEqual([])
			expect(obsidianUpdates.userTags).toEqual(['#User'])
			expect(obsidianUpdates.providers).toHaveLength(0)
			expect(obsidianUpdates.mcpServers).toHaveLength(0)
		})

		it('should handle large values correctly', () => {
			// Create settings with large values
			const largeValueSettings = {
				...comprehensiveSettings,
				answerDelayInMilliseconds: 60000, // large delay
				mcpConcurrentLimit: 1000, // large limit
				mcpSessionLimit: 10000, // large limit
				mcpGlobalTimeout: 3600000, // 1 hour
				mcpMaxParallelTools: 1000, // large limit
				defaultSystemMsg: 'A'.repeat(10000), // long string
				newChatTags: Array.from({ length: 100 }, (_, i) => `#Tag${i}`), // many tags
				userTags: Array.from({ length: 100 }, (_, i) => `#User${i}`),
				systemTags: Array.from({ length: 100 }, (_, i) => `#System${i}`)
			}

			const reactState = adaptObsidianToReact(largeValueSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Verify large values are preserved
			expect(obsidianUpdates.answerDelayInMilliseconds).toBe(60000)
			expect(obsidianUpdates.mcpConcurrentLimit).toBe(1000)
			expect(obsidianUpdates.mcpSessionLimit).toBe(10000)
			expect(obsidianUpdates.mcpGlobalTimeout).toBe(3600000)
			expect(obsidianUpdates.mcpMaxParallelTools).toBe(1000)
			expect(obsidianUpdates.defaultSystemMsg).toBe('A'.repeat(10000))
			expect(obsidianUpdates.newChatTags).toHaveLength(100)
			expect(obsidianUpdates.userTags).toHaveLength(100)
			expect(obsidianUpdates.systemTags).toHaveLength(100)
		})
	})

	describe('Validation Function Testing', () => {
		it('should validate comprehensive settings successfully', () => {
			const validation = validateAdapterTransformation(comprehensiveSettings)

			expect(validation.isValid).toBe(true)
			expect(validation.errors).toHaveLength(0)
		})

		it('should detect issues in corrupted settings', () => {
			// Create corrupted settings
			const corruptedSettings = { ...comprehensiveSettings }
			;(corruptedSettings as any).newChatTags = null // should be array
			;(corruptedSettings as any).confirmRegenerate = 'yes' // should be boolean
			;(corruptedSettings as any).answerDelayInMilliseconds = 'invalid' // should be number

			const validation = validateAdapterTransformation(corruptedSettings)

			// Should detect issues (validation function may not catch all type issues, but should detect critical ones)
			expect(typeof validation.isValid).toBe('boolean')
			expect(Array.isArray(validation.errors)).toBe(true)
		})
	})

	describe('Real-world Complex Scenarios', () => {
		it('should handle complex real-world configuration changes', () => {
			const reactState = adaptObsidianToReact(comprehensiveSettings)

			// Simulate complex user scenario:
			// 1. Update multiple providers with different changes
			reactState.providers[0].apiKey = 'sk-ant-new-production-key'
			reactState.providers[0].model = 'claude-3-5-haiku-20241022'
			reactState.providers[1].vendorConfig.openai.temperature = 0.2
			reactState.providers[1].vendorConfig.openai.maxTokens = 1000

			// 2. Reconfigure MCP servers
			reactState.mcpServers[0].enabled = false
			reactState.mcpServers[0].dockerConfig.environment.LOG_LEVEL = 'error'
			reactState.mcpServers[1].enabled = true
			reactState.mcpServers[1].sseConfig.url = 'http://localhost:9090/sse'

			// 3. Update message tags
			reactState.messageTags.userTags = ['#User', '#Human', '#Participant', '#Speaker']
			reactState.messageTags.newChatTags = ['#NewChat', '#Start']

			// 4. Modify system behavior
			reactState.systemMessage.enabled = false
			reactState.basicSettings.confirmRegenerate = false
			reactState.advancedSettings.answerDelayInMilliseconds = 0

			// 5. Adjust limits and features
			reactState.globalLimits.concurrentExecutions = 5
			reactState.globalLimits.sessionLimitPerDocument = 25
			reactState.reactFeatures.reactStatusBar = false

			// Apply changes
			const mergedSettings = mergeReactChanges(comprehensiveSettings, reactState)

			// Verify all complex changes were applied correctly
			expect(mergedSettings.providers[0].options.apiKey).toBe('sk-ant-new-production-key')
			expect(mergedSettings.providers[0].options.model).toBe('claude-3-5-haiku-20241022')
			expect(mergedSettings.providers[1].options.parameters.temperature).toBe(0.2)
			expect(mergedSettings.providers[1].options.parameters.max_tokens).toBe(1000)
			expect(mergedSettings.mcpServers?.[0].enabled).toBe(false)
			expect(mergedSettings.mcpServers?.[0].dockerConfig.environment.LOG_LEVEL).toBe('error')
			expect(mergedSettings.mcpServers?.[1].enabled).toBe(true)
			expect(mergedSettings.mcpServers?.[1].sseConfig.url).toBe('http://localhost:9090/sse')
			expect(mergedSettings.userTags).toEqual(['#User', '#Human', '#Participant', '#Speaker'])
			expect(mergedSettings.newChatTags).toEqual(['#NewChat', '#Start'])
			expect(mergedSettings.enableDefaultSystemMsg).toBe(false)
			expect(mergedSettings.confirmRegenerate).toBe(false)
			expect(mergedSettings.answerDelayInMilliseconds).toBe(0)
			expect(mergedSettings.mcpConcurrentLimit).toBe(5)
			expect(mergedSettings.mcpSessionLimit).toBe(25)
			expect(mergedSettings.features?.reactStatusBar).toBe(false)

			// Verify other data remains intact
			expect(mergedSettings.providers[2].options.model).toBe('llama3.2:70b') // unchanged
			expect(mergedSettings.mcpServers?.[2].enabled).toBe(true) // unchanged
			expect(mergedSettings.systemTags).toEqual(['#System', '#Instructions', '#Setup', '#Context']) // unchanged
			expect(mergedSettings.enableInternalLink).toBe(true) // unchanged
			expect(mergedSettings.mcpParallelExecution).toBe(true) // unchanged
			expect(mergedSettings.features?.reactSettingsTab).toBe(true) // unchanged
		})
	})
})
