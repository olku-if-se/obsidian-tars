import { injectable } from '@needle-di/core'
import { ProviderTemplate } from '../base/ProviderTemplate'
import { azureVendor } from './azure'
import type { LlmCapability } from '@tars/contracts/providers'

@injectable()
export class AzureProvider extends ProviderTemplate {
  readonly name = 'azure'
  readonly displayName = 'Azure OpenAI'
  readonly capabilities: LlmCapability[] = ['Text Generation', 'Tool Calling']
  readonly models = ['gpt-4', 'gpt-4-32k', 'gpt-35-turbo', 'gpt-35-turbo-16k']
  readonly websiteToObtainKey = 'https://azure.microsoft.com/en-us/products/cognitive-services/openai-service'

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