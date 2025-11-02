/**
 * Base provider functionality
 */

import { createPluginLogger } from '@tars/shared'
import type { Message, ProviderType, SendRequest, Vendor, VendorCapabilities } from '@tars/types'

const providerLogger = createPluginLogger('tars-providers')

export interface BaseVendorOptions {
  apiKey?: string
  baseURL?: string
  model?: string
  maxTokens?: number
  temperature?: number
  timeout?: number
}

export abstract class BaseVendor implements Vendor {
  public abstract readonly type: ProviderType
  public abstract readonly name: string
  public abstract readonly capabilities: VendorCapabilities

  protected options: BaseVendorOptions

  constructor(options: BaseVendorOptions = {}) {
    providerLogger.debug('Initializing vendor base with options', options)
    this.options = {
      maxTokens: 4000,
      temperature: 0.7,
      timeout: 30000,
      ...options,
    }
  }

  abstract sendRequest: SendRequest

  updateOptions(newOptions: Partial<BaseVendorOptions>): void {
    this.options = { ...this.options, ...newOptions }
    providerLogger.info('Updated vendor options', this.options)
  }

  getOptions(): Readonly<BaseVendorOptions> {
    return { ...this.options }
  }

  protected formatMessages(messages: Message[]): string[] {
    return messages.map(msg => `${msg.role}: ${msg.content}`)
  }

  protected validateMessages(messages: Message[]): void {
    if (!messages || messages.length === 0) {
      throw new Error('Messages array cannot be empty')
    }

    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        throw new Error('Each message must have a role and content')
      }
    }

    providerLogger.debug('Validated message batch', {
      count: messages.length,
      preview: this.formatMessages(messages.slice(0, 1)),
    })
  }
}
