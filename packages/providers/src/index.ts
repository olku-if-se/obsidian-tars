// Re-export from organized modules

// Re-export core types from contracts for backward compatibility
export type {
	Message,
	ProviderSettings,
	Vendor,
	BaseOptions,
	Optional,
	CreatePlainText,
	ResolveEmbedAsBinary,
	SaveAttachment,
	NoticeSystem,
	PlatformInfo,
	RequestSystem,
	EmbedCache,
	LlmModel,
	LlmStreamProcessor,
	LlmCapability,
	NoOpStreamProcessor
} from '@tars/contracts'
export { getModelById, toLlmModels } from '@tars/contracts'

export * from './factories'
// Export DI provider factory
export {
	createDIProviderFactory,
	DIProviderFactory
} from './factories'
export * from './i18n'
export * from './implementations'
// Export DI providers with their own types (deprecated - use streaming providers)
export {
	ClaudeDIProvider,
	OllamaDIProvider
} from './implementations'
export * from './mcp-integration-helper'
export * from './mcp-tool-injection-impl'
export * from './utils'
