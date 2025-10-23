import { injectable } from '@needle-di/core'
import { type LlmCapability, toLlmModels } from '@tars/contracts/providers'
import { ProviderTemplate } from '../base/ProviderTemplate'
import { qwenVendor } from './qwen'

@injectable()
export class QwenProvider extends ProviderTemplate {
	readonly name = 'qwen'
	readonly displayName = 'Qwen (Alibaba Cloud)'
	readonly capabilities: LlmCapability[] = ['Text Generation', 'Image Vision', 'Tool Calling']
	readonly models = toLlmModels(['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-vl-max'], this.capabilities)
	readonly websiteToObtainKey = 'https://dashscope.console.aliyun.com'

	protected getDefaultOptions() {
		return {
			model: 'qwen-turbo',
			apiKey: '',
			baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
			parameters: {}
		}
	}

	protected createVendorImplementation() {
		return qwenVendor
	}
}
