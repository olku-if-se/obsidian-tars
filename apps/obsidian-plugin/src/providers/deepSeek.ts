import OpenAI from 'openai'
import { t } from '../lang/helper'
import type { BaseOptions, Message, ResolveEmbedAsBinary, Vendor } from '.'
import { CALLOUT_BLOCK_END, CALLOUT_BLOCK_START } from './utils'

type DeepSeekDelta = OpenAI.ChatCompletionChunk.Choice.Delta & {
  reasoning_content?: string
} // hack, deepseek-reasoner added a reasoning_content field

const sendRequestFunc: Vendor['sendRequestFunc'] = options => {
  const settings = options as BaseOptions

  const generator =
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: reasoning stream handling needs detailed branching
    async function* (
      messages: readonly Message[],
      controller: AbortController,
      _resolveEmbedAsBinary: ResolveEmbedAsBinary
    ) {
    const { parameters, ...optionsExcludingParams } = settings
    const mergedOptions = { ...optionsExcludingParams, ...parameters }
    const { apiKey, baseURL, model, ...remains } = mergedOptions
    if (!apiKey) throw new Error(t('API key is required'))

    const client = new OpenAI({
      apiKey,
      baseURL,
      dangerouslyAllowBrowser: true,
    })

    const messageList = Array.from(messages)
    const stream = await client.chat.completions.create(
      {
        model,
        messages: messageList,
        stream: true,
        ...remains,
      },
      { signal: controller.signal }
    )

    let startReasoning = false
    for await (const part of stream) {
      if (part.usage?.prompt_tokens && part.usage.completion_tokens)
        console.debug(
          `Prompt tokens: ${part.usage.prompt_tokens}, completion tokens: ${part.usage.completion_tokens}`
        )

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

const models = ['deepseek-chat', 'deepseek-reasoner']

export const deepSeekVendor: Vendor = {
  name: 'DeepSeek',
  defaultOptions: {
    apiKey: '',
    baseURL: 'https://api.deepseek.com',
    model: models[0],
    parameters: {},
  },
  sendRequestFunc,
  models,
  websiteToObtainKey: 'https://platform.deepseek.com',
  capabilities: ['Text Generation', 'Reasoning'],
}
