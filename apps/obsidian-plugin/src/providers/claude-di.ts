import Anthropic from '@anthropic-ai/sdk'
import { injectable } from '@needle-di/core'
import type { EmbedCache } from 'obsidian'
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
import { arrayBufferToBase64, CALLOUT_BLOCK_END, CALLOUT_BLOCK_START, getMimeTypeFromFilename } from './utils'

export interface ClaudeOptions extends BaseOptions {
  max_tokens: number
  enableWebSearch: boolean
  enableThinking: boolean
  budget_tokens: number
}

// Error messages
const Errors = {
  api_key_missing: 'Claude API key is required',
  model_invalid: 'Invalid Claude model specified',
  request_failed: 'Claude API request failed',
  system_message_position: 'System messages are only allowed as the first message',
} as const

// Custom exceptions
export class ClaudeProviderError extends Error {
  static apiKeyMissing = () =>
    Object.assign(new ClaudeProviderError(Errors.api_key_missing), { code: 'API_KEY_MISSING' })

  static modelInvalid = (model: string) =>
    Object.assign(new ClaudeProviderError(`${Errors.model_invalid}: ${model}`), {
      code: 'MODEL_INVALID',
      model,
    })

  static requestFailed = (cause: unknown) =>
    Object.assign(new ClaudeProviderError(Errors.request_failed), { code: 'REQUEST_FAILED', cause })

  static systemMessagePosition = () =>
    Object.assign(new ClaudeProviderError(Errors.system_message_position), { code: 'SYSTEM_MESSAGE_POSITION' })
}

/**
 * Injectable Claude provider implementation.
 * Uses constructor injection to receive PluginSettings through DI.
 */
@injectable()
export class ClaudeProvider extends BaseVendorOptions implements Vendor {
  public readonly name = 'Claude'
  public readonly capabilities: Capability[] = [
    'Text Generation',
    'Web Search',
    'Reasoning',
    'Image Vision',
    'PDF Vision',
  ]

  protected getProviderName(): string {
    return 'Claude'
  }

  get models(): string[] {
    return [
      'claude-sonnet-4-0',
      'claude-opus-4-0',
      'claude-3-7-sonnet-latest',
      'claude-3-5-sonnet-latest',
      'claude-3-opus-latest',
      'claude-3-5-haiku-latest',
    ]
  }

  get websiteToObtainKey(): string {
    return 'https://console.anthropic.com'
  }

  get defaultOptions(): ClaudeOptions {
    return {
      apiKey: this.apiKey,
      baseURL: this.baseURL,
      model: this.model,
      max_tokens: 8192,
      enableWebSearch: false,
      enableThinking: false,
      budget_tokens: 1600,
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
        _saveAttachment?: SaveAttachment
      ) {
        const response = await self.sendRequest(
          messages as Message[],
          options,
          controller,
          resolveEmbedAsBinary,
          _saveAttachment
        )
        for await (const chunk of response) {
          yield chunk
        }
      }
    }
  }

  /**
   * Send request to Claude API
   */
  sendRequest = async (
    messages: Message[],
    options: BaseOptions = this.defaultOptions,
    controller?: AbortController,
    resolveEmbedAsBinary?: ResolveEmbedAsBinary,
    _saveAttachment?: SaveAttachment
  ): Promise<AsyncGenerator<string, void, unknown>> => {
    if (!resolveEmbedAsBinary) {
      throw new Error('resolveEmbedAsBinary function is required for Claude provider')
    }

    this.validateMessages(messages)

    try {
      const settings = options as ClaudeOptions
      const { parameters, ...optionsExcludingParams } = settings
      const optionsWithOverrides = { ...optionsExcludingParams, ...parameters }
      const {
        apiKey,
        baseURL: originalBaseURL,
        model,
        max_tokens,
        enableWebSearch = false,
        enableThinking = false,
        budget_tokens = 1600,
      } = optionsWithOverrides
      let baseURL = originalBaseURL

      if (!apiKey) {
        throw ClaudeProviderError.apiKeyMissing()
      }

      // Validate model
      if (model && !this.models.includes(model)) {
        throw ClaudeProviderError.modelInvalid(model)
      }

      // Remove /v1/messages from baseURL if present, as Anthropic SDK will add it automatically
      if (baseURL.endsWith('/v1/messages/')) {
        baseURL = baseURL.slice(0, -'/v1/messages/'.length)
      } else if (baseURL.endsWith('/v1/messages')) {
        baseURL = baseURL.slice(0, -'/v1/messages'.length)
      }

      const messageList = Array.from(messages)
      const systemMsgCandidate = messageList[0]
      const isSystemPrefixed = systemMsgCandidate?.role === 'system'
      const system_msg = isSystemPrefixed ? systemMsgCandidate : null
      const messagesWithoutSys = isSystemPrefixed ? messageList.slice(1) : messageList

      this.validateMessagePositions(messagesWithoutSys)

      const formattedMsgs = await Promise.all(
        messagesWithoutSys.map(msg => this.formatMsgForClaudeAPI(msg, resolveEmbedAsBinary))
      )

      const client = new Anthropic({
        apiKey,
        baseURL,
        fetch: globalThis.fetch,
        dangerouslyAllowBrowser: true,
      })

      const requestParams: Anthropic.MessageCreateParams = {
        model,
        max_tokens,
        messages: formattedMsgs,
        stream: true,
        ...(system_msg && { system: system_msg.content }),
        ...(enableWebSearch && {
          tools: [
            {
              name: 'web_search',
              type: 'web_search_20250305',
            },
          ],
        }),
        ...(enableThinking && {
          thinking: {
            type: 'enabled',
            budget_tokens,
          },
        }),
      }

      const stream = await client.messages.create(requestParams, {
        signal: controller?.signal,
      })

      return Promise.resolve(this.createClaudeStream(stream))
    } catch (error) {
      if (error instanceof ClaudeProviderError) {
        throw error
      }
      throw ClaudeProviderError.requestFailed(error)
    }
  }

  /**
   * Create a Claude-specific stream that handles thinking and reasoning content
   */
  private async *createClaudeStream(
    stream: AsyncIterable<Anthropic.MessageStreamEvent>
  ): AsyncGenerator<string, void, unknown> {
    let startReasoning = false

    for await (const messageStreamEvent of stream) {
      switch (messageStreamEvent.type) {
        case 'content_block_delta':
          yield* this.handleContentBlockDelta(messageStreamEvent, startReasoning)
          startReasoning = this.shouldUpdateReasoningState(messageStreamEvent, startReasoning)
          break

        case 'content_block_start':
          this.handleContentBlockStart(messageStreamEvent)
          break

        case 'message_delta':
          this.handleMessageDelta(messageStreamEvent)
          break

        default:
          // Ignore other event types
          break
      }
    }
  }

  /**
   * Handle content block delta events for text and thinking content
   */
  private async *handleContentBlockDelta(
    event: Anthropic.ContentBlockDeltaEvent,
    startReasoning: boolean
  ): AsyncGenerator<string, void, unknown> {
    if (event.delta.type === 'text_delta') {
      if (startReasoning) {
        yield `${CALLOUT_BLOCK_END}${event.delta.text}`
      } else {
        yield event.delta.text
      }
    }

    if (event.delta.type === 'thinking_delta') {
      yield this.formatThinkingContent(event.delta.thinking, !startReasoning)
    }
  }

  /**
   * Handle content block start events for tool usage
   */
  private handleContentBlockStart(event: Anthropic.ContentBlockStartEvent): void {
    if (
      event.content_block.type === 'server_tool_use' &&
      event.content_block.name === 'web_search'
    ) {
      // Web search tool detected - in real implementation would show Notice
      console.log('🔍Web Search')
    }
  }

  /**
   * Handle message delta events for stop reason validation
   */
  private handleMessageDelta(event: Anthropic.MessageDeltaEvent): void {
    if (event.delta.stop_reason && event.delta.stop_reason !== 'end_turn') {
      throw new Error(`🔴 Unexpected stop reason: ${event.delta.stop_reason}`)
    }
  }

  /**
   * Format thinking content with proper callout formatting
   */
  private formatThinkingContent(thinking: string, addPrefix: boolean): string {
    const prefix = addPrefix ? CALLOUT_BLOCK_START : ''
    return prefix + thinking.replace(/\n/g, '\n> ') // Each line of the callout needs to have '>' at the beginning
  }

  /**
   * Determine if reasoning state should be updated based on the event
   */
  private shouldUpdateReasoningState(
    event: Anthropic.ContentBlockDeltaEvent,
    currentState: boolean
  ): boolean {
    // When we encounter text delta after reasoning, we should stop reasoning
    if (event.delta.type === 'text_delta' && currentState) {
      return false
    }
    // When we encounter thinking delta, we should start reasoning
    if (event.delta.type === 'thinking_delta' && !currentState) {
      return true
    }
    // Otherwise, maintain current state
    return currentState
  }

  private async formatMsgForClaudeAPI(msg: Message, resolveEmbedAsBinary: ResolveEmbedAsBinary) {
    const content: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam | Anthropic.DocumentBlockParam)[] = msg.embeds
      ? await Promise.all(msg.embeds.map(embed => this.formatEmbed(embed, resolveEmbedAsBinary)))
      : []

    if (msg.content.trim()) {
      content.push({
        type: 'text',
        text: msg.content,
      })
    }

    return {
      role: msg.role as 'user' | 'assistant',
      content,
    }
  }

  private async formatEmbed(embed: EmbedCache, resolveEmbedAsBinary: ResolveEmbedAsBinary) {
    const mimeType = getMimeTypeFromFilename(embed.link)
    if (mimeType === 'application/pdf') {
      const embedBuffer = await resolveEmbedAsBinary(embed)
      const base64Data = arrayBufferToBase64(embedBuffer)
      return {
        type: 'document',
        source: {
          type: 'base64',
          media_type: mimeType,
          data: base64Data,
        },
      } as Anthropic.DocumentBlockParam
    } else if (['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(mimeType)) {
      const embedBuffer = await resolveEmbedAsBinary(embed)
      const base64Data = arrayBufferToBase64(embedBuffer)
      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mimeType,
          data: base64Data,
        },
      } as Anthropic.ImageBlockParam
    } else {
      throw new Error('Only PNG, JPEG, GIF, WebP, and PDF files are supported.')
    }
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

  private validateMessagePositions(messagesWithoutSys: Message[]): void {
    messagesWithoutSys.forEach(msg => {
      if (msg.role === 'system') {
        throw ClaudeProviderError.systemMessagePosition()
      }
    })
  }

  /**
   * Factory method for creating instances (useful for testing)
   */
  static create(settings: PluginSettings): ClaudeProvider {
    return new ClaudeProvider(settings)
  }

  /**
   * Validate provider configuration
   */
  validate(): { isValid: boolean; errors: string[] } {
    const baseValidation = this.validateConfiguration()
    const errors = [...baseValidation.errors]

    try {
      if (!this.models.includes(this.model)) {
        errors.push(`Invalid model: ${this.model}. Supported models: ${this.models.join(', ')}`)
      }

      // Check if base URL is Claude's
      if (!this.baseURL.includes('anthropic.com') && !this.baseURL.includes('anthropic')) {
        errors.push(`Invalid base URL for Claude: ${this.baseURL}. Expected: https://api.anthropic.com`)
      }

      // Validate max_tokens setting
      const claudeOptions = this.defaultOptions
      if (claudeOptions.max_tokens < 1 || claudeOptions.max_tokens > 200000) {
        errors.push('Invalid max_tokens value. Must be between 1 and 200000.')
      }

      // Validate budget_tokens
      if (claudeOptions.budget_tokens < 0 || claudeOptions.budget_tokens > 200000) {
        errors.push('Invalid budget_tokens value. Must be between 0 and 200000.')
      }
    } catch (error) {
      errors.push(`Claude configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}
