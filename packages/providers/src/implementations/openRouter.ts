import { createLogger } from '@tars/logger'
import type { EmbedCache } from 'obsidian'
import OpenAI from 'openai'
import { t } from '../i18n'
import type { BaseOptions, Message, ResolveEmbedAsBinary, SendRequest, Vendor } from '../interfaces'
import { createMCPIntegrationHelper } from '../mcp-integration-helper'
import { arrayBufferToBase64, getMimeTypeFromFilename } from '../utils'

const logger = createLogger('providers:openrouter')

const sendRequestFunc = (settings: BaseOptions): SendRequest =>
	async function* (messages: Message[], controller: AbortController, resolveEmbedAsBinary: ResolveEmbedAsBinary) {
		const {
			parameters,
			documentPath,
			pluginSettings,
			documentWriteLock,
			beforeToolExecution,
			...optionsExcludingParams
		} = settings
		const options = { ...optionsExcludingParams, ...parameters }
		const { apiKey, baseURL, model, ...remains } = options
		if (!apiKey) throw new Error(t('API key is required'))
		if (!model) throw new Error(t('Model is required'))
		logger.info('starting openrouter chat', { baseURL, model, messageCount: messages.length })

		// Create MCP integration helper
		const mcpHelper = createMCPIntegrationHelper(settings)

		// Tool-aware path: Use coordinator for autonomous tool calling
		if (mcpHelper?.hasToolCalling()) {
			try {
				// OpenRouter is OpenAI-compatible, so use OpenAI SDK
				const client = new OpenAI({
					apiKey,
					baseURL,
					dangerouslyAllowBrowser: true
				})

				yield* mcpHelper.generateWithTools({
					documentPath: documentPath || 'unknown.md',
					providerName: 'OpenRouter',
					messages,
					controller,
					client,
					pluginSettings,
					documentWriteLock,
					beforeToolExecution
				})

				return
			} catch (error) {
				logger.warn('Tool calling failed, falling back to streaming pipeline', error)
				// Fall through to original path
			}
		}

		// Original streaming path with tool injection
		// biome-ignore lint/suspicious/noExplicitAny: MCP tools inject runtime
		let requestBody: any = { model, messages: [], ...remains }
		if (mcpHelper) {
			requestBody = await mcpHelper.injectTools(requestBody, 'OpenRouter')
		}

		const formattedMessages = await Promise.all(messages.map((msg) => formatMsg(msg, resolveEmbedAsBinary)))
		requestBody.messages = formattedMessages

		const response = await fetch(baseURL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({ ...requestBody, stream: true }),
			signal: controller.signal
		})

		const reader = response.body?.getReader()
		if (!reader) {
			throw new Error('Response body is not readable')
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
	}

type ContentItem =
	| {
			type: 'image_url'
			image_url: {
				url: string
			}
	  }
	| { type: 'text'; text: string }
	| { type: 'file'; file: { filename: string; file_data: string } }

const formatEmbed = async (embed: EmbedCache, resolveEmbedAsBinary: ResolveEmbedAsBinary) => {
	const mimeType = getMimeTypeFromFilename(embed.link)
	if (['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(mimeType)) {
		const embedBuffer = await resolveEmbedAsBinary(embed)
		const base64Data = arrayBufferToBase64(embedBuffer)
		return {
			type: 'image_url' as const,
			image_url: {
				url: `data:${mimeType};base64,${base64Data}`
			}
		}
	} else if ('application/pdf' === mimeType) {
		const embedBuffer = await resolveEmbedAsBinary(embed)
		const base64Data = arrayBufferToBase64(embedBuffer)
		return {
			type: 'file' as const,
			file: {
				filename: embed.link,
				file_data: `data:${mimeType};base64,${base64Data}`
			}
		}
	} else {
		throw new Error(t('Only PNG, JPEG, GIF, WebP, and PDF files are supported.'))
	}
}

const formatMsg = async (msg: Message, resolveEmbedAsBinary: ResolveEmbedAsBinary) => {
	const content: ContentItem[] = msg.embeds
		? await Promise.all(msg.embeds.map((embed) => formatEmbed(embed, resolveEmbedAsBinary)))
		: []

	if (msg.content.trim()) {
		content.push({
			type: 'text' as const,
			text: msg.content
		})
	}
	return {
		role: msg.role,
		content
	}
}

export const openRouterVendor: Vendor = {
	name: 'OpenRouter',
	defaultOptions: {
		apiKey: '',
		baseURL: 'https://openrouter.ai/api/v1/chat/completions',
		model: '',
		parameters: {}
	},
	sendRequestFunc,
	models: [],
	websiteToObtainKey: 'https://openrouter.ai',
	capabilities: ['Text Generation', 'Image Vision', 'PDF Vision', 'Tool Calling']
}
