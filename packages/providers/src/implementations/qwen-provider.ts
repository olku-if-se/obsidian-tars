import { injectable } from '@needle-di/core'
import { ProviderTemplate } from '../base/ProviderTemplate'
import { qwenVendor } from './qwen'
import type { LlmCapability } from '@tars/contracts/providers'

@injectable()
export class QwenProvider extends ProviderTemplate {
  readonly name = 'qwen'
  readonly displayName = 'Qwen (Alibaba Cloud)'
  readonly capabilities: LlmCapability[] = ['Text Generation', 'Image Vision', 'Tool Calling']

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