/**
 * Enhanced Vendor Interface for DI-Enabled AI Providers
 *
 * Extends the original Vendor interface with DI-specific requirements
 * and defines the contract for all injectable AI provider implementations.
 */

import type { SendRequest } from '../../apps/obsidian-plugin/src/providers/base';

// ============================================================================
// Base Vendor Options (DI-enabled)
// ============================================================================

/** Base class for provider configuration with dependency injection */
export abstract class BaseVendorOptions {
  constructor(
    protected settings = inject(APP_SETTINGS),
    protected app = inject(OBSIDIAN_APP)
  ) {}

  // Abstract properties that must be implemented by concrete providers
  abstract get apiKey(): string;
  abstract get baseURL(): string;
  abstract get model(): string;
  abstract get parameters(): Record<string, unknown>;
  abstract get capabilities(): VendorCapabilities;

  // Common functionality
  validateConfiguration(): ValidationResult {
    const errors: string[] = [];

    if (!this.apiKey?.trim()) {
      errors.push('API key is required');
    }

    if (!this.baseURL?.trim()) {
      errors.push('Base URL is required');
    }

    if (!this.model?.trim()) {
      errors.push('Model must be selected');
    }

    return {
      valid: errors.length === 0,
      errors,
      timestamp: Date.now()
    };
  }

  isEnabled(): boolean {
    const providerName = this.getProviderName();
    return this.settings.providers?.[providerName]?.enabled ?? false;
  }

  protected abstract getProviderName(): string;
}

// ============================================================================
// Enhanced Vendor Interface (DI-compatible)
// ============================================================================

/** Enhanced Vendor interface with DI support requirements */
export interface DIEnabledVendor {
  // Original Vendor interface properties
  readonly name: string;
  readonly defaultOptions: BaseOptions;
  readonly sendRequestFunc: SendRequest;
  readonly models: string[];
  readonly websiteToObtainKey: string;
  readonly capabilities: string[];

  // DI-specific properties
  readonly isSingleton: boolean;
  readonly dependencies: InjectionToken<any>[];

  // Lifecycle methods
  initialize?(): Promise<void>;
  dispose?(): Promise<void>;

  // Configuration methods
  validateConfiguration?(): ValidationResult;
  onConfigurationChange?(): void;

  // Health check methods
  isHealthy?(): Promise<boolean>;
  getHealthStatus?(): Promise<ProviderHealthStatus>;
}

// ============================================================================
// Provider Factory Interface
// ============================================================================

/** Factory for creating and managing AI provider instances */
export interface ProviderFactory {
  /**
   * Create a provider instance by name
   * @param vendorName - Name of the provider to create
   * @returns Provider instance or null if not found
   */
  createProvider(vendorName: string): DIEnabledVendor | null;

  /**
   * Get all registered providers
   * @returns Array of all provider instances
   */
  getAllProviders(): DIEnabledVendor[];

  /**
   * Get providers that are enabled in settings
   * @returns Array of enabled provider instances
   */
  getEnabledProviders(): DIEnabledVendor[];

  /**
   * Check if a provider is enabled
   * @param vendorName - Name of the provider to check
   * @returns True if provider is enabled
   */
  isProviderEnabled(vendorName: string): boolean;

  /**
   * Register a new provider type
   * @param token - Injection token for the provider
   * @param vendorName - Name of the provider
   */
  registerProvider<T extends DIEnabledVendor>(
    token: InjectionToken<T>,
    vendorName: string
  ): void;

  /**
   * Unregister a provider type
   * @param vendorName - Name of the provider to unregister
   */
  unregisterProvider(vendorName: string): void;

  /**
   * Get providers with specific capabilities
   * @param capability - Capability to filter by
   * @returns Array of providers with the specified capability
   */
  getProvidersWithCapability(capability: string): DIEnabledVendor[];

  /**
   * Validate all enabled providers
   * @returns Validation results for all providers
   */
  validateAllProviders(): Record<string, ValidationResult>;
}

// ============================================================================
// Provider Health and Monitoring
// ============================================================================

/** Provider health status */
export interface ProviderHealthStatus {
  healthy: boolean;
  lastCheck: number;
  errorMessage?: string;
  responseTime?: number;
  configurationValid: boolean;
}

/** Provider performance metrics */
export interface ProviderMetrics {
  requestCount: number;
  successRate: number;
  averageResponseTime: number;
  errorCount: number;
  lastRequestTime: number;
}

// ============================================================================
// Provider Lifecycle States
// ============================================================================

/** Provider lifecycle state enumeration */
export enum ProviderState {
  /** Provider is registered but not yet initialized */
  REGISTERED = 'registered',

  /** Provider is being initialized */
  INITIALIZING = 'initializing',

  /** Provider is ready to handle requests */
  READY = 'ready',

  /** Provider is temporarily disabled due to errors */
  DISABLED = 'disabled',

  /** Provider has failed and cannot recover */
  FAILED = 'failed',

  /** Provider is being disposed */
  DISPOSING = 'disposing',

  /** Provider has been disposed */
  DISPOSED = 'disposed'
}

/** Provider state transition interface */
export interface ProviderStateManager {
  getCurrentState(): ProviderState;
  canTransitionTo(newState: ProviderState): boolean;
  transitionTo(newState: ProviderState): void;
  onStateChange(callback: (oldState: ProviderState, newState: ProviderState) => void): void;
}

// ============================================================================
// Provider Configuration Schema
// ============================================================================

/** Provider-specific configuration schema */
export interface ProviderConfigurationSchema {
  /** Human-readable display name */
  displayName: string;

  /** Configuration field definitions */
  fields: ProviderConfigurationField[];

  /** Validation rules */
  validation: ProviderValidationRules;

  /** Default configuration values */
  defaults: Record<string, any>;
}

/** Configuration field definition */
export interface ProviderConfigurationField {
  /** Field identifier */
  key: string;

  /** Human-readable label */
  label: string;

  /** Field type */
  type: 'text' | 'password' | 'url' | 'select' | 'number' | 'boolean';

  /** Whether the field is required */
  required: boolean;

  /** Field description */
  description?: string;

  /** Validation pattern (for text fields) */
  pattern?: string;

  /** Options for select fields */
  options?: Array<{ value: string; label: string }>;

  /** Minimum/maximum values for number fields */
  min?: number;
  max?: number;
}

/** Provider validation rules */
export interface ProviderValidationRules {
  /** Function to validate configuration */
  validate: (config: Record<string, any>) => ValidationResult;

  /** Function to validate API connectivity */
  testConnection?: (config: Record<string, any>) => Promise<boolean>;

  /** Required fields that must have non-empty values */
  requiredFields: string[];
}

// ============================================================================
// Provider Registry Contract
// ============================================================================

/** Complete provider registry contract */
export interface ProviderRegistryContract {
  // Provider management
  registerProvider<T extends DIEnabledVendor>(
    token: InjectionToken<T>,
    vendorName: string,
    schema: ProviderConfigurationSchema
  ): void;

  unregisterProvider(vendorName: string): void;

  // Provider access
  getProvider(vendorName: string): DIEnabledVendor | null;
  getAllProviders(): DIEnabledVendor[];
  getEnabledProviders(): DIEnabledVendor[];

  // Capability queries
  hasCapability(vendorName: string, capability: string): boolean;
  getProvidersWithCapability(capability: string): DIEnabledVendor[];

  // Configuration management
  getProviderSchema(vendorName: string): ProviderConfigurationSchema | null;
  getAllSchemas(): Record<string, ProviderConfigurationSchema>;

  // State management
  getProviderState(vendorName: string): ProviderState;
  setProviderState(vendorName: string, state: ProviderState): void;

  // Health monitoring
  getProviderHealth(vendorName: string): ProviderHealthStatus;
  getAllProviderHealth(): Record<string, ProviderHealthStatus>;

  // Metrics
  getProviderMetrics(vendorName: string): ProviderMetrics;
  getAllProviderMetrics(): Record<string, ProviderMetrics>;
}

// ============================================================================
// Provider Facade Interface
// ============================================================================

/** Facade for backward compatibility with legacy provider access */
export interface ProviderFacade {
  /**
   * Get provider instance (legacy compatibility)
   * @param vendorName - Name of the provider
   * @returns Provider instance or null
   */
  getVendor(vendorName: string): DIEnabledVendor | null;

  /**
   * Get all providers (legacy compatibility)
   * @returns Array of provider instances
   */
  getAllVendors(): DIEnabledVendor[];

  /**
   * Check if DI mode is enabled
   * @returns True if DI mode is active
   */
  isDIMode(): boolean;

  /**
   * Enable/disable DI mode
   * @param enabled - Whether to enable DI mode
   */
  setDIMode(enabled: boolean): void;
}

// ============================================================================
// Type Guards and Utilities
// ============================================================================

/** Type guard for DI-enabled vendors */
export function isDIEnabledVendor(obj: any): obj is DIEnabledVendor {
  return obj &&
         typeof obj.name === 'string' &&
         typeof obj.defaultOptions === 'object' &&
         typeof obj.sendRequestFunc === 'function' &&
         Array.isArray(obj.models) &&
         typeof obj.isSingleton === 'boolean' &&
         Array.isArray(obj.dependencies);
}

/** Type guard for provider factory */
export function isProviderFactory(obj: any): obj is ProviderFactory {
  return obj &&
         typeof obj.createProvider === 'function' &&
         typeof obj.getAllProviders === 'function' &&
         typeof obj.isProviderEnabled === 'function';
}

/** Utility to extract provider name from token */
export function getProviderNameFromToken(token: InjectionToken<any>): string {
  const tokenDescription = token.toString();
  return tokenDescription.replace(/[^a-zA-Z]/g, '').toLowerCase();
}

/** Utility to create provider dependencies array */
export function createProviderDependencies(...tokens: InjectionToken<any>[]): InjectionToken<any>[] {
  return tokens;
}