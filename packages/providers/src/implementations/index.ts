// Export new streaming providers (migrated to comprehensive callbacks)

export { AzureStreamingProvider } from '../providers/azure'
export { ClaudeStreamingProvider } from '../providers/claude'
export { DeepseekStreamingProvider } from '../providers/deepseek'
export { GeminiStreamingProvider } from '../providers/gemini'
export { GrokStreamingProvider } from '../providers/grok'
export { OllamaStreamingProvider } from '../providers/ollama'
export { OpenAIStreamingProvider } from '../providers/openai'
export { OpenRouterStreamingProvider } from '../providers/openrouter'
export { SiliconFlowStreamingProvider } from '../providers/siliconflow'
// Export utilities
export { withStreamLogging } from './decorator'
// Export old DI providers (deprecated - to be removed)
export { DoubaoProvider } from './doubao-provider'
// Export types from legacy vendors (still needed for options)
export type { GptImageOptions } from './gptImage'
export { GptImageProvider } from './gptimage-provider'
export { KimiProvider } from './kimi-provider'
export { QianFanProvider } from './qianfan-provider'
export { QwenProvider } from './qwen-provider'
export { ZhipuProvider } from './zhipu-provider'

// All providers array
import {
	AzureStreamingProvider,
	ClaudeStreamingProvider,
	DeepseekStreamingProvider,
	DoubaoProvider,
	GeminiStreamingProvider,
	GptImageProvider,
	GrokStreamingProvider,
	KimiProvider,
	OllamaStreamingProvider,
	OpenAIStreamingProvider,
	OpenRouterStreamingProvider,
	QianFanProvider,
	QwenProvider,
	SiliconFlowStreamingProvider,
	ZhipuProvider
} from './index'

export const allProviders = [
	// New streaming providers with comprehensive callbacks
	OpenAIStreamingProvider,
	GrokStreamingProvider,
	DeepseekStreamingProvider,
	OpenRouterStreamingProvider,
	SiliconFlowStreamingProvider,
	OllamaStreamingProvider,
	AzureStreamingProvider,
	ClaudeStreamingProvider,
	GeminiStreamingProvider,

	// Old DI providers (deprecated, will be removed)
	DoubaoProvider,
	KimiProvider,
	QianFanProvider,
	QwenProvider,
	ZhipuProvider,
	GptImageProvider
]
