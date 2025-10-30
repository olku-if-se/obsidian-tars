/**
 * Configuration Token Contracts
 *
 * Type-safe injection tokens for dependency injection system.
 * These interfaces define the shape of configuration values that can be injected.
 *
 * Usage:
 *   export const TOKEN_NAME = new InjectionToken<InterfaceName>('TOKEN_NAME');
 *   container.bind({ provide: TOKEN_NAME, useValue: configValue });
 *   constructor(private config = inject(TOKEN_NAME)) {}
 */

import type { InjectionToken } from '@needle-di/core';
import type { App } from 'obsidian'; // Obsidian App instance type
import type { PluginSettings } from '../settings'; // Will exist in apps/obsidian-plugin/src/settings.ts
import type { Vendor, Capability } from '../providers'; // Will exist in apps/obsidian-plugin/src/providers/index.ts

/**
 * Model Registry Interface
 *
 * Provides access to available AI models and their capabilities across providers.
 */
export interface ModelRegistry {
  /**
   * Get available models for a specific vendor
   * @param vendor - Vendor name (e.g., "OpenAI", "Claude")
   * @returns Array of model identifiers
   */
  getModels(vendor: string): string[];

  /**
   * Check if a vendor supports a specific capability
   * @param vendor - Vendor name
   * @param capability - Capability to check (e.g., "Image Vision", "Reasoning")
   * @returns True if vendor supports the capability
   */
  hasCapability(vendor: string, capability: Capability): boolean;

  /**
   * Get all registered vendors
   * @returns Array of vendor names
   */
  getVendors(): string[];

  /**
   * Get default model for a vendor
   * @param vendor - Vendor name
   * @returns Default model identifier or undefined if vendor not found
   */
  getDefaultModel(vendor: string): string | undefined;
}

/**
 * Command Registry Interface
 *
 * Manages Obsidian command registration and tag-based command mappings.
 */
export interface CommandRegistry {
  /**
   * Get all registered command IDs
   * @returns Array of Obsidian command identifiers
   */
  getCommandIds(): string[];

  /**
   * Register a command with Obsidian
   * @param id - Unique command identifier
   * @param handler - Command execution handler
   */
  registerCommand(id: string, handler: () => void): void;

  /**
   * Get command ID for a specific tag
   * @param tag - Tag string (e.g., "#User:", "#Claude:")
   * @returns Command ID or undefined if not found
   */
  getCommandForTag(tag: string): string | undefined;

  /**
   * Register a tag-to-command mapping
   * @param tag - Tag string
   * @param commandId - Command identifier
   */
  registerTagCommand(tag: string, commandId: string): void;
}

/**
 * Provider Configuration
 *
 * Configuration object for an individual AI provider.
 */
export interface ProviderConfig {
  /** Vendor identifier (e.g., "OpenAI", "Claude") */
  vendor: string;

  /** Provider-specific settings (API keys, endpoints, etc.) */
  settings: Record<string, unknown>;

  /** Whether this provider is enabled */
  enabled: boolean;

  /** Default model for this provider */
  defaultModel?: string;
}

/**
 * Feature Flags Interface
 *
 * Toggle experimental or optional features.
 */
export interface FeatureFlags {
  /** Enable dependency injection system */
  enableDI: boolean;

  /** Enable debug logging for DI resolution */
  debugDI: boolean;

  /** Enable lazy provider instantiation */
  lazyProviders: boolean;

  /** Enable child container testing */
  childContainers: boolean;
}

/**
 * Configuration Tokens
 *
 * These tokens are used to inject configuration values into services.
 * Actual token definitions will be in apps/obsidian-plugin/src/di/tokens.ts
 */

/** Obsidian App instance - replaces passing this.app as parameter */
export declare const OBSIDIAN_APP: InjectionToken<App>;

/** Main plugin settings (Obsidian encrypted storage) - replaces passing this.settings as parameter */
export declare const APP_SETTINGS: InjectionToken<PluginSettings>;

/** Model registry for AI provider capabilities */
export declare const MODEL_REGISTRY: InjectionToken<ModelRegistry>;

/** Command registry for Obsidian commands */
export declare const COMMAND_REGISTRY: InjectionToken<CommandRegistry>;

/** Provider configurations array */
export declare const PROVIDER_CONFIGS: InjectionToken<ProviderConfig[]>;

/** Array of all registered AI providers */
export declare const AI_PROVIDERS: InjectionToken<Vendor[]>;

/** Feature flags for experimental features */
export declare const FEATURE_FLAGS: InjectionToken<FeatureFlags>;
