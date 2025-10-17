export { AzureConfigPanel } from './AzureConfigPanel/AzureConfigPanel'
export type { AzureConfigPanelProps, AzureOptions } from './AzureConfigPanel/AzureConfigPanel'

export { ClaudeConfigPanel } from './ClaudeConfigPanel/ClaudeConfigPanel'
export type { ClaudeConfigPanelProps, ClaudeOptions } from './ClaudeConfigPanel/ClaudeConfigPanel'

export { DeepSeekConfigPanel } from './DeepSeekConfigPanel/DeepSeekConfigPanel'
export type { DeepSeekConfigPanelProps, DeepSeekOptions } from './DeepSeekConfigPanel/DeepSeekConfigPanel'

export { GPTImageConfigPanel } from './GPTImageConfigPanel/GPTImageConfigPanel'
export type { GPTImageConfigPanelProps, GptImageOptions } from './GPTImageConfigPanel/GPTImageConfigPanel'

export { OpenAIConfigPanel } from './OpenAIConfigPanel/OpenAIConfigPanel'
export type { OpenAIConfigPanelProps, OpenAIOptions } from './OpenAIConfigPanel/OpenAIConfigPanel'

export { OllamaConfigPanel } from './OllamaConfigPanel/OllamaConfigPanel'
export type { OllamaConfigPanelProps, OllamaOptions } from './OllamaConfigPanel/OllamaConfigPanel'

// Vendor configuration mapping
export const VENDOR_CONFIG_PANELS = {
	'Azure': AzureConfigPanel,
	'Claude': ClaudeConfigPanel,
	'DeepSeek': DeepSeekConfigPanel,
	'GPT Image': GPTImageConfigPanel,
	'OpenAI': OpenAIConfigPanel,
	'Ollama': OllamaConfigPanel,
} as const

export type SupportedVendor = keyof typeof VENDOR_CONFIG_PANELS