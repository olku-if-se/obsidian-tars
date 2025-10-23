import { injectable } from '@needle-di/core'
import { type LlmCapability, toLlmModels } from '@tars/contracts/providers'
import { ProviderTemplate } from '../base/ProviderTemplate'
import { zhipuVendor } from './zhipu'

@injectable()
export class ZhipuProvider extends ProviderTemplate {
	readonly name = 'zhipu'
	readonly displayName = 'Zhipu AI'
	readonly capabilities: LlmCapability[] = ['Text Generation', 'Web Search']
	readonly models = toLlmModels(
		['glm-4-plus', 'glm-4-air', 'glm-4-airx', 'glm-4-long', 'glm-4-flash', 'glm-4-flashx'],
		this.capabilities
	)
	readonly websiteToObtainKey = 'https://open.bigmodel.cn/'

	protected getDefaultOptions() {
		return {
			model: 'glm-4',
			apiKey: '',
			baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
			parameters: {}
		}
	}

	protected createVendorImplementation() {
		return zhipuVendor
	}
}
