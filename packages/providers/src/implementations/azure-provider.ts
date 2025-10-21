import { injectable } from '@needle-di/core'
import { ProviderTemplate } from '../base/ProviderTemplate'
import { azureVendor } from './azure'
import type { LlmCapability } from '@tars/contracts/providers'

@injectable()
export class AzureProvider extends ProviderTemplate {
  readonly name = 'azure'
  readonly displayName = 'Azure OpenAI'
  readonly capabilities: LlmCapability[] = ['Text Generation', 'Tool Calling']

  protected getDefaultOptions() {
    return {
      model: 'gpt-4',
      endpoint: 'https://your-resource.openai.azure.com/',
      apiVersion: '2023-12-01-preview',
      apiKey: '',
      parameters: {}
    }
  }

  protected createVendorImplementation() {
    return azureVendor
  }
}