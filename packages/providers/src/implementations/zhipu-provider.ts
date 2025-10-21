import { injectable } from '@needle-di/core'
import { ProviderTemplate } from '../base/ProviderTemplate'
import { zhipuVendor } from './zhipu'
import type { LlmCapability } from '@tars/contracts/providers'

@injectable()
export class ZhipuProvider extends ProviderTemplate {
  readonly name = 'zhipu'
  readonly displayName = 'Zhipu AI'
  readonly capabilities: LlmCapability[] = ['Text Generation', 'Web Search']

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