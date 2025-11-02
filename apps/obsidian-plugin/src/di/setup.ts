import type { Container } from '@needle-di/core'
import type { App } from 'obsidian'
import type { PluginSettings } from '../settings'
import { DIContainerWrapper } from './container'
import type { ContainerConfig, ServiceFactory, TestContainer, ValidationError } from './interfaces'
import { Tokens } from './tokens'

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

    try {
      // Register core services
      // This will be expanded as services are implemented in later tasks

      // Placeholder for future service registrations:
      // container.bind(Tokens.SETTINGS_SERVICE).to(SettingsService);
      // container.bind(Tokens.NOTIFICATIONS_SERVICE).to(NotificationsService);
      // container.bind(Tokens.PROVIDER_REGISTRY).to(ProviderRegistry);
      // etc.

      console.log('Core services registered (placeholder - services will be added in later tasks)')
    } catch (error) {
      throw ServiceRegistrationError.failed('core services', error)
    }
  }

  private async registerProviders(_settings: PluginSettings): Promise<void> {
    if (!this._wrapper) {
      throw ContainerSetupError.failed()
    }

    try {
      // Register AI providers
      // This will be expanded as providers are converted to DI in later tasks

      // Placeholder for future provider registrations:
      // container.bind({ provide: Tokens.AI_PROVIDERS, useClass: OpenAIProvider, multi: true });
      // container.bind({ provide: Tokens.AI_PROVIDERS, useClass: ClaudeProvider, multi: true });
      // etc.

      console.log('AI providers registered (placeholder - providers will be added in later tasks)')
    } catch (error) {
      throw ServiceRegistrationError.failed('AI providers', error)
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
