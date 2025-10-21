import { Container } from '@needle-di/core'
import { tokens } from '@tars/contracts/tokens'
import {
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
} from '../implementations'

export function createProviderContainer(): Container {
  const container = new Container()

  // Mock services for demonstration
  container.bind({ provide: tokens.Logger, useValue: {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {}
  }})

  container.bind({ provide: tokens.Notification, useValue: { show: () => {} } })
  container.bind({ provide: tokens.Settings, useValue: { get: () => 'Tars' } })
  container.bind({ provide: tokens.Document, useValue: { normalizePath: (p: string) => p } })

  // Simple providers (not the complex DI ones for now)
  const simpleProviders = [
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

  // Register each provider class
  simpleProviders.forEach(ProviderClass => {
    container.bind(ProviderClass)
  })

  // Create a simple providers array manually
  container.bind({ provide: tokens.Providers, useFactory: () => {
    return simpleProviders.map(ProviderClass => {
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