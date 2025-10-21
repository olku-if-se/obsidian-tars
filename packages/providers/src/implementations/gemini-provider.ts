import { injectable } from '@needle-di/core'
import { ProviderTemplate } from '../base/ProviderTemplate'
import { geminiVendor } from './gemini'
import type { LlmCapability } from '@tars/contracts/providers'

@injectable()
export class GeminiProvider extends ProviderTemplate {
  readonly name = 'gemini'
  readonly displayName = 'Google Gemini'
  readonly capabilities: LlmCapability[] = ['Text Generation', 'Image Vision', 'Tool Calling']
  readonly models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro']
  readonly websiteToObtainKey = 'https://makersuite.google.com/app/apikey'

  protected getDefaultOptions() {
    return {
      model: 'gemini-1.5-flash',
      apiKey: '',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      parameters: {}
    }
  }

  protected createVendorImplementation() {
    return geminiVendor
  }
}