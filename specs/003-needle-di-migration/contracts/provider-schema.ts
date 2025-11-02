/**
 * Provider Configuration Schema
 *
 * Defines the schema for AI provider configurations and validation rules.
 * Used by the DI system to ensure provider configurations are valid before binding.
 */

// Provider Configuration Schema
export interface ProviderConfigSchema {
  readonly name: string
  readonly displayName: string
  readonly description: string
  readonly website: string
  readonly required: ProviderConfigField[]
  readonly optional: ProviderConfigField[]
  readonly parameters: ParameterField[]
  readonly capabilities: string[]
  readonly models: ModelInfo[]
}

export interface ProviderConfigField {
  readonly key: string
  readonly type: 'string' | 'number' | 'boolean' | 'select' | 'url'
  readonly label: string
  readonly description: string
  readonly required: boolean
  readonly validation?: FieldValidation
  readonly options?: FieldOption[]
}

export interface FieldValidation {
  readonly pattern?: string
  readonly minLength?: number
  readonly maxLength?: number
  readonly min?: number
  readonly max?: number
  readonly format?: string // 'url', 'email', etc.
}

export interface FieldOption {
  readonly value: string
  readonly label: string
  readonly description?: string
}

export interface ParameterField {
  readonly key: string
  readonly type: 'string' | 'number' | 'boolean'
  readonly label: string
  readonly description: string
  readonly defaultValue?: any
  readonly validation?: FieldValidation
}

export interface ModelInfo {
  readonly id: string
  readonly name: string
  readonly capabilities: string[]
  readonly contextLimit?: number
  readonly pricing?: ModelPricing
}

export interface ModelPricing {
  readonly inputCost: number // per 1K tokens
  readonly outputCost: number // per 1K tokens
  readonly currency: string
}

// Provider Schemas
export const OPENAI_PROVIDER_SCHEMA: ProviderConfigSchema = {
  name: 'openai',
  displayName: 'OpenAI',
  description: 'GPT-4 and GPT-3.5 language models from OpenAI',
  website: 'https://platform.openai.com',
  required: [
    {
      key: 'apiKey',
      type: 'string',
      label: 'API Key',
      description: 'Your OpenAI API key from platform.openai.com',
      required: true,
      validation: {
        minLength: 1,
        pattern: '^sk-[A-Za-z0-9]{48}$'
      }
    }
  ],
  optional: [
    {
      key: 'baseURL',
      type: 'url',
      label: 'Base URL',
      description: 'Custom API endpoint (optional)',
      required: false,
      validation: {
        format: 'url'
      }
    }
  ],
  parameters: [
    {
      key: 'temperature',
      type: 'number',
      label: 'Temperature',
      description: 'Controls randomness in responses (0.0-2.0)',
      defaultValue: 0.7,
      validation: {
        min: 0,
        max: 2
      }
    },
    {
      key: 'maxTokens',
      type: 'number',
      label: 'Max Tokens',
      description: 'Maximum number of tokens to generate',
      defaultValue: 2048,
      validation: {
        min: 1,
        max: 4096
      }
    }
  ],
  capabilities: ['Text Generation', 'Image Vision'],
  models: [
    {
      id: 'gpt-4',
      name: 'GPT-4',
      capabilities: ['Text Generation', 'Image Vision'],
      contextLimit: 8192,
      pricing: {
        inputCost: 0.03,
        outputCost: 0.06,
        currency: 'USD'
      }
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      capabilities: ['Text Generation', 'Image Vision'],
      contextLimit: 128000,
      pricing: {
        inputCost: 0.01,
        outputCost: 0.03,
        currency: 'USD'
      }
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      capabilities: ['Text Generation'],
      contextLimit: 4096,
      pricing: {
        inputCost: 0.0015,
        outputCost: 0.002,
        currency: 'USD'
      }
    }
  ]
}

export const CLAUDE_PROVIDER_SCHEMA: ProviderConfigSchema = {
  name: 'claude',
  displayName: 'Claude',
  description: 'Claude AI models from Anthropic',
  website: 'https://console.anthropic.com',
  required: [
    {
      key: 'apiKey',
      type: 'string',
      label: 'API Key',
      description: 'Your Anthropic API key from console.anthropic.com',
      required: true,
      validation: {
        minLength: 1,
        pattern: '^sk-ant-[A-Za-z0-9]{95}$'
      }
    }
  ],
  optional: [
    {
      key: 'baseURL',
      type: 'url',
      label: 'Base URL',
      description: 'Custom API endpoint (optional)',
      required: false,
      validation: {
        format: 'url'
      }
    }
  ],
  parameters: [
    {
      key: 'temperature',
      type: 'number',
      label: 'Temperature',
      description: 'Controls randomness in responses (0.0-1.0)',
      defaultValue: 0.7,
      validation: {
        min: 0,
        max: 1
      }
    },
    {
      key: 'maxTokens',
      type: 'number',
      label: 'Max Tokens',
      description: 'Maximum number of tokens to generate',
      defaultValue: 4096,
      validation: {
        min: 1,
        max: 8192
      }
    }
  ],
  capabilities: ['Text Generation', 'Image Vision'],
  models: [
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      capabilities: ['Text Generation', 'Image Vision'],
      contextLimit: 200000,
      pricing: {
        inputCost: 0.015,
        outputCost: 0.075,
        currency: 'USD'
      }
    },
    {
      id: 'claude-3-sonnet-20240229',
      name: 'Claude 3 Sonnet',
      capabilities: ['Text Generation', 'Image Vision'],
      contextLimit: 200000,
      pricing: {
        inputCost: 0.003,
        outputCost: 0.015,
        currency: 'USD'
      }
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      capabilities: ['Text Generation'],
      contextLimit: 200000,
      pricing: {
        inputCost: 0.00025,
        outputCost: 0.00125,
        currency: 'USD'
      }
    }
  ]
}

export const DEEPSEEK_PROVIDER_SCHEMA: ProviderConfigSchema = {
  name: 'deepseek',
  displayName: 'DeepSeek',
  description: 'DeepSeek AI models for code and reasoning',
  website: 'https://platform.deepseek.com',
  required: [
    {
      key: 'apiKey',
      type: 'string',
      label: 'API Key',
      description: 'Your DeepSeek API key from platform.deepseek.com',
      required: true,
      validation: {
        minLength: 1
      }
    }
  ],
  optional: [],
  parameters: [
    {
      key: 'temperature',
      type: 'number',
      label: 'Temperature',
      description: 'Controls randomness in responses (0.0-2.0)',
      defaultValue: 0.7,
      validation: {
        min: 0,
        max: 2
      }
    }
  ],
  capabilities: ['Text Generation'],
  models: [
    {
      id: 'deepseek-coder',
      name: 'DeepSeek Coder',
      capabilities: ['Text Generation'],
      contextLimit: 16384,
      pricing: {
        inputCost: 0.00014,
        outputCost: 0.00028,
        currency: 'USD'
      }
    },
    {
      id: 'deepseek-chat',
      name: 'DeepSeek Chat',
      capabilities: ['Text Generation'],
      contextLimit: 32768,
      pricing: {
        inputCost: 0.0001,
        outputCost: 0.0002,
        currency: 'USD'
      }
    }
  ]
}

export const GEMINI_PROVIDER_SCHEMA: ProviderConfigSchema = {
  name: 'gemini',
  displayName: 'Gemini',
  description: 'Google Gemini AI models',
  website: 'https://aistudio.google.com',
  required: [
    {
      key: 'apiKey',
      type: 'string',
      label: 'API Key',
      description: 'Your Google AI Studio API key',
      required: true,
      validation: {
        minLength: 1
      }
    }
  ],
  optional: [],
  parameters: [
    {
      key: 'temperature',
      type: 'number',
      label: 'Temperature',
      description: 'Controls randomness in responses (0.0-2.0)',
      defaultValue: 0.7,
      validation: {
        min: 0,
        max: 2
      }
    },
    {
      key: 'topP',
      type: 'number',
      label: 'Top P',
      description: 'Nucleus sampling parameter (0.0-1.0)',
      defaultValue: 0.9,
      validation: {
        min: 0,
        max: 1
      }
    }
  ],
  capabilities: ['Text Generation', 'Image Vision'],
  models: [
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      capabilities: ['Text Generation', 'Image Vision'],
      contextLimit: 2097152,
      pricing: {
        inputCost: 0.0025,
        outputCost: 0.0075,
        currency: 'USD'
      }
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      capabilities: ['Text Generation', 'Image Vision'],
      contextLimit: 1048576,
      pricing: {
        inputCost: 0.000075,
        outputCost: 0.00015,
        currency: 'USD'
      }
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      capabilities: ['Text Generation'],
      contextLimit: 32768,
      pricing: {
        inputCost: 0.00025,
        outputCost: 0.0005,
        currency: 'USD'
      }
    }
  ]
}

// Schema Registry
export const PROVIDER_SCHEMAS: Record<string, ProviderConfigSchema> = {
  'openai': OPENAI_PROVIDER_SCHEMA,
  'claude': CLAUDE_PROVIDER_SCHEMA,
  'deepseek': DEEPSEEK_PROVIDER_SCHEMA,
  'gemini': GEMINI_PROVIDER_SCHEMA
}

// Validation Functions
export function validateProviderConfig(
  providerName: string,
  config: Record<string, any>
): ValidationResult {
  const schema = PROVIDER_SCHEMAS[providerName]
  if (!schema) {
    return {
      valid: false,
      errors: [`Unknown provider: ${providerName}`],
      warnings: [],
      metadata: {
        totalBindings: 0,
        circularDependencies: [],
        missingDependencies: [],
        performanceMetrics: {
          resolutionTime: 0,
          memoryUsage: 0,
          cacheHitRate: 0
        }
      }
    }
  }

  const errors: string[] = []
  const warnings: string[] = []

  // Validate required fields
  for (const field of schema.required) {
    const value = config[field.key]
    if (!value || (typeof value === 'string' && !value.trim())) {
      errors.push(`${field.label} is required`)
    } else if (field.validation) {
      validateFieldValue(field, value, errors, warnings)
    }
  }

  // Validate optional fields if provided
  for (const field of schema.optional) {
    const value = config[field.key]
    if (value !== undefined && value !== null && value !== '') {
      if (field.validation) {
        validateFieldValue(field, value, errors, warnings)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metadata: {
      totalBindings: 0,
      circularDependencies: [],
      missingDependencies: [],
      performanceMetrics: {
        resolutionTime: 0,
        memoryUsage: 0,
        cacheHitRate: 0
      }
    }
  }
}

function validateFieldValue(
  field: ProviderConfigField,
  value: any,
  errors: string[],
  warnings: string[]
): void {
  const validation = field.validation
  if (!validation) return

  // String validation
  if (field.type === 'string') {
    if (validation.minLength && typeof value === 'string' && value.length < validation.minLength) {
      errors.push(`${field.label} must be at least ${validation.minLength} characters`)
    }
    if (validation.maxLength && typeof value === 'string' && value.length > validation.maxLength) {
      errors.push(`${field.label} must be no more than ${validation.maxLength} characters`)
    }
    if (validation.pattern && typeof value === 'string' && !new RegExp(validation.pattern).test(value)) {
      errors.push(`${field.label} format is invalid`)
    }
  }

  // Number validation
  if (field.type === 'number') {
    if (typeof value !== 'number' || isNaN(value)) {
      errors.push(`${field.label} must be a valid number`)
      return
    }
    if (validation.min !== undefined && value < validation.min) {
      errors.push(`${field.label} must be at least ${validation.min}`)
    }
    if (validation.max !== undefined && value > validation.max) {
      errors.push(`${field.label} must be no more than ${validation.max}`)
    }
  }

  // URL validation
  if (field.type === 'url' && validation.format === 'url') {
    try {
      new URL(value)
    } catch {
      errors.push(`${field.label} must be a valid URL`)
    }
  }
}