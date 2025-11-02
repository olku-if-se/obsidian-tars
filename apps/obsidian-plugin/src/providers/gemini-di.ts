import { type Content, GoogleGenerativeAI } from '@google/generative-ai'
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
  api_key_missing: 'Gemini API key is required',
  model_invalid: 'Invalid Gemini model specified',
  request_failed: 'Gemini API request failed',
} as const

// Custom exceptions
export class GeminiProviderError extends Error {
  static apiKeyMissing = () =>
    Object.assign(new GeminiProviderError(Errors.api_key_missing), { code: 'API_KEY_MISSING' })

  static modelInvalid = (model: string) =>
    Object.assign(new GeminiProviderError(`${Errors.model_invalid}: ${model}`), {
      code: 'MODEL_INVALID',
      model,
    })

  static requestFailed = (cause: unknown) =>
    Object.assign(new GeminiProviderError(Errors.request_failed), { code: 'REQUEST_FAILED', cause })
}

/**
 * Injectable Gemini provider implementation.
 * Uses constructor injection to receive PluginSettings through DI.
 */
@injectable()
export class GeminiProvider extends BaseVendorOptions implements Vendor {
  public readonly name = 'Gemini'
  public readonly capabilities: Capability[] = ['Text Generation', 'Multimodal', 'Coding']

  protected getProviderName(): string {
    return 'Gemini'
  }

  get models(): string[] {
    return ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro', 'gemini-pro-vision']
  }

  get websiteToObtainKey(): string {
    return 'https://makersuite.google.com/app/apikey'
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
   * Send request to Gemini API
   */
  sendRequest = async (
    messages: Message[],
    options: BaseOptions = this.defaultOptions,
    controller?: AbortController,
    _resolveEmbedAsBinary?: ResolveEmbedAsBinary,
    _saveAttachment?: SaveAttachment
  ): Promise<AsyncGenerator<string, void, unknown>> => {
    // Handle empty messages case gracefully
    if (!messages || messages.length === 0) {
      return Promise.resolve(this.createEmptyStream())
    }

    this.validateMessages(messages)

    try {
      const { parameters, ...optionsExcludingParams } = options
      const mergedOptions = { ...optionsExcludingParams, ...parameters }
      const { apiKey, baseURL: baseUrl, model } = mergedOptions

      if (!apiKey) {
        throw GeminiProviderError.apiKeyMissing()
      }

      // Validate model
      if (model && !this.models.includes(model)) {
        throw GeminiProviderError.modelInvalid(model)
      }

      const messageList = Array.from(messages)

      const systemMsgCandidate = messageList[0]
      const hasSystem = systemMsgCandidate.role === 'system'
      const systemInstruction = hasSystem ? systemMsgCandidate.content : undefined
      const messagesWithoutSys = hasSystem ? messageList.slice(1, -1) : messageList.slice(0, -1)
      const lastMsg = messageList[messageList.length - 1]

      const history: Content[] = messagesWithoutSys.map(m => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.content }],
      }))

      const genAI = new GoogleGenerativeAI(apiKey)
      const genModel = genAI.getGenerativeModel({ model: model || this.model, systemInstruction }, { baseUrl })
      const chat = genModel.startChat({ history })

      console.log(`[Gemini Provider] Request:`, {
        model: model || this.model,
        messageCount: messages.length,
        hasSystemInstruction: !!systemInstruction,
        historyLength: history.length,
      })

      const result = await chat.sendMessageStream(lastMsg.content, {
        signal: controller?.signal,
      })

      return Promise.resolve(this.createGeminiStream(result.stream))
    } catch (error) {
      // Re-throw our specific errors
      if (error instanceof GeminiProviderError) {
        throw error
      }
      throw GeminiProviderError.requestFailed(error)
    }
  }

  /**
   * Create a Gemini-specific stream
   */
  private async *createGeminiStream(stream: AsyncIterable<{ text(): string }>): AsyncGenerator<string, void, unknown> {
    for await (const chunk of stream) {
      const chunkText = chunk.text()
      if (chunkText) {
        yield chunkText
      }
    }
  }

  /**
   * Create an empty stream for edge cases
   */
  private async *createEmptyStream(): AsyncGenerator<string, void, unknown> {
    // Empty stream - yields nothing
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
  static create(settings: PluginSettings): GeminiProvider {
    return new GeminiProvider(settings)
  }

  /**
   * Validate provider configuration
   */
  validate(): { isValid: boolean; errors: string[] } {
    const baseValidation = this.validateConfiguration()
    const errors = [...baseValidation.errors]

    // Gemini-specific validation
    try {
      if (!this.models.includes(this.model)) {
        errors.push(`Invalid model: ${this.model}. Supported models: ${this.models.join(', ')}`)
      }

      // Check if base URL is Gemini's
      if (!this.baseURL.includes('generativelanguage.googleapis.com')) {
        errors.push(`Invalid base URL for Gemini: ${this.baseURL}. Expected: https://generativelanguage.googleapis.com`)
      }

      // Gemini vision model validation
      if (this.model.includes('vision') && !this.models.includes('gemini-pro-vision')) {
        errors.push('Invalid model for Gemini Vision. Use gemini-pro-vision instead.')
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
