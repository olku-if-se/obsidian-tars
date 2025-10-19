// Simplified Claude vendor for testing DI integration
import { createLogger } from '@tars/logger'
import { t } from '../i18n'
import type { BaseOptions, Message, ResolveEmbedAsBinary, SendRequest, Vendor } from '../interfaces'
import { createMCPIntegrationHelper } from '../mcp-integration-helper'

const logger = createLogger('providers:claude')

export interface ClaudeOptions extends BaseOptions {
	max_tokens: number
	enableWebSearch: boolean
	enableThinking: boolean
	budget_tokens: number
}

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
		logger.info('starting claude chat', { baseURL, model, messageCount: messages.length })

		// Create MCP integration helper
		const mcpHelper = createMCPIntegrationHelper(settings)

		// Tool-aware path: Use coordinator for autonomous tool calling
		if (mcpHelper?.hasToolCalling()) {
			try {
				yield* mcpHelper.generateWithTools({
					documentPath: documentPath || 'unknown.md',
					providerName: 'Claude',
					messages,
					controller,
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

		logger.debug('Mock Claude streaming response')
		yield 'Mock Claude response for testing'
	}

export const claudeVendor: Vendor = {
	name: 'Claude',
	defaultOptions: {
		apiKey: '',
		baseURL: 'https://api.anthropic.com',
		model: 'claude-3-sonnet-20240229',
		parameters: {},
		max_tokens: 4096,
		enableWebSearch: false,
		enableThinking: false,
		budget_tokens: 20000
	} as ClaudeOptions,
	sendRequestFunc,
	models: [
		'claude-3-sonnet-20240229',
		'claude-3-haiku-20240307',
		'claude-3-opus-20240229'
	],
	websiteToObtainKey: 'https://console.anthropic.com/',
	capabilities: [
		'Text Generation',
		'Image Vision',
		'PDF Vision',
		'Tool Calling',
		'Reasoning'
	]
}