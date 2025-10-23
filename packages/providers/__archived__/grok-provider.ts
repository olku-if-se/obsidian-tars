import { injectable } from '@needle-di/core'
import { type LlmCapability, toLlmModels } from '@tars/contracts/providers'
import { ProviderTemplate } from '../base/ProviderTemplate'
import { grokVendor } from './grok'

@injectable()
export class GrokProvider extends ProviderTemplate {
	readonly name = 'grok'
	readonly displayName = 'Grok (xAI)'
	readonly capabilities: LlmCapability[] = ['Text Generation', 'Image Vision', 'Tool Calling']
	readonly models = toLlmModels(['grok-beta'], this.capabilities)
	readonly websiteToObtainKey = 'https://x.ai'

	protected getDefaultOptions() {
		return {
			model: 'grok-beta',
			apiKey: '',
			baseUrl: 'https://api.x.ai/v1',
			parameters: {}
		}
	}

	protected createVendorImplementation() {
		return grokVendor
	}
}
