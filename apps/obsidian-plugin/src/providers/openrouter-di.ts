import type { EmbedCache } from 'obsidian'
import { injectable, inject } from '@needle-di/core'
import { t } from '../lang/helper'
import type { BaseOptions, Message, ResolveEmbedAsBinary, Vendor } from '.'
import { arrayBufferToBase64, getMimeTypeFromFilename } from './utils'
import { BaseVendorOptions } from '../di/base-vendor-options'
import { Tokens } from '../di/tokens'

// Error messages
const Errors = {
  api_key_missing: "API key is required but not configured",
  model_missing: "Model is required but not configured",
  invalid_response: "Invalid response from OpenRouter API",
  unsupported_file: "Only PNG, JPEG, GIF, WebP, and PDF files are supported",
} as const

// Custom exceptions
export class OpenRouterError extends Error {
  static apiKeyMissing = () =>
    Object.assign(new OpenRouterError(Errors.api_key_missing), {
      code: 'API_KEY_MISSING'
    })

  static modelMissing = () =>
    Object.assign(new OpenRouterError(Errors.model_missing), {
      code: 'MODEL_MISSING'
    })

  static invalidResponse = (cause?: unknown) =>
    Object.assign(new OpenRouterError(Errors.invalid_response), {
      code: 'INVALID_RESPONSE',
      cause
    })

  static unsupportedFile = () =>
    Object.assign(new OpenRouterError(Errors.unsupported_file), {
      code: 'UNSUPPORTED_FILE'
    })
}

// Type definitions
type ContentItem =
  | {
      type: 'image_url'
      image_url: {
        url: string
      }
    }
  | { type: 'text'; text: string }
  | { type: 'file'; file: { filename: string; file_data: string } }

/**
 * OpenRouter AI provider implementation with dependency injection
 */
@injectable()
export class OpenRouterProvider extends BaseVendorOptions implements Vendor {
  constructor(settings = inject(Tokens.AppSettings)) {
    super(settings, 'openrouter')
  }

  protected getProviderName(): string {
    return 'openrouter'
  }

  get name(): string {
    return 'OpenRouter'
  }

  get models(): string[] {
    return [
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o',
      'google/gemini-pro-1.5',
      'meta-llama/llama-3.1-405b-instruct',
      'meta-llama/llama-3.1-70b-instruct',
      'anthropic/claude-3.5-haiku',
      'openai/gpt-4o-mini',
    ]
  }

  get websiteToObtainKey(): string {
    return 'https://openrouter.ai/keys'
  }

  get capabilities(): Vendor['capabilities'] {
    return ['Text Generation', 'Image Vision', 'PDF Vision']
  }

  get sendRequestFunc() {
    return (options: BaseOptions) => {
      const settings = options

      const generator = async function* (
        messages: readonly Message[],
        controller: AbortController,
        resolveEmbedAsBinary: ResolveEmbedAsBinary
      ) {
        try {
          const { parameters, ...optionsExcludingParams } = settings
          const mergedOptions = { ...optionsExcludingParams, ...parameters }
          const { apiKey, baseURL, model, ...remains } = mergedOptions

          if (!apiKey) throw OpenRouterError.apiKeyMissing()
          if (!model) throw OpenRouterError.modelMissing()

          const messageList = Array.from(messages)
          const formattedMessages = await Promise.all(
            messageList.map(msg => formatMsg(msg, resolveEmbedAsBinary))
          )

          const data = {
            model,
            messages: formattedMessages,
            stream: true,
            ...remains,
          }

          const response = await fetch(baseURL, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            signal: controller.signal,
          })

          const reader = response.body?.getReader()
          if (!reader) {
            throw OpenRouterError.invalidResponse()
          }

          const decoder = new TextDecoder()
          let buffer = ''

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              // Append new chunk to buffer
              buffer += decoder.decode(value, { stream: true })

              // Process complete lines from buffer
              while (true) {
                const lineEnd = buffer.indexOf('\n')
                if (lineEnd === -1) break

                const line = buffer.slice(0, lineEnd).trim()
                buffer = buffer.slice(lineEnd + 1)

                if (line.startsWith('data: ')) {
                  const data = line.slice(6)
                  if (data === '[DONE]') break

                  try {
                    const parsed = JSON.parse(data)
                    const content = parsed.choices[0].delta.content
                    if (content) {
                      yield content
                    }
                  } catch {
                    // Ignore invalid JSON
                  }
                }
              }
            }
          } finally {
            reader.cancel()
          }
        } catch (error) {
          if (error instanceof OpenRouterError) {
            throw error
          }
          throw OpenRouterError.invalidResponse(error)
        }
      }

      return generator
    }
  }

  // Static factory for creating instances without DI
  static create(settings?: any): OpenRouterProvider {
    return new OpenRouterProvider(settings)
  }

  // Validation specific to OpenRouter
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const baseValidation = super.validateConfiguration()

    if (!baseValidation.isValid) {
      return baseValidation
    }

    const errors: string[] = []

    // OpenRouter-specific validation
    try {
      const baseURL = this.baseURL
      if (!baseURL.includes('openrouter.ai')) {
        errors.push('OpenRouter API URL should be from openrouter.ai domain')
      }
    } catch (error) {
      errors.push('Failed to validate base URL for OpenRouter')
    }

    try {
      const model = this.model
      if (!this.models.includes(model)) {
        errors.push(`Unsupported OpenRouter model: ${model}. Supported models: ${this.models.join(', ')}`)
      }
    } catch (error) {
      errors.push('Failed to validate model for OpenRouter')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

/**
 * Format embed for OpenRouter API
 */
async function formatEmbed(embed: EmbedCache, resolveEmbedAsBinary: ResolveEmbedAsBinary) {
  const mimeType = getMimeTypeFromFilename(embed.link)

  if (['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(mimeType)) {
    const embedBuffer = await resolveEmbedAsBinary(embed)
    const base64Data = arrayBufferToBase64(embedBuffer)
    return {
      type: 'image_url' as const,
      image_url: {
        url: `data:${mimeType};base64,${base64Data}`,
      },
    }
  } else if ('application/pdf' === mimeType) {
    const embedBuffer = await resolveEmbedAsBinary(embed)
    const base64Data = arrayBufferToBase64(embedBuffer)
    return {
      type: 'file' as const,
      file: {
        filename: embed.link,
        file_data: `data:${mimeType};base64,${base64Data}`,
      },
    }
  } else {
    throw OpenRouterError.unsupportedFile()
  }
}

/**
 * Format message for OpenRouter API
 */
async function formatMsg(msg: Message, resolveEmbedAsBinary: ResolveEmbedAsBinary) {
  const content: ContentItem[] = msg.embeds
    ? await Promise.all(msg.embeds.map(embed => formatEmbed(embed, resolveEmbedAsBinary)))
    : []

  if (msg.content.trim()) {
    content.push({
      type: 'text' as const,
      text: msg.content,
    })
  }

  return {
    role: msg.role,
    content,
  }
}