import type { Container } from '@needle-di/core'
import type { App } from 'obsidian'
import type { Vendor } from '../providers/index'
import type { PluginSettings } from '../settings'
import type { Tokens } from './tokens'

// DI Container lifecycle states
export type ContainerState = 'UNINITIALIZED' | 'CONFIGURED' | 'READY' | 'DISPOSED'

// Provider lifecycle states
export type ProviderState = 'REGISTERED' | 'INSTANTIATING' | 'ACTIVE' | 'DISPOSED'

// Core container configuration
export interface ContainerConfig {
  readonly debug?: boolean
  readonly validateOnStartup?: boolean
  readonly enablePerformanceMonitoring?: boolean
}

// Service factory for complex initialization
export interface ServiceFactory<T> {
  create(container: Container): T
  readonly singleton?: boolean
  readonly name?: string
}

// Provider metadata for registration and discovery
export interface ProviderMetadata {
  readonly name: string
  readonly displayName: string
  readonly description: string
  readonly capabilities: string[]
  readonly models: string[]
  readonly websiteToObtainKey: string
  readonly version?: string
  readonly category?: string
}

// Settings validation result
export interface ValidationResult {
  readonly isValid: boolean
  readonly errors: ValidationError[]
  readonly warnings: ValidationWarning[]
}

export interface ValidationError {
  readonly path: string
  readonly message: string
  readonly code: string
}

export interface ValidationWarning {
  readonly path: string
  readonly message: string
  readonly code: string
}

// Performance monitoring
export interface PerformanceMetrics {
  readonly containerSetupTime: number
  readonly providerResolutionTime: Map<string, number>
  readonly totalResolutionCount: number
  readonly cacheHitRate: number
}

// Dependency graph validation
export interface DependencyGraph {
  readonly nodes: DependencyNode[]
  readonly edges: DependencyEdge[]
}

export interface DependencyNode {
  readonly id: string
  readonly type: 'service' | 'token' | 'provider'
  readonly lifecycle: 'singleton' | 'transient' | 'scoped'
  readonly dependencies: string[]
}

export interface DependencyEdge {
  readonly from: string
  readonly to: string
  readonly type: 'constructor' | 'property' | 'method'
}

// Error handling
export interface DIError extends Error {
  readonly code: string
  readonly token?: string
  readonly dependency?: string
  readonly cause?: unknown
}

export interface CircularDependencyError extends DIError {
  readonly cycle: string[]
}

export interface ResolutionError extends DIError {
  readonly missingDependencies: string[]
}

// Event types for reactive DI system
export interface DIEvents {
  'container:initialized': { config: ContainerConfig }
  'container:disposed': { timestamp: number }
  'provider:registered': { metadata: ProviderMetadata }
  'provider:resolved': { name: string; time: number }
  'settings:changed': { settings: PluginSettings }
  'error:resolution': { error: ResolutionError }
  'error:circular': { error: CircularDependencyError }
}

// Container lifecycle management
export interface ContainerLifecycle {
  readonly state: ContainerState
  readonly config: ContainerConfig
  readonly metrics: PerformanceMetrics

  initialize(config: ContainerConfig): Promise<void>
  dispose(): Promise<void>
  validate(): ValidationResult
}

// Child container for testing
export interface TestContainer extends ContainerLifecycle {
  readonly parent: Container
  readonly overrides: Map<keyof typeof Tokens, unknown>

  override<T>(token: keyof typeof Tokens, value: T): void
  reset(): void
}

// Provider factory interface
export interface ProviderFactory {
  createProvider(name: string, settings: PluginSettings): Vendor | null
  getAvailableProviders(): string[]
  getProviderMetadata(name: string): ProviderMetadata | null
  validateProviderConfig(name: string, config: Record<string, unknown>): ValidationResult
}

// Settings change notification
export interface SettingsChangeNotifier {
  subscribe(callback: (settings: PluginSettings) => void): () => void
  notify(settings: PluginSettings): void
  unsubscribe(callback: (settings: PluginSettings) => void): void
}

// Plugin initializer interface
export interface PluginInitializer {
  readonly app: App
  readonly container: Container
  readonly lifecycle: ContainerLifecycle

  initialize(): Promise<void>
  dispose(): Promise<void>
  reload(): Promise<void>

  // Service accessors
  getProvider(name: string): Vendor | null
  getSettings(): PluginSettings
  notify(message: string, options?: { timeout?: number }): void
}

// Service registration interface
export interface ServiceRegistry {
  register<T>(token: keyof typeof Tokens, implementation: ServiceFactory<T>): void
  registerSingleton<T>(token: keyof typeof Tokens, implementation: new (...args: unknown[]) => T): void
  registerTransient<T>(token: keyof typeof Tokens, implementation: new (...args: unknown[]) => T): void
  registerMulti<T>(token: keyof typeof Tokens, implementation: new (...args: unknown[]) => T): void

  isRegistered(token: keyof typeof Tokens): boolean
  getRegistrations(): ReadonlyArray<{ token: keyof typeof Tokens; implementation: ServiceFactory<unknown> }>
}

// Container configuration validator
export interface ConfigValidator {
  validateConfig(config: ContainerConfig): ValidationResult
  validateDependencies(container: { get: (token: unknown) => unknown } | null | Container): ValidationResult
  validateCircularDependencies(container: { get: (token: unknown) => unknown } | null | Container): ValidationResult
}

// Performance monitor interface
export interface PerformanceMonitor {
  startTimer(name: string): () => number
  recordResolution(token: string, time: number): void
  getMetrics(): PerformanceMetrics
  reset(): void
}

// Debug mode interface
export interface DebugMode {
  readonly isEnabled: boolean
  enable(): void
  disable(): void

  logContainerState(): void
  logDependencyGraph(): void
  logResolutionTime(token: string): void
  logError(error: DIError): void
}

// Error handler interface
export interface ErrorHandler {
  handleResolutionError(error: ResolutionError): void
  handleCircularDependency(error: CircularDependencyError): void
  handleValidationError(error: ValidationError): void

  subscribe(callback: (error: DIError) => void): () => void
}
