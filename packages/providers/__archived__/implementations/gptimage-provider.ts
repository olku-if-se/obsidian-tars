import { injectable } from '@needle-di/core'
import { type LlmCapability, toLlmModels } from '@tars/contracts/providers'
import { ProviderTemplate } from '../../src/base/ProviderTemplate'
import { gptImageVendor } from './gptImage'

@injectable()
export class GptImageProvider extends ProviderTemplate {
	readonly name = 'gptimage'
	readonly displayName = 'GPT Image Generator'
	readonly capabilities: LlmCapability[] = ['Image Generation']
	readonly models = toLlmModels(['gpt-image-1'], this.capabilities)
	readonly websiteToObtainKey = 'https://platform.openai.com/api-keys'

	protected getDefaultOptions() {
		return {
			model: 'dall-e-3',
			apiKey: '',
			baseUrl: 'https://api.openai.com/v1',
			quality: 'standard',
			size: '1024x1024',
			parameters: {}
		}
	}

	protected createVendorImplementation() {
		return gptImageVendor
	}
}
