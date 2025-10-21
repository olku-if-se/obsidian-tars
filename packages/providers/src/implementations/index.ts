// Export all providers
export { ClaudeDIProvider } from './claude-di'
export { OpenAIDIProvider } from './openai-di'
export { OllamaDIProvider } from './ollama-di'
export { AzureProvider } from './azure-provider'
export { DeepSeekProvider } from './deepseek-provider'
export { DoubaoProvider } from './doubao-provider'
export { GeminiProvider } from './gemini-provider'
export { GrokProvider } from './grok-provider'
export { KimiProvider } from './kimi-provider'
export { OpenRouterProvider } from './openrouter-provider'
export { QianFanProvider } from './qianfan-provider'
export { QwenProvider } from './qwen-provider'
export { SiliconFlowProvider } from './siliconflow-provider'
export { ZhipuProvider } from './zhipu-provider'
export { GptImageProvider } from './gptimage-provider'

// Export utilities
export { withStreamLogging } from './decorator'

// Export types from legacy vendors (still needed for options)
export { type ClaudeOptions } from './claude'
export { type GptImageOptions } from './gptImage'

// All providers array
import {
	ClaudeDIProvider,
	OpenAIDIProvider,
	OllamaDIProvider,
	AzureProvider,
	DeepSeekProvider,
	DoubaoProvider,
	GeminiProvider,
	GrokProvider,
	KimiProvider,
	OpenRouterProvider,
	QianFanProvider,
	QwenProvider,
	SiliconFlowProvider,
	ZhipuProvider,
	GptImageProvider
} from './index'

export const allProviders = [
	ClaudeDIProvider,
	OpenAIDIProvider,
	OllamaDIProvider,
	AzureProvider,
	DeepSeekProvider,
	DoubaoProvider,
	GeminiProvider,
	GrokProvider,
	KimiProvider,
	OpenRouterProvider,
	QianFanProvider,
	QwenProvider,
	SiliconFlowProvider,
	ZhipuProvider,
	GptImageProvider
]
