import { injectable } from '@needle-di/core'
import { ProviderTemplate } from '../base/ProviderTemplate'
import { openRouterVendor } from './openRouter'
import type { LlmCapability } from '@tars/contracts/providers'

@injectable()
export class OpenRouterProvider extends ProviderTemplate {
  readonly name = 'openrouter'
  readonly displayName = 'OpenRouter'
  readonly capabilities: LlmCapability[] = ['Text Generation', 'Image Vision', 'Tool Calling']

  protected getDefaultOptions() {
    return {
      model: 'anthropic/claude-3.5-sonnet',
      apiKey: '',
      baseUrl: 'https://openrouter.ai/api/v1',
      parameters: {}
    }
  }

  protected createVendorImplementation() {
    return openRouterVendor
  }
}