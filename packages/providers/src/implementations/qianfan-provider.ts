import { injectable } from '@needle-di/core'
import { ProviderTemplate } from '../base/ProviderTemplate'
import { qianFanVendor } from './qianFan'
import type { LlmCapability } from '@tars/contracts/providers'

@injectable()
export class QianFanProvider extends ProviderTemplate {
  readonly name = 'qianfan'
  readonly displayName = 'QianFan (Baidu)'
  readonly capabilities: LlmCapability[] = ['Text Generation']

  protected getDefaultOptions() {
    return {
      model: 'ERNIE-Speed-8K',
      apiKey: '',
      secretKey: '',
      baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop',
      parameters: {}
    }
  }

  protected createVendorImplementation() {
    return qianFanVendor
  }
}