import { describe, it, expect, beforeEach } from 'vitest'
import { PluginSettings } from '../../src/settings'
import { adaptObsidianToReact, adaptReactToObsidian, mergeReactChanges } from '../../src/adapters/reactSettingsAdapter'

describe('Performance with Large Datasets - Integration Tests', () => {
	let largeSettings: PluginSettings

	beforeEach(() => {
		// Create large test settings with many providers and MCP servers
		const manyProviders = Array.from({ length: 50 }, (_, i) => ({
			tag: `provider-${i}`,
			vendor: ['Claude', 'OpenAI', 'Ollama', 'Azure', 'DeepSeek'][i % 5] as 'Claude' | 'OpenAI' | 'Ollama' | 'Azure' | 'DeepSeek',
			options: {
				apiKey: `test-key-${i}`,
				model: `model-${i}`,
				baseURL: `https://api.example-${i}.com`,
				parameters: {
					temperature: 0.1 + (i * 0.01),
					max_tokens: 1000 + (i * 100),
					top_p: 0.1 + (i * 0.01),
					top_k: 10 + i,
					thinkingMode: ['auto', 'manual'][i % 2] as 'auto' | 'manual',
					budget_tokens: 1000 + (i * 50),
					stop: [`</response-${i}>`, `<END-${i}>`]
				}
			}
		}))

		const manyMcpServers = Array.from({ length: 100 }, (_, i) => ({
			id: `server-${i}`,
			name: `MCP Server ${i}`,
			enabled: i % 2 === 0,
			deploymentType: i % 3 === 0 ? 'managed' : 'external' as 'managed' | 'external',
			transport: i % 2 === 0 ? 'stdio' : 'sse' as 'stdio' | 'sse',
			dockerConfig: i % 3 === 0 ? {
				image: `mcp/server-${i}:latest`,
				containerName: `server-${i}`,
				ports: [`${3000 + i}:3000`, `${8080 + i}:8080`],
				volumes: [`/data-${i}:/app/data`, `/config-${i}:/app/config`],
				environment: {
					'NODE_ENV': 'production',
					'LOG_LEVEL': 'debug',
					'SERVER_ID': `server-${i}`
				},
				networks: ['mcp-network', 'default'],
				restartPolicy: 'unless-stopped'
			} : undefined,
			sseConfig: i % 3 !== 0 ? {
				url: `http://localhost:${8000 + i}/sse`,
				headers: {
					'Authorization': `Bearer token-${i}`,
					'Content-Type': 'application/json'
				}
			} : undefined,
			healthCheckConfig: {
				enabled: true,
				interval: 30000 + (i * 1000),
				timeout: 5000 + (i * 100),
				failureThreshold: 3 + (i % 3),
				successThreshold: 2
			},
			retryConfig: {
				maxAttempts: 5 + (i % 5),
				backoffMultiplier: 1.5 + (i * 0.1),
				initialDelay: 1000 + (i * 100),
				maxDelay: 60000 - (i * 1000)
			},
			configInput: JSON.stringify({
				serverId: `server-${i}`,
				maxConnections: 10 + i,
				queryTimeout: 30000 + (i * 1000),
				environment: `production-${i % 2}`
			}, null, 2)
		}))

		const manyTags = Array.from({ length: 20 }, (_, i) => `#Tag${i}`)
		const manyEmojis = ['🆕', '👤', '⚙️', '✨', '🔧', '📝', '🎯', '🚀', '💡', '🔍']

		largeSettings = {
			providers: manyProviders,
			newChatTags: manyTags,
			userTags: manyTags.slice(0, 15),
			systemTags: manyTags.slice(0, 10),
			roleEmojis: {
				newChat: manyEmojis[0],
				user: manyEmojis[1],
				system: manyEmojis[2],
				assistant: manyEmojis[3]
			},
			confirmRegenerate: true,
			enableInternalLink: true,
			enableDefaultSystemMsg: true,
			defaultSystemMsg: 'A'.repeat(1000), // Long system message
			enableInternalLinkForAssistantMsg: true,
			answerDelayInMilliseconds: 750,
			enableReplaceTag: true,
			enableExportToJSONL: true,
			enableTagSuggest: true,
			mcpServers: manyMcpServers,
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

	describe('Adapter Performance Tests', () => {
		it('should handle large provider arrays efficiently', () => {
			const startTime = performance.now()

			const reactState = adaptObsidianToReact(largeSettings)

			const adaptToReactTime = performance.now() - startTime
			console.log(`Adapt to React time: ${adaptToReactTime.toFixed(2)}ms`)

			// Verify all providers were converted
			expect(reactState.providers).toHaveLength(50)
			expect(reactState.availableVendors).toHaveLength(50)

			// Performance should be reasonable (< 100ms for 50 providers)
			expect(adaptToReactTime).toBeLessThan(100)
		})

		it('should handle large MCP server arrays efficiently', () => {
			const startTime = performance.now()

			const reactState = adaptObsidianToReact(largeSettings)

			const adaptTime = performance.now() - startTime
			console.log(`Adapt time with 100 MCP servers: ${adaptTime.toFixed(2)}ms`)

			// Verify all MCP servers were preserved
			expect(reactState.mcpServers).toHaveLength(100)

			// Performance should be reasonable (< 50ms for MCP servers)
			expect(adaptTime).toBeLessThan(50)
		})

		it('should handle reverse conversion efficiently', () => {
			// First convert to React
			const reactState = adaptObsidianToReact(largeSettings)

			const startTime = performance.now()

			const obsidianUpdates = adaptReactToObsidian(reactState)

			const adaptToObsidianTime = performance.now() - startTime
			console.log(`Adapt to Obsidian time: ${adaptToObsidianTime.toFixed(2)}ms`)

			// Verify data was preserved
			expect(obsidianUpdates.providers).toHaveLength(50)
			expect(obsidianUpdates.mcpServers).toHaveLength(100)

			// Performance should be reasonable (< 100ms)
			expect(adaptToObsidianTime).toBeLessThan(100)
		})

		it('should handle large merge operations efficiently', () => {
			const reactState = adaptObsidianToReact(largeSettings)

			// Make some changes to test merge performance
			reactState.providers[0].apiKey = 'updated-key'
			reactState.providers[1].vendorConfig.claude.temperature = 0.9
			reactState.mcpServers[0].enabled = false
			reactState.globalLimits.concurrentExecutions = 25

			const startTime = performance.now()

			const mergedSettings = mergeReactChanges(largeSettings, reactState)

			const mergeTime = performance.now() - startTime
			console.log(`Merge time: ${mergeTime.toFixed(2)}ms`)

			// Verify changes were applied
			expect(mergedSettings.providers[0].options.apiKey).toBe('updated-key')
			expect(mergedSettings.providers[1].options.parameters.temperature).toBe(0.9)
			expect(mergedSettings.mcpServers?.[0].enabled).toBe(false)
			expect(mergedSettings.mcpConcurrentLimit).toBe(25)

			// Performance should be reasonable (< 200ms for large merge)
			expect(mergeTime).toBeLessThan(200)
		})

		it('should maintain memory efficiency with large datasets', () => {
			const initialMemory = (performance as any).memory?.usedJSHeapSize || 0

			// Perform multiple conversions
			for (let i = 0; i < 10; i++) {
				const reactState = adaptObsidianToReact(largeSettings)
				const obsidianUpdates = adaptReactToObsidian(reactState)
				const mergedSettings = mergeReactChanges(largeSettings, reactState)

				// Verify data integrity
				expect(mergedSettings.providers).toHaveLength(50)
				expect(mergedSettings.mcpServers).toHaveLength(100)
			}

			const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
			const memoryIncrease = finalMemory - initialMemory

			console.log(`Memory increase after 10 conversions: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)

			// Memory increase should be reasonable (< 50MB)
			expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
		})
	})

	describe('Data Integrity with Large Datasets', () => {
		it('should preserve all provider configurations with large arrays', () => {
			const reactState = adaptObsidianToReact(largeSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Verify random providers are preserved
			expect(obsidianUpdates.providers?.[10]?.tag).toBe('provider-10')
			expect(obsidianUpdates.providers?.[25]?.vendor).toBe('Azure')
			expect(obsidianUpdates.providers?.[40]?.options.parameters?.temperature).toBe(0.1 + (40 * 0.01))
			expect(obsidianUpdates.providers?.[45]?.options.parameters?.top_k).toBe(55)
		})

		it('should preserve all MCP server configurations with large arrays', () => {
			const reactState = adaptObsidianToReact(largeSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Verify random MCP servers are preserved
			expect(obsidianUpdates.mcpServers?.[20]?.id).toBe('server-20')
			expect(obsidianUpdates.mcpServers?.[50]?.name).toBe('MCP Server 50')
			expect(obsidianUpdates.mcpServers?.[75]?.enabled).toBe(true) // 75 % 2 === 1
			expect(obsidianUpdates.mcpServers?.[90]?.retryConfig?.maxAttempts).toBe(5 + (90 % 5))
		})

		it('should preserve array order in large datasets', () => {
			const reactState = adaptObsidianToReact(largeSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			// Verify provider order is preserved
			for (let i = 0; i < 50; i++) {
				expect(obsidianUpdates.providers?.[i]?.tag).toBe(`provider-${i}`)
			}

			// Verify MCP server order is preserved
			for (let i = 0; i < 100; i++) {
				expect(obsidianUpdates.mcpServers?.[i]?.id).toBe(`server-${i}`)
			}
		})

		it('should handle selective updates efficiently in large datasets', () => {
			const reactState = adaptObsidianToReact(largeSettings)

			// Make selective changes to first few items
			reactState.providers[0].apiKey = 'changed-key-0'
			reactState.providers[1].vendorConfig.openai.temperature = 0.8
			reactState.mcpServers[0].enabled = false
			reactState.mcpServers[1].name = 'Changed Server Name'

			const startTime = performance.now()

			const mergedSettings = mergeReactChanges(largeSettings, reactState)

			const selectiveUpdateTime = performance.now() - startTime
			console.log(`Selective update time: ${selectiveUpdateTime.toFixed(2)}ms`)

			// Verify only intended changes were applied
			expect(mergedSettings.providers[0].options.apiKey).toBe('changed-key-0')
			expect(mergedSettings.providers[1].options.parameters.temperature).toBe(0.8)
			expect(mergedSettings.mcpServers?.[0].enabled).toBe(false)
			expect(mergedSettings.mcpServers?.[1].name).toBe('Changed Server Name')

			// Verify other data is preserved
			expect(mergedSettings.providers[2].options.apiKey).toBe('test-key-2')
			expect(mergedSettings.providers[10].tag).toBe('provider-10')
			expect(mergedSettings.mcpServers?.[2].enabled).toBe(true)
			expect(mergedSettings.mcpServers?.[10].id).toBe('server-10')

			// Performance should be good even with large datasets
			expect(selectiveUpdateTime).toBeLessThan(50)
		})
	})

	describe('Complex Large Dataset Scenarios', () => {
		it('should handle large datasets with complex nested structures', () => {
			// Create even more complex nested data
			const complexLargeSettings = {
				...largeSettings,
				providers: largeSettings.providers.map((provider, i) => ({
					...provider,
					options: {
						...provider.options,
						parameters: {
							...provider.options.parameters,
							complexNested: {
								level1: {
									level2: {
										level3: {
											value: i,
											data: `complex-data-${i}`,
											metadata: {
												timestamp: Date.now(),
												type: 'test',
												version: `v${i}`
											}
										}
									}
								}
							}
						}
					}
				})),
				mcpServers: largeSettings.mcpServers.map((server, i) => ({
					...server,
					complexConfig: {
						environments: Array.from({ length: 5 }, (_, j) => ({
							name: `env-${j}`,
							value: `value-${i}-${j}`,
							settings: {
								param1: true,
								param2: i + j,
								param3: `string-${i}-${j}`
							}
						})),
						metadata: {
							created: new Date().toISOString(),
							modified: new Date().toISOString(),
							version: `1.${i}.0`,
							tags: [`tag-${i}`, `tag-${i + 1}`, `tag-${i + 2}`]
						}
					}
				}))
			}

			const startTime = performance.now()

			const reactState = adaptObsidianToReact(complexLargeSettings)
			const obsidianUpdates = adaptReactToObsidian(reactState)

			const complexProcessingTime = performance.now() - startTime
			console.log(`Complex large dataset processing time: ${complexProcessingTime.toFixed(2)}ms`)

			// Verify data integrity
			expect(obsidianUpdates.providers).toHaveLength(50)
			expect(obsidianUpdates.mcpServers).toHaveLength(100)
			expect(obsidianUpdates.providers?.[0]?.options.parameters?.complexNested?.level1?.level2?.level3?.value).toBe(0)
			expect(obsidianUpdates.mcpServers?.[0]?.complexConfig?.environments).toHaveLength(5)

			// Performance should still be reasonable
			expect(complexProcessingTime).toBeLessThan(200)
		})

		it('should handle rapid successive operations on large datasets', () => {
			const startTime = performance.now()
			let totalTime = 0

			// Perform 20 rapid conversions
			for (let i = 0; i < 20; i++) {
				const operationStart = performance.now()

				const reactState = adaptObsidianToReact(largeSettings)
				const obsidianUpdates = adaptReactToObsidian(reactState)

				const operationTime = performance.now() - operationStart
				totalTime += operationTime

				// Verify data integrity each time
				expect(obsidianUpdates.providers).toHaveLength(50)
				expect(obsidianUpdates.mcpServers).toHaveLength(100)
			}

			const averageTime = totalTime / 20
			console.log(`Average time per operation: ${averageTime.toFixed(2)}ms`)
			console.log(`Total time for 20 operations: ${totalTime.toFixed(2)}ms`)

			// Average time should be reasonable
			expect(averageTime).toBeLessThan(50)
			expect(totalTime).toBeLessThan(1000) // Less than 1 second total
		})
	})
})