import { injectable } from '@needle-di/core'
import { type LlmCapability, toLlmModels } from '@tars/contracts/providers'
import { ProviderTemplate } from '../base/ProviderTemplate'
import { openRouterVendor } from './openRouter'

@injectable()
export class OpenRouterProvider extends ProviderTemplate {
	readonly name = 'openrouter'
	readonly displayName = 'OpenRouter'
	readonly capabilities: LlmCapability[] = ['Text Generation', 'Image Vision', 'Tool Calling']
	readonly models = toLlmModels(['meta-llama/llama-3.1-8b-instruct:free'], this.capabilities)
	readonly websiteToObtainKey = 'https://openrouter.ai'

	protected getDefaultOptions() {
		return {
			model: 'anthropic/claude-3.5-sonnet',
			apiKey: '',
			baseUrl: 'https://openrouter.ai/api/v1',
			parameters: {}
		}
	}

	protected createVendorImplementation() {
		return openRouterVendor
	}
}
