import axios from 'axios'
import { injectable, inject } from '@needle-di/core'
import { t } from '../lang/helper'
import type { BaseOptions, Message, ResolveEmbedAsBinary, Vendor } from '.'
import { CALLOUT_BLOCK_END, CALLOUT_BLOCK_START, convertEmbedToImageUrl } from './utils'
import { BaseVendorOptions } from '../di/base-vendor-options'
import { Tokens } from '../di/tokens'

// Error messages
const Errors = {
  api_key_missing: "API key is required but not configured",
  model_missing: "Model is required but not configured",
  invalid_request: "Invalid request configuration",
} as const

// Custom exceptions
export class GrokProviderError extends Error {
  static apiKeyMissing = () =>
    Object.assign(new GrokProviderError(Errors.api_key_missing), {
      code: 'API_KEY_MISSING'
    })

  static modelMissing = () =>
    Object.assign(new GrokProviderError(Errors.model_missing), {
      code: 'MODEL_MISSING'
    })

  static invalidRequest = (cause?: unknown) =>
    Object.assign(new GrokProviderError(Errors.invalid_request), {
      code: 'INVALID_REQUEST',
      cause
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

/**
 * Grok AI provider implementation with dependency injection
 */
@injectable()
export class GrokProvider extends BaseVendorOptions implements Vendor {
  constructor(settings = inject(Tokens.AppSettings)) {
    super(settings, 'grok')
  }

  protected getProviderName(): string {
    return 'grok'
  }

  get name(): string {
    return 'Grok'
  }

  get models(): string[] {
    return [
      'grok-beta',
      'grok-vision-beta',
    ]
  }

  get websiteToObtainKey(): string {
    return 'https://x.ai'
  }

  get capabilities(): Vendor['capabilities'] {
    return ['Text Generation', 'Reasoning', 'Image Vision']
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

          if (!apiKey) throw GrokProviderError.apiKeyMissing()
          if (!model) throw GrokProviderError.modelMissing()

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

          const response = await axios.post(baseURL, data, {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            adapter: 'fetch',
            responseType: 'stream',
            withCredentials: false,
            signal: controller.signal,
          })

          const reader = response.data.pipeThrough(new TextDecoderStream()).getReader()

          let reading = true
          let startReasoning = false

          while (reading) {
            const { done, value } = await reader.read()
            if (done) {
              reading = false
              break
            }

            const parts = value.split('\n')

            for (const part of parts) {
              if (part.includes('data: [DONE]')) {
                reading = false
                break
              }

              const trimmedPart = part.replace(/^data: /, '').trim()
              if (trimmedPart) {
                const data = JSON.parse(trimmedPart)
                if (data.choices?.[0].delta) {
                  const delta = data.choices[0].delta
                  const reasonContent = delta.reasoning_content

                  if (reasonContent) {
                    let prefix = ''
                    if (!startReasoning) {
                      startReasoning = true
                      prefix = CALLOUT_BLOCK_START
                    }
                    yield prefix + reasonContent.replace(/\n/g, '\n> ')
                  } else if (delta.content) {
                    let prefix = ''
                    if (startReasoning) {
                      startReasoning = false
                      prefix = CALLOUT_BLOCK_END
                    }
                    yield prefix + delta.content
                  }
                }
              }
            }
          }
        } catch (error) {
          if (error instanceof GrokProviderError) {
            throw error
          }
          throw GrokProviderError.invalidRequest(error)
        }
      }

      return generator
    }
  }

  // Static factory for creating instances without DI
  static create(settings?: any): GrokProvider {
    return new GrokProvider(settings)
  }

  // Validation specific to Grok
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const baseValidation = super.validateConfiguration()

    if (!baseValidation.isValid) {
      return baseValidation
    }

    const errors: string[] = []

    // Grok-specific validation
    try {
      const baseURL = this.baseURL
      if (!baseURL.includes('x.ai')) {
        errors.push('Grok API URL should be from x.ai domain')
      }
    } catch (error) {
      errors.push('Failed to validate base URL for Grok')
    }

    try {
      const model = this.model
      if (!this.models.includes(model)) {
        errors.push(`Unsupported Grok model: ${model}. Supported models: ${this.models.join(', ')}`)
      }
    } catch (error) {
      errors.push('Failed to validate model for Grok')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

/**
 * Format message for Grok API
 */
async function formatMsg(msg: Message, resolveEmbedAsBinary: ResolveEmbedAsBinary) {
  const content: ContentItem[] = msg.embeds
    ? await Promise.all(msg.embeds.map(embed => convertEmbedToImageUrl(embed, resolveEmbedAsBinary)))
    : []

  // If there are no embeds/images, return a simple text message format
  if (content.length === 0) {
    return {
      role: msg.role,
      content: msg.content,
    }
  }

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