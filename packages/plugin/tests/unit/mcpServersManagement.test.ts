import { describe, it, expect, beforeEach } from 'vitest'
import { adaptObsidianToReact, adaptReactToObsidian, mergeReactChanges } from '../../src/adapters/reactSettingsAdapter'

describe('MCP Servers Management - Unit Tests', () => {
	let mockObsidianSettings: any

	beforeEach(() => {
		// Create a mock Obsidian settings object with MCP servers
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
			mcpServers: [
				{
					id: 'test-server-1',
					name: 'Test Server 1',
					enabled: true,
					deploymentType: 'managed',
					transport: 'stdio',
					dockerConfig: {
						image: 'mcp/test-server:latest',
						containerName: 'test-server-1',
						ports: ['3000:3000'],
						volumes: ['/data:/app/data']
					},
					retryConfig: {
						maxAttempts: 3,
						backoffMultiplier: 2,
						initialDelay: 1000
					},
					configInput: '{"command": "test", "args": ["--help"]}'
				},
				{
					id: 'test-server-2',
					name: 'Test Server 2',
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
					configInput: '{"port": 8080}'
				}
			],
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
			}
		}
	})

	describe('Obsidian to React MCP Servers Transformation', () => {
		it('should transform MCP servers correctly', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			expect(reactState.mcpServers).toBeDefined()
			expect(reactState.mcpServers).toHaveLength(2)
			expect(reactState.mcpServers[0]).toEqual(mockObsidianSettings.mcpServers[0])
			expect(reactState.mcpServers[1]).toEqual(mockObsidianSettings.mcpServers[1])
		})

		it('should handle empty MCP servers list', () => {
			const emptySettings = {
				...mockObsidianSettings,
				mcpServers: []
			}

			const reactState = adaptObsidianToReact(emptySettings)

			expect(reactState.mcpServers).toEqual([])
		})

		it('should handle missing MCP servers', () => {
			const settingsWithoutMCP = {
				...mockObsidianSettings,
				mcpServers: undefined
			}

			const reactState = adaptObsidianToReact(settingsWithoutMCP)

			expect(reactState.mcpServers).toEqual([])
		})

		it('should transform global MCP limits correctly', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			expect(reactState.globalLimits).toBeDefined()
			expect(reactState.globalLimits.concurrentExecutions).toBe(5)
			expect(reactState.globalLimits.sessionLimitPerDocument).toBe(20)
			expect(reactState.globalLimits.defaultTimeout).toBe(30000)
			expect(reactState.globalLimits.parallelExecutionEnabled).toBe(false)
			expect(reactState.globalLimits.maxParallelTools).toBe(10)
		})

		it('should handle complex MCP server configurations', () => {
			const complexMCPServer = {
				id: 'complex-server',
				name: 'Complex Server',
				enabled: true,
				deploymentType: 'managed',
				transport: 'stdio',
				dockerConfig: {
					image: 'complex/server:latest',
					containerName: 'complex-server',
					ports: ['3000:3000', '8080:8080'],
					volumes: ['/data:/app/data', '/config:/app/config'],
					environment: {
						NODE_ENV: 'production',
						LOG_LEVEL: 'debug'
					},
					networks: ['mcp-network'],
					restartPolicy: 'unless-stopped'
				},
				healthCheckConfig: {
					enabled: true,
					interval: 30000,
					timeout: 5000,
					failureThreshold: 3
				},
				retryConfig: {
					maxAttempts: 10,
					backoffMultiplier: 2.5,
					initialDelay: 2000,
					maxDelay: 60000
				},
				configInput: JSON.stringify(
					{
						command: 'complex',
						args: ['--verbose', '--port', '3000'],
						environment: {
							DEBUG: 'true'
						}
					},
					null,
					2
				)
			}

			const settingsWithComplexMCP = {
				...mockObsidianSettings,
				mcpServers: [complexMCPServer]
			}

			const reactState = adaptObsidianToReact(settingsWithComplexMCP)

			expect(reactState.mcpServers).toHaveLength(1)
			expect(reactState.mcpServers[0]).toEqual(complexMCPServer)
		})

		it('should preserve MCP server order during transformation', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			expect(reactState.mcpServers[0].id).toBe('test-server-1')
			expect(reactState.mcpServers[1].id).toBe('test-server-2')
		})
	})

	describe('React to Obsidian MCP Servers Transformation', () => {
		it('should transform React MCP servers back to Obsidian format', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.mcpServers).toHaveLength(2)
			expect(obsidianUpdates.mcpServers[0]).toEqual(mockObsidianSettings.mcpServers[0])
			expect(obsidianUpdates.mcpServers[1]).toEqual(mockObsidianSettings.mcpServers[1])
		})

		it('should handle updated MCP servers from React', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Update MCP servers in React state
			reactState.mcpServers[0].enabled = false
			reactState.mcpServers[1].name = 'Updated Server 2'
			reactState.mcpServers[1].sseConfig.url = 'http://localhost:9090/sse'

			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.mcpServers[0].enabled).toBe(false)
			expect(obsidianUpdates.mcpServers[1].name).toBe('Updated Server 2')
			expect(obsidianUpdates.mcpServers[1].sseConfig.url).toBe('http://localhost:9090/sse')
		})

		it('should handle adding new MCP servers in React', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Add new MCP server
			const newServer = {
				id: 'new-server',
				name: 'New Server',
				enabled: true,
				deploymentType: 'external',
				transport: 'stdio',
				configInput: '{"command": "new"}'
			}

			reactState.mcpServers.push(newServer)

			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.mcpServers).toHaveLength(3)
			expect(obsidianUpdates.mcpServers[2]).toEqual(newServer)
		})

		it('should handle removing MCP servers in React', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Remove one MCP server
			reactState.mcpServers.pop()

			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.mcpServers).toHaveLength(1)
			expect(obsidianUpdates.mcpServers[0].id).toBe('test-server-1')
		})

		it('should transform global limits back correctly', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.mcpConcurrentLimit).toBe(5)
			expect(obsidianUpdates.mcpSessionLimit).toBe(20)
			expect(obsidianUpdates.mcpGlobalTimeout).toBe(30000)
			expect(obsidianUpdates.mcpParallelExecution).toBe(false)
			expect(obsidianUpdates.mcpMaxParallelTools).toBe(10)
		})
	})

	describe('MCP Servers Settings Merging', () => {
		it('should merge React MCP server changes with original settings', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Make changes in React state
			reactState.mcpServers[0].enabled = false
			reactState.globalLimits.concurrentExecutions = 10

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			// Check that changes are applied
			expect(mergedSettings.mcpServers[0].enabled).toBe(false)
			expect(mergedSettings.mcpConcurrentLimit).toBe(10)

			// Check that other settings are preserved
			expect(mergedSettings.mcpServers[1].enabled).toBe(false) // unchanged
			expect(mergedSettings.mcpSessionLimit).toBe(20) // unchanged
		})

		it('should handle partial MCP server updates', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Only update one server
			reactState.mcpServers[0].name = 'Partially Updated Server'

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			// Check that only the specified server is updated
			expect(mergedSettings.mcpServers[0].name).toBe('Partially Updated Server')
			expect(mergedSettings.mcpServers[1].name).toBe('Test Server 2') // unchanged
		})

		it('should preserve other settings when updating MCP servers', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Update MCP servers
			reactState.mcpServers[0].enabled = false
			reactState.globalLimits.sessionLimitPerDocument = 50

			// Also update some other settings
			reactState.basicSettings.confirmRegenerate = false
			reactState.systemMessage.enabled = true

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			// Check that all changes are applied
			expect(mergedSettings.mcpServers[0].enabled).toBe(false)
			expect(mergedSettings.mcpSessionLimit).toBe(50)
			expect(mergedSettings.confirmRegenerate).toBe(false)
			expect(mergedSettings.enableDefaultSystemMsg).toBe(true)
		})
	})

	describe('MCP Servers Data Integrity', () => {
		it('should maintain data integrity through round-trip conversion', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)
			const backToReact = adaptObsidianToReact(obsidianUpdates)

			// Check that MCP servers are preserved
			expect(backToReact.mcpServers).toEqual(mockObsidianSettings.mcpServers)

			// Check that global limits are preserved
			expect(backToReact.globalLimits.concurrentExecutions).toBe(mockObsidianSettings.mcpConcurrentLimit)
			expect(backToReact.globalLimits.sessionLimitPerDocument).toBe(mockObsidianSettings.mcpSessionLimit)
			expect(backToReact.globalLimits.defaultTimeout).toBe(mockObsidianSettings.mcpGlobalTimeout)
		})

		it('should handle complex MCP server configurations through round-trip', () => {
			const complexServer = {
				id: 'round-trip-server',
				name: 'Round Trip Server',
				enabled: true,
				deploymentType: 'managed',
				transport: 'stdio',
				dockerConfig: {
					image: 'roundtrip/server:latest',
					containerName: 'round-trip-server',
					ports: ['3000:3000'],
					volumes: ['/data:/app/data'],
					environment: {
						NODE_ENV: 'production',
						API_KEY: 'secret-key'
					},
					networks: ['mcp-network'],
					restartPolicy: 'always'
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
					backoffMultiplier: 2,
					initialDelay: 1000,
					maxDelay: 30000
				},
				configInput: JSON.stringify(
					{
						command: 'roundtrip',
						args: ['--port', '3000'],
						config: {
							timeout: 60000,
							retries: 3
						}
					},
					null,
					2
				)
			}

			const settingsWithComplexServer = {
				...mockObsidianSettings,
				mcpServers: [complexServer]
			}

			const reactState = adaptObsidianToReact(settingsWithComplexServer)
			const obsidianUpdates = adaptReactToObsidian(reactState)
			const backToReact = adaptObsidianToReact(obsidianUpdates)

			expect(backToReact.mcpServers[0]).toEqual(complexServer)
		})

		it('should preserve MCP server array order through round-trip', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)
			const backToReact = adaptObsidianToReact(obsidianUpdates)

			expect(backToReact.mcpServers[0].id).toBe(mockObsidianSettings.mcpServers[0].id)
			expect(backToReact.mcpServers[1].id).toBe(mockObsidianSettings.mcpServers[1].id)
		})
	})

	describe('MCP Servers Edge Cases', () => {
		it('should handle null and undefined values gracefully', () => {
			const nullUndefinedSettings = {
				...mockObsidianSettings,
				mcpServers: [null, undefined],
				mcpConcurrentLimit: null,
				mcpSessionLimit: undefined
			}

			const reactState = adaptObsidianToReact(nullUndefinedSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Should handle null values gracefully
			expect(Array.isArray(obsidianUpdates.mcpServers)).toBe(true)
			expect(typeof obsidianUpdates.mcpConcurrentLimit).toBe('number')
			expect(typeof obsidianUpdates.mcpSessionLimit).toBe('number')
		})

		it('should handle invalid JSON in configInput', () => {
			const invalidJSONSettings = {
				...mockObsidianSettings,
				mcpServers: [
					{
						...mockObsidianSettings.mcpServers[0],
						configInput: 'invalid json string'
					}
				]
			}

			const reactState = adaptObsidianToReact(invalidJSONSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.mcpServers[0].configInput).toBe('invalid json string')
		})

		it('should handle empty and whitespace-only configInput', () => {
			const emptyConfigSettings = {
				...mockObsidianSettings,
				mcpServers: [
					{
						...mockObsidianSettings.mcpServers[0],
						configInput: ''
					},
					{
						...mockObsidianSettings.mcpServers[1],
						configInput: '   \n\t   \n\n\t   '
					}
				]
			}

			const reactState = adaptObsidianToReact(emptyConfigSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.mcpServers[0].configInput).toBe('')
			expect(obsidianUpdates.mcpServers[1].configInput).toBe('   \n\t   \n\n\t   ')
		})

		it('should handle extremely large MCP server lists', () => {
			const largeMCPList = Array.from({ length: 100 }, (_, index) => ({
				id: `server-${index}`,
				name: `Server ${index}`,
				enabled: index % 2 === 0,
				deploymentType: index % 3 === 0 ? 'managed' : 'external',
				transport: index % 2 === 0 ? 'stdio' : 'sse',
				configInput: `{"id": ${index}}`
			}))

			const settingsWithLargeList = {
				...mockObsidianSettings,
				mcpServers: largeMCPList
			}

			const reactState = adaptObsidianToReact(settingsWithLargeList)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.mcpServers).toHaveLength(100)
			expect(obsidianUpdates.mcpServers[0].id).toBe('server-0')
			expect(obsidianUpdates.mcpServers[99].id).toBe('server-99')
		})

		it('should maintain consistency with other settings during updates', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Update MCP servers
			reactState.mcpServers[0].enabled = false
			reactState.globalLimits.concurrentExecutions = 15

			// Update message tags
			reactState.messageTags.userTags = ['#User', '#Human']

			// Update system message
			reactState.systemMessage.enabled = false

			const mergedSettings = mergeReactChanges(mockObsidianSettings, reactState)

			// Verify all settings are correctly updated
			expect(mergedSettings.mcpServers[0].enabled).toBe(false)
			expect(mergedSettings.mcpConcurrentLimit).toBe(15)
			expect(mergedSettings.userTags).toEqual(['#User', '#Human'])
			expect(mergedSettings.enableDefaultSystemMsg).toBe(false)
		})

		it('should handle rapid MCP server additions and removals', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Rapidly add and remove servers
			for (let i = 0; i < 10; i++) {
				const newServer = {
					id: `rapid-server-${i}`,
					name: `Rapid Server ${i}`,
					enabled: i % 2 === 0,
					deploymentType: 'external',
					transport: 'stdio',
					configInput: `{"id": ${i}}`
				}

				if (i % 3 === 0) {
					reactState.mcpServers.push(newServer)
				} else {
					reactState.mcpServers.shift()
				}

				const obsidianUpdates = adaptReactToObsidian(reactState)
				expect(Array.isArray(obsidianUpdates.mcpServers)).toBe(true)
			}
		})
	})

	describe('MCP Servers Integration with Other Features', () => {
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

			// Verify both MCP servers and providers are preserved
			expect(obsidianUpdates.mcpServers).toHaveLength(2)
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

			// Verify both MCP servers and features are preserved
			expect(obsidianUpdates.mcpServers).toHaveLength(2)
			expect(obsidianUpdates.features?.reactSettingsTab).toBe(true)
			expect(obsidianUpdates.features?.reactMcpUI).toBe(true)
		})

		it('should work correctly with basic settings', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Update both MCP servers and basic settings
			reactState.mcpServers[0].enabled = false
			reactState.basicSettings.confirmRegenerate = false

			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.mcpServers[0].enabled).toBe(false)
			expect(obsidianUpdates.confirmRegenerate).toBe(false)
		})

		it('should work correctly with UI state', () => {
			const reactState = adaptObsidianToReact(mockObsidianSettings)

			// Update MCP servers and UI state
			reactState.mcpServers[0].enabled = false
			reactState.uiState.mcpServersExpanded = true

			const obsidianUpdates = adaptReactToObsidian(reactState)

			expect(obsidianUpdates.mcpServers[0].enabled).toBe(false)
			expect(obsidianUpdates.uiState?.mcpServersExpanded).toBe(true)
		})
	})
})
