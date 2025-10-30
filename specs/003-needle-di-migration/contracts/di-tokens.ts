/**
 * Dependency Injection Tokens for Tars Obsidian Plugin
 *
 * Type-safe identifiers for injectable dependencies using Needle DI framework.
 * Each token defines the contract for configuration values and services.
 */

import { InjectionToken } from '@needle-di/core';
import type { App } from 'obsidian';
import type { PluginSettings } from '../../apps/obsidian-plugin/src/settings';
import type { Vendor } from '../../apps/obsidian-plugin/src/providers/base';

// ============================================================================
// Core Obsidian Integration Tokens
// ============================================================================

/** Obsidian App instance - provides access to vault, workspace, and file system */
export const OBSIDIAN_APP = new InjectionToken<App>('OBSIDIAN_APP');

/** Plugin settings from encrypted storage - contains all user configuration */
export const APP_SETTINGS = new InjectionToken<PluginSettings>('APP_SETTINGS');

// ============================================================================
// Service Layer Tokens
// ============================================================================

/** Settings management service - handles loading, saving, and change notifications */
export interface SettingsManager {
  loadSettings(): Promise<void>;
  saveSettings(): Promise<void>;
  getSettings(): PluginSettings;
  onSettingsChange(listener: (settings: PluginSettings) => void): void;
  validateSettings(settings: PluginSettings): ValidationResult;
}

export const SETTINGS_MANAGER = new InjectionToken<SettingsManager>('SETTINGS_MANAGER');

/** AI provider registry - manages registration and discovery of AI providers */
export interface ProviderRegistry {
  registerProvider<T extends Vendor>(token: InjectionToken<T>): void;
  unregisterProvider(token: InjectionToken<Vendor>): void;
  getProvider(vendorName: string): Vendor | null;
  getAllProviders(): Vendor[];
  getEnabledProviders(): Vendor[];
  hasCapability(vendorName: string, capability: string): boolean;
  getProvidersWithCapability(capability: string): Vendor[];
}

export const PROVIDER_REGISTRY = new InjectionToken<ProviderRegistry>('PROVIDER_REGISTRY');

/** Command registry - manages dynamic command registration and execution */
export interface CommandRegistry {
  registerCommand(command: CommandDefinition): void;
  unregisterCommand(commandId: string): void;
  getCommand(commandId: string): CommandDefinition | null;
  getAllCommands(): CommandDefinition[];
  getTagCommands(): CommandDefinition[];
  executeCommand(commandId: string, ...args: unknown[]): Promise<void>;
}

export interface CommandDefinition {
  id: string;
  name: string;
  editorCallback: (editor: any, view: any) => void;
  settingsCallback?: () => void;
  tags?: string[];
}

export const COMMAND_REGISTRY = new InjectionToken<CommandRegistry>('COMMAND_REGISTRY');

/** Status bar manager - handles plugin status display */
export interface StatusBarManager {
  initialize(): void;
  updateStatus(text: string): void;
  setGeneratingStatus(count: number): void;
  setSuccessStatus(): void;
  setErrorStatus(error: string): void;
  dispose(): void;
}

export const STATUS_BAR_MANAGER = new InjectionToken<StatusBarManager>('STATUS_BAR_MANAGER');

// ============================================================================
// AI Provider Tokens
// ============================================================================

/** Individual provider tokens for type-safe provider resolution */
export const OPENAI_PROVIDER = new InjectionToken<Vendor>('OPENAI_PROVIDER');
export const CLAUDE_PROVIDER = new InjectionToken<Vendor>('CLAUDE_PROVIDER');
export const DEEPSEEK_PROVIDER = new InjectionToken<Vendor>('DEEPSEEK_PROVIDER');
export const GEMINI_PROVIDER = new InjectionToken<Vendor>('GEMINI_PROVIDER');

/** Provider factory - creates and manages AI provider instances */
export interface ProviderFactory {
  createProvider(vendorName: string): Vendor | null;
  getAllProviders(): Vendor[];
  getAvailableProviders(): Vendor[];
  isProviderEnabled(vendorName: string): boolean;
}

export const PROVIDER_FACTORY = new InjectionToken<ProviderFactory>('PROVIDER_FACTORY');

// ============================================================================
// Testing Infrastructure Tokens
// ============================================================================

/** Test container - isolated container for unit testing */
export const TEST_CONTAINER = new InjectionToken<any>('TEST_CONTAINER');

/** Mock settings for testing scenarios */
export const MOCK_SETTINGS = new InjectionToken<PluginSettings>('MOCK_SETTINGS');

/** Mock Obsidian services for testing */
export interface MockObsidianServices {
  app: App;
  vault: any;
  workspace: any;
  metadataCache: any;
}

export const MOCK_OBSIDIAN_SERVICES = new InjectionToken<MockObsidianServices>('MOCK_OBSIDIAN_SERVICES');

// ============================================================================
// Configuration and Feature Tokens
// ============================================================================

/** DI configuration settings */
export interface DIConfiguration {
  enabled: boolean;
  debugMode: boolean;
  performanceMonitoring: boolean;
  lazyLoading: boolean;
  failFastErrors: boolean;
}

export const DI_CONFIGURATION = new InjectionToken<DIConfiguration>('DI_CONFIGURATION');

/** Feature flags for controlling DI functionality */
export interface FeatureFlags {
  enableDIMode: boolean;
  enablePerformanceMonitoring: boolean;
  enableDebugMode: boolean;
  enableLazyLoading: boolean;
}

export const FEATURE_FLAGS = new InjectionToken<FeatureFlags>('FEATURE_FLAGS');

// ============================================================================
// Validation Types
// ============================================================================

/** Settings validation result */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  timestamp: number;
}

/** Provider capability definition */
export interface VendorCapabilities {
  textGeneration: boolean;
  vision: boolean;
  imageGeneration: boolean;
  webSearch: boolean;
  streaming: boolean;
}

/** Provider configuration interface */
export interface ProviderConfiguration {
  enabled: boolean;
  apiKey: string;
  baseURL: string;
  model: string;
  parameters: Record<string, unknown>;
  capabilities: string[];
}

// ============================================================================
// Error Types
// ============================================================================

/** Base DI error class */
export class DIError extends Error {
  constructor(
    message: string,
    public readonly service: string,
    public readonly dependency?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'DIError';
  }
}

/** Service not found error */
export class ServiceNotFoundError extends DIError {
  constructor(service: string) {
    super(`Service not found: ${service}`, service);
    this.name = 'ServiceNotFoundError';
  }
}

/** Configuration error */
export class ConfigurationError extends DIError {
  constructor(service: string, configErrors: string[]) {
    super(`Configuration errors for ${service}: ${configErrors.join(', ')}`, service);
    this.name = 'ConfigurationError';
  }
}

/** Circular dependency error */
export class CircularDependencyError extends DIError {
  constructor(dependencyChain: string[]) {
    super(
      `Circular dependency detected: ${dependencyChain.join(' -> ')} -> ${dependencyChain[0]}`,
      'CircularDependency',
      dependencyChain[0]
    );
    this.name = 'CircularDependencyError';
  }
}

// ============================================================================
// Token Registry
// ============================================================================

/** Registry of all available tokens for runtime introspection */
export const TOKEN_REGISTRY = {
  // Core tokens
  OBSIDIAN_APP,
  APP_SETTINGS,

  // Service tokens
  SETTINGS_MANAGER,
  PROVIDER_REGISTRY,
  COMMAND_REGISTRY,
  STATUS_BAR_MANAGER,

  // Provider tokens
  OPENAI_PROVIDER,
  CLAUDE_PROVIDER,
  DEEPSEEK_PROVIDER,
  GEMINI_PROVIDER,
  PROVIDER_FACTORY,

  // Testing tokens
  TEST_CONTAINER,
  MOCK_SETTINGS,
  MOCK_OBSIDIAN_SERVICES,

  // Configuration tokens
  DI_CONFIGURATION,
  FEATURE_FLAGS,
} as const;

/** Type definition for all available tokens */
export type AvailableToken = typeof TOKEN_REGISTRY[keyof typeof TOKEN_REGISTRY];