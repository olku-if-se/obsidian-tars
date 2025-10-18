import { createLogger } from '@tars/logger'
import OpenAI from 'openai'
import { t } from '../i18n'
import type { BaseOptions, Message, ResolveEmbedAsBinary, SendRequest, Vendor } from '../interfaces'
import { convertEmbedToImageUrl } from '../utils'
import { createMCPIntegrationHelper } from '../mcp-integration-helper'

const logger = createLogger('providers:openai')

const sendRequestFunc = (settings: BaseOptions): SendRequest =>
	async function* (messages: Message[], controller: AbortController, resolveEmbedAsBinary: ResolveEmbedAsBinary) {
		const {
			parameters,
			mcpToolInjector,
			mcpIntegration,
			documentPath,
			pluginSettings,
			documentWriteLock,
			beforeToolExecution,
			...optionsExcludingParams
		} = settings
		const options = { ...optionsExcludingParams, ...parameters }
		const { apiKey, baseURL, model, ...remains } = options
		if (!apiKey) throw new Error(t('API key is required'))
		logger.info('starting openai chat', { baseURL, model, messageCount: messages.length })

		// Create MCP integration helper
		const mcpHelper = createMCPIntegrationHelper(settings)

		// Tool-aware path: Use coordinator for autonomous tool calling
		if (mcpHelper?.hasToolCalling()) {
			try {
				const client = new OpenAI({
					apiKey,
					baseURL,
					dangerouslyAllowBrowser: true
				})

				yield* mcpHelper.generateWithTools({
					documentPath: documentPath || 'unknown.md',
					providerName: 'OpenAI',
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
		let requestParams: Record<string, unknown> = { model, ...remains }
		if (mcpHelper) {
			requestParams = await mcpHelper.injectTools(requestParams, 'OpenAI')
		}

		const formattedMessages = await Promise.all(messages.map((msg) => formatMsg(msg, resolveEmbedAsBinary)))
		const client = new OpenAI({
			apiKey,
			baseURL,
			dangerouslyAllowBrowser: true
		})

		const stream = await client.chat.completions.create(
			{
				...(requestParams as object),
				messages: formattedMessages as OpenAI.ChatCompletionMessageParam[],
				stream: true
			} as OpenAI.ChatCompletionCreateParamsStreaming,
			{ signal: controller.signal }
		)

		for await (const part of stream) {
			const text = part.choices[0]?.delta?.content
			if (!text) continue
			yield text
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

const formatMsg = async (msg: Message, resolveEmbedAsBinary: ResolveEmbedAsBinary) => {
	const content: ContentItem[] = msg.embeds
		? await Promise.all(msg.embeds.map((embed) => convertEmbedToImageUrl(embed, resolveEmbedAsBinary)))
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

/**
 * Format message for coordinator (simpler format - just role and content)
 */
const formatMsgForCoordinator = async (msg: Message, _resolveEmbedAsBinary: ResolveEmbedAsBinary) => {
	// For coordinator, we keep it simple - embeds will be handled by the adapter
	return {
		role: msg.role,
		content: msg.content,
		embeds: msg.embeds
	}
}

export const openAIVendor: Vendor = {
	name: 'OpenAI',
	defaultOptions: {
		apiKey: '',
		baseURL: 'https://api.openai.com/v1',
		model: 'gpt-4.1',
		parameters: {}
	},
	sendRequestFunc,
	models: [],
	websiteToObtainKey: 'https://platform.openai.com/api-keys',
	capabilities: ['Text Generation', 'Image Vision', 'Tool Calling']
}
