import { inject, injectable } from "@needle-di/core";
import type { LlmCapability, LlmProvider } from "@tars/contracts/providers";
import { ProviderRegistry } from "@tars/contracts/providers";
import { tokens } from "@tars/contracts/tokens";
import { StreamingProviderBase } from "src/base/StreamingProviderBase";

@injectable()
export class LlmProviderRegistry extends ProviderRegistry {
	constructor(
		private providers = inject(StreamingProviderBase, { multi: true }),
		private logger = inject(tokens.Logger),
	) {
		super();
	}

	/** Get all registered providers */
	getAll(): LlmProvider[] {
		this.logger?.debug("Getting all providers", {
			count: this.providers.length,
		});
		return this.providers;
	}

	/** Get providers filtered by capability */
	getByCapability(capability: LlmCapability): LlmProvider[] {
		const filtered = this.providers.filter((provider) =>
			provider.capabilities.includes(capability),
		);

		this.logger?.debug(`Getting providers for capability: ${capability}`, {
			count: filtered.length,
			capability,
		});

		return filtered;
	}

	/** Get provider by unique name */
	getByName(name: string): LlmProvider | undefined {
		this.logger?.debug(`Looking up provider: ${name}`, { name });

		return this.providers.find((provider) => provider.name === name);
	}

	/** Check if any providers support a capability */
	hasCapability(capability: LlmCapability): boolean {
		const hasCapability = this.providers.some((provider) =>
			provider.capabilities.includes(capability),
		);

		this.logger?.debug(`Checking capability support: ${capability}`, {
			supported: hasCapability,
			capability,
		});

		return hasCapability;
	}

	/** Get all unique capabilities across all providers */
	getAllCapabilities(): LlmCapability[] {
		const allCaps = this.providers.flatMap((p) => p.capabilities);
		const uniqueCaps = [...new Set(allCaps)]; // Remove duplicates

		this.logger?.debug("Getting all capabilities", {
			total: allCaps.length,
			unique: uniqueCaps.length,
			capabilities: uniqueCaps,
		});

		return uniqueCaps;
	}
}
