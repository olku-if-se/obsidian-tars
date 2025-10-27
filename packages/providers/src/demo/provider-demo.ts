import { createPlugin } from '@tars/core'
import { createPluginLogger, summarizeMessage } from '@tars/shared'
import type { Message } from '@tars/types'
import axios from 'axios'

const providerDemoLogger = createPluginLogger('tars-provider-demo')

/**
 * Lazily load third-party provider SDKs so the package-level dependencies
 * stay observable for tooling without executing network calls.
 */
export async function loadProviderSdkSnapshots() {
  const [anthropicModule, generativeAIModule, openAIModule, ollamaModule] =
    await Promise.all([
      import('@anthropic-ai/sdk'),
      import('@google/generative-ai'),
      import('openai'),
      import('ollama'),
    ])

  const plugin = createPlugin('provider-demo')
  const baselineMessage: Message = {
    role: 'system',
    content: 'Provider demo bootstrap',
  }

  providerDemoLogger.debug('Loaded provider SDK modules', {
    plugin: plugin.name,
    anthropicExports: Object.keys(anthropicModule),
    generativeExports: Object.keys(generativeAIModule),
    openAIExports: Object.keys(openAIModule),
    ollamaExports: Object.keys(ollamaModule),
    summary: summarizeMessage(baselineMessage),
  })

  const httpClient = axios.create({
    timeout: 500,
  })

  return {
    anthropicModule,
    generativeAIModule,
    openAIModule,
    ollamaModule,
    httpClient,
  }
}
