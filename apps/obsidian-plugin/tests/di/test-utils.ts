import { Container } from '@needle-di/core'
import type { App } from 'obsidian'
import { expect, vi } from 'vitest'
import { DIContainerWrapper } from '../../src/di/container'
import type { ContainerConfig, TestContainer, ValidationError, ValidationWarning } from '../../src/di/interfaces'
import { Tokens } from '../../src/di/tokens'
import type { PluginSettings } from '../../src/settings'

// Mock implementations
export const createMockApp = (): App =>
  ({
    vault: {
      getMarkdownFile: vi.fn(),
      read: vi.fn(),
      modify: vi.fn(),
      // biome-ignore lint/suspicious/noExplicitAny: Obsidian API types are complex for test mocks
    } as any,
    workspace: {
      getActiveFile: vi.fn(),
      getActiveViewOfType: vi.fn(),
      onDidChangeActiveLeaf: vi.fn(),
      // biome-ignore lint/suspicious/noExplicitAny: Obsidian API types are complex for test mocks
    } as any,
    setting: {
      openTabById: vi.fn(),
      // biome-ignore lint/suspicious/noExplicitAny: Obsidian API types are complex for test mocks
    } as any,
    metadataCache: {
      onChanged: vi.fn(),
      getFileCache: vi.fn(),
      // biome-ignore lint/suspicious/noExplicitAny: Obsidian API types are complex for test mocks
    } as any,
    fileManager: {
      generateMarkdownLink: vi.fn(),
    },
    // biome-ignore lint/suspicious/noExplicitAny: Obsidian API types are complex for test mocks
  }) as any

export const createMockSettings = (): PluginSettings => ({
  editorStatus: { isTextInserting: false },
  providers: [],
  systemTags: ['System'],
  newChatTags: ['NewChat'],
  userTags: ['User'],
  roleEmojis: {
    assistant: '✨',
    system: '🔧',
    newChat: '🚀',
    user: '💬',
  },
  promptTemplates: [],
  enableInternalLink: true,
  enableInternalLinkForAssistantMsg: false,
  answerDelayInMilliseconds: 2000,
  confirmRegenerate: true,
  enableTagSuggest: true,
  tagSuggestMaxLineLength: 20,
  enableExportToJSONL: false,
  enableReplaceTag: false,
  enableDefaultSystemMsg: false,
  defaultSystemMsg: '',
  enableStreamLog: false,
})

// Test factory for creating containers with mock dependencies
// biome-ignore lint/complexity/noStaticOnlyClass: Test factory pattern is acceptable for test utilities
export class TestContainerFactory {
  static createContainer(
    mockApp?: Partial<App>,
    mockSettings?: Partial<PluginSettings>,
    _config: ContainerConfig = {}
  ): DIContainerWrapper {
    const app = { ...createMockApp(), ...mockApp }
    const settings = { ...createMockSettings(), ...mockSettings }

    const container = new DIContainerWrapper()

    // Initialize synchronously for testing
    // biome-ignore lint/suspicious/noExplicitAny: Test container setup requires access to private container properties
    ;(container as any)._isInitialized = true
    // biome-ignore lint/suspicious/noExplicitAny: Test container setup requires access to private container properties
    ;(container as any).container = new Container()

    // Bind mock dependencies
    // biome-ignore lint/suspicious/noExplicitAny: Test container binding requires access to private container methods
    ;(container as any).container.bind({ provide: Tokens.ObsidianApp, useValue: app })
    // biome-ignore lint/suspicious/noExplicitAny: Test container binding requires access to private container methods
    ;(container as any).container.bind({ provide: Tokens.AppSettings, useValue: settings })

    return container
  }

  static createTestContainer(
    mockApp?: Partial<App>,
    mockSettings?: Partial<PluginSettings>,
    overrides: Record<string, unknown> = {}
  ): TestContainer {
    const baseContainer = TestContainerFactory.createContainer(mockApp, mockSettings)
    const testContainer = baseContainer.createChild(overrides)

    // Mock test container methods if needed
    return {
      ...testContainer,
      state: 'READY',
      config: { debug: false, validateOnStartup: false, enablePerformanceMonitoring: false },
      metrics: { containerSetupTime: 0, providerResolutionTime: new Map(), totalResolutionCount: 0, cacheHitRate: 0 },
      // biome-ignore lint/suspicious/noExplicitAny: Test container parent property requires type casting for test mock
      parent: baseContainer as any,
      overrides: new Map(Object.entries(overrides)),
      override: vi.fn(),
      reset: vi.fn(),
      initialize: vi.fn().mockResolvedValue(undefined),
      dispose: vi.fn().mockResolvedValue(undefined),
      validate: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] }),
    } as TestContainer
  }

  static createContainerWithMocks(
    mocks: { app?: Partial<App>; settings?: Partial<PluginSettings>; services?: Record<string, unknown> } = {}
  ): DIContainerWrapper {
    const container = TestContainerFactory.createContainer(mocks.app, mocks.settings)

    // Register service mocks
    if (mocks.services) {
      for (const [serviceName, mockService] of Object.entries(mocks.services)) {
        const token = (Tokens as Record<string, unknown>)[serviceName] as keyof typeof Tokens
        if (token && mockService) {
          // biome-ignore lint/suspicious/noExplicitAny: Test container service binding requires access to private container methods
          ;(container as any).container.bind({ provide: token, useValue: mockService })
        }
      }
    }

    return container
  }
}

// Test data builders
export class SettingsBuilder {
  private settings: PluginSettings

  constructor() {
    this.settings = createMockSettings()
  }

  withOpenAIProvider(config: { apiKey: string; baseURL?: string; model?: string }): SettingsBuilder {
    this.settings.providers.openai = {
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.openai.com/v1',
      model: config.model || 'gpt-3.5-turbo',
      parameters: {},
    }
    return this
  }

  withClaudeProvider(config: { apiKey: string; baseURL?: string; model?: string }): SettingsBuilder {
    this.settings.providers.claude = {
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.anthropic.com',
      model: config.model || 'claude-3-sonnet-20241022',
      parameters: {},
    }
    return this
  }

  withTags(tags: { user?: string; assistant?: string; system?: string }): SettingsBuilder {
    this.settings.tags = { ...this.settings.tags, ...tags }
    return this
  }

  withStatusBar(enabled: boolean): SettingsBuilder {
    this.settings.enableStatusBar = enabled
    return this
  }

  withAutoComplete(enabled: boolean): SettingsBuilder {
    this.settings.enableAutoComplete = enabled
    return this
  }

  build(): PluginSettings {
    return { ...this.settings }
  }
}

export class AppBuilder {
  private app: App

  constructor() {
    this.app = createMockApp()
  }

  withVault(vault: Partial<App['vault']>): AppBuilder {
    // biome-ignore lint/suspicious/noExplicitAny: App builder requires type casting for Obsidian API compatibility
    this.app.vault = { ...this.app.vault, ...vault } as any
    return this
  }

  withWorkspace(workspace: Partial<App['workspace']>): AppBuilder {
    // biome-ignore lint/suspicious/noExplicitAny: App builder requires type casting for Obsidian API compatibility
    this.app.workspace = { ...this.app.workspace, ...workspace } as any
    return this
  }

  withSetting(setting: Partial<App['setting']>): AppBuilder {
    // biome-ignore lint/suspicious/noExplicitAny: App builder requires type casting for Obsidian API compatibility
    this.app.setting = { ...this.app.setting, ...setting } as any
    return this
  }

  build(): App {
    return { ...this.app }
  }
}

// Test helpers
// biome-ignore lint/complexity/noStaticOnlyClass: Test utility class with static methods is acceptable for test helpers
export class TestUtils {
  static async withTestContainer<T>(
    testFn: (container: DIContainerWrapper) => Promise<T> | T,
    overrides: Record<string, unknown> = {}
  ): Promise<T> {
    const container = TestContainerFactory.createContainerWithMocks({ services: overrides })

    try {
      return await testFn(container)
    } finally {
      await container.dispose()
    }
  }

  static async withMockSettings<T>(
    settings: Partial<PluginSettings>,
    testFn: (settings: PluginSettings) => Promise<T> | T
  ): Promise<T> {
    const mockSettings = { ...createMockSettings(), ...settings }
    return await testFn(mockSettings)
  }

  static async withMockApp<T>(app: Partial<App>, testFn: (app: App) => Promise<T> | T): Promise<T> {
    const mockApp = { ...createMockApp(), ...app }
    return await testFn(mockApp)
  }

  static createProviderMock(name: string, capabilities: string[] = []) {
    return {
      name,
      defaultOptions: {
        apiKey: `mock-${name}-key`,
        baseURL: `https://api.${name.toLowerCase()}.com/v1`,
        model: `${name.toLowerCase()}-model`,
        parameters: {},
      },
      sendRequestFunc: vi.fn(),
      models: [`${name.toLowerCase()}-model`],
      websiteToObtainKey: `https://api.${name.toLowerCase()}.com/api-keys`,
      capabilities: capabilities.length > 0 ? capabilities : ['Text Generation'],
    }
  }

  static createServiceMock<T>(serviceName: string, methods: Record<string, unknown> = {}): T {
    const baseMock = {
      [serviceName]: vi.fn(),
    }

    return {
      ...baseMock,
      ...methods,
      // biome-ignore lint/suspicious/noExplicitAny: Test mock builder requires type casting for method spreading
    } as any
  }

  static expectContainerToBeValid(container: DIContainerWrapper): void {
    expect(container.isInitialized).toBe(true)

    const validation = container.validateDependencies()
    expect(validation.isValid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  }

  static expectTokenToBeRegistered(container: DIContainerWrapper, token: unknown): void {
    expect(container.isRegistered(token)).toBe(true)
  }

  static expectResolutionToSucceed<T>(container: DIContainerWrapper, token: unknown, expectedType?: new () => T): void {
    expect(() => {
      const resolved = container.resolve(token)
      if (expectedType) {
        expect(resolved).toBeInstanceOf(expectedType)
      }
    }).not.toThrow()
  }

  static expectResolutionToFail(container: DIContainerWrapper, token: unknown, expectedError?: string): void {
    expect(() => container.resolve(token)).toThrow(expectedError)
  }

  static createPerformanceMetricsMock() {
    return {
      containerSetupTime: 10,
      providerResolutionTime: new Map([['test-provider', 5]]),
      totalResolutionCount: 1,
      cacheHitRate: 0.85,
    }
  }

  static createValidationResultMock(
    isValid: boolean = true,
    errors: ValidationError[] = [],
    warnings: ValidationWarning[] = []
  ) {
    return {
      isValid,
      errors,
      warnings,
    }
  }
}

// Custom matchers for Vitest
declare global {
  namespace Vi {
    interface Assertion<R = unknown> {
      toBeValidContainer(): R
      toHaveTokenRegistered(token: unknown): R
      toResolveSuccessfully(token: unknown): R
    }
  }
}

expect.extend({
  toBeValidContainer(received: DIContainerWrapper) {
    const isValid = received.isInitialized
    const validation = received.validateDependencies()

    if (isValid && validation.isValid) {
      return {
        message: () => `expected ${received} not to be a valid container`,
        pass: true,
      }
    } else {
      const errors = validation.errors.map(e => e.message).join(', ')
      return {
        message: () => `expected ${received} to be a valid container, but got errors: ${errors}`,
        pass: false,
      }
    }
  },

  toHaveTokenRegistered(received: DIContainerWrapper, token: unknown) {
    const isRegistered = received.isRegistered(token)

    if (isRegistered) {
      return {
        message: () => `expected ${token} not to be registered in container`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${token} to be registered in container`,
        pass: false,
      }
    }
  },

  toResolveSuccessfully(received: DIContainerWrapper, token: unknown) {
    try {
      received.resolve(token)
      return {
        message: () => `expected ${token} resolution to fail`,
        pass: true,
      }
    } catch (error) {
      return {
        message: () => `expected ${token} to resolve successfully, but got error: ${error}`,
        pass: false,
      }
    }
  },
})

// Note: Custom matcher types are declared above before expect.extend()
