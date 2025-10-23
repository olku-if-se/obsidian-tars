import type {
	LlmCapability,
	LlmProvider,
	ProviderRegistry,
} from "../providers";

export const ProviderRegistryNoOp: ProviderRegistry = {
	getAll(): LlmProvider[] {
		return [];
	},
	getAllCapabilities(): LlmCapability[] {
		return [];
	},
	getByCapability(capability: LlmCapability): LlmProvider[] {
		return [];
	},
	getByName(name: string): LlmProvider | undefined {
		return undefined;
	},
	hasCapability(capability: LlmCapability): boolean {
		return false;
	},
};
