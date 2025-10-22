import { injectable } from '@needle-di/core'
import { ProviderTemplate } from '../base/ProviderTemplate'
import { siliconFlowVendor } from './siliconflow'
import { toLlmModels, type LlmCapability } from '@tars/contracts/providers'

@injectable()
export class SiliconFlowProvider extends ProviderTemplate {
  readonly name = 'siliconflow'
  readonly displayName = 'Silicon Flow'
  readonly capabilities: LlmCapability[] = ['Text Generation', 'Image Vision', 'Tool Calling']
	readonly models = toLlmModels(['deepseek-chat'], this.capabilities)
  readonly websiteToObtainKey = 'https://siliconflow.cn'

  protected getDefaultOptions() {
    return {
      model: 'deepseek-chat',
      apiKey: '',
      baseUrl: 'https://api.siliconflow.cn/v1',
      parameters: {}
    }
  }

  protected createVendorImplementation() {
    return siliconFlowVendor
  }
}
