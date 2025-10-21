import { injectable } from '@needle-di/core'
import { ProviderTemplate } from '../base/ProviderTemplate'
import { grokVendor } from './grok'
import type { LlmCapability } from '@tars/contracts/providers'

@injectable()
export class GrokProvider extends ProviderTemplate {
  readonly name = 'grok'
  readonly displayName = 'Grok (xAI)'
  readonly capabilities: LlmCapability[] = ['Text Generation', 'Image Vision', 'Tool Calling']

  protected getDefaultOptions() {
    return {
      model: 'grok-beta',
      apiKey: '',
      baseUrl: 'https://api.x.ai/v1',
      parameters: {}
    }
  }

  protected createVendorImplementation() {
    return grokVendor
  }
}