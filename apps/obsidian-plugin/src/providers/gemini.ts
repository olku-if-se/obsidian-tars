import { type Content, GoogleGenerativeAI } from '@google/generative-ai'
import { t } from '../lang/helper'
import type { BaseOptions, Message, ResolveEmbedAsBinary, Vendor } from '.'

const sendRequestFunc: Vendor['sendRequestFunc'] = options => {
  const settings = options as BaseOptions

  return async function* (
    messages: readonly Message[],
    controller: AbortController,
    _resolveEmbedAsBinary: ResolveEmbedAsBinary
  ) {
    const { parameters, ...optionsExcludingParams } = settings
    const mergedOptions = { ...optionsExcludingParams, ...parameters }
    const { apiKey, baseURL: baseUrl, model } = mergedOptions
    if (!apiKey) throw new Error(t('API key is required'))

    const messageList = Array.from(messages)
    if (messageList.length === 0) {
      return
    }

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
    const genModel = genAI.getGenerativeModel({ model, systemInstruction }, { baseUrl })
    const chat = genModel.startChat({ history })

    const result = await chat.sendMessageStream(lastMsg.content, {
      signal: controller.signal,
    })
    for await (const chunk of result.stream) {
      const chunkText = chunk.text()
      // console.debug('chunkText', chunkText)
      yield chunkText
    }
  }
}

export const geminiVendor: Vendor = {
  name: 'Gemini',
  defaultOptions: {
    apiKey: '',
    baseURL: 'https://generativelanguage.googleapis.com',
    model: 'gemini-1.5-flash',
    parameters: {},
  },
  sendRequestFunc,
  models: [],
  websiteToObtainKey: 'https://makersuite.google.com/app/apikey',
  capabilities: ['Text Generation'],
}
