import { injectable } from '@needle-di/core'
import { type LlmCapability, toLlmModels } from '@tars/contracts/providers'
import { ProviderTemplate } from '../../src/base/ProviderTemplate'
import { doubaoVendor } from './doubao'

@injectable()
export class DoubaoProvider extends ProviderTemplate {
	readonly name = 'doubao'
	readonly displayName = 'Doubao (ByteDance)'
	readonly capabilities: LlmCapability[] = ['Text Generation']
	readonly models = toLlmModels(['doubao-pro'], this.capabilities)
	readonly websiteToObtainKey = 'https://www.volcengine.com'

	protected getDefaultOptions() {
		return {
			model: 'doubao-pro-4k',
			apiKey: '',
			baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
			parameters: {}
		}
	}

	protected createVendorImplementation() {
		return doubaoVendor
	}
}
