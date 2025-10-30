/**
 * Injectable Provider Contracts
 *
 * Interfaces and types for AI providers in the dependency injection system.
 * These contracts define how providers integrate with DI while maintaining
 * the existing Vendor interface.
 *
 * Implementation will be in apps/obsidian-plugin/src/providers/
 */

import type { PluginSettings } from '../settings';
import type { EmbedCache } from 'obsidian';

/**
 * Message Role
 *
 * Role identifier for conversation messages.
 */
export type MsgRole = 'user' | 'assistant' | 'system';

/**
 * Capability Type
 *
 * Features supported by AI providers.
 */
export type Capability =
  | 'Text Generation'
  | 'Image Vision'
  | 'PDF Vision'
  | 'Image Generation'
  | 'Image Editing'
  | 'Web Search'
  | 'Reasoning';

/**
 * Message Interface
 *
 * Represents a conversation message with optional embedded files.
 */
export interface Message {
  readonly role: MsgRole;
  readonly content: string;
  readonly embeds?: EmbedCache[];
}

/**
 * Base Options for AI Requests
 *
 * Configuration for making AI provider requests.
 */
export interface BaseOptions {
  /** API key for authentication */
  apiKey: string;

  /** Base URL for API endpoint */
  baseURL: string;

  /** Model identifier */
  model: string;

  /** Provider-specific parameters (temperature, max_tokens, etc.) */
  parameters: Record<string, unknown>;

  /** Enable web search (if provider supports it) */
  enableWebSearch?: boolean;
}

/**
 * Callback Types
 *
 * Callbacks used during message processing.
 */

/** Save generated file (image, etc.) to vault */
export type SaveAttachment = (
  fileName: string,
  data: ArrayBuffer
) => Promise<void>;

/** Resolve embedded file to binary data */
export type ResolveEmbedAsBinary = (
  embed: EmbedCache
) => Promise<ArrayBuffer>;

/** Create plain text file in vault */
export type CreatePlainText = (
  filePath: string,
  text: string
) => Promise<void>;

/**
 * Send Request Function
 *
 * Async generator that yields streamed response tokens and returns final payload.
 */
export type SendRequest = (
  messages: readonly Message[],
  controller: AbortController,
  resolveEmbedAsBinary: ResolveEmbedAsBinary,
  saveAttachment?: SaveAttachment
) => AsyncGenerator<string, void, unknown>;

/**
 * Vendor Interface
 *
 * Contract that all AI providers must implement.
 * This interface remains unchanged from the original implementation.
 */
export interface Vendor {
  /** Provider name (e.g., "OpenAI", "Claude") */
  readonly name: string;

  /** Default configuration options */
  readonly defaultOptions: BaseOptions;

  /** Function to send requests with specific options */
  readonly sendRequestFunc: (options: BaseOptions) => SendRequest;

  /** Available models for this provider */
  readonly models: string[];

  /** URL where users can obtain API key */
  readonly websiteToObtainKey: string;

  /** Capabilities supported by this provider */
  readonly capabilities: Capability[];
}

/**
 * Injectable Vendor Options Base Class
 *
 * Abstract base class for injectable AI providers.
 * Provides settings injection and common vendor functionality.
 */
export abstract class BaseVendorOptions {
  constructor(protected settings: PluginSettings) {}

  /** Get API key from settings */
  abstract get apiKey(): string;

  /** Get base URL from settings */
  abstract get baseURL(): string;

  /** Get model identifier from settings */
  abstract get model(): string;

  /** Get provider-specific parameters from settings */
  abstract get parameters(): Record<string, unknown>;

  /** Get provider name */
  abstract get name(): string;

  /** Get available models */
  abstract get models(): string[];

  /** Get website URL for obtaining API key */
  abstract get websiteToObtainKey(): string;

  /** Get supported capabilities */
  abstract get capabilities(): Capability[];

  /** Get default options */
  abstract get defaultOptions(): BaseOptions;

  /** Get send request function */
  abstract get sendRequestFunc(): (options: BaseOptions) => SendRequest;
}

/**
 * Provider Settings Interface
 *
 * Configuration for a single AI provider instance.
 */
export interface ProviderSettings {
  /** Tag associated with this provider (e.g., "#Claude:", "#GPT:") */
  tag: string;

  /** Vendor identifier */
  readonly vendor: string;

  /** Provider options */
  options: BaseOptions;
}

/**
 * Optional Provider Configuration
 *
 * Additional optional settings that some providers may use.
 */
export interface Optional {
  /** API secret (if different from API key) */
  apiSecret: string;

  /** Custom endpoint URL */
  endpoint: string;

  /** API version string */
  apiVersion: string;
}

/**
 * Provider Decorator
 *
 * Decorator function to mark a class as an injectable AI provider.
 * Combines Needle DI's @injectable() with vendor registration.
 */
export declare function VendorProvider(vendorName: string): ClassDecorator;

/**
 * Provider Registry Interface
 *
 * Manages registration and lookup of AI providers.
 */
export interface IProviderRegistry {
  /**
   * Register a provider class
   * @param name - Vendor name
   * @param providerClass - Injectable provider class
   */
  register(name: string, providerClass: new (...args: any[]) => Vendor): void;

  /**
   * Get provider class by name
   * @param name - Vendor name
   * @returns Provider class or undefined if not found
   */
  get(name: string): (new (...args: any[]) => Vendor) | undefined;

  /**
   * Get all registered provider names
   * @returns Array of vendor names
   */
  getNames(): string[];

  /**
   * Check if a provider is registered
   * @param name - Vendor name
   * @returns True if provider is registered
   */
  has(name: string): boolean;

  /**
   * Unregister a provider
   * @param name - Vendor name
   */
  unregister(name: string): void;

  /**
   * Clear all registrations
   */
  clear(): void;
}

/**
 * Provider Capability Query
 *
 * Query interface for finding providers by capability.
 */
export interface ProviderCapabilityQuery {
  /** Required capabilities (all must be present) */
  required: Capability[];

  /** Optional capabilities (at least one must be present) */
  optional?: Capability[];

  /** Excluded capabilities (none must be present) */
  excluded?: Capability[];

  /** Minimum number of total capabilities */
  minCapabilities?: number;
}

/**
 * Provider Validation Result
 *
 * Result of validating a provider's configuration.
 */
export interface ProviderValidationResult {
  /** Whether provider configuration is valid */
  valid: boolean;

  /** Validation errors (if any) */
  errors: string[];

  /** Validation warnings (non-blocking) */
  warnings: string[];

  /** Missing required settings */
  missingSettings: string[];

  /** Invalid setting values */
  invalidSettings: { key: string; reason: string }[];
}

/**
 * Provider Health Check
 *
 * Result of checking provider health/connectivity.
 */
export interface ProviderHealthCheck {
  /** Provider name */
  provider: string;

  /** Whether provider is healthy */
  healthy: boolean;

  /** Response time in milliseconds */
  responseTime: number;

  /** Error message if unhealthy */
  error?: string;

  /** Timestamp of check */
  checkedAt: number;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Injectable Provider Example
 *
 * Example showing how to create an injectable AI provider.
 *
 * ```typescript
 * import { injectable, inject } from '@needle-di/core';
 * import { APP_SETTINGS } from '../di/tokens';
 * import { VendorProvider } from './decorator';
 *
 * @VendorProvider('OpenAI')
 * @injectable()
 * export class OpenAIProvider extends BaseVendorOptions implements Vendor {
 *   constructor(settings = inject(APP_SETTINGS)) {
 *     super(settings);
 *   }
 *
 *   get name(): string {
 *     return 'OpenAI';
 *   }
 *
 *   get apiKey(): string {
 *     return this.settings.providers?.openai?.apiKey || '';
 *   }
 *
 *   get baseURL(): string {
 *     return this.settings.providers?.openai?.baseURL || 'https://api.openai.com/v1';
 *   }
 *
 *   get model(): string {
 *     return this.settings.providers?.openai?.model || 'gpt-3.5-turbo';
 *   }
 *
 *   get parameters(): Record<string, unknown> {
 *     return this.settings.providers?.openai?.parameters || {};
 *   }
 *
 *   get models(): string[] {
 *     return ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];
 *   }
 *
 *   get websiteToObtainKey(): string {
 *     return 'https://platform.openai.com/api-keys';
 *   }
 *
 *   get capabilities(): Capability[] {
 *     return ['Text Generation', 'Image Vision', 'Image Generation'];
 *   }
 *
 *   get defaultOptions(): BaseOptions {
 *     return {
 *       apiKey: this.apiKey,
 *       baseURL: this.baseURL,
 *       model: this.model,
 *       parameters: this.parameters
 *     };
 *   }
 *
 *   get sendRequestFunc() {
 *     return (options: BaseOptions) => {
 *       return async function* (
 *         messages: readonly Message[],
 *         controller: AbortController,
 *         resolveEmbedAsBinary: ResolveEmbedAsBinary,
 *         saveAttachment?: SaveAttachment
 *       ) {
 *         // Implementation here
 *         yield 'token';
 *       };
 *     };
 *   }
 * }
 * ```
 */
