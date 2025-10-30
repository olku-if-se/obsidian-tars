/**
 * DI Container Interface and Configuration
 *
 * Defines the contract for the central dependency injection container,
 * including configuration, lifecycle management, and testing support.
 */

import { Container } from '@needle-di/core';
import type { App } from 'obsidian';
import type { PluginSettings } from '../../apps/obsidian-plugin/src/settings';

// ============================================================================
// Container Configuration Interface
// ============================================================================

/** Configuration options for DI container setup */
export interface ContainerConfiguration {
  /** Obsidian app instance */
  app: App;

  /** Plugin settings */
  settings: PluginSettings;

  /** DI-specific configuration */
  diConfig: {
    /** Enable debug mode for verbose logging */
    debugMode: boolean;

    /** Enable performance monitoring */
    performanceMonitoring: boolean;

    /** Enable lazy loading of providers */
    lazyLoading: boolean;

    /** Enable fail-fast error handling */
    failFastErrors: boolean;

    /** Maximum number of cached instances */
    maxCacheSize: number;
  };

  /** Provider registration options */
  providers: {
    /** Auto-register all available providers */
    autoRegister: boolean;

    /** List of providers to exclude from auto-registration */
    exclude: string[];

    /** Custom provider registrations */
    custom: Array<{
      name: string;
      token: InjectionToken<any>;
      implementation: any;
    }>;
  };
}

// ============================================================================
// Container Lifecycle Interface
// ============================================================================

/** Container lifecycle states */
export enum ContainerState {
  /** Container not yet initialized */
  UNINITIALIZED = 'uninitialized',

  /** Container is being configured */
  CONFIGURING = 'configuring',

  /** Container is ready for use */
  READY = 'ready',

  /** Container is being disposed */
  DISPOSING = 'disposing',

  /** Container has been disposed */
  DISPOSED = 'disposed',

  /** Container encountered an error */
  ERROR = 'error'
}

/** Container lifecycle manager interface */
export interface ContainerLifecycleManager {
  /**
   * Initialize the container with configuration
   * @param config - Container configuration
   */
  initialize(config: ContainerConfiguration): Promise<void>;

  /**
   * Get current container state
   */
  getState(): ContainerState;

  /**
   * Register state change listener
   * @param listener - Callback for state changes
   */
  onStateChange(listener: (oldState: ContainerState, newState: ContainerState) => void): void;

  /**
   * Dispose the container and all resources
   */
  dispose(): Promise<void>;

  /**
   * Reset the container (for testing)
   */
  reset(): void;
}

// ============================================================================
// Main Container Interface
// ============================================================================

/** Main DI container interface extending Needle DI Container */
export interface DIContainer extends Container {
  /** Container lifecycle management */
  readonly lifecycle: ContainerLifecycleManager;

  /** Container configuration */
  readonly configuration: ContainerConfiguration;

  /** Container state */
  readonly state: ContainerState;

  /**
   * Configure the container with Obsidian-specific bindings
   * @param config - Container configuration
   */
  configure(config: ContainerConfiguration): Promise<void>;

  /**
   * Create a child container for testing
   * @param overrides - Optional dependency overrides
   */
  createTestContainer(overrides?: ContainerOverrides): TestContainer;

  /**
   * Validate all registered dependencies
   */
  validateDependencies(): ValidationResult;

  /**
   * Get performance metrics for the container
   */
  getMetrics(): ContainerMetrics;

  /**
   * Get dependency graph information
   */
  getDependencyGraph(): DependencyGraph;

  /**
   * Check if a service is registered
   * @param token - Service token to check
   */
  isRegistered<T>(token: InjectionToken<T>): boolean;

  /**
   * Get all registered tokens
   */
  getRegisteredTokens(): InjectionToken<any>[];

  /**
   * Clear all cached instances (for testing)
   */
  clearCache(): void;
}

// ============================================================================
// Test Container Interface
// ============================================================================

/** Test container with mocking capabilities */
export interface TestContainer {
  /** Parent container reference */
  readonly parent: DIContainer;

  /** Mock bindings for this test container */
  readonly mocks: Map<InjectionToken<any>, any>;

  /**
   * Override a dependency with a mock
   * @param token - Token to override
   * @param mock - Mock implementation
   */
  override<T>(token: InjectionToken<T>, mock: T): void;

  /**
   * Override multiple dependencies
   * @param overrides - Map of token to mock implementations
   */
  overrideAll(overrides: Map<InjectionToken<any>, any>): void;

  /**
   * Create a fresh mock of a type
   * @param token - Token to mock
   * @param partialMock - Partial mock implementation
   */
  createMock<T>(token: InjectionToken<T>, partialMock?: Partial<T>): T;

  /**
   * Reset all overrides
   */
  reset(): void;

  /**
   * Verify all mocks were used (optional)
   */
  verifyMocks(): void;

  /**
   * Get call history for mocks
   */
  getMockCallHistory(token: InjectionToken<any>): MockCallHistory;
}

// ============================================================================
// Container Overrides Interface
// ============================================================================

/** Container override configuration */
export interface ContainerOverrides {
  /** Token to mock implementation mappings */
  mocks: Map<InjectionToken<any>, any>;

  /** Configuration overrides */
  configOverrides: Partial<ContainerConfiguration>;

  /** Provider exclusions */
  excludeProviders: string[];

  /** Additional test-specific bindings */
  testBindings: Map<InjectionToken<any>, any>;
}

// ============================================================================
// Validation Interfaces
// ============================================================================

/** Container validation result */
export interface ContainerValidationResult {
  valid: boolean;
  errors: ContainerValidationError[];
  warnings: ContainerValidationWarning[];
  timestamp: number;
}

/** Container validation error */
export interface ContainerValidationError {
  type: 'circular_dependency' | 'missing_dependency' | 'invalid_binding' | 'configuration_error';
  message: string;
  token: string;
  dependency?: string;
  resolution?: string;
}

/** Container validation warning */
export interface ContainerValidationWarning {
  type: 'unused_dependency' | 'deprecated_binding' | 'performance_warning';
  message: string;
  token: string;
  suggestion?: string;
}

/** Validation result (alias for compatibility) */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  timestamp: number;
}

// ============================================================================
// Performance and Metrics Interfaces
// ============================================================================

/** Container performance metrics */
export interface ContainerMetrics {
  /** Container initialization time */
  initializationTime: number;

  /** Total number of registered bindings */
  bindingCount: number;

  /** Number of cached instances */
  cachedInstanceCount: number;

  /** Memory usage estimate */
  memoryUsage: number;

  /** Dependency resolution times by token */
  resolutionTimes: Map<string, number>;

  /** Cache hit/miss statistics */
  cacheStats: {
    hits: number;
    misses: number;
    hitRate: number;
  };

  /** Error counts by type */
  errorStats: {
    resolutionErrors: number;
    validationErrors: number;
    configurationErrors: number;
  };
}

/** Dependency graph information */
export interface DependencyGraph {
  /** All nodes in the graph */
  nodes: DependencyNode[];

  /** All edges in the graph */
  edges: DependencyEdge[];

  /** Circular dependencies detected */
  circularDependencies: string[][];

  /** Dependency levels (topological sort) */
  levels: string[][];

  /** Orphaned dependencies (no dependents) */
  orphans: string[];
}

/** Dependency graph node */
export interface DependencyNode {
  name: string;
  token: string;
  type: 'singleton' | 'transient' | 'scoped';
  dependencies: string[];
  dependents: string[];
  resolved: boolean;
  resolutionTime: number;
}

/** Dependency graph edge */
export interface DependencyEdge {
  from: string;
  to: string;
  type: 'required' | 'optional';
}

// ============================================================================
// Mock and Testing Interfaces
// ============================================================================

/** Mock call history */
export interface MockCallHistory {
  /** Total number of calls */
  callCount: number;

  /** Call arguments by call index */
  calls: Array<{
    args: any[];
    timestamp: number;
    returned: any;
    threw: boolean;
    error?: Error;
  }>;

  /** Most recent call */
  lastCall?: {
    args: any[];
    timestamp: number;
    returned: any;
    threw: boolean;
    error?: Error;
  };
}

/** Mock factory interface */
export interface MockFactory {
  /**
   * Create a mock for a given token
   * @param token - Token to create mock for
   * @param partialMock - Partial implementation
   */
  createMock<T>(token: InjectionToken<T>, partialMock?: Partial<T>): T;

  /**
   * Create a mock with specific behavior
   * @param token - Token to create mock for
   * @param behavior - Mock behavior configuration
   */
  createMockWithBehavior<T>(
    token: InjectionToken<T>,
    behavior: MockBehavior<T>
  ): T;

  /**
   * Reset all mocks
   */
  resetAll(): void;

  /**
   * Verify all mocks
   */
  verifyAll(): void;
}

/** Mock behavior configuration */
export interface MockBehavior<T> {
  /** Method implementations */
  methods?: Partial<Record<keyof T, MockMethod>>;

  /** Property values */
  properties?: Partial<T>;

  /** Constructor behavior */
  constructor?: MockConstructor;

  /** Default return value for unimplemented methods */
  defaultReturn?: any;
}

/** Mock method implementation */
export interface MockMethod {
  /** Implementation function */
  implementation: (...args: any[]) => any;

  /** Expected call count */
  expectedCalls?: number;

  /** Expected arguments (partial match) */
  expectedArgs?: any[];

  /** Whether to throw an error */
  shouldThrow?: boolean;

  /** Error to throw */
  error?: Error;
}

/** Mock constructor behavior */
export interface MockConstructor {
  /** Constructor implementation */
  implementation: (...args: any[]) => any;

  /** Whether to throw during construction */
  shouldThrow?: boolean;

  /** Error to throw */
  error?: Error;
}

// ============================================================================
// Container Factory Interface
// ============================================================================

/** Factory for creating DI containers */
export interface ContainerFactory {
  /**
   * Create a new DI container
   * @param config - Container configuration
   */
  create(config: ContainerConfiguration): Promise<DIContainer>;

  /**
   * Create a container with default configuration
   * @param app - Obsidian app instance
   * @param settings - Plugin settings
   */
  createWithDefaults(app: App, settings: PluginSettings): Promise<DIContainer>;

  /**
   * Create a test container
   * @param parent - Parent container
   * @param overrides - Test overrides
   */
  createTestContainer(
    parent: DIContainer,
    overrides?: ContainerOverrides
  ): TestContainer;

  /**
   * Reset singleton container instance
   */
  reset(): void;
}

// ============================================================================
// Container Utilities
// ============================================================================

/** Container utility functions */
export interface ContainerUtils {
  /**
   * Validate container configuration
   * @param config - Configuration to validate
   */
  validateConfiguration(config: ContainerConfiguration): ContainerValidationResult;

  /**
   * Create default container configuration
   * @param app - Obsidian app instance
   * @param settings - Plugin settings
   */
  createDefaultConfiguration(app: App, settings: PluginSettings): ContainerConfiguration;

  /**
   * Merge container configurations
   * @param base - Base configuration
   * @param override - Override configuration
   */
  mergeConfigurations(
    base: ContainerConfiguration,
    override: Partial<ContainerConfiguration>
  ): ContainerConfiguration;

  /**
   * Extract dependency information from container
   * @param container - Container to analyze
   */
  extractDependencyInfo(container: DIContainer): DependencyGraph;

  /**
   * Create performance benchmark for container
   * @param container - Container to benchmark
   */
  benchmarkContainer(container: DIContainer): Promise<ContainerMetrics>;
}

// ============================================================================
// Type Guards and Utilities
// ============================================================================

/** Type guard for DI container */
export function isDIContainer(obj: any): obj is DIContainer {
  return obj &&
         typeof obj.configure === 'function' &&
         typeof obj.createTestContainer === 'function' &&
         typeof obj.validateDependencies === 'function' &&
         typeof obj.getMetrics === 'function' &&
         obj.lifecycle &&
         obj.configuration;
}

/** Type guard for test container */
export function isTestContainer(obj: any): obj is TestContainer {
  return obj &&
         typeof obj.override === 'function' &&
         typeof obj.createMock === 'function' &&
         typeof obj.reset === 'function' &&
         obj.parent &&
         obj.mocks;
}

/** Utility to create container overrides */
export function createContainerOverrides(
  mocks: Record<string, any> = {},
  configOverrides: Partial<ContainerConfiguration> = {},
  excludeProviders: string[] = []
): ContainerOverrides {
  const mockMap = new Map<InjectionToken<any>, any>();

  // Convert plain object mocks to Map (would need token conversion in real implementation)
  Object.entries(mocks).forEach(([key, value]) => {
    // In real implementation, would convert string keys to tokens
    mockMap.set(key as any, value);
  });

  return {
    mocks: mockMap,
    configOverrides,
    excludeProviders,
    testBindings: new Map()
  };
}