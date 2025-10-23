import type { LlmProvider, LlmCapability } from './base'

/**
 * Provider Registry Interface
 * Manages provider discovery and lookup
 */
export interface ProviderRegistry {
	/** Get all registered providers */
	getAll(): LlmProvider[]

	/** Get providers filtered by capability */
	getByCapability(capability: LlmCapability): LlmProvider[]

	/** Get provider by unique name */
	getByName(name: string): LlmProvider | undefined

	/** Check if any providers support a capability */
	hasCapability(capability: LlmCapability): boolean

	/** Get all unique capabilities across all providers */
	getAllCapabilities(): LlmCapability[]
}
