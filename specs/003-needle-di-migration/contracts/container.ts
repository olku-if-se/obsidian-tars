/**
 * DI Container Contracts
 *
 * Interfaces defining the dependency injection container API and related types.
 * These contracts establish the boundary between the DI system and the rest of the plugin.
 *
 * Implementation will be in apps/obsidian-plugin/src/di/container.ts
 */

import type { Container, InjectionToken } from '@needle-di/core';
import type { Vendor } from '../providers';

/**
 * DI Container Interface
 *
 * Manages dependency registration, resolution, and lifecycle.
 */
export interface IDIContainer {
  /**
   * Get a service from the container
   * @param token - Class or injection token to resolve
   * @returns Resolved service instance
   * @throws {DependencyResolutionError} If dependency cannot be resolved
   */
  get<T>(token: any): T;

  /**
   * Bind a service or value to the container
   * @param token - Token to bind
   * @param implementation - Implementation class or configuration
   */
  bind(token: any, implementation?: any): void;

  /**
   * Register all AI providers
   * Called during container setup to register provider classes
   */
  registerAIProviders(): void;

  /**
   * Register core services
   * Called during container setup to register settings, managers, etc.
   */
  registerCoreServices(): void;

  /**
   * Get all registered providers
   * @returns Array of provider instances
   */
  getAllProviders(): Vendor[];

  /**
   * Check if a token is registered
   * @param token - Token to check
   * @returns True if token is registered
   */
  has(token: any): boolean;

  /**
   * Unbind a token from the container
   * @param token - Token to unbind
   */
  unbind(token: any): void;

  /**
   * Create a child container for testing
   * @returns Child container inheriting parent bindings
   */
  createChild(): IDIContainer;

  /**
   * Dispose of the container and cleanup resources
   */
  dispose(): void;

  /**
   * Get the underlying Needle DI container
   * @returns Raw Needle Container instance
   */
  getContainer(): Container;
}

/**
 * Provider Factory Interface
 *
 * Creates AI provider instances from the DI container.
 */
export interface IProviderFactory {
  /**
   * Create a provider by name
   * @param providerName - Vendor name (e.g., "OpenAI", "Claude")
   * @returns Provider instance or null if not found
   */
  createProvider(providerName: string): Vendor | null;

  /**
   * Get all available providers
   * @returns Array of provider instances
   */
  getAllProviders(): Vendor[];

  /**
   * Get available providers with their metadata
   * @returns Array of provider info objects
   */
  getAvailableProviders(): ProviderInfo[];

  /**
   * Check if a provider is available
   * @param providerName - Vendor name
   * @returns True if provider is registered and available
   */
  hasProvider(providerName: string): boolean;

  /**
   * Get provider by capability
   * @param capability - Required capability (e.g., "Image Vision")
   * @returns Array of providers supporting the capability
   */
  getProvidersByCapability(capability: string): Vendor[];
}

/**
 * Provider Information
 *
 * Metadata about an available AI provider.
 */
export interface ProviderInfo {
  /** Vendor name */
  name: string;

  /** Available models */
  models: string[];

  /** Supported capabilities */
  capabilities: string[];

  /** Whether provider is currently enabled */
  enabled: boolean;

  /** Whether provider has valid configuration */
  configured: boolean;
}

/**
 * Container Configuration Options
 *
 * Options for creating and configuring the DI container.
 */
export interface ContainerOptions {
  /** Enable debug logging for dependency resolution */
  debug?: boolean;

  /** Validate all bindings at initialization */
  validate?: boolean;

  /** Enable lazy provider instantiation */
  lazy?: boolean;

  /** Maximum resolution depth (circular dependency prevention) */
  maxResolutionDepth?: number;
}

/**
 * Dependency Resolution Error
 *
 * Thrown when a dependency cannot be resolved.
 */
export class DependencyResolutionError extends Error {
  constructor(
    message: string,
    public token: any,
    public cause?: Error
  ) {
    super(message);
    this.name = 'DependencyResolutionError';
  }

  /**
   * Create error for missing dependency
   */
  static missingDependency(token: any): DependencyResolutionError {
    return new DependencyResolutionError(
      `Dependency not registered: ${String(token)}`,
      token
    );
  }

  /**
   * Create error for circular dependency
   */
  static circularDependency(chain: string[]): DependencyResolutionError {
    return new DependencyResolutionError(
      `Circular dependency detected: ${chain.join(' → ')}`,
      chain[0]
    );
  }

  /**
   * Create error for resolution failure
   */
  static resolutionFailed(token: any, cause: Error): DependencyResolutionError {
    return new DependencyResolutionError(
      `Failed to resolve dependency: ${String(token)}`,
      token,
      cause
    );
  }
}

/**
 * Container Lifecycle Events
 *
 * Events emitted during container lifecycle for monitoring and debugging.
 */
export interface ContainerEvents {
  /** Emitted when container is initialized */
  'container:initialized': { timestamp: number };

  /** Emitted when a service is registered */
  'service:registered': { token: any; type: 'class' | 'value' | 'factory' };

  /** Emitted when a service is resolved */
  'service:resolved': { token: any; cached: boolean; duration: number };

  /** Emitted when a service resolution fails */
  'service:failed': { token: any; error: Error };

  /** Emitted when container is disposed */
  'container:disposed': { timestamp: number };
}

/**
 * Container Statistics
 *
 * Runtime statistics about container usage and performance.
 */
export interface ContainerStats {
  /** Number of registered bindings */
  bindingsCount: number;

  /** Number of resolved instances (singletons) */
  instancesCount: number;

  /** Number of child containers created */
  childContainersCount: number;

  /** Total resolutions performed */
  resolutionCount: number;

  /** Cache hit rate (percentage) */
  cacheHitRate: number;

  /** Average resolution time (milliseconds) */
  avgResolutionTime: number;

  /** Memory footprint estimate (bytes) */
  memoryFootprint: number;
}

/**
 * Service Metadata
 *
 * Metadata about a registered service for debugging and monitoring.
 */
export interface ServiceMetadata {
  /** Token identifier */
  token: any;

  /** Service type */
  type: 'class' | 'value' | 'factory' | 'existing';

  /** Lifecycle strategy */
  lifecycle: 'singleton' | 'transient' | 'scoped';

  /** Whether service is lazy */
  lazy: boolean;

  /** Dependencies of this service */
  dependencies: any[];

  /** Registration timestamp */
  registeredAt: number;

  /** First resolution timestamp (undefined if not yet resolved) */
  firstResolvedAt?: number;

  /** Number of times resolved */
  resolutionCount: number;
}
