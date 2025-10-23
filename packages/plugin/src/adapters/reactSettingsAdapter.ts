/**
 * Adapter to convert between Obsidian PluginSettings and React SettingsState
 * Handles bidirectional transformation with type safety and data preservation
 */

import type { PluginSettings } from '../settings'
import type { FeatureFlags } from '../featureFlags'
import type { ProviderSettings } from '@tars/providers'

// Define React SettingsState interface locally to avoid cross-package imports
export interface Provider {
	id: string
	name: string
	tag: string
	model?: string
	apiKey?: string
	capabilities: string[]
	vendorConfig?: Record<string, any>
}

export interface MessageTagsData {
	newChatTags: string[]
	userTags: string[]
	systemTags: string[]
	roleEmojis: {
		newChat: string
		user: string
		system: string
		assistant: string
	}
}

export interface SystemMessage {
	enabled: boolean
	message: string
}

export interface BasicSettings {
	confirmRegenerate: boolean
	enableInternalLink: boolean
}

export interface ReactFeatures {
	reactSettingsTab: boolean
	reactStatusBar: boolean
	reactModals: boolean
	reactMcpUI: boolean
}

export interface GlobalLimits {
	concurrentExecutions: number
	sessionLimitPerDocument: number
	defaultTimeout: number
	parallelExecutionEnabled: boolean
	llmUtilityEnabled: boolean
	maxParallelTools: number
}

export interface SettingsUIState {
	systemMessageExpanded: boolean
	advancedExpanded: boolean
	mcpServersExpanded: boolean
	reactFeaturesExpanded: boolean
}

export interface AdvancedSettings {
	enableInternalLinkForAssistantMsg: boolean
	answerDelayInMilliseconds: number
	enableReplaceTag: boolean
	enableExportToJSONL: boolean
	enableTagSuggest: boolean
}

export interface SettingsState {
	providers: Provider[]
	availableVendors: string[]
	messageTags: MessageTagsData
	defaultTags: MessageTagsData
	systemMessage: SystemMessage
	basicSettings: BasicSettings
	mcpServers: any[]
	reactFeatures: ReactFeatures
	globalLimits: GlobalLimits
	uiState: SettingsUIState
	advancedSettings: AdvancedSettings
}

/**
 * Convert Obsidian PluginSettings to React SettingsState
 */
export function adaptObsidianToReact(obsidianSettings: PluginSettings): SettingsState {
	// Transform providers from ProviderSettings to Provider type
	const providers: Provider[] = obsidianSettings.providers.map((providerSettings, index) => {
		const provider: Provider = {
			id: `${providerSettings.vendor.toLowerCase()}-${index}-${Date.now()}`,
			name: providerSettings.vendor,
			tag: providerSettings.tag,
			model: providerSettings.options.model,
			apiKey: providerSettings.options.apiKey,
			capabilities: [] // Will be populated from vendor info
		}

		// Extract vendor-specific configurations based on vendor name
		const parameters = providerSettings.options.parameters || {}
		switch (providerSettings.vendor) {
			case 'Azure':
				provider.vendorConfig = {
					azure: {
						endpoint:
							(providerSettings.options as any).endpoint ||
							providerSettings.options.baseURL ||
							(parameters.endpoint as string),
						apiVersion: parameters.apiVersion as string
					}
				}
				break
			case 'Claude':
				provider.vendorConfig = {
					claude: {
						thinkingMode: parameters.thinkingMode as string,
						budgetTokens: (parameters.budgetTokens || parameters.budget_tokens) as number,
						maxTokens: (parameters.maxTokens || parameters.max_tokens) as number,
						temperature: parameters.temperature as number,
						topP: (parameters.topP || parameters.top_p) as number,
						topK: (parameters.topK || parameters.top_k) as number,
						stop: parameters.stop as string[]
					}
				}
				break
			case 'DeepSeek':
				provider.vendorConfig = {
					deepseek: {
						baseURL: parameters.baseURL as string,
						model: parameters.model as string,
						maxTokens: parameters.maxTokens as number,
						temperature: parameters.temperature as number,
						topP: parameters.topP as number,
						frequencyPenalty: parameters.frequencyPenalty as number,
						presencePenalty: parameters.presencePenalty as number,
						reasoningEffort: parameters.reasoningEffort as string
					}
				}
				break
			case 'GPT Image':
				provider.vendorConfig = {
					gptImage: {
						displayWidth: parameters.displayWidth as number,
						n: parameters.n as number,
						size: parameters.size as string,
						output_format: parameters.output_format as string,
						quality: parameters.quality as string,
						background: parameters.background as string,
						output_compression: parameters.output_compression as number
					}
				}
				break
			case 'OpenAI':
				provider.vendorConfig = {
					openai: {
						baseURL: providerSettings.options.baseURL,
						organization: parameters.organization as string,
						project: parameters.project as string,
						maxTokens: (parameters.maxTokens || parameters.max_tokens) as number,
						temperature: parameters.temperature as number,
						topP: (parameters.topP || parameters.top_p) as number,
						topK: parameters.topK as number,
						frequencyPenalty: parameters.frequencyPenalty as number,
						presencePenalty: parameters.presencePenalty as number
					}
				}
				break
			case 'Ollama':
				provider.vendorConfig = {
					ollama: {
						baseURL: providerSettings.options.baseURL,
						model: parameters.model as string,
						keepAlive: parameters.keepAlive as string,
						stream: parameters.stream as boolean,
						numCtx: parameters.numCtx as number,
						numPredict: parameters.numPredict as number,
						temperature: parameters.temperature as number,
						topP: (parameters.topP || parameters.top_p) as number,
						topK: (parameters.topK || parameters.top_k) as number,
						repeatPenalty: parameters.repeatPenalty as number,
						stop: parameters.stop as string[],
						tfsZ: parameters.tfsZ as number,
						mirostat: parameters.mirostat as number,
						mirostatTau: parameters.mirostatTau as number,
						mirostatEta: parameters.mirostatEta as number
					}
				}
				break
		}

		return provider
	})

	// Get available vendor names
	const availableVendors = obsidianSettings.providers.map((p) => p.vendor)

	// Transform message tags
	const messageTags: MessageTagsData = {
		newChatTags: obsidianSettings.newChatTags,
		userTags: obsidianSettings.userTags,
		systemTags: obsidianSettings.systemTags,
		roleEmojis: {
			newChat: obsidianSettings.roleEmojis?.newChat || '🆕',
			user: obsidianSettings.roleEmojis?.user || '👤',
			system: obsidianSettings.roleEmojis?.system || '⚙️',
			assistant: obsidianSettings.roleEmojis?.assistant || '✨'
		}
	}

	// Default tags for comparison
	const defaultTags: MessageTagsData = {
		newChatTags: ['#NewChat'],
		userTags: ['#User'],
		systemTags: ['#System'],
		roleEmojis: {
			newChat: '🆕',
			user: '👤',
			system: '⚙️',
			assistant: '✨'
		}
	}

	// System message settings
	const systemMessage: SystemMessage = {
		enabled: obsidianSettings.enableDefaultSystemMsg ?? false,
		message: obsidianSettings.defaultSystemMsg ?? ''
	}

	// Basic settings
	const basicSettings: BasicSettings = {
		confirmRegenerate: obsidianSettings.confirmRegenerate ?? false,
		enableInternalLink: obsidianSettings.enableInternalLink ?? false
	}

	// React features
	const reactFeatures: ReactFeatures = {
		reactSettingsTab: Boolean(obsidianSettings.features?.reactSettingsTab),
		reactStatusBar: Boolean(obsidianSettings.features?.reactStatusBar),
		reactModals: Boolean(obsidianSettings.features?.reactModals),
		reactMcpUI: Boolean(obsidianSettings.features?.reactMcpUI)
	}

	// Global limits from MCP settings
	const globalLimits: GlobalLimits = {
		concurrentExecutions: obsidianSettings.mcpConcurrentLimit ?? 5,
		sessionLimitPerDocument: obsidianSettings.mcpSessionLimit ?? 20,
		defaultTimeout: obsidianSettings.mcpGlobalTimeout ?? 30000,
		parallelExecutionEnabled: obsidianSettings.mcpParallelExecution ?? false,
		llmUtilityEnabled: true, // Default value, not in obsidian settings
		maxParallelTools: obsidianSettings.mcpMaxParallelTools ?? 10
	}

	// UI state with defaults for missing fields
	const uiState: SettingsUIState = {
		systemMessageExpanded: obsidianSettings.uiState?.systemMessageExpanded ?? false,
		advancedExpanded: obsidianSettings.uiState?.advancedExpanded ?? false,
		mcpServersExpanded: obsidianSettings.uiState?.mcpServersExpanded ?? false,
		reactFeaturesExpanded: false // Default, not in obsidian settings
	}

	// Advanced settings
	const advancedSettings: AdvancedSettings = {
		enableInternalLinkForAssistantMsg: obsidianSettings.enableInternalLinkForAssistantMsg ?? false,
		answerDelayInMilliseconds: obsidianSettings.answerDelayInMilliseconds ?? 0,
		enableReplaceTag: obsidianSettings.enableReplaceTag ?? false,
		enableExportToJSONL: obsidianSettings.enableExportToJSONL ?? false,
		enableTagSuggest: obsidianSettings.enableTagSuggest ?? true
	}

	return {
		providers,
		availableVendors,
		messageTags,
		defaultTags,
		systemMessage,
		basicSettings,
		mcpServers: obsidianSettings.mcpServers ?? [],
		reactFeatures,
		globalLimits,
		uiState,
		advancedSettings
	}
}

/**
 * Convert React SettingsState back to Obsidian PluginSettings
 * Returns partial settings to be merged with existing settings
 */
export function adaptReactToObsidian(reactState: SettingsState): Partial<PluginSettings> {
	// Transform providers back to ProviderSettings format
	const providers: ProviderSettings[] = reactState.providers.map((provider) => {
		const baseOptions = {
			apiKey: provider.apiKey || '',
			baseURL: '', // Will be preserved from original settings
			model: provider.model || '',
			parameters: {} as Record<string, any>
		}

		// Extract vendor-specific configurations back to parameters
		if (provider.vendorConfig) {
			switch (provider.name) {
				case 'Azure':
					if (provider.vendorConfig.azure) {
						baseOptions.baseURL = provider.vendorConfig.azure.endpoint || ''
						baseOptions.parameters = {
							endpoint: provider.vendorConfig.azure.endpoint,
							apiVersion: provider.vendorConfig.azure.apiVersion
						}
					}
					break
				case 'Claude':
					if (provider.vendorConfig.claude) {
						baseOptions.parameters = {
							thinkingMode: provider.vendorConfig.claude.thinkingMode,
							budget_tokens: provider.vendorConfig.claude.budgetTokens,
							max_tokens: provider.vendorConfig.claude.maxTokens,
							temperature: provider.vendorConfig.claude.temperature,
							top_p: provider.vendorConfig.claude.topP,
							top_k: provider.vendorConfig.claude.topK,
							stop: provider.vendorConfig.claude.stop
						}
					}
					break
				case 'DeepSeek':
					if (provider.vendorConfig.deepseek) {
						baseOptions.baseURL = provider.vendorConfig.deepseek.baseURL || ''
						baseOptions.parameters = {
							baseURL: provider.vendorConfig.deepseek.baseURL,
							model: provider.vendorConfig.deepseek.model,
							maxTokens: provider.vendorConfig.deepseek.maxTokens,
							temperature: provider.vendorConfig.deepseek.temperature,
							topP: provider.vendorConfig.deepseek.topP,
							frequencyPenalty: provider.vendorConfig.deepseek.frequencyPenalty,
							presencePenalty: provider.vendorConfig.deepseek.presencePenalty,
							reasoningEffort: provider.vendorConfig.deepseek.reasoningEffort
						}
					}
					break
				case 'GPT Image':
					if (provider.vendorConfig.gptImage) {
						baseOptions.parameters = {
							displayWidth: provider.vendorConfig.gptImage.displayWidth,
							n: provider.vendorConfig.gptImage.n,
							size: provider.vendorConfig.gptImage.size,
							output_format: provider.vendorConfig.gptImage.output_format,
							quality: provider.vendorConfig.gptImage.quality,
							background: provider.vendorConfig.gptImage.background,
							output_compression: provider.vendorConfig.gptImage.output_compression
						}
					}
					break
				case 'OpenAI':
					if (provider.vendorConfig.openai) {
						baseOptions.baseURL = provider.vendorConfig.openai.baseURL || ''
						baseOptions.parameters = {
							organization: provider.vendorConfig.openai.organization,
							project: provider.vendorConfig.openai.project,
							max_tokens: provider.vendorConfig.openai.maxTokens,
							temperature: provider.vendorConfig.openai.temperature,
							top_p: provider.vendorConfig.openai.topP,
							top_k: provider.vendorConfig.openai.topK,
							frequencyPenalty: provider.vendorConfig.openai.frequencyPenalty,
							presencePenalty: provider.vendorConfig.openai.presencePenalty
						}
					}
					break
				case 'Ollama':
					if (provider.vendorConfig.ollama) {
						baseOptions.baseURL = provider.vendorConfig.ollama.baseURL || ''
						baseOptions.parameters = {
							model: provider.vendorConfig.ollama.model,
							keepAlive: provider.vendorConfig.ollama.keepAlive,
							stream: provider.vendorConfig.ollama.stream,
							numCtx: provider.vendorConfig.ollama.numCtx,
							numPredict: provider.vendorConfig.ollama.numPredict,
							temperature: provider.vendorConfig.ollama.temperature,
							top_p: provider.vendorConfig.ollama.topP,
							top_k: provider.vendorConfig.ollama.topK,
							repeatPenalty: provider.vendorConfig.ollama.repeatPenalty,
							stop: provider.vendorConfig.ollama.stop,
							tfsZ: provider.vendorConfig.ollama.tfsZ,
							mirostat: provider.vendorConfig.ollama.mirostat,
							mirostatTau: provider.vendorConfig.ollama.mirostatTau,
							mirostatEta: provider.vendorConfig.ollama.mirostatEta
						}
					}
					break
			}
		}

		return {
			tag: provider.tag,
			vendor: provider.name,
			options: baseOptions
		}
	})

	return {
		providers,
		newChatTags: reactState.messageTags.newChatTags,
		userTags: reactState.messageTags.userTags,
		systemTags: reactState.messageTags.systemTags,
		roleEmojis: {
			newChat: reactState.messageTags.roleEmojis.newChat,
			user: reactState.messageTags.roleEmojis.user,
			system: reactState.messageTags.roleEmojis.system,
			assistant: reactState.messageTags.roleEmojis.assistant
		},
		enableDefaultSystemMsg: reactState.systemMessage.enabled,
		defaultSystemMsg: reactState.systemMessage.message,
		confirmRegenerate: reactState.basicSettings.confirmRegenerate,
		enableInternalLink: reactState.basicSettings.enableInternalLink,
		enableInternalLinkForAssistantMsg: reactState.advancedSettings.enableInternalLinkForAssistantMsg,
		answerDelayInMilliseconds: reactState.advancedSettings.answerDelayInMilliseconds,
		enableReplaceTag: reactState.advancedSettings.enableReplaceTag,
		enableExportToJSONL: reactState.advancedSettings.enableExportToJSONL,
		enableTagSuggest: reactState.advancedSettings.enableTagSuggest,
		mcpServers: reactState.mcpServers,
		mcpConcurrentLimit: reactState.globalLimits.concurrentExecutions,
		mcpSessionLimit: reactState.globalLimits.sessionLimitPerDocument,
		mcpGlobalTimeout: reactState.globalLimits.defaultTimeout,
		mcpParallelExecution: reactState.globalLimits.parallelExecutionEnabled,
		mcpMaxParallelTools: reactState.globalLimits.maxParallelTools,
		features: reactState.reactFeatures,
		uiState: {
			systemMessageExpanded: reactState.uiState.systemMessageExpanded,
			advancedExpanded: reactState.uiState.advancedExpanded,
			mcpServersExpanded: reactState.uiState.mcpServersExpanded
		}
	}
}

/**
 * Merge React changes with existing Obsidian settings
 * Preserves fields not managed by React (like provider options details)
 */
export function mergeReactChanges(originalSettings: PluginSettings, reactState: SettingsState): PluginSettings {
	const reactUpdates = adaptReactToObsidian(reactState)

	// Create deep copy of original settings
	const mergedSettings: PluginSettings = JSON.parse(JSON.stringify(originalSettings))

	// Apply React updates except for mcpServers (will be merged separately)
	const { mcpServers, ...reactUpdatesWithoutMcp } = reactUpdates
	Object.assign(mergedSettings, reactUpdatesWithoutMcp)

	// Preserve provider-specific options that aren't managed in React
	mergedSettings.providers = reactState.providers.map((reactProvider, index) => {
		const originalProvider = originalSettings.providers[index]
		if (originalProvider) {
			// Create merged parameters preserving vendor-specific configurations
			const mergedParameters = { ...originalProvider.options.parameters }

			// Update vendor-specific parameters from React state
			if (reactProvider.vendorConfig) {
				switch (reactProvider.name) {
					case 'Azure':
						if (reactProvider.vendorConfig.azure) {
							mergedParameters.endpoint = reactProvider.vendorConfig.azure.endpoint
							mergedParameters.apiVersion = reactProvider.vendorConfig.azure.apiVersion
						}
						break
					case 'Claude':
						if (reactProvider.vendorConfig.claude) {
							mergedParameters.thinkingMode = reactProvider.vendorConfig.claude.thinkingMode
							mergedParameters.budget_tokens = reactProvider.vendorConfig.claude.budgetTokens
							mergedParameters.max_tokens = reactProvider.vendorConfig.claude.maxTokens
							mergedParameters.temperature = reactProvider.vendorConfig.claude.temperature
							mergedParameters.top_p = reactProvider.vendorConfig.claude.topP
							mergedParameters.top_k = reactProvider.vendorConfig.claude.topK
							mergedParameters.stop = reactProvider.vendorConfig.claude.stop
						}
						break
					case 'DeepSeek':
						if (reactProvider.vendorConfig.deepseek) {
							mergedParameters.baseURL = reactProvider.vendorConfig.deepseek.baseURL
							mergedParameters.model = reactProvider.vendorConfig.deepseek.model
							mergedParameters.maxTokens = reactProvider.vendorConfig.deepseek.maxTokens
							mergedParameters.temperature = reactProvider.vendorConfig.deepseek.temperature
							mergedParameters.topP = reactProvider.vendorConfig.deepseek.topP
							mergedParameters.frequencyPenalty = reactProvider.vendorConfig.deepseek.frequencyPenalty
							mergedParameters.presencePenalty = reactProvider.vendorConfig.deepseek.presencePenalty
							mergedParameters.reasoningEffort = reactProvider.vendorConfig.deepseek.reasoningEffort
						}
						break
					case 'GPT Image':
						if (reactProvider.vendorConfig.gptImage) {
							mergedParameters.displayWidth = reactProvider.vendorConfig.gptImage.displayWidth
							mergedParameters.n = reactProvider.vendorConfig.gptImage.n
							mergedParameters.size = reactProvider.vendorConfig.gptImage.size
							mergedParameters.output_format = reactProvider.vendorConfig.gptImage.output_format
							mergedParameters.quality = reactProvider.vendorConfig.gptImage.quality
							mergedParameters.background = reactProvider.vendorConfig.gptImage.background
							mergedParameters.output_compression = reactProvider.vendorConfig.gptImage.output_compression
						}
						break
					case 'OpenAI':
						if (reactProvider.vendorConfig.openai) {
							mergedParameters.organization = reactProvider.vendorConfig.openai.organization
							mergedParameters.project = reactProvider.vendorConfig.openai.project
							mergedParameters.max_tokens = reactProvider.vendorConfig.openai.maxTokens
							mergedParameters.temperature = reactProvider.vendorConfig.openai.temperature
							mergedParameters.top_p = reactProvider.vendorConfig.openai.topP
							mergedParameters.top_k = reactProvider.vendorConfig.openai.topK
							mergedParameters.frequencyPenalty = reactProvider.vendorConfig.openai.frequencyPenalty
							mergedParameters.presencePenalty = reactProvider.vendorConfig.openai.presencePenalty
						}
						break
					case 'Ollama':
						if (reactProvider.vendorConfig.ollama) {
							mergedParameters.model = reactProvider.vendorConfig.ollama.model
							mergedParameters.keepAlive = reactProvider.vendorConfig.ollama.keepAlive
							mergedParameters.stream = reactProvider.vendorConfig.ollama.stream
							mergedParameters.numCtx = reactProvider.vendorConfig.ollama.numCtx
							mergedParameters.numPredict = reactProvider.vendorConfig.ollama.numPredict
							mergedParameters.temperature = reactProvider.vendorConfig.ollama.temperature
							mergedParameters.top_p = reactProvider.vendorConfig.ollama.topP
							mergedParameters.top_k = reactProvider.vendorConfig.ollama.topK
							mergedParameters.repeatPenalty = reactProvider.vendorConfig.ollama.repeatPenalty
							mergedParameters.stop = reactProvider.vendorConfig.ollama.stop
							mergedParameters.tfsZ = reactProvider.vendorConfig.ollama.tfsZ
							mergedParameters.mirostat = reactProvider.vendorConfig.ollama.mirostat
							mergedParameters.mirostatTau = reactProvider.vendorConfig.ollama.mirostatTau
							mergedParameters.mirostatEta = reactProvider.vendorConfig.ollama.mirostatEta
						}
						break
				}
			}

			return {
				...originalProvider,
				tag: reactProvider.tag,
				vendor: reactProvider.name,
				options: {
					...originalProvider.options,
					apiKey: reactProvider.apiKey || originalProvider.options.apiKey,
					model: reactProvider.model || originalProvider.options.model,
					parameters: mergedParameters
				}
			}
		}

		// Fallback for new providers - build from React state
		const baseOptions = {
			apiKey: reactProvider.apiKey || '',
			baseURL: '',
			model: reactProvider.model || '',
			parameters: {} as Record<string, any>
		}

		// Add vendor-specific configurations for new providers
		if (reactProvider.vendorConfig) {
			switch (reactProvider.name) {
				case 'Azure':
					if (reactProvider.vendorConfig.azure) {
						baseOptions.baseURL = reactProvider.vendorConfig.azure.endpoint || ''
						baseOptions.parameters = {
							endpoint: reactProvider.vendorConfig.azure.endpoint,
							apiVersion: reactProvider.vendorConfig.azure.apiVersion
						}
					}
					break
				// Add similar cases for other vendors...
			}
		}

		return {
			tag: reactProvider.tag,
			vendor: reactProvider.name,
			options: baseOptions
		}
	})

	// Merge MCP servers selectively to preserve unmodified servers
	if (originalSettings.mcpServers && originalSettings.mcpServers.length > 0) {
		mergedSettings.mcpServers = originalSettings.mcpServers.map((existingServer, index) => {
			const updatedServer = reactUpdates.mcpServers?.[index]
			return updatedServer ? { ...existingServer, ...updatedServer } : existingServer
		})
	}

	// Add any new MCP servers
	if (reactUpdates.mcpServers && reactUpdates.mcpServers.length > (originalSettings.mcpServers?.length || 0)) {
		const existingCount = originalSettings.mcpServers?.length || 0
		const newServers = reactUpdates.mcpServers.slice(existingCount)
		mergedSettings.mcpServers = [...(mergedSettings.mcpServers || []), ...newServers]
	}

	return mergedSettings
}

/**
 * Validate adapter transformation by checking round-trip conversion
 */
export function validateAdapterTransformation(obsidianSettings: PluginSettings): {
	isValid: boolean
	errors: string[]
} {
	const errors: string[] = []

	try {
		// Convert to React and back
		const reactState = adaptObsidianToReact(obsidianSettings)
		const backToObsidian = adaptReactToObsidian(reactState)

		// Check critical fields are preserved
		const criticalFields: (keyof PluginSettings)[] = [
			'newChatTags',
			'userTags',
			'systemTags',
			'confirmRegenerate',
			'enableInternalLink',
			'enableDefaultSystemMsg',
			'defaultSystemMsg'
		]

		for (const field of criticalFields) {
			const original = obsidianSettings[field]
			const converted = backToObsidian[field]
			if (JSON.stringify(original) !== JSON.stringify(converted)) {
				errors.push(`Field '${field}' not preserved in round-trip conversion`)
			}
		}

		// Check array lengths
		if (obsidianSettings.providers.length !== backToObsidian.providers?.length) {
			errors.push('Provider count mismatch in round-trip conversion')
		}

		if (obsidianSettings.mcpServers.length !== backToObsidian.mcpServers?.length) {
			errors.push('MCP server count mismatch in round-trip conversion')
		}
	} catch (error) {
		errors.push(`Adapter validation failed: ${error instanceof Error ? error.message : String(error)}`)
	}

	return {
		isValid: errors.length === 0,
		errors
	}
}
