import { Container } from '@needle-di/core'
import { tokens } from '@tars/contracts/tokens'
import { MockMCPIntegration, MockMCPToolInjector } from '@tars/contracts/mocks'
import {
  AzureDIProvider,
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
} from '../implementations'

/**
 * Create provider container with mock/stub implementations for MCP services
 * This enables providers to work even without full MCP infrastructure
 */
export function createProviderContainer(): Container {
  const container = new Container()

  // Mock core services for demonstration
  container.bind({ provide: tokens.Logger, useValue: {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {}
  }})

  container.bind({ provide: tokens.Notification, useValue: { show: () => {} } })
  container.bind({ provide: tokens.Settings, useValue: { get: () => 'Tars' } })
  container.bind({ provide: tokens.Document, useValue: { normalizePath: (p: string) => p } })

  // Mock MCP integration services (fast way to complete the task)
  // These provide stub implementations that allow providers to function
  container.bind({
    provide: tokens.MCPIntegrationToken,
    useValue: new MockMCPIntegration()
  })

  container.bind({
    provide: tokens.MCPToolInjectorToken,
    useValue: new MockMCPToolInjector()
  })

  // Template-based providers (not the complex DI ones for now)
  const templateProviders = [
    AzureDIProvider,
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

  // Register each provider class
  templateProviders.forEach(ProviderClass => {
    container.bind(ProviderClass)
  })

  // Create a providers array manually
  container.bind({ provide: tokens.Providers, useFactory: () => {
    return templateProviders.map(ProviderClass => {
      try {
        return container.get(ProviderClass)
      } catch (error) {
        console.warn(`Failed to instantiate ${ProviderClass.name}:`, error.message)
        return null
      }
    }).filter(Boolean)
  }})

  return container
}