import { createLogger } from '@tars/logger'
import { AzureOpenAI } from 'openai'
import { t } from '../i18n'
import type { BaseOptions, Message, ResolveEmbedAsBinary, SendRequest, Vendor } from '../interfaces'
import { CALLOUT_BLOCK_END, CALLOUT_BLOCK_START } from '../utils'

interface AzureOptions extends BaseOptions {
	endpoint: string
	apiVersion: string
}

const logger = createLogger('providers:azure')

const sendRequestFunc = (settings: AzureOptions): SendRequest =>
	async function* (messages: Message[], controller: AbortController, _resolveEmbedAsBinary: ResolveEmbedAsBinary) {
		const {
			parameters,
			mcpToolInjector,
			mcpIntegration,
			mcpExecutor,
			documentPath,
			pluginSettings,
			documentWriteLock,
			beforeToolExecution,
			...optionsExcludingParams
		} = settings
		const options = { ...optionsExcludingParams, ...parameters } // 这样的设计，让parameters 可以覆盖掉前面的设置 optionsExcludingParams
		const { apiKey, model, endpoint, apiVersion, ...remains } = options
		if (!apiKey) throw new Error(t('API key is required'))
		logger.info('starting azure completion', { endpoint, model, messageCount: messages.length })

		// Tool-aware path: Use coordinator for autonomous tool calling
		if (mcpIntegration?.toolCallingCoordinator && mcpIntegration?.providerAdapter) {
			try {
				// biome-ignore lint/suspicious/noExplicitAny: MCP types are optional dependencies
				const coordinator = mcpIntegration.toolCallingCoordinator as any
				// biome-ignore lint/suspicious/noExplicitAny: MCP types are optional dependencies
				const adapter = mcpIntegration.providerAdapter as any
				// biome-ignore lint/suspicious/noExplicitAny: Plugin settings type is not imported
				const pluginOpts = pluginSettings as any
				// biome-ignore lint/suspicious/noExplicitAny: MCP types are optional dependencies
				const mcpExec = mcpExecutor as any

				const _client = new AzureOpenAI({
					endpoint,
					apiKey,
					apiVersion,
					deployment: model,
					dangerouslyAllowBrowser: true
				})

				// Initialize adapter if needed
				if (adapter.initialize) {
					await adapter.initialize({ preloadTools: false })
				}

				// Convert messages to coordinator format
				const formattedMessages = messages.map((msg) => ({
					role: msg.role,
					content: msg.content,
					embeds: msg.embeds
				}))

				yield* coordinator.generateWithTools(formattedMessages, adapter, mcpExec, {
					documentPath: documentPath || 'unknown.md',
					autoUseDocumentCache: true,
					parallelExecution: pluginOpts?.mcpParallelExecution ?? false,
					maxParallelTools: pluginOpts?.mcpMaxParallelTools ?? 3,
					documentWriteLock,
					onBeforeToolExecution: beforeToolExecution
				})

				return
			} catch (error) {
				logger.warn('tool-aware path unavailable, falling back to streaming pipeline', error)
				// Fall through to original path
			}
		}

		// Original streaming path (backward compatible)
		let requestParams: Record<string, unknown> = { model, ...remains }
		if (mcpToolInjector) {
			try {
				requestParams = await mcpToolInjector.injectTools(requestParams, 'Azure')
			} catch (error) {
				logger.warn('failed to inject MCP tools for azure', error)
			}
		}

		const client = new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment: model, dangerouslyAllowBrowser: true })

		// 添加系统提示，要求模型在每次输出前加入 <think>，解决 Azure DeepSeek-R1 不推理的问题
		messages = [
			{ role: 'system', content: `Initiate your response with "<think>\n嗯" at the beginning of every output.` },
			...messages
		]

		const stream = (await client.chat.completions.create(
			{
				...(requestParams as object),
				messages,
				stream: true
			} as Parameters<typeof client.chat.completions.create>[0],
			{
				signal: controller.signal
			}
		)) as AsyncIterable<{
			usage?: { prompt_tokens?: number; completion_tokens?: number }
			choices: Array<{ delta?: { content?: string } }>
		}>

		let isReasoning = false
		let thinkBegin = false // 过滤掉重复的 <think>
		let thinkEnd = false // 过滤掉重复的 </think>

		for await (const part of stream) {
			if (part.usage?.prompt_tokens && part.usage.completion_tokens)
				logger.debug('usage update', {
					promptTokens: part.usage.prompt_tokens,
					completionTokens: part.usage.completion_tokens
				})

			const text = part.choices[0]?.delta?.content
			if (!text) continue

			if (text === '<think>') {
				if (thinkBegin) continue
				isReasoning = true
				thinkBegin = true
				yield CALLOUT_BLOCK_START
				continue
			}

			if (text === '</think>') {
				if (thinkEnd) continue
				isReasoning = false
				thinkEnd = true
				yield CALLOUT_BLOCK_END
				continue
			}

			yield isReasoning
				? text.replace(/\n/g, '\n> ') // callout的每行前面都要加上 >
				: text
		}
	}

const models = ['o3-mini', 'deepseek-r1', 'phi-4', 'o1', 'o1-mini', 'gpt-4o', 'gpt-4o-mini']

export const azureVendor: Vendor = {
	name: 'Azure',
	defaultOptions: {
		apiKey: '',
		baseURL: '',
		model: models[0],
		endpoint: '',
		apiVersion: '',
		parameters: {}
	} as AzureOptions,
	sendRequestFunc: (options: BaseOptions) => sendRequestFunc(options as AzureOptions),
	models,
	websiteToObtainKey: 'https://portal.azure.com',
	capabilities: ['Text Generation', 'Reasoning', 'Tool Calling']
}
