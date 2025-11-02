import axios from 'axios'
import { t } from '../lang/helper'
import type { BaseOptions, Message, ResolveEmbedAsBinary, Vendor } from '.'
import { CALLOUT_BLOCK_END, CALLOUT_BLOCK_START, convertEmbedToImageUrl } from './utils'

const sendRequestFunc: Vendor['sendRequestFunc'] = options => {
  const settings = options as BaseOptions

  const generator =
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: streaming pipeline interacts with multiple data shapes
    async function* (
      messages: readonly Message[],
      controller: AbortController,
      resolveEmbedAsBinary: ResolveEmbedAsBinary
    ) {
      const { parameters, ...optionsExcludingParams } = settings
      const mergedOptions = { ...optionsExcludingParams, ...parameters }
      const { apiKey, baseURL, model, ...remains } = mergedOptions
      if (!apiKey) throw new Error(t('API key is required'))
      if (!model) throw new Error(t('Model is required'))

      const messageList = Array.from(messages)
      const formattedMessages = await Promise.all(messageList.map(msg => formatMsg(msg, resolveEmbedAsBinary)))
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
                yield prefix + reasonContent.replace(/\n/g, '\n> ') // Each line of the callout needs to have '>' at the beginning
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

export const grokVendor: Vendor = {
  name: 'Grok',
  defaultOptions: {
    apiKey: '',
    baseURL: 'https://api.x.ai/v1/chat/completions',
    model: '',
    parameters: {},
  },
  sendRequestFunc,
  models: [],
  websiteToObtainKey: 'https://x.ai',
  capabilities: ['Text Generation', 'Reasoning', 'Image Vision'],
}
