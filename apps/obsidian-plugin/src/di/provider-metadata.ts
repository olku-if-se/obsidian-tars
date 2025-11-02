import type { Capability } from '../providers/index'
import type { ProviderMetadata } from './provider-factory'

/**
 * Default metadata for common AI providers
 * This enables automatic registration of providers without requiring manual metadata setup
 */

export const DEFAULT_PROVIDER_METADATA: Record<string, ProviderMetadata> = {
  openai: {
    id: 'openai-gpt',
    name: 'OpenAI',
    tag: 'openai',
    vendor: 'OpenAI',
    capabilities: ['Text Generation', 'Image Vision', 'Image Generation', 'Coding'],
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini'],
    websiteToObtainKey: 'https://platform.openai.com/api-keys',
    enabled: true,
    metadata: {
      supportsStreaming: true,
      supportsSystemMessages: true,
      supportsTools: true,
      maxTokens: 128000,
    },
  },

  claude: {
    id: 'anthropic-claude',
    name: 'Claude',
    tag: 'claude',
    vendor: 'Anthropic',
    capabilities: ['Text Generation', 'Image Vision', 'Reasoning', 'Coding'],
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    websiteToObtainKey: 'https://console.anthropic.com/',
    enabled: true,
    metadata: {
      supportsStreaming: true,
      supportsSystemMessages: true,
      supportsTools: true,
      maxTokens: 200000,
      supportsWebSearch: true,
    },
  },

  deepseek: {
    id: 'deepseek-ai',
    name: 'DeepSeek',
    tag: 'deepseek',
    vendor: 'DeepSeek',
    capabilities: ['Text Generation', 'Reasoning', 'Coding'],
    models: ['deepseek-chat', 'deepseek-coder'],
    websiteToObtainKey: 'https://platform.deepseek.com/',
    enabled: true,
    metadata: {
      supportsStreaming: true,
      supportsSystemMessages: true,
      maxTokens: 128000,
      supportsReasoning: true,
    },
  },

  gemini: {
    id: 'google-gemini',
    name: 'Gemini',
    tag: 'gemini',
    vendor: 'Google',
    capabilities: ['Text Generation', 'Image Vision', 'Multimodal', 'Coding'],
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
    websiteToObtainKey: 'https://aistudio.google.com/app/apikey',
    enabled: true,
    metadata: {
      supportsStreaming: true,
      supportsSystemMessages: true,
      maxTokens: 2097152,
      supportsMultimodal: true,
    },
  },

  perplexity: {
    id: 'perplexity-ai',
    name: 'Perplexity',
    tag: 'perplexity',
    vendor: 'Perplexity',
    capabilities: ['Text Generation', 'Web Search', 'Reasoning'],
    models: ['llama-3.1-sonar-small-128k-online', 'llama-3.1-sonar-large-128k-online', 'llama-3.1-sonar-huge-128k-online'],
    websiteToObtainKey: 'https://www.perplexity.ai/settings/api',
    enabled: true,
    metadata: {
      supportsStreaming: true,
      supportsSystemMessages: true,
      supportsWebSearch: true,
      maxTokens: 127000,
    },
  },

  groq: {
    id: 'groq-labs',
    name: 'Groq',
    tag: 'groq',
    vendor: 'Groq',
    capabilities: ['Text Generation', 'Coding'],
    models: ['llama-3.1-405b-reasoning', 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant'],
    websiteToObtainKey: 'https://console.groq.com/keys',
    enabled: true,
    metadata: {
      supportsStreaming: true,
      supportsSystemMessages: true,
      maxTokens: 131072,
      highSpeedInference: true,
    },
  },

  openrouter: {
    id: 'openrouter-ai',
    name: 'OpenRouter',
    tag: 'openrouter',
    vendor: 'OpenRouter',
    capabilities: ['Text Generation', 'Image Vision', 'Web Search', 'Coding'],
    models: [
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o',
      'google/gemini-pro-1.5',
      'meta-llama/llama-3.1-405b-instruct',
    ],
    websiteToObtainKey: 'https://openrouter.ai/keys',
    enabled: true,
    metadata: {
      supportsStreaming: true,
      supportsSystemMessages: true,
      supportsTools: true,
      maxTokens: 200000,
      modelRouting: true,
    },
  },

  siliconflow: {
    id: 'siliconflow-ai',
    name: 'SiliconFlow',
    tag: 'siliconflow',
    vendor: 'SiliconFlow',
    capabilities: ['Text Generation', 'Image Generation'],
    models: ['deepseek-ai/DeepSeek-V2.5', 'Qwen/Qwen2.5-7B-Instruct', 'meta-llama/Llama-3.1-8B-Instruct'],
    websiteToObtainKey: 'https://cloud.siliconflow.cn',
    enabled: true,
    metadata: {
      supportsStreaming: true,
      supportsSystemMessages: true,
      maxTokens: 32000,
      affordableInference: true,
    },
  },

  ollama: {
    id: 'ollama-local',
    name: 'Ollama',
    tag: 'ollama',
    vendor: 'Ollama',
    capabilities: ['Text Generation', 'Coding'],
    models: ['llama3.1', 'qwen2.5', 'codellama', 'mistral', 'phi3'],
    websiteToObtainKey: 'https://ollama.com',
    enabled: true,
    metadata: {
      supportsStreaming: true,
      supportsSystemMessages: true,
      maxTokens: 8192,
      localInference: true,
      requiresLocalInstallation: true,
    },
  },

  azure: {
    id: 'azure-openai',
    name: 'Azure OpenAI',
    tag: 'azure',
    vendor: 'Microsoft',
    capabilities: ['Text Generation', 'Image Vision', 'Coding'],
    models: ['gpt-4', 'gpt-35-turbo', 'text-embedding-ada-002'],
    websiteToObtainKey: 'https://portal.azure.com',
    enabled: true,
    metadata: {
      supportsStreaming: true,
      supportsSystemMessages: true,
      supportsTools: true,
      maxTokens: 128000,
      enterpriseReady: true,
      requiresAzureDeployment: true,
    },
  },
}

/**
 * Get metadata for a provider by tag
 */
export function getProviderMetadata(tag: string): ProviderMetadata | null {
  return DEFAULT_PROVIDER_METADATA[tag.toLowerCase()] || null
}

/**
 * Check if a provider is supported
 */
export function isProviderSupported(tag: string): boolean {
  return tag.toLowerCase() in DEFAULT_PROVIDER_METADATA
}

/**
 * Get all supported provider tags
 */
export function getSupportedProviderTags(): string[] {
  return Object.keys(DEFAULT_PROVIDER_METADATA)
}

/**
 * Get providers by capability
 */
export function getProvidersByCapability(capability: Capability): ProviderMetadata[] {
  return Object.values(DEFAULT_PROVIDER_METADATA).filter(provider =>
    provider.capabilities.includes(capability)
  )
}

/**
 * Get providers that support vision capabilities
 */
export function getVisionProviders(): ProviderMetadata[] {
  return getProvidersByCapability('Image Vision')
}

/**
 * Get providers that support image generation
 */
export function getImageGenerationProviders(): ProviderMetadata[] {
  return getProvidersByCapability('Image Generation')
}

/**
 * Get providers that support web search
 */
export function getWebSearchProviders(): ProviderMetadata[] {
  return getProvidersByCapability('Web Search')
}

/**
 * Get providers that support reasoning
 */
export function getReasoningProviders(): ProviderMetadata[] {
  return getProvidersByCapability('Reasoning')
}

/**
 * Validate provider metadata
 */
export function validateProviderMetadata(metadata: ProviderMetadata): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!metadata.id?.trim()) {
    errors.push('Provider ID is required')
  }

  if (!metadata.name?.trim()) {
    errors.push('Provider name is required')
  }

  if (!metadata.tag?.trim()) {
    errors.push('Provider tag is required')
  }

  if (!metadata.vendor?.trim()) {
    errors.push('Provider vendor is required')
  }

  if (!Array.isArray(metadata.capabilities) || metadata.capabilities.length === 0) {
    errors.push('Provider must have at least one capability')
  }

  if (!Array.isArray(metadata.models) || metadata.models.length === 0) {
    errors.push('Provider must have at least one model')
  }

  if (!metadata.websiteToObtainKey?.trim()) {
    errors.push('Provider website to obtain key is required')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Merge custom metadata with defaults
 */
export function mergeProviderMetadata(
  tag: string,
  customMetadata: Partial<ProviderMetadata>
): ProviderMetadata {
  const defaults = getProviderMetadata(tag)

  if (!defaults) {
    throw new Error(`No default metadata found for provider: ${tag}`)
  }

  return {
    ...defaults,
    ...customMetadata,
    id: customMetadata.id || defaults.id,
    metadata: {
      ...defaults.metadata,
      ...customMetadata.metadata,
    },
  }
}

/**
 * Provider capability groups for organization
 */
export const PROVIDER_CAPABILITIES = {
  'Text Generation': ['Text Generation'],
  'Vision & Multimodal': ['Image Vision', 'Multimodal'],
  'Image Generation': ['Image Generation'],
  'Web Search': ['Web Search'],
  'Advanced Reasoning': ['Reasoning'],
  'Coding': ['Coding'],
} as const

/**
 * Get providers grouped by capability categories
 */
export function getProvidersByCategory(): Record<string, ProviderMetadata[]> {
  const grouped: Record<string, ProviderMetadata[]> = {}

  for (const [category, capabilities] of Object.entries(PROVIDER_CAPABILITIES)) {
    grouped[category] = Object.values(DEFAULT_PROVIDER_METADATA).filter(provider =>
      capabilities.some(cap => provider.capabilities.includes(cap as Capability))
    )
  }

  return grouped
}