import { injectable } from '@needle-di/core'
import { BaseVendorOptions } from '../di/base-vendor-options'
import type { PluginSettings } from '../settings'
import type {
  BaseOptions,
  Capability,
  Message,
  ResolveEmbedAsBinary,
  SaveAttachment,
  SendRequest,
  Vendor,
} from './index'

// Error messages
const Errors = {
  api_key_missing: 'OpenAI API key is required',
  model_invalid: 'Invalid OpenAI model specified',
  request_failed: 'OpenAI API request failed',
} as const

// Custom exceptions
export class OpenAIProviderError extends Error {
  static apiKeyMissing = () =>
    Object.assign(new OpenAIProviderError(Errors.api_key_missing), { code: 'API_KEY_MISSING' })

  static modelInvalid = (model: string) =>
    Object.assign(new OpenAIProviderError(`${Errors.model_invalid}: ${model}`), {
      code: 'MODEL_INVALID',
      model,
    })

  static requestFailed = (cause: unknown) =>
    Object.assign(new OpenAIProviderError(Errors.request_failed), { code: 'REQUEST_FAILED', cause })
}

/**
 * Injectable OpenAI provider implementation.
 * Uses constructor injection to receive PluginSettings through DI.
 */
@injectable()
export class OpenAIProvider extends BaseVendorOptions implements Vendor {
  public readonly name = 'OpenAI'
  public readonly capabilities: Capability[] = [
    'Text Generation',
    'Image Vision',
    'PDF Vision',
    'Image Generation',
    'Reasoning',
  ]

  protected getProviderName(): string {
    return 'OpenAI'
  }

  // Factory method for creating instances (useful for testing)
  static createWithSettings(settings: PluginSettings): OpenAIProvider {
    return new OpenAIProvider(settings)
  }

  get models(): string[] {
    return [
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4-turbo-preview',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
      'gpt-4-vision-preview',
      'gpt-4-1106-preview',
      'gpt-4-0125-preview',
    ]
  }

  get websiteToObtainKey(): string {
    return 'https://platform.openai.com/api-keys'
  }

  get defaultOptions(): BaseOptions {
    return {
      apiKey: this.apiKey,
      baseURL: this.baseURL,
      model: this.model,
      parameters: this.parameters,
    }
  }

  get sendRequestFunc(): (options: BaseOptions) => SendRequest {
    const self = this
    return (options: BaseOptions) => {
      return async function* (
        messages: readonly Message[],
        controller: AbortController,
        resolveEmbedAsBinary: ResolveEmbedAsBinary,
        saveAttachment?: SaveAttachment
      ) {
        const response = await self.sendRequest(
          messages as Message[],
          options,
          controller,
          resolveEmbedAsBinary,
          saveAttachment
        )
        for await (const chunk of response) {
          yield chunk
        }
      }
    }
  }

  /**
   * Send request to OpenAI API
   */
  sendRequest = async (
    messages: Message[],
    options: BaseOptions = this.defaultOptions,
    controller?: AbortController,
    _resolveEmbedAsBinary?: ResolveEmbedAsBinary,
    _saveAttachment?: SaveAttachment
  ): Promise<AsyncGenerator<string, void, unknown>> => {
    this.validateMessages(messages)

    try {
      // Build request options
      const requestOptions = {
        model: options.model || this.model,
        messages: this.formatMessages(messages),
        max_tokens: (options.parameters.maxTokens as number) || 4000,
        temperature: (options.parameters.temperature as number) || 0.7,
        stream: (options.parameters.stream as boolean) || false,
      }

      // Validate model
      if (requestOptions.model && !this.models.includes(requestOptions.model)) {
        throw OpenAIProviderError.modelInvalid(requestOptions.model)
      }

      // In a real implementation, you would use the OpenAI SDK here
      // For now, we'll create a mock implementation that demonstrates the pattern
      console.log(`[OpenAI Provider] Request:`, {
        model: requestOptions.model,
        messageCount: messages.length,
        stream: requestOptions.stream,
      })

      return Promise.resolve(this.createMockStream(messages, controller))
    } catch (error) {
      throw OpenAIProviderError.requestFailed(error)
    }
  }

  private formatMessages(messages: Message[]): Array<{ role: string; content: string }> {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }))
  }

  private validateMessages(messages: Message[]): void {
    if (!messages || messages.length === 0) {
      throw new Error('Messages array cannot be empty')
    }

    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        throw new Error('Each message must have a role and content')
      }
    }

    const validRoles = ['user', 'assistant', 'system']
    for (const msg of messages) {
      if (!validRoles.includes(msg.role)) {
        throw new Error(`Invalid message role: ${msg.role}`)
      }
    }
  }

  private async *createMockStream(
    messages: Message[],
    controller?: AbortController
  ): AsyncGenerator<string, void, unknown> {
    const mockResponse = this.generateMockResponse(messages)
    const words = mockResponse.split(' ')

    for (const word of words) {
      // Check for cancellation
      if (controller?.signal.aborted) {
        return
      }

      yield `${word} `
      // Simulate streaming delay
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }

  private generateMockResponse(messages: Message[]): string {
    const lastMessage = messages[messages.length - 1]
    const userQuery = lastMessage?.content || 'Hello'

    return `[OpenAI Mock Response] I understand you said: "${userQuery}". This is a mock response demonstrating the DI provider pattern. In a real implementation, this would call the OpenAI API using the injected settings (API key: ${this.apiKey?.substring(0, 8)}..., model: ${this.model}).`
  }

  /**
   * Factory method for creating instances (useful for testing)
   */
  static create(settings: PluginSettings): OpenAIProvider {
    return new OpenAIProvider(settings)
  }

  /**
   * Validate provider configuration
   */
  validate(): { isValid: boolean; errors: string[] } {
    const baseValidation = this.validateConfiguration()
    const errors = [...baseValidation.errors]

    // Additional OpenAI-specific validation
    try {
      if (!this.models.includes(this.model)) {
        errors.push(`Invalid model: ${this.model}. Supported models: ${this.models.join(', ')}`)
      }
    } catch (error) {
      errors.push(`Model validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}
