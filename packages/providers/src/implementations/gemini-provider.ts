import { injectable } from '@needle-di/core'
import { ProviderTemplate } from '../base/ProviderTemplate'
import { geminiVendor } from './gemini'
import type { LlmCapability } from '@tars/contracts/providers'

@injectable()
export class GeminiProvider extends ProviderTemplate {
  readonly name = 'gemini'
  readonly displayName = 'Google Gemini'
  readonly capabilities: LlmCapability[] = ['Text Generation', 'Tool Calling']

  protected getDefaultOptions() {
    return {
      model: 'gemini-pro',
      apiKey: '',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      parameters: {}
    }
  }

  protected createVendorImplementation() {
    return geminiVendor
  }
}