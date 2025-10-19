import type { Container } from '@needle-di/core'
import { providerToVendor, type Vendor } from '@tars/contracts'
import { ClaudeDIProvider } from '../implementations/claude-di'
import { OllamaDIProvider } from '../implementations/ollama-di'
import { OpenAIDIProvider } from '../implementations/openai-di'

export class DIProviderFactory {
	constructor(private container: Container) {}

	createVendor(providerName: string): Vendor {
		switch (providerName) {
			case 'Claude':
				return providerToVendor(this.container.get(ClaudeDIProvider))
			case 'OpenAI':
				return providerToVendor(this.container.get(OpenAIDIProvider))
			case 'Ollama':
				return providerToVendor(this.container.get(OllamaDIProvider))
			default:
				throw new Error(`Unknown provider: ${providerName}`)
		}
	}

	/**
	 * Get all available DI-enabled providers
	 */
	getAvailableProviders(): string[] {
		return ['Claude', 'OpenAI', 'Ollama']
	}

	/**
	 * Check if a provider is DI-enabled
	 */
	isDIProviderEnabled(providerName: string): boolean {
		return this.getAvailableProviders().includes(providerName)
	}

	/**
	 * Create multiple vendors for the given provider names
	 */
	createVendors(providerNames: string[]): Vendor[] {
		return providerNames.map((name) => this.createVendor(name))
	}
}

/**
 * Create a DI provider factory with the given container
 */
export function createDIProviderFactory(container: Container): DIProviderFactory {
	return new DIProviderFactory(container)
}
