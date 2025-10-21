import { injectable } from '@needle-di/core'
import { ProviderTemplate } from '../base/ProviderTemplate'
import { doubaoVendor } from './doubao'
import type { LlmCapability } from '@tars/contracts/providers'

@injectable()
export class DoubaoProvider extends ProviderTemplate {
  readonly name = 'doubao'
  readonly displayName = 'Doubao (ByteDance)'
  readonly capabilities: LlmCapability[] = ['Text Generation']
  readonly models = ['doubao-pro']
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