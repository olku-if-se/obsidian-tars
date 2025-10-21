import { injectable } from '@needle-di/core'
import { ProviderTemplate } from '../base/ProviderTemplate'
import { gptImageVendor } from './gptImage'
import type { LlmCapability } from '@tars/contracts/providers'

@injectable()
export class GptImageProvider extends ProviderTemplate {
  readonly name = 'gptimage'
  readonly displayName = 'GPT Image Generator'
  readonly capabilities: LlmCapability[] = ['Image Generation']

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