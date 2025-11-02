import { injectable } from '@needle-di/core'
import OpenAI from 'openai'
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
import { CALLOUT_BLOCK_END, CALLOUT_BLOCK_START } from './utils'

type DeepSeekDelta = OpenAI.ChatCompletionChunk.Choice.Delta & {
  reasoning_content?: string
} // hack, deepseek-reasoner added a reasoning_content field

// Error messages
const Errors = {
  api_key_missing: 'DeepSeek API key is required',
  model_invalid: 'Invalid DeepSeek model specified',
  request_failed: 'DeepSeek API request failed',
} as const

// Custom exceptions
export class DeepSeekError extends Error {
  static apiKeyMissing = () =>
    Object.assign(new DeepSeekError(Errors.api_key_missing), { code: 'API_KEY_MISSING' })

  static modelInvalid = (model: string) =>
    Object.assign(new DeepSeekError(`${Errors.model_invalid}: ${model}`), {
      code: 'MODEL_INVALID',
      model,
    })

  static requestFailed = (cause: unknown) =>
    Object.assign(new DeepSeekError(Errors.request_failed), { code: 'REQUEST_FAILED', cause })
}

/**
 * Injectable DeepSeek provider implementation.
 * Uses constructor injection to receive PluginSettings through DI.
 */
@injectable()
export class DeepSeekProvider extends BaseVendorOptions implements Vendor {
  public readonly name = 'DeepSeek'
  public readonly capabilities: Capability[] = ['Text Generation', 'Reasoning', 'Coding']

  protected getProviderName(): string {
    return 'DeepSeek'
  }

  get models(): string[] {
    return ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner']
  }

  get websiteToObtainKey(): string {
    return 'https://platform.deepseek.com/'
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
   * Send request to DeepSeek API
   */
  sendRequest = async (
    messages: Message[],
    options: BaseOptions = this.defaultOptions,
    _controller?: AbortController,
    _resolveEmbedAsBinary?: ResolveEmbedAsBinary,
    _saveAttachment?: SaveAttachment
  ): Promise<AsyncGenerator<string, void, unknown>> => {
    this.validateMessages(messages)

    try {
      // Build request options for DeepSeek
      const requestOptions = {
        model: options.model || this.model,
        messages: this.formatMessages(messages),
        max_tokens: (options.parameters.maxTokens as number) || 4000,
        temperature: (options.parameters.temperature as number) || 0.7,
        stream: (options.parameters.stream as boolean) || false,
      }

      // Validate model
      if (requestOptions.model && !this.models.includes(requestOptions.model)) {
        throw DeepSeekError.modelInvalid(requestOptions.model)
      }

      // Create DeepSeek client (uses OpenAI SDK with different base URL)
      const client = new OpenAI({
        apiKey: this.apiKey,
        baseURL: this.baseURL,
        dangerouslyAllowBrowser: true,
      })

      console.log(`[DeepSeek Provider] Request:`, {
        model: requestOptions.model,
        messageCount: messages.length,
        stream: requestOptions.stream,
      })

      // Create completion stream
      const stream = await client.chat.completions.create({
        model: requestOptions.model,
        messages: requestOptions.messages,
        stream: true, // Force streaming for DeepSeek reasoning
        max_tokens: requestOptions.max_tokens,
        temperature: requestOptions.temperature,
      })

      return Promise.resolve(this.createDeepSeekStream(stream, messages))
    } catch (error) {
      throw DeepSeekError.requestFailed(error)
    }
  }

  /**
   * Create a DeepSeek-specific stream that handles reasoning content
   */
  private async *createDeepSeekStream(
    stream: AsyncIterable<OpenAI.ChatCompletionChunk>,
    _originalMessages: Message[]
  ): AsyncGenerator<string, void, unknown> {
    let startReasoning = false

    for await (const part of stream) {
      if (part.usage?.prompt_tokens && part.usage.completion_tokens) {
        console.debug(
          `DeepSeek Prompt tokens: ${part.usage.prompt_tokens}, completion tokens: ${part.usage.completion_tokens}`
        )
      }

      const delta = part.choices[0]?.delta as DeepSeekDelta
      const reasonContent = delta?.reasoning_content

      if (reasonContent) {
        startReasoning = true
        yield `<reasoning>${reasonContent}</reasoning>`
      } else if (delta.content) {
        if (startReasoning) {
          yield `${CALLOUT_BLOCK_START}${delta.content}${CALLOUT_BLOCK_END}`
          startReasoning = false
        } else {
          yield delta.content
        }
      }
    }
  }

  private formatMessages(messages: Message[]): OpenAI.ChatCompletionMessageParam[] {
    return messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
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

  /**
   * Factory method for creating instances (useful for testing)
   */
  static create(settings: PluginSettings): DeepSeekProvider {
    return new DeepSeekProvider(settings)
  }

  /**
   * Validate provider configuration
   */
  validate(): { isValid: boolean; errors: string[] } {
    const baseValidation = this.validateConfiguration()
    const errors = [...baseValidation.errors]

    // DeepSeek-specific validation
    try {
      if (!this.models.includes(this.model)) {
        errors.push(`Invalid model: ${this.model}. Supported models: ${this.models.join(', ')}`)
      }

      // Check if base URL is DeepSeek's
      if (!this.baseURL.includes('deepseek')) {
        errors.push(`Invalid base URL for DeepSeek: ${this.baseURL}. Expected: https://api.deepseek.com`)
      }

      // DeepSeek requires specific reasoning model format
      if (this.model.includes('reasoner') && !this.models.includes('deepseek-reasoner')) {
        errors.push('Invalid model for DeepSeek Reasoner. Use deepseek-reasoner instead.')
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
