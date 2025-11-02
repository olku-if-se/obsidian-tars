import { Container } from '@needle-di/core'
import type { App } from 'obsidian'
import type { PluginSettings } from '../settings'
import { DIContainerWrapper } from './container'
import type { ContainerConfig, ServiceFactory, TestContainer, ValidationError } from './interfaces'
import { Tokens } from './tokens'
import { ProviderRegistry } from './provider-registry'
import { ProviderFactoryRegistry, createProviderFactoryRegistry } from './provider-factory-impl'
import { getProviderMetadata, DEFAULT_PROVIDER_METADATA } from './provider-metadata'
import { SettingsChangeNotifier } from './settings-change-notifier'
import { ConfigBindingService } from './config-binding-service'
import { PerformanceMonitor } from './performance-monitor'

// Import DI providers
import { OpenAIProvider } from '../providers/openai-di'
import { ClaudeProvider } from '../providers/claude-di'
import { DeepSeekProvider } from '../providers/deepseek-di'
import { GeminiProvider } from '../providers/gemini-di'
import { GrokProvider } from '../providers/grok-di'
import { OpenRouterProvider } from '../providers/openrouter-di'

// Error messages
const Errors = {
  setup_already_completed: 'DI container setup has already been completed',
  setup_failed: 'DI container setup failed',
  service_registration_failed: 'Service registration failed',
  token_binding_failed: 'Token binding failed',
  validation_failed: 'Container validation failed',
} as const

// Custom exceptions
export class ContainerSetupError extends Error {
  static failed = (cause?: unknown) => Object.assign(new ContainerSetupError(Errors.setup_failed), { cause })
}

export class ServiceRegistrationError extends Error {
  static failed = (service: string, cause?: unknown) =>
    Object.assign(new ServiceRegistrationError(`${Errors.service_registration_failed}: ${service}`), {
      service,
      cause,
    })
}

// Service registration configuration
interface ServiceRegistration {
  token: keyof typeof Tokens
  implementation: ServiceFactory<unknown> | (new (...args: unknown[]) => unknown)
  lifecycle?: 'singleton' | 'transient' | 'scoped'
  multi?: boolean
  factory?: (container: Container) => unknown
}

// Core service registry
const _CORE_SERVICES: ServiceRegistration[] = [
  // Placeholder for core services - will be populated as services are implemented
]

// Provider registration configuration (to be implemented when providers are converted to DI)
// interface ProviderRegistration {
//   name: string;
//   token: keyof typeof Tokens;
//   implementation: ServiceFactory<unknown> | (new (...args: unknown[]) => unknown);
// }

// DI container setup factory
export class ContainerSetup {
  private static _instance?: ContainerSetup
  private _wrapper?: DIContainerWrapper
  private _isSetup = false

  private constructor() {}

  static getInstance(): ContainerSetup {
    if (!ContainerSetup._instance) {
      ContainerSetup._instance = new ContainerSetup()
    }
    return ContainerSetup._instance
  }

  get wrapper(): DIContainerWrapper {
    if (!this._wrapper) {
      throw ContainerSetupError.failed()
    }
    return this._wrapper
  }

  get isSetup(): boolean {
    return this._isSetup
  }

  async setupContainer(app: App, settings: PluginSettings, config: ContainerConfig = {}): Promise<DIContainerWrapper> {
    if (this._isSetup) {
      throw new Error(Errors.setup_already_completed)
    }

    const setupStart = Date.now()

    try {
      // Create the wrapper
      this._wrapper = new DIContainerWrapper()

      // Initialize the container
      await this._wrapper.initialize(app, settings, config)

      // Register core tokens
      this.registerCoreTokens(app, settings)

      // Register core services
      await this.registerCoreServices()

      // Register providers (will be expanded as providers are implemented)
      await this.registerProviders(settings)

      // Validate the container
      const validation = this._wrapper.validateDependencies()
      if (!validation.isValid) {
        throw new Error(
          `${Errors.validation_failed}: ${validation.errors.map((e: ValidationError) => e.message).join(', ')}`
        )
      }

      this._isSetup = true

      const setupTime = Date.now() - setupStart
      console.log(`DI Container setup completed in ${setupTime}ms`)

      return this._wrapper
    } catch (error) {
      throw ContainerSetupError.failed(error)
    }
  }

  async disposeContainer(): Promise<void> {
    if (!this._wrapper || !this._isSetup) {
      return
    }

    try {
      await this._wrapper.dispose()
      this._wrapper = undefined
      this._isSetup = false
    } catch (error) {
      throw ContainerSetupError.failed(error)
    }
  }

  private registerCoreTokens(app: App, settings: PluginSettings): void {
    if (!this._wrapper) {
      throw ContainerSetupError.failed()
    }

    const container = (this._wrapper as unknown as { container?: Container }).container
    if (!container) {
      throw new Error(Errors.token_binding_failed)
    }

    try {
      // Bind core Obsidian and plugin tokens
      container.bind({ provide: Tokens.ObsidianApp, useValue: app })
      container.bind({ provide: Tokens.AppSettings, useValue: settings })

      // Note: Service bindings will be added as services are implemented
      // This is a placeholder structure for future service registration
    } catch (error) {
      throw new Error(`${Errors.token_binding_failed}: ${error}`)
    }
  }

  private async registerCoreServices(): Promise<void> {
    if (!this._wrapper) {
      throw ContainerSetupError.failed()
    }

    const container = (this._wrapper as unknown as { container?: Container }).container
    if (!container) {
      throw new Error('Container not available for service registration')
    }

    try {
      // Register core services
      container.bind(ProviderRegistry)
      container.bind({
      provide: ProviderFactoryRegistry,
      useValue: createProviderFactoryRegistry()
    })
      container.bind(SettingsChangeNotifier)
      container.bind(ConfigBindingService)
      container.bind(PerformanceMonitor)

      console.log('Core services registered')
    } catch (error) {
      throw ServiceRegistrationError.failed('core services', error)
    }
  }

  private async registerProviders(settings: PluginSettings): Promise<void> {
    if (!this._wrapper) {
      throw ContainerSetupError.failed()
    }

    const container = (this._wrapper as unknown as { container?: Container }).container
    if (!container) {
      throw new Error('Container not available for provider registration')
    }

    try {
      // Get the provider factory registry
      const factoryRegistry = container.get(ProviderFactoryRegistry)

      // Register providers with multi-token pattern
      this.registerProviderWithMulti(container, 'openai', OpenAIProvider, settings, factoryRegistry)
      this.registerProviderWithMulti(container, 'claude', ClaudeProvider, settings, factoryRegistry)
      this.registerProviderWithMulti(container, 'deepseek', DeepSeekProvider, settings, factoryRegistry)
      this.registerProviderWithMulti(container, 'gemini', GeminiProvider, settings, factoryRegistry)
      this.registerProviderWithMulti(container, 'grok', GrokProvider, settings, factoryRegistry)
      this.registerProviderWithMulti(container, 'openrouter', OpenRouterProvider, settings, factoryRegistry)

      console.log(`Registered ${factoryRegistry.size()} AI providers with dynamic registration`)

      // Bind configuration services together
      const configBindingService = container.get(ConfigBindingService)
      configBindingService.bind()

      console.log('Configuration binding service initialized')
    } catch (error) {
      throw ServiceRegistrationError.failed('AI providers', error)
    }
  }

  /**
   * Register a provider with multi-token pattern and factory registry
   */
  private registerProviderWithMulti(
    container: Container,
    tag: string,
    ProviderClass: new (settings: PluginSettings, tag?: string) => any,
    settings: PluginSettings,
    factoryRegistry: ProviderFactoryRegistry
  ): void {
    try {
      // Check if provider is enabled in settings
      const providerSettings = settings.providers.find(p => p.tag === tag)
      if (!providerSettings) {
        console.log(`Provider ${tag} not found in settings, skipping registration`)
        return
      }

      // Register with factory registry for dynamic creation
      factoryRegistry.registerFactory(tag, ProviderClass, {
        override: false,
        validate: true,
      })

      // Register with multi-token pattern for injection
      container.bind({
        provide: Tokens.AiProviders,
        useClass: ProviderClass,
        multi: true,
      })

      console.log(`Registered provider: ${tag}`)
    } catch (error) {
      console.warn(`Failed to register provider ${tag}:`, error)
    }
  }

  // Utility method to create a test container with overrides
  createTestContainer(overrides: Partial<Record<keyof typeof Tokens, unknown>> = {}): TestContainer {
    if (!this._wrapper) {
      throw ContainerSetupError.failed()
    }

    return this._wrapper.createChild(overrides)
  }

  // Utility method to check if a token is registered
  isTokenRegistered(token: keyof typeof Tokens): boolean {
    if (!this._wrapper) {
      return false
    }

    return this._wrapper.isRegistered(token)
  }

  // Utility method to get all registered tokens
  getRegisteredTokens(): string[] {
    if (!this._wrapper) {
      return []
    }

    return this._wrapper.getRegisteredTokens()
  }

  // Reset the setup (useful for testing)
  reset(): void {
    this._wrapper = undefined
    this._isSetup = false
  }
}

// Convenience function for container setup
export async function setupDIContainer(
  app: App,
  settings: PluginSettings,
  config: ContainerConfig = {}
): Promise<DIContainerWrapper> {
  const containerSetup = ContainerSetup.getInstance()
  return await containerSetup.setupContainer(app, settings, config)
}

// Convenience function for container disposal
export async function disposeDIContainer(): Promise<void> {
  const containerSetup = ContainerSetup.getInstance()
  await containerSetup.disposeContainer()
}

// Convenience function to get the container wrapper
export function getDIContainer(): DIContainerWrapper {
  const containerSetup = ContainerSetup.getInstance()
  return containerSetup.wrapper
}

// Default container configuration
export const DEFAULT_CONTAINER_CONFIG: ContainerConfig = {
  debug: process.env.NODE_ENV === 'development',
  validateOnStartup: true,
  enablePerformanceMonitoring: true,
} as const
