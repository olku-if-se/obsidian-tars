// Export new streaming providers (migrated to comprehensive callbacks)
export { OpenAIStreamingProvider } from '../providers/openai'
export { GrokStreamingProvider } from '../providers/grok'
export { DeepseekStreamingProvider } from '../providers/deepseek'
export { OpenRouterStreamingProvider } from '../providers/openrouter'
export { SiliconFlowStreamingProvider } from '../providers/siliconflow'
export { OllamaStreamingProvider } from '../providers/ollama'
export { AzureStreamingProvider } from '../providers/azure'
export { ClaudeStreamingProvider } from '../providers/claude'
export { GeminiStreamingProvider } from '../providers/gemini'

// Export old DI providers (deprecated - to be removed)
export { DoubaoProvider } from './doubao-provider'
export { KimiProvider } from './kimi-provider'
export { QianFanProvider } from './qianfan-provider'
export { QwenProvider } from './qwen-provider'
export { ZhipuProvider } from './zhipu-provider'
export { GptImageProvider } from './gptimage-provider'

// Export utilities
export { withStreamLogging } from './decorator'

// Export types from legacy vendors (still needed for options)
export { type GptImageOptions } from './gptImage'

// All providers array
import {
	OpenAIStreamingProvider,
	GrokStreamingProvider,
	DeepseekStreamingProvider,
	OpenRouterStreamingProvider,
	SiliconFlowStreamingProvider,
	OllamaStreamingProvider,
	AzureStreamingProvider,
	ClaudeStreamingProvider,
	GeminiStreamingProvider,
	DoubaoProvider,
	KimiProvider,
	QianFanProvider,
	QwenProvider,
	ZhipuProvider,
	GptImageProvider
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
