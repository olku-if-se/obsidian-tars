import { Container, type InjectionToken } from '@needle-di/core'
import type { App } from 'obsidian'
import type { PluginSettings } from '../settings'
import type {
  CircularDependencyError,
  ContainerConfig,
  ContainerState,
  DebugMode,
  DIError,
  ErrorHandler,
  PerformanceMonitor,
  ResolutionError,
  TestContainer,
  ValidationError,
  ValidationResult,
  ValidationWarning,
} from './interfaces'
import { Tokens } from './tokens'

// Error messages
const Errors = {
  container_already_initialized: 'DI container is already initialized',
  container_not_initialized: 'DI container is not initialized',
  dependency_resolution_failed: 'Dependency resolution failed',
  circular_dependency_detected: 'Circular dependency detected',
  token_not_registered: 'Token is not registered in container',
  child_container_creation_failed: 'Failed to create child container',
  performance_monitoring_disabled: 'Performance monitoring is disabled',
  debug_mode_disabled: 'Debug mode is disabled',
} as const

// Custom exceptions
export class ContainerError extends Error {
  static notInitialized = () =>
    Object.assign(new ContainerError(Errors.container_not_initialized), { code: 'CONTAINER_NOT_INITIALIZED' })

  static alreadyInitialized = () =>
    Object.assign(new ContainerError(Errors.container_already_initialized), { code: 'CONTAINER_ALREADY_INITIALIZED' })
}

export class DependencyResolutionError extends Error {
  static failed = (token: string, cause?: unknown) =>
    Object.assign(new DependencyResolutionError(`${Errors.dependency_resolution_failed}: ${token}`), {
      code: 'DEPENDENCY_RESOLUTION_FAILED',
      token,
      missingDependencies: [token], // Add missing property to match ResolutionError interface
      cause,
    })
}

export class CircularDependencyErrorImpl extends Error {
  static detected = (cycle: string[], cause?: unknown) =>
    Object.assign(new CircularDependencyErrorImpl(`${Errors.circular_dependency_detected}: ${cycle.join(' -> ')}`), {
      code: 'CIRCULAR_DEPENDENCY',
      cycle,
      cause,
    })
}

// Performance monitor implementation
class PerformanceMonitorImpl implements PerformanceMonitor {
  private timers = new Map<string, number>()
  private resolutions = new Map<string, number[]>()
  private totalResolutions = 0

  startTimer(name: string): () => number {
    const startTime = Date.now()
    this.timers.set(name, startTime)

    return () => {
      const endTime = Date.now()
      const duration = endTime - startTime
      this.timers.delete(name)
      return duration
    }
  }

  recordResolution(token: string, time: number): void {
    if (!this.resolutions.has(token)) {
      this.resolutions.set(token, [])
    }
    this.resolutions.get(token)?.push(time)
    this.totalResolutions++
  }

  getMetrics() {
    const resolutionTimes = new Map<string, number>()

    for (const [token, times] of this.resolutions) {
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length
      resolutionTimes.set(token, avgTime)
    }

    return {
      containerSetupTime: 0, // Would be set during initialization
      providerResolutionTime: resolutionTimes,
      totalResolutionCount: this.totalResolutions,
      cacheHitRate: this.calculateCacheHitRate(),
    }
  }

  reset(): void {
    this.timers.clear()
    this.resolutions.clear()
    this.totalResolutions = 0
  }

  private calculateCacheHitRate(): number {
    // This would be calculated based on actual cache implementation
    return 0.85 // Placeholder
  }
}

// Debug mode implementation
class DebugModeImpl implements DebugMode {
  private _isEnabled = false

  get isEnabled(): boolean {
    return this._isEnabled
  }

  enable(): void {
    this._isEnabled = true
    console.log('DI Container debug mode enabled')
  }

  disable(): void {
    this._isEnabled = false
    console.log('DI Container debug mode disabled')
  }

  logContainerState(): void {
    if (!this._isEnabled) return
    console.log('DI Container State:', {
      registeredTokens: this.getRegisteredTokens(),
      timestamp: new Date().toISOString(),
    })
  }

  logDependencyGraph(): void {
    if (!this._isEnabled) return
    console.log('DI Dependency Graph:', {
      // Would include actual dependency graph data
      timestamp: new Date().toISOString(),
    })
  }

  logResolutionTime(token: string): void {
    if (!this._isEnabled) return
    console.log(`DI Resolution time for ${token}:`, Date.now())
  }

  logError(error: DIError): void {
    if (!this._isEnabled) return
    console.error('DI Error:', {
      code: error.code,
      message: error.message,
      token: error.token,
      dependency: error.dependency,
      timestamp: new Date().toISOString(),
    })
  }

  private getRegisteredTokens(): string[] {
    // Would return actual registered tokens
    return Object.values(Tokens).map(token => token.toString())
  }
}

// Error handler implementation
class ErrorHandlerImpl implements ErrorHandler {
  private subscribers = new Set<(error: DIError) => void>()

  handleResolutionError(error: ResolutionError): void {
    const diError: DIError = {
      ...error,
      code: 'RESOLUTION_ERROR',
    }
    this.notify(diError)
  }

  handleCircularDependency(error: CircularDependencyError): void {
    const diError: DIError = {
      ...error,
      code: 'CIRCULAR_DEPENDENCY',
    }
    this.notify(diError)
  }

  handleValidationError(error: ValidationError): void {
    const diError: DIError = {
      name: 'ValidationError',
      message: error.message,
      code: 'VALIDATION_ERROR',
      cause: error,
    }
    this.notify(diError)
  }

  subscribe(callback: (error: DIError) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  private notify(error: DIError): void {
    this.subscribers.forEach(callback => {
      try {
        callback(error)
      } catch (callbackError) {
        console.error('Error in error handler callback:', callbackError)
      }
    })
  }
}

// Test container implementation
class TestContainerImpl implements TestContainer {
  private _state: ContainerState = 'UNINITIALIZED'
  private _config: ContainerConfig = { debug: false, validateOnStartup: false, enablePerformanceMonitoring: false }
  private _overrides = new Map<keyof typeof Tokens, unknown>()
  private _metrics = {
    containerSetupTime: 0,
    providerResolutionTime: new Map(),
    totalResolutionCount: 0,
    cacheHitRate: 0,
  }

  constructor(
    public readonly parent: Container,
    config: ContainerConfig = {}
  ) {
    this._config = { ...this._config, ...config }
  }

  get state(): ContainerState {
    return this._state
  }
  get config(): ContainerConfig {
    return this._config
  }
  get metrics(): {
    containerSetupTime: number
    providerResolutionTime: Map<string, number>
    totalResolutionCount: number
    cacheHitRate: number
  } {
    return this._metrics
  }
  get overrides(): Map<keyof typeof Tokens, unknown> {
    return this._overrides
  }

  override<T>(token: keyof typeof Tokens, value: T): void {
    this._overrides.set(token, value)
  }

  reset(): void {
    this._overrides.clear()
  }

  async initialize(config: ContainerConfig): Promise<void> {
    this._config = { ...this._config, ...config }
    this._state = 'CONFIGURED'
    // Initialization logic here
    this._state = 'READY'
  }

  async dispose(): Promise<void> {
    this._state = 'DISPOSED'
  }

  validate(): ValidationResult {
    return { isValid: true, errors: [], warnings: [] }
  }
}

// Main DI container wrapper
export class DIContainerWrapper {
  private container?: Container
  private performanceMonitor = new PerformanceMonitorImpl()
  private debugMode = new DebugModeImpl()
  private errorHandler = new ErrorHandlerImpl()
  private _isInitialized = false

  get isInitialized(): boolean {
    return this._isInitialized
  }

  get performance(): PerformanceMonitor {
    return this.performanceMonitor
  }

  get debug(): DebugMode {
    return this.debugMode
  }

  get errorHandling(): ErrorHandler {
    return this.errorHandler
  }

  async initialize(app: App, settings: PluginSettings, config: ContainerConfig = {}): Promise<void> {
    if (this._isInitialized) {
      throw ContainerError.alreadyInitialized()
    }

    const endTimer = this.performanceMonitor.startTimer('container-initialization')

    try {
      this.container = new Container()

      // Bind core dependencies
      this.container.bind({ provide: Tokens.ObsidianApp, useValue: app })
      this.container.bind({ provide: Tokens.AppSettings, useValue: settings })

      this._isInitialized = true
      const setupTime = endTimer()

      this.performanceMonitor.recordResolution('container-initialization', setupTime)

      if (config.debug) {
        this.debugMode.enable()
      }

      this.debugMode.logContainerState()
    } catch (error) {
      throw DependencyResolutionError.failed('container-initialization', error)
    }
  }

  async dispose(): Promise<void> {
    if (!this._isInitialized || !this.container) {
      return
    }

    try {
      this.debugMode.logContainerState()
      this.container = undefined
      this._isInitialized = false
      this.performanceMonitor.reset()
    } catch (_error) {
      throw ContainerError.notInitialized()
    }
  }

  resolve<T>(token: InjectionToken<T> | string): T {
    if (!this._isInitialized || !this.container) {
      throw ContainerError.notInitialized()
    }

    const endTimer = this.performanceMonitor.startTimer(token.toString())

    try {
      const result = this.container.get(token) as T
      const resolutionTime = endTimer()

      this.performanceMonitor.recordResolution(token.toString(), resolutionTime)
      this.debugMode.logResolutionTime(token.toString())

      return result
    } catch (error) {
      const resolutionError = DependencyResolutionError.failed(token.toString(), error)
      this.errorHandler.handleResolutionError(resolutionError)
      throw resolutionError
    }
  }

  isRegistered(token: InjectionToken<unknown> | string): boolean {
    if (!this._isInitialized || !this.container) {
      return false
    }

    try {
      this.container.get(token)
      return true
    } catch {
      return false
    }
  }

  createChild(overrides: Partial<Record<keyof typeof Tokens, unknown>> = {}): TestContainer {
    if (!this._isInitialized || !this.container) {
      throw ContainerError.notInitialized()
    }

    try {
      const childContainer = new TestContainerImpl(this.container, { debug: this.debugMode.isEnabled })

      // Apply overrides
      for (const [tokenName, value] of Object.entries(overrides)) {
        const token = (Tokens as Record<string, unknown>)[tokenName] as keyof typeof Tokens
        if (token) {
          childContainer.override(tokenName as keyof typeof Tokens, value)
        }
      }

      return childContainer
    } catch (error) {
      throw new Error(`${Errors.child_container_creation_failed}: ${error}`)
    }
  }

  validateDependencies(): ValidationResult {
    if (!this._isInitialized || !this.container) {
      return {
        isValid: false,
        errors: [{ path: 'container', message: Errors.container_not_initialized, code: 'CONTAINER_NOT_INITIALIZED' }],
        warnings: [],
      }
    }

    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Basic validation of core dependencies
    const coreTokens = [Tokens.ObsidianApp, Tokens.AppSettings]

    for (const token of coreTokens) {
      if (!this.isRegistered(token)) {
        errors.push({
          path: token.toString(),
          message: `${Errors.token_not_registered}: ${token}`,
          code: 'TOKEN_NOT_REGISTERED',
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  getRegisteredTokens(): string[] {
    if (!this._isInitialized) {
      return []
    }

    return Object.values(Tokens).map(token => token.toString())
  }
}
