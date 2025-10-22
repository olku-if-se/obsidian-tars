import { injectable } from '@needle-di/core'
import { ProviderTemplate } from '../base/ProviderTemplate'
import { qianFanVendor } from './qianFan'
import { toLlmModels, type LlmCapability } from '@tars/contracts/providers'

@injectable()
export class QianFanProvider extends ProviderTemplate {
  readonly name = 'qianfan'
  readonly displayName = 'QianFan (Baidu)'
  readonly capabilities: LlmCapability[] = ['Text Generation']
	readonly models = toLlmModels(
		['ernie-4.0-8k-latest', 'ernie-4.0-turbo-8k', 'ernie-3.5-128k', 'ernie_speed', 'ernie-speed-128k', 'gemma_7b_it', 'yi_34b_chat', 'mixtral_8x7b_instruct', 'llama_2_70b'],
		this.capabilities
	)
  readonly websiteToObtainKey = 'https://qianfan.cloud.baidu.com'

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
