import { injectable } from '@needle-di/core'
import { type LlmCapability, toLlmModels } from '@tars/contracts/providers'
import { ProviderTemplate } from '../../src/base/ProviderTemplate'
import { kimiVendor } from './kimi'

@injectable()
export class KimiProvider extends ProviderTemplate {
	readonly name = 'kimi'
	readonly displayName = 'Kimi (Moonshot)'
	readonly capabilities: LlmCapability[] = ['Text Generation', 'Image Vision', 'Tool Calling']
	readonly models = toLlmModels(['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'], this.capabilities)
	readonly websiteToObtainKey = 'https://www.moonshot.cn'

	protected getDefaultOptions() {
		return {
			model: 'moonshot-v1-8k',
			apiKey: '',
			baseUrl: 'https://api.moonshot.cn/v1',
			parameters: {}
		}
	}

	protected createVendorImplementation() {
		return kimiVendor
	}
}
