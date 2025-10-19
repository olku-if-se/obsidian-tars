import type { BaseOptions, Message, ResolveEmbedAsBinary, SendRequest, Vendor } from '@tars/contracts'
import { createLogger } from '@tars/logger'
import OpenAI from 'openai'
import { t } from '../i18n'
import { createMCPIntegrationHelper } from '../mcp-integration-helper'
import { convertEmbedToImageUrl } from '../utils'

const logger = createLogger('providers:openai')

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
		logger.info('starting openai chat', { baseURL, model, messageCount: messages.length })

		// Create MCP integration helper
		const mcpHelper = createMCPIntegrationHelper(settings)

		// Tool-aware path: Use coordinator for autonomous tool calling
		if (mcpHelper?.hasToolCalling()) {
			try {
				const client = new OpenAI({ apiKey, baseURL })

				yield* mcpHelper.generateWithTools({
					documentPath: documentPath || 'unknown.md',
					providerName: 'OpenAI',
					messages,
					controller,
					client,
					statusBarManager: settings.statusBarManager,
					editor: settings.editor,
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

		logger.debug('initial request params', { ...requestParams, messages: `${messages.length} messages` })

		if (mcpHelper) {
			requestParams = await mcpHelper.injectTools(requestParams, 'OpenAI')
			logger.debug('mcp tools injected successfully')
		}

		// Process message embeddings
		const processedMessages = await Promise.all(
			messages.map(async (msg) => ({
				role: msg.role,
				content: msg.content,
				embeds: msg.embeds
					? await Promise.all(
							msg.embeds.map(async (embed) => {
								const imageData = await convertEmbedToImageUrl(embed, resolveEmbedAsBinary)
								return {
									type: 'image_url',
									image_url: {
										...imageData.image_url,
										detail: 'auto'
									}
								}
							})
						)
					: undefined
			}))
		)

		logger.debug('initiating streaming chat request')
		const client = new OpenAI({ apiKey, baseURL })

		try {
			const response = await client.chat.completions.create({
				...requestParams,
				messages: processedMessages,
				stream: true
			} as any)

			let responseChunkCount = 0
			try {
				for await (const chunk of response as any) {
					responseChunkCount++
					if (controller.signal.aborted) {
						logger.info('request aborted', { chunkCount: responseChunkCount })
						break
					}

					const content = chunk.choices[0]?.delta?.content || ''
					logger.debug('received chunk', {
						chunk: responseChunkCount,
						contentLength: content.length,
						preview: content.substring(0, 100)
					})

					if (content) {
						yield content
					}
				}
			} catch (streamError) {
				logger.error('error during openai stream', streamError)
				throw streamError
			}

			logger.info('stream completed', { chunkCount: responseChunkCount })
		} catch (connectionError) {
			logger.error('failed to connect to openai', connectionError)
			throw new Error(
				`OpenAI connection failed: ${connectionError instanceof Error ? connectionError.message : String(connectionError)}`
			)
		}
	}

export const openAIVendor: Vendor = {
	name: 'OpenAI',
	defaultOptions: {
		apiKey: '',
		baseURL: 'https://api.openai.com/v1',
		model: 'gpt-4',
		parameters: {}
	},
	sendRequestFunc,
	models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini'],
	websiteToObtainKey: 'https://platform.openai.com/api-keys',
	capabilities: ['Text Generation', 'Image Vision', 'Image Generation', 'Tool Calling', 'Reasoning']
}
