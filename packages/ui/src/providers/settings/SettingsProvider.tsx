import { createContext, type ReactNode, useContext, useReducer, useCallback, useMemo } from 'react'
import type { MCPServerConfig } from '../../components'
import { validateFormat, type ValidationResult } from '../../utilities/validation'

// Type aliases for better readability
export type Provider = {
	id: string
	name: string
	tag: string
	model?: string
	apiKey?: string
	capabilities?: string[]
}

export type MessageTagsData = {
	newChatTags: string[]
	userTags: string[]
	systemTags: string[]
	roleEmojis: {
		newChat: string
		user: string
		system: string
	}
}

export type ReactFeatures = {
	reactSettingsTab: boolean
	reactStatusBar: boolean
	reactModals: boolean
	reactMcpUI: boolean
}

export type GlobalLimits = {
	concurrentExecutions: number
	sessionLimitPerDocument: number
	defaultTimeout: number
	parallelExecutionEnabled: boolean
	llmUtilityEnabled: boolean
	maxParallelTools: number
}

export type SystemMessage = {
	enabled: boolean
	message: string
}

export type BasicSettings = {
	confirmRegenerate: boolean
	enableInternalLink: boolean
}

export type AdvancedSettings = {
	enableInternalLinkForAssistantMsg: boolean
	answerDelayInMilliseconds: number
	enableReplaceTag: boolean
	enableExportToJSONL: boolean
	enableTagSuggest: boolean
}

type MCPDisplayMode = MCPServerConfig['displayMode']
type MCPServerTemplate = Partial<MCPServerConfig>

function createEmptyValidationState(format: MCPDisplayMode): ValidationResult {
	return {
		isValid: false,
		errors: [],
		warnings: [],
		formatCompatibility: {
			canShowAsUrl: format === 'url',
			canShowAsCommand: format === 'command',
			canShowAsJson: format === 'json'
		}
	}
}

function inferDisplayMode(configInput?: string, fallback: MCPDisplayMode = 'command'): MCPDisplayMode {
	const value = configInput?.trim()
	if (!value) {
		return fallback
	}
	if (value.startsWith('http://') || value.startsWith('https://')) {
		return 'url'
	}
	if (value.startsWith('{') || value.startsWith('[')) {
		return 'json'
	}
	return 'command'
}

function getDefaultTransport(displayMode: MCPDisplayMode, template: MCPServerTemplate): MCPServerConfig['transport'] {
	if (template.transport) {
		return template.transport
	}
	return displayMode === 'url' ? 'sse' : 'stdio'
}

function generateUniqueServerName(baseName: string, existing: MCPServerConfig[]): string {
	const trimmedBase = baseName.trim() || 'New MCP Server'
	const existingNames = new Set(existing.map(server => server.name.toLowerCase()))
	if (!existingNames.has(trimmedBase.toLowerCase())) {
		return trimmedBase
	}

	let suffix = 2
	while (existingNames.has(`${trimmedBase} ${suffix}`.toLowerCase())) {
		suffix += 1
	}

	return `${trimmedBase} ${suffix}`
}

// UI State for collapsible sections
export type SettingsUIState = {
	systemMessageExpanded: boolean
	advancedExpanded: boolean
	mcpServersExpanded: boolean
	reactFeaturesExpanded: boolean
}

// Complete settings state
export type SettingsState = {
	providers: Provider[]
	availableVendors: string[]
	messageTags: MessageTagsData
	defaultTags: MessageTagsData
	systemMessage: SystemMessage
	basicSettings: BasicSettings
	mcpServers: MCPServerConfig[]
	reactFeatures: ReactFeatures
	globalLimits: GlobalLimits
	uiState: SettingsUIState
	advancedSettings: AdvancedSettings
}

// Action types for settings reducer
export type SettingsAction =
	// Provider actions
	| { type: 'ADD_PROVIDER'; payload: { vendor: string } }
	| { type: 'UPDATE_PROVIDER'; payload: { id: string; updates: Partial<Provider> } }
	| { type: 'REMOVE_PROVIDER'; payload: { id: string } }
	// Message tag actions
	| { type: 'UPDATE_MESSAGE_TAGS'; payload: Partial<MessageTagsData> }
	// System message actions
	| { type: 'UPDATE_SYSTEM_MESSAGE'; payload: SystemMessage }
	// Basic settings actions
	| { type: 'UPDATE_BASIC_SETTINGS'; payload: Partial<BasicSettings> }
	// UI state actions
	| { type: 'TOGGLE_SECTION'; payload: { section: keyof SettingsUIState; open: boolean } }
	// MCP server actions
	| { type: 'ADD_MCP_SERVER'; payload?: { template?: MCPServerTemplate } }
	| { type: 'REMOVE_MCP_SERVER'; payload: { id: string } }
	| { type: 'UPDATE_MCP_SERVER'; payload: { id: string; updates: Partial<MCPServerConfig> } }
	| { type: 'TOGGLE_MCP_SERVER'; payload: { id: string; enabled: boolean } }
	| { type: 'UPDATE_GLOBAL_LIMITS'; payload: Partial<GlobalLimits> }
	// React features actions
	| { type: 'TOGGLE_REACT_FEATURE'; payload: { feature: keyof ReactFeatures; enabled: boolean } }
	| { type: 'ENABLE_ALL_REACT_FEATURES' }
	| { type: 'DISABLE_ALL_REACT_FEATURES' }
	// Advanced settings actions
	| { type: 'UPDATE_ADVANCED_SETTINGS'; payload: Partial<AdvancedSettings> }
	// Batch update action
	| { type: 'BATCH_UPDATE'; payload: Partial<SettingsState> }

// Initial state defaults
const getDefaultState = (): SettingsState => ({
	providers: [],
	availableVendors: [],
	messageTags: {
		newChatTags: [],
		userTags: [],
		systemTags: [],
		roleEmojis: {
			newChat: '🆕',
			user: '👤',
			system: '⚙️'
		}
	},
	defaultTags: {
		newChatTags: ['#NewChat'],
		userTags: ['#User'],
		systemTags: ['#System'],
		roleEmojis: {
			newChat: '🆕',
			user: '👤',
			system: '⚙️'
		}
	},
	systemMessage: {
		enabled: false,
		message: ''
	},
	basicSettings: {
		confirmRegenerate: false,
		enableInternalLink: true
	},
	mcpServers: [],
	reactFeatures: {
		reactSettingsTab: false,
		reactStatusBar: false,
		reactModals: false,
		reactMcpUI: false
	},
	globalLimits: {
		concurrentExecutions: 3,
		sessionLimitPerDocument: 25,
		defaultTimeout: 30000,
		parallelExecutionEnabled: false,
		llmUtilityEnabled: true,
		maxParallelTools: 3
	},
	uiState: {
		systemMessageExpanded: false,
		advancedExpanded: false,
		mcpServersExpanded: false,
		reactFeaturesExpanded: false
	},
	advancedSettings: {
		enableInternalLinkForAssistantMsg: false,
		answerDelayInMilliseconds: 1000,
		enableReplaceTag: false,
		enableExportToJSONL: false,
		enableTagSuggest: true
	}
})

// Settings reducer
function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
	switch (action.type) {
		case 'ADD_PROVIDER': {
			const newProvider: Provider = {
				id: `${action.payload.vendor.toLowerCase()}-${Date.now()}`,
				name: action.payload.vendor,
				tag: action.payload.vendor.substring(0, 4).toUpperCase(),
				capabilities: []
			}
			return {
				...state,
				providers: [...state.providers, newProvider]
			}
		}

		case 'UPDATE_PROVIDER':
			return {
				...state,
				providers: state.providers.map(provider =>
					provider.id === action.payload.id
						? { ...provider, ...action.payload.updates }
						: provider
				)
			}

		case 'REMOVE_PROVIDER':
			return {
				...state,
				providers: state.providers.filter(provider => provider.id !== action.payload.id)
			}

		case 'UPDATE_MESSAGE_TAGS':
			return {
				...state,
				messageTags: { ...state.messageTags, ...action.payload }
			}

		case 'UPDATE_SYSTEM_MESSAGE':
			return {
				...state,
				systemMessage: action.payload
			}

		case 'UPDATE_BASIC_SETTINGS':
			return {
				...state,
				basicSettings: { ...state.basicSettings, ...action.payload }
			}

		case 'TOGGLE_SECTION':
			return {
				...state,
				uiState: {
					...state.uiState,
					[action.payload.section]: action.payload.open
				}
			}

		case 'ADD_MCP_SERVER': {
			const template = action.payload?.template ?? {}
			const inferredDisplayMode = inferDisplayMode(template.configInput, template.displayMode ?? 'url')
			const displayMode = template.displayMode ?? inferredDisplayMode
			const configInput = template.configInput ? template.configInput.trim() : ''
			const baseValidation = template.validationState
				? { ...template.validationState }
				: configInput
					? validateFormat(configInput, displayMode)
					: createEmptyValidationState(displayMode)
			const name = generateUniqueServerName(template.name ?? 'New MCP Server', state.mcpServers)

			const newServer: MCPServerConfig = {
				id: template.id ?? `mcp-server-${Date.now()}`,
				name,
				enabled: template.enabled ?? false,
				configInput,
				displayMode,
				validationState: baseValidation,
				failureCount: template.failureCount ?? 0,
				autoDisabled: template.autoDisabled ?? false,
				deploymentType: template.deploymentType ?? 'managed',
				transport: getDefaultTransport(displayMode, template),
				dockerConfig: template.dockerConfig,
				sseConfig: template.sseConfig,
				retryPolicy:
					template.retryPolicy ?? {
						maxRetries: 3,
						backoffMs: 1000
					},
				timeout: template.timeout ?? 30
			}
			return {
				...state,
				mcpServers: [...state.mcpServers, newServer]
			}
		}

		case 'REMOVE_MCP_SERVER':
			return {
				...state,
				mcpServers: state.mcpServers.filter(server => server.id !== action.payload.id)
			}

		case 'UPDATE_MCP_SERVER':
			return {
				...state,
				mcpServers: state.mcpServers.map(server =>
					server.id === action.payload.id
						? { ...server, ...action.payload.updates }
						: server
				)
			}

		case 'TOGGLE_MCP_SERVER':
			return {
				...state,
				mcpServers: state.mcpServers.map(server =>
					server.id === action.payload.id
						? { ...server, enabled: action.payload.enabled }
						: server
				)
			}

		case 'UPDATE_GLOBAL_LIMITS':
			return {
				...state,
				globalLimits: { ...state.globalLimits, ...action.payload }
			}

		case 'TOGGLE_REACT_FEATURE':
			return {
				...state,
				reactFeatures: {
					...state.reactFeatures,
					[action.payload.feature]: action.payload.enabled
				}
			}

		case 'ENABLE_ALL_REACT_FEATURES':
			return {
				...state,
				reactFeatures: Object.fromEntries(
					Object.keys(state.reactFeatures).map(key => [key, true])
				) as ReactFeatures
			}

		case 'DISABLE_ALL_REACT_FEATURES':
			return {
				...state,
				reactFeatures: Object.fromEntries(
					Object.keys(state.reactFeatures).map(key => [key, false])
				) as ReactFeatures
			}

		case 'UPDATE_ADVANCED_SETTINGS':
			return {
				...state,
				advancedSettings: { ...state.advancedSettings, ...action.payload }
			}

		case 'BATCH_UPDATE':
			return {
				...state,
				...action.payload
			}

		default:
			return state
	}
}

// Context interface
interface SettingsContextValue {
	state: SettingsState
	dispatch: React.Dispatch<SettingsAction>
	// Convenience actions that map to dispatch
	actions: {
		addProvider: (vendor: string) => void
		updateProvider: (id: string, updates: Partial<Provider>) => void
		removeProvider: (id: string) => void
		updateMessageTags: (tags: Partial<MessageTagsData>) => void
		updateSystemMessage: (systemMessage: SystemMessage) => void
		updateBasicSettings: (settings: Partial<BasicSettings>) => void
		toggleSection: (section: keyof SettingsUIState, open: boolean) => void
		addMCPServer: (template?: MCPServerTemplate) => void
		removeMCPServer: (id: string) => void
		updateMCPServer: (id: string, updates: Partial<MCPServerConfig>) => void
		toggleMCPServer: (id: string, enabled: boolean) => void
		updateGlobalLimits: (limits: Partial<GlobalLimits>) => void
		toggleReactFeature: (feature: keyof ReactFeatures, enabled: boolean) => void
		enableAllReactFeatures: () => void
		disableAllReactFeatures: () => void
		updateAdvancedSettings: (settings: Partial<AdvancedSettings>) => void
		batchUpdate: (updates: Partial<SettingsState>) => void
	}
}

// Create context
const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

// Provider props
export interface SettingsProviderProps {
	children: ReactNode
	initialState?: Partial<SettingsState>
	onStateChange?: (state: SettingsState) => void
}

// Settings Provider component
export function SettingsProvider({ children, initialState, onStateChange }: SettingsProviderProps) {
	const [state, dispatch] = useReducer(settingsReducer, {
		...getDefaultState(),
		...initialState
	})

	// Notify parent of state changes
	useCallback(() => {
		if (onStateChange) {
			onStateChange(state)
		}
	}, [state, onStateChange])

	// Memoize actions to prevent unnecessary re-renders
	const actions = useMemo(() => ({
		addProvider: (vendor: string) => dispatch({ type: 'ADD_PROVIDER', payload: { vendor } }),
		updateProvider: (id: string, updates: Partial<Provider>) =>
			dispatch({ type: 'UPDATE_PROVIDER', payload: { id, updates } }),
		removeProvider: (id: string) => dispatch({ type: 'REMOVE_PROVIDER', payload: { id } }),
		updateMessageTags: (tags: Partial<MessageTagsData>) =>
			dispatch({ type: 'UPDATE_MESSAGE_TAGS', payload: tags }),
		updateSystemMessage: (systemMessage: SystemMessage) =>
			dispatch({ type: 'UPDATE_SYSTEM_MESSAGE', payload: systemMessage }),
		updateBasicSettings: (settings: Partial<BasicSettings>) =>
			dispatch({ type: 'UPDATE_BASIC_SETTINGS', payload: settings }),
		toggleSection: (section: keyof SettingsUIState, open: boolean) =>
			dispatch({ type: 'TOGGLE_SECTION', payload: { section, open } }),
		addMCPServer: (template?: MCPServerTemplate) =>
			dispatch({ type: 'ADD_MCP_SERVER', payload: { template } }),
		removeMCPServer: (id: string) => dispatch({ type: 'REMOVE_MCP_SERVER', payload: { id } }),
		updateMCPServer: (id: string, updates: Partial<MCPServerConfig>) =>
			dispatch({ type: 'UPDATE_MCP_SERVER', payload: { id, updates } }),
		toggleMCPServer: (id: string, enabled: boolean) =>
			dispatch({ type: 'TOGGLE_MCP_SERVER', payload: { id, enabled } }),
		updateGlobalLimits: (limits: Partial<GlobalLimits>) =>
			dispatch({ type: 'UPDATE_GLOBAL_LIMITS', payload: limits }),
		toggleReactFeature: (feature: keyof ReactFeatures, enabled: boolean) =>
			dispatch({ type: 'TOGGLE_REACT_FEATURE', payload: { feature, enabled } }),
		enableAllReactFeatures: () => dispatch({ type: 'ENABLE_ALL_REACT_FEATURES' }),
		disableAllReactFeatures: () => dispatch({ type: 'DISABLE_ALL_REACT_FEATURES' }),
		updateAdvancedSettings: (settings: Partial<AdvancedSettings>) =>
			dispatch({ type: 'UPDATE_ADVANCED_SETTINGS', payload: settings }),
		batchUpdate: (updates: Partial<SettingsState>) =>
			dispatch({ type: 'BATCH_UPDATE', payload: updates })
	}), [])

	// Memoize context value
	const contextValue = useMemo(() => ({
		state,
		dispatch,
		actions
	}), [state, actions])

	return (
		<SettingsContext.Provider value={contextValue}>
			{children}
		</SettingsContext.Provider>
	)
}

// Hook to use settings context
export function useSettings(): SettingsContextValue {
	const context = useContext(SettingsContext)
	if (context === undefined) {
		throw new Error('useSettings must be used within a SettingsProvider')
	}
	return context
}

// Selector hooks for specific parts of the state
export function useProviders() {
	const { state, actions } = useSettings()
	return {
		providers: state.providers,
		availableVendors: state.availableVendors,
		addProvider: actions.addProvider,
		updateProvider: actions.updateProvider,
		removeProvider: actions.removeProvider
	}
}

export function useMessageTags() {
	const { state, actions } = useSettings()
	return {
		tags: state.messageTags,
		defaultTags: state.defaultTags,
		updateTags: actions.updateMessageTags
	}
}

export function useSystemMessage() {
	const { state, actions } = useSettings()
	return {
		systemMessage: state.systemMessage,
		updateMessage: actions.updateSystemMessage
	}
}

export function useBasicSettings() {
	const { state, actions } = useSettings()
	return {
		settings: state.basicSettings,
		updateSettings: actions.updateBasicSettings
	}
}

export function useUIState() {
	const { state, actions } = useSettings()
	return {
		uiState: state.uiState,
		toggleSection: actions.toggleSection
	}
}

export function useMCPServers() {
	const { state, actions } = useSettings()
	return {
		servers: state.mcpServers,
		globalLimits: state.globalLimits,
		addServer: actions.addMCPServer,
		removeServer: actions.removeMCPServer,
		updateServer: actions.updateMCPServer,
		toggleServer: actions.toggleMCPServer,
		updateGlobalLimits: actions.updateGlobalLimits
	}
}

export function useReactFeatures() {
	const { state, actions } = useSettings()
	return {
		features: state.reactFeatures,
		toggleFeature: actions.toggleReactFeature,
		enableAll: actions.enableAllReactFeatures,
		disableAll: actions.disableAllReactFeatures
	}
}

export function useAdvancedSettings() {
	const { state, actions } = useSettings()
	return {
		settings: state.advancedSettings,
		updateSettings: actions.updateAdvancedSettings
	}
}
