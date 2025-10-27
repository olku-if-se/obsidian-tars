import { Notice, requestUrl } from 'obsidian'
import { t } from '../lang/helper'
import type { BaseOptions, Message, ResolveEmbedAsBinary, Vendor } from '.'

const sendRequestFunc: Vendor['sendRequestFunc'] = options => {
  const settings = options as BaseOptions

  return async function* (
    messages: readonly Message[],
    _controller: AbortController,
    _resolveEmbedAsBinary: ResolveEmbedAsBinary
  ) {
    const { parameters, ...optionsExcludingParams } = settings
    const mergedOptions = { ...optionsExcludingParams, ...parameters }
    const { apiKey, baseURL, model, ...remains } = mergedOptions
    if (!apiKey) throw new Error(t('API key is required'))
    if (!model) throw new Error(t('Model is required'))

    const data = {
      model,
      messages: Array.from(messages),
      stream: false,
      ...remains,
    }

    new Notice(t('This is a non-streaming request, please wait...'), 5 * 1000)

    const response = await requestUrl({
      url: baseURL,
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    yield response.json.choices[0].message.content
  }
}

export const doubaoVendor: Vendor = {
  name: 'Doubao',
  defaultOptions: {
    apiKey: '',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    model: '',
    parameters: {},
  },
  sendRequestFunc,
  models: [],
  websiteToObtainKey: 'https://www.volcengine.com',
  capabilities: ['Text Generation'],
}
