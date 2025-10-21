import { inject, injectable } from '@needle-di/core'
import { AzureOpenAI } from 'openai'
import { z } from 'zod'
import { createLogger } from '@tars/logger'
import { DIBaseProvider, type Message, type SendRequest, type ResolveEmbedAsBinary, type BaseOptions, type DIBaseOptions } from '@tars/contracts'
import { tokens } from '@tars/contracts/tokens'
import { CALLOUT_BLOCK_END, CALLOUT_BLOCK_START } from '../utils'
import type { LlmCapability } from '@tars/contracts/providers'

// Azure-specific options extending DIBaseOptions
export interface AzureOptions extends DIBaseOptions {
	endpoint: string
	apiVersion: string
}

// Zod schemas for type safety and validation
const AzureOptionsSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  endpoint: z.string().url('Invalid Azure endpoint URL'),
  apiVersion: z.string().min(1, 'API version is required'),
  model: z.string().min(1, 'Model is required'),
  baseURL: z.string().optional(),
  parameters: z.record(z.unknown()).optional(),
  documentPath: z.string().optional(),
  pluginSettings: z.record(z.unknown()).optional(),
  documentWriteLock: z.any().optional(),
  beforeToolExecution: z.function().returns(z.promise(z.void())).optional(),
  mcpIntegration: z.any().optional(),
  mcpToolInjector: z.any().optional()
})

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.union([z.string(), z.array(z.any())]),
  embeds: z.array(z.any()).optional()
})

type ValidatedAzureOptions = z.infer<typeof AzureOptionsSchema>
type ValidatedMessage = z.infer<typeof MessageSchema>

const logger = createLogger('providers:azure')

/**
 * Azure OpenAI Provider with DI support
 * Supports GPT-4 series models, O1 reasoning models, and DeepSeek-R1
 * Provides full MCP tool integration and reasoning capabilities
 *
 * Implementation Note:
 * - Uses Zod for runtime type validation and safety
 * - Injects MCP services via DI tokens for clean separation
 * - Handles DeepSeek-R1 reasoning tokens with callout formatting
 * - Supports both advanced MCP tool calling and simple tool injection
 * - Single-path logic with proper error handling and fallbacks
 */
@injectable()
export class AzureDIProvider extends DIBaseProvider {
  readonly name = 'azure'
  readonly displayName = 'Azure OpenAI'
  readonly websiteToObtainKey = 'https://portal.azure.com'

  // Source: https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models
  // Updated to include latest models including reasoning series
  readonly models = [
    // Reasoning models (highest tier) - special handling for DeepSeek-R1 tokens
    'o3-mini',
    'deepseek-r1',
    'phi-4',
    'o1',
    'o1-mini',
    // Latest GPT models
    'gpt-4o',
    'gpt-4o-mini',
    // Legacy models (for compatibility)
    'gpt-4',
    'gpt-4-32k',
    'gpt-35-turbo',
    'gpt-35-turbo-16k'
  ]

  readonly capabilities: LlmCapability[] = [
    'Text Generation',
    'Tool Calling',
    'Reasoning' // O1, O3, DeepSeek-R1 have reasoning capabilities
  ]

  constructor(
    loggingService = inject(tokens.Logger),
    notificationService = inject(tokens.Notification),
    settingsService = inject(tokens.Settings),
    documentService = inject(tokens.Document),
    // MCP dependencies for tool integration - injected via DI tokens
    private readonly mcpIntegration = inject(tokens.MCPIntegrationToken, { optional: true }) || null,
    private readonly mcpToolInjector = inject(tokens.MCPToolInjectorToken, { optional: true }) || null
  ) {
    super(
      loggingService,
      notificationService,
      settingsService,
      documentService
    )
  }

  // Default configuration for Azure OpenAI
  get defaultOptions(): AzureOptions {
    return {
      apiKey: '',
      model: this.models[0], // Default to latest model (o3-mini)
      baseURL: 'https://your-resource.openai.azure.com/', // Required by BaseOptions
      endpoint: 'https://your-resource.openai.azure.com/',
      apiVersion: '2024-08-01-preview', // Latest API version
      parameters: {},
      // DI services automatically available
      loggingService: this.loggingService,
      notificationService: this.notificationService,
      settingsService: this.settingsService,
      documentService: this.documentService
    }
  }

  /**
   * Validates provider options using Zod schema
   * Ensures type safety and provides helpful error messages
   *
   * @param options - Raw options to validate
   * @returns Type guard indicating if options are valid
   */
  validateOptions(options: unknown): options is AzureOptions {
    try {
      AzureOptionsSchema.parse(options)
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorDetails = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        this.loggingService?.error(`Invalid Azure provider options: ${errorDetails}`)
      }
      return false
    }
  }

  /**
   * Creates send request function with streaming support
   * Implements both advanced MCP tool calling and simple tool injection
   * Handles reasoning models with special token processing
   *
   * Single-path implementation with proper DI service usage
   *
   * @param options - Provider options (validated)
   * @returns SendRequest function for streaming responses
   */
  createSendRequest(options: BaseOptions): SendRequest {
    // Validate options for type safety - quick fail if invalid
    if (!this.validateOptions(options)) {
      throw new Error('Invalid Azure provider options - check API key, endpoint, and model configuration')
    }

    return async function* (messages: Message[], controller: AbortController, _resolveEmbedAsBinary: ResolveEmbedAsBinary) {
      const {
        parameters,
        documentPath,
        pluginSettings,
        documentWriteLock,
        beforeToolExecution,
        ...optionsExcludingParams
      } = options as ValidatedAzureOptions

      // Merge options with parameters (parameters take precedence)
      const mergedOptions = { ...optionsExcludingParams, ...parameters }
      const { apiKey, model, endpoint, apiVersion, ...remains } = mergedOptions

      logger.info('Starting Azure completion', {
        endpoint,
        model,
        messageCount: messages.length,
        hasMCP: !!(options.mcpIntegration || options.mcpToolInjector)
      })

      // Validate required fields - quick fail approach
      if (!apiKey) {
        throw new Error('API key is required for Azure OpenAI')
      }

      if (!endpoint) {
        throw new Error('Azure endpoint is required')
      }

      if (!apiVersion) {
        throw new Error('Azure API version is required')
      }

      // Validate messages using Zod schema
      const validatedMessages = messages.map(msg => {
        try {
          return MessageSchema.parse(msg)
        } catch (error) {
          logger.warn(`Invalid message format, skipping: ${JSON.stringify(msg)}`, error)
          return null
        }
      }).filter((msg): msg is ValidatedMessage => msg !== null)

      // Create Azure OpenAI client
      const client = new AzureOpenAI({
        endpoint,
        apiKey,
        apiVersion,
        deployment: model,
        dangerouslyAllowBrowser: true
      })

      // Check for MCP integration capabilities
      const hasToolCalling = !!(options.mcpIntegration?.toolCallingCoordinator && options.mcpIntegration?.providerAdapter)
      const hasToolInjection = !!options.mcpToolInjector

      // Path 1: Advanced MCP tool calling with autonomous execution
      if (hasToolCalling) {
        try {
          logger.info('Using advanced MCP tool calling path', { provider: 'Azure', model })

          const { toolCallingCoordinator, providerAdapter, mcpExecutor } = options.mcpIntegration!

          if (!toolCallingCoordinator || !providerAdapter || !mcpExecutor) {
            throw new Error('Missing required MCP components for tool calling')
          }

          // Initialize provider adapter if needed
          if (providerAdapter.initialize) {
            await providerAdapter.initialize({ preloadTools: false })
          }

          // Convert messages to coordinator format
          const formattedMessages = validatedMessages.map((msg) => ({
            role: msg.role,
            content: Array.isArray(msg.content) ? JSON.stringify(msg.content) : msg.content,
            embeds: msg.embeds
          }))

          // Extract plugin settings for parallel execution
          const pluginOpts = pluginSettings || {}

          yield* toolCallingCoordinator.generateWithTools(formattedMessages, providerAdapter, mcpExecutor, {
            documentPath: documentPath || 'unknown.md',
            parallelExecution: (pluginOpts as any)?.mcpParallelExecution ?? false,
            maxParallelTools: (pluginOpts as any)?.mcpMaxParallelTools ?? 3,
            documentWriteLock,
            onBeforeToolExecution: beforeToolExecution
          })

          return
        } catch (error) {
          logger.warn('Advanced MCP tool calling failed, falling back to tool injection', error)
          // Continue to tool injection path
        }
      }

      // Path 2: Simple MCP tool injection
      let requestParams: Record<string, unknown> = { model, ...remains }

      if (hasToolInjection) {
        try {
          logger.info('Using MCP tool injection path', { provider: 'Azure' })
          requestParams = await options.mcpToolInjector!.injectTools(requestParams, 'Azure')
        } catch (error) {
          logger.warn('MCP tool injection failed, proceeding without tools', error)
          // Continue without tools
        }
      }

      // Special handling for DeepSeek-R1 reasoning model
      const isReasoningModel = model.includes('deepseek-r1') || model.includes('o1') || model.includes('o3-mini')
      const finalMessages = isReasoningModel && model.includes('deepseek-r1')
        ? [
            { role: 'system', content: 'Initiate your response with "🧀\n嗯" at the beginning of every output.' },
            ...validatedMessages
          ]
        : validatedMessages

      // Execute streaming completion
      const stream = await client.chat.completions.create({
        ...(requestParams as object),
        messages: finalMessages,
        stream: true
      } as Parameters<typeof client.chat.completions.create>[0], {
        signal: controller.signal
      })

      // Process streaming response with reasoning model special handling
      let isReasoning = false
      let thinkBegin = false // Filter duplicate 🧀
      let thinkEnd = false // Filter duplicate 🧀

      for await (const part of stream as AsyncIterable<{
        usage?: { prompt_tokens?: number; completion_tokens?: number }
        choices: Array<{ delta?: { content?: string } }>
      }>) {
        if (part.usage?.prompt_tokens && part.usage.completion_tokens) {
          logger.debug('Usage update', {
            promptTokens: part.usage.prompt_tokens,
            completionTokens: part.usage.completion_tokens
          })
        }

        const text = part.choices[0]?.delta?.content
        if (!text) continue

        // Handle DeepSeek-R1 reasoning tokens with callout formatting
        if (model.includes('deepseek-r1')) {
          if (text === '🧀') {
            if (thinkBegin) continue
            isReasoning = true
            thinkBegin = true
            yield CALLOUT_BLOCK_START
            continue
          }

          if (text === '🧀') {
            if (thinkEnd) continue
            isReasoning = false
            thinkEnd = true
            yield CALLOUT_BLOCK_END
            continue
          }

          // Format reasoning content as callout block
          yield isReasoning
            ? text.replace(/\n/g, '\n> ') // Add > prefix for callout formatting
            : text
        } else {
          // Regular model output
          yield text
        }
      }
    }
  }
}