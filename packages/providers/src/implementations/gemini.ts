import { type Content, GoogleGenerativeAI, type Tool } from '@google/generative-ai'
import { createLogger } from '@tars/logger'
import { t } from '../i18n/i18n'
import type { BaseOptions, Message, ResolveEmbedAsBinary, SendRequest, Vendor } from '../interfaces'
import { createMCPIntegrationHelper } from '../mcp-integration-helper'

const logger = createLogger('providers:gemini')

const sendRequestFunc = (settings: BaseOptions): SendRequest =>
	async function* (messages: Message[], controller: AbortController, _resolveEmbedAsBinary: ResolveEmbedAsBinary) {
		const {
			parameters,
			documentPath,
			pluginSettings,
			documentWriteLock,
			beforeToolExecution,
			...optionsExcludingParams
		} = settings
		const options = { ...optionsExcludingParams, ...parameters }
		const { apiKey, baseURL: baseUrl, model } = options
		if (!apiKey) throw new Error(t('API key is required'))

		// Create MCP integration helper
		const mcpHelper = createMCPIntegrationHelper(settings)

		// Tool-aware path: Use coordinator for autonomous tool calling
		if (mcpHelper?.hasToolCalling()) {
			try {
				const client = new GoogleGenerativeAI(apiKey)

				yield* mcpHelper.generateWithTools({
					documentPath: documentPath || 'unknown.md',
					providerName: 'Gemini',
					messages,
					controller,
					client,
					pluginSettings,
					documentWriteLock,
					beforeToolExecution
				})

				return
			} catch (error) {
				logger.warn('Tool calling failed, falling back to standard Gemini workflow', error)
				// Fall through to original path
			}
		}

		// Original streaming path with tool injection
		const [system_msg, messagesWithoutSys, lastMsg] =
			messages[0].role === 'system'
				? [messages[0], messages.slice(1, -1), messages[messages.length - 1]]
				: [null, messages.slice(0, -1), messages[messages.length - 1]]
		const systemInstruction = system_msg?.content
		const history: Content[] = messagesWithoutSys.map((m) => ({
			role: m.role === 'assistant' ? 'model' : m.role,
			parts: [{ text: m.content }]
		}))

		// Inject MCP tools for Gemini if available
		let tools: Tool[] = []
		if (mcpHelper) {
			const result = await mcpHelper.injectTools(options, 'Gemini')
			tools = (result.tools as Tool[]) || []
			logger.debug('Injected MCP tools for Gemini', { toolCount: tools.length })
		}

		const genAI = new GoogleGenerativeAI(apiKey)
		const genModel = genAI.getGenerativeModel({ model, systemInstruction }, { baseUrl })

		// Start chat with tools if available
		const chatConfig = { history }
		if (tools.length > 0) {
			(chatConfig as any).tools = tools
			logger.debug('Starting Gemini chat with tools', { toolCount: tools.length })
		}
		const chat = genModel.startChat(chatConfig)

		const result = await chat.sendMessageStream(lastMsg.content, { signal: controller.signal })
		for await (const chunk of result.stream) {
			const chunkText = chunk.text()
			// console.debug('chunkText', chunkText)
			yield chunkText
		}
	}

export const geminiVendor: Vendor = {
	name: 'Gemini',
	defaultOptions: {
		apiKey: '',
		baseURL: 'https://generativelanguage.googleapis.com',
		model: 'gemini-1.5-flash',
		parameters: {}
	},
	sendRequestFunc,
	models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'],
	websiteToObtainKey: 'https://makersuite.google.com/app/apikey',
	capabilities: ['Text Generation', 'Tool Calling']
}
