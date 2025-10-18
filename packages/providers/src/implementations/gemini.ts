import { type Content, GoogleGenerativeAI } from '@google/generative-ai'
import { createLogger } from '@tars/logger'
import { t } from '../i18n/i18n'
import type { BaseOptions, Message, ResolveEmbedAsBinary, SendRequest, Vendor } from '../interfaces'
import { ConcreteMCPToolInjector } from '../mcp-tool-injection-impl'

const logger = createLogger('providers:gemini')

const sendRequestFunc = (settings: BaseOptions): SendRequest =>
	async function* (messages: Message[], controller: AbortController, _resolveEmbedAsBinary: ResolveEmbedAsBinary) {
		const { parameters, mcpToolInjector, mcpManager, mcpExecutor, ...optionsExcludingParams } = settings
		const options = { ...optionsExcludingParams, ...parameters }
		const { apiKey, baseURL: baseUrl, model } = options
		if (!apiKey) throw new Error(t('API key is required'))

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
		let tools: any[] = []
		if (mcpToolInjector) {
			try {
				const result = await mcpToolInjector.injectTools({}, 'Gemini')
				tools = (result.tools as any[]) || []
				logger.debug('Injected MCP tools for Gemini', { toolCount: tools.length })
			} catch (error) {
				logger.warn('failed to inject MCP tools for gemini', error)
			}
		} else if (mcpManager && mcpExecutor) {
			// Legacy MCP integration - create injector on the fly
			try {
				const injector = new ConcreteMCPToolInjector(mcpManager, mcpExecutor)
				const result = await injector.injectTools({}, 'Gemini')
				tools = (result.tools as any[]) || []
				logger.debug('Injected MCP tools for Gemini using legacy integration', { toolCount: tools.length })
			} catch (error) {
				logger.warn('failed to inject MCP tools for gemini using legacy integration', error)
			}
		}

		const genAI = new GoogleGenerativeAI(apiKey)
		const genModel = genAI.getGenerativeModel({ model, systemInstruction }, { baseUrl })

		// Start chat with tools if available
		const chatConfig: any = { history }
		if (tools.length > 0) {
			chatConfig.tools = tools
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
