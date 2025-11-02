import OpenAI from 'openai'
import { t } from '../lang/helper'
import type { BaseOptions, Message, ResolveEmbedAsBinary, Vendor } from '.'
import { CALLOUT_BLOCK_END, CALLOUT_BLOCK_START, convertEmbedToImageUrl } from './utils'

type DeepSeekDelta = OpenAI.ChatCompletionChunk.Choice.Delta & {
  reasoning_content?: string
} // hack, deepseek-reasoner added a reasoning_content field

const sendRequestFunc: Vendor['sendRequestFunc'] = options => {
  const settings = options as BaseOptions

  const generator =
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: stream handling mirrors upstream APIs
    async function* (
      messages: readonly Message[],
      controller: AbortController,
      resolveEmbedAsBinary: ResolveEmbedAsBinary
    ) {
      const { parameters, ...optionsExcludingParams } = settings
      const mergedOptions = { ...optionsExcludingParams, ...parameters }
      const { apiKey, baseURL, model, ...remains } = mergedOptions
      if (!apiKey) throw new Error(t('API key is required'))

      const messageList = Array.from(messages)
      const formattedMessages = await Promise.all(messageList.map(msg => formatMsg(msg, resolveEmbedAsBinary)))
      const client = new OpenAI({
        apiKey,
        baseURL,
        dangerouslyAllowBrowser: true,
      })

      const stream = await client.chat.completions.create(
        {
          model,
          messages: formattedMessages as OpenAI.ChatCompletionMessageParam[],
          stream: true,
          ...remains,
        },
        { signal: controller.signal }
      )

      let startReasoning = false
      for await (const part of stream) {
        const delta = part.choices[0]?.delta as DeepSeekDelta
        const reasonContent = delta?.reasoning_content

        if (reasonContent) {
          let prefix = ''
          if (!startReasoning) {
            startReasoning = true
            prefix = CALLOUT_BLOCK_START
          }
          yield prefix + reasonContent.replace(/\n/g, '\n> ') // Each line of the callout needs to have '>' at the beginning
        } else if (delta?.content) {
          let prefix = ''
          if (startReasoning) {
            startReasoning = false
            prefix = CALLOUT_BLOCK_END
          }
          yield prefix + delta.content
        }
      }
    }

  return generator
}

type ContentItem =
  | {
      type: 'image_url'
      image_url: {
        url: string
      }
    }
  | { type: 'text'; text: string }

const formatMsg = async (msg: Message, resolveEmbedAsBinary: ResolveEmbedAsBinary) => {
  const content: ContentItem[] = msg.embeds
    ? await Promise.all(msg.embeds.map(embed => convertEmbedToImageUrl(embed, resolveEmbedAsBinary)))
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

export const siliconFlowVendor: Vendor = {
  name: 'SiliconFlow',
  defaultOptions: {
    apiKey: '',
    baseURL: 'https://api.siliconflow.cn/v1',
    model: '',
    parameters: {},
  },
  sendRequestFunc,
  models: [],
  websiteToObtainKey: 'https://siliconflow.cn',
  capabilities: ['Text Generation', 'Image Vision', 'Reasoning'],
}
