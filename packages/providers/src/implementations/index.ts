// Export all provider implementations
export { azureVendor } from './azure'
export { type ClaudeOptions, claudeVendor } from './claude'
export { ClaudeDIProvider } from './claude-di'
export { withStreamLogging } from './decorator'
export { deepSeekVendor } from './deepSeek'
export { doubaoVendor } from './doubao'
export { geminiVendor } from './gemini'
export { type GptImageOptions, gptImageVendor } from './gptImage'
export { grokVendor } from './grok'
export { kimiVendor } from './kimi'
export { ollamaVendor } from './ollama'
export { OllamaDIProvider } from './ollama-di'
export { openAIVendor } from './openAI'
export { OpenAIDIProvider } from './openai-di'
export { openRouterVendor } from './openRouter'
export { qianFanVendor } from './qianFan'
export { qwenVendor } from './qwen'
export { siliconFlowVendor } from './siliconflow'
export { createSimpleVendor } from './simple'
export { zhipuVendor } from './zhipu'

// Import all vendors for the allVendors array
import { azureVendor } from './azure'
import { claudeVendor } from './claude'
import { deepSeekVendor } from './deepSeek'
import { doubaoVendor } from './doubao'
import { geminiVendor } from './gemini'
import { gptImageVendor } from './gptImage'
import { grokVendor } from './grok'
import { kimiVendor } from './kimi'
import { ollamaVendor } from './ollama'
import { openAIVendor } from './openAI'
import { openRouterVendor } from './openRouter'
import { qianFanVendor } from './qianFan'
import { qwenVendor } from './qwen'
import { siliconFlowVendor } from './siliconflow'
import { zhipuVendor } from './zhipu'

// Export all available vendors
export const allVendors = [
	azureVendor,
	claudeVendor,
	deepSeekVendor,
	doubaoVendor,
	geminiVendor,
	gptImageVendor,
	grokVendor,
	kimiVendor,
	ollamaVendor,
	openAIVendor,
	openRouterVendor,
	qianFanVendor,
	qwenVendor,
	siliconFlowVendor,
	zhipuVendor
]
