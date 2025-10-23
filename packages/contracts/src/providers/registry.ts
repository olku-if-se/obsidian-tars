import type { LlmCapability, LlmProvider } from "./base";

/**
 * Provider Registry Interface
 * Manages provider discovery and lookup
 */
export abstract class ProviderRegistry {
	/** Get all registered providers */
	abstract getAll(): LlmProvider[];

	/** Get providers filtered by capability */
	abstract getByCapability(capability: LlmCapability): LlmProvider[];

	/** Get provider by unique name */
	abstract getByName(name: string): LlmProvider | undefined;

	/** Check if any providers support a capability */
	abstract hasCapability(capability: LlmCapability): boolean;

	/** Get all unique capabilities across all providers */
	abstract getAllCapabilities(): LlmCapability[];
}
