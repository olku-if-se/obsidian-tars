import { injectable } from '@needle-di/core'
import { ProviderTemplate } from '../base/ProviderTemplate'
import { deepSeekVendor } from './deepSeek'
import { toLlmModels, type LlmCapability } from '@tars/contracts/providers'

@injectable()
export class DeepSeekProvider extends ProviderTemplate {
  readonly name = 'deepseek'
  readonly displayName = 'DeepSeek'
  readonly capabilities: LlmCapability[] = ['Text Generation', 'Reasoning', 'Tool Calling']
	readonly models = toLlmModels(['deepseek-chat', 'deepseek-reasoner'], this.capabilities)
  readonly websiteToObtainKey = 'https://platform.deepseek.com'

  protected getDefaultOptions() {
    return {
      model: 'deepseek-chat',
      apiKey: '',
      baseUrl: 'https://api.deepseek.com/v1',
      parameters: {}
    }
  }

  protected createVendorImplementation() {
    return deepSeekVendor
  }
}
