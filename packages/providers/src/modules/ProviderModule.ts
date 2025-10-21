import { ContainerModule, multiBind, bind } from '@needle-di/core'
import { tokens } from '@tars/contracts/tokens'
import { TarsProviderRegistry } from '../ProviderRegistry'
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
} from '../implementations'

export class ProviderModule extends ContainerModule {
  constructor() {
    super((bind, multiBind) => {
      // Registry (singleton)
      bind(tokens.Registry).to(TarsProviderRegistry).inSingletonScope()

      // All providers (multi-injection)
      multiBind(tokens.Providers)
        .to(ClaudeDIProvider)
        .to(OpenAIDIProvider)
        .to(OllamaDIProvider)
        .to(AzureProvider)
        .to(DeepSeekProvider)
        .to(DoubaoProvider)
        .to(GeminiProvider)
        .to(GrokProvider)
        .to(KimiProvider)
        .to(OpenRouterProvider)
        .to(QianFanProvider)
        .to(QwenProvider)
        .to(SiliconFlowProvider)
        .to(ZhipuProvider)
        .to(GptImageProvider)

      // Individual providers (singleton scope)
      bind(ClaudeDIProvider).toSelf().inSingletonScope()
      bind(OpenAIDIProvider).toSelf().inSingletonScope()
      bind(OllamaDIProvider).toSelf().inSingletonScope()
      bind(AzureProvider).toSelf().inSingletonScope()
      bind(DeepSeekProvider).toSelf().inSingletonScope()
      bind(DoubaoProvider).toSelf().inSingletonScope()
      bind(GeminiProvider).toSelf().inSingletonScope()
      bind(GrokProvider).toSelf().inSingletonScope()
      bind(KimiProvider).toSelf().inSingletonScope()
      bind(OpenRouterProvider).toSelf().inSingletonScope()
      bind(QianFanProvider).toSelf().inSingletonScope()
      bind(QwenProvider).toSelf().inSingletonScope()
      bind(SiliconFlowProvider).toSelf().inSingletonScope()
      bind(ZhipuProvider).toSelf().inSingletonScope()
      bind(GptImageProvider).toSelf().inSingletonScope()

      // Capability-specific multi-injections
      multiBind(tokens.TextGenerationProviders)
        .to(ClaudeDIProvider)
        .to(OpenAIDIProvider)
        .to(OllamaDIProvider)
        .to(AzureProvider)
        .to(DeepSeekProvider)
        .to(DoubaoProvider)
        .to(GeminiProvider)
        .to(GrokProvider)
        .to(KimiProvider)
        .to(OpenRouterProvider)
        .to(QianFanProvider)
        .to(QwenProvider)
        .to(SiliconFlowProvider)
        .to(ZhipuProvider)

      multiBind(tokens.ToolCallingProviders)
        .to(ClaudeDIProvider)
        .to(OpenAIDIProvider)
        .to(OllamaDIProvider)
        .to(AzureProvider)
        .to(DeepSeekProvider)
        .to(GeminiProvider)
        .to(GrokProvider)
        .to(KimiProvider)
        .to(OpenRouterProvider)
        .to(QwenProvider)
        .to(SiliconFlowProvider)

      multiBind(tokens.VisionProviders)
        .to(ClaudeDIProvider)
        .to(OpenAIDIProvider)
        .to(OllamaDIProvider)
        .to(GeminiProvider)
        .to(GrokProvider)
        .to(KimiProvider)
        .to(OpenRouterProvider)
        .to(QwenProvider)
        .to(SiliconFlowProvider)

      multiBind(tokens.ImageGenerationProviders)
        .to(GptImageProvider)
    })
  }
}