export type { AzureConfigPanelProps, AzureOptions } from './AzureConfigPanel/AzureConfigPanel'
export { AzureConfigPanel } from './AzureConfigPanel/AzureConfigPanel'
export type { ClaudeConfigPanelProps, ClaudeOptions } from './ClaudeConfigPanel/ClaudeConfigPanel'
export { ClaudeConfigPanel } from './ClaudeConfigPanel/ClaudeConfigPanel'
export type { DeepSeekConfigPanelProps, DeepSeekOptions } from './DeepSeekConfigPanel/DeepSeekConfigPanel'
export { DeepSeekConfigPanel } from './DeepSeekConfigPanel/DeepSeekConfigPanel'
export type { GPTImageConfigPanelProps, GptImageOptions } from './GPTImageConfigPanel/GPTImageConfigPanel'
export { GPTImageConfigPanel } from './GPTImageConfigPanel/GPTImageConfigPanel'
export type {
	OllamaConfigPanelProps,
	OllamaOptions
} from './OllamaConfigPanel/OllamaConfigPanel'
export { OllamaConfigPanel } from './OllamaConfigPanel/OllamaConfigPanel'
export type { OpenAIConfigPanelProps, OpenAIOptions } from './OpenAIConfigPanel/OpenAIConfigPanel'
export { OpenAIConfigPanel } from './OpenAIConfigPanel/OpenAIConfigPanel'

// Import all components for the mapping
import { AzureConfigPanel } from './AzureConfigPanel/AzureConfigPanel'
import { ClaudeConfigPanel } from './ClaudeConfigPanel/ClaudeConfigPanel'
import { DeepSeekConfigPanel } from './DeepSeekConfigPanel/DeepSeekConfigPanel'
import { GPTImageConfigPanel } from './GPTImageConfigPanel/GPTImageConfigPanel'
import { OllamaConfigPanel } from './OllamaConfigPanel/OllamaConfigPanel'
import { OpenAIConfigPanel } from './OpenAIConfigPanel/OpenAIConfigPanel'

// Vendor configuration mapping
export const VENDOR_CONFIG_PANELS = {
	Azure: AzureConfigPanel,
	Claude: ClaudeConfigPanel,
	DeepSeek: DeepSeekConfigPanel,
	'GPT Image': GPTImageConfigPanel,
	OpenAI: OpenAIConfigPanel,
	Ollama: OllamaConfigPanel
} as const

export type SupportedVendor = keyof typeof VENDOR_CONFIG_PANELS
