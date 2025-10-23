import { InjectionToken } from "@needle-di/core";
import { urn } from "./urn";

/**
 * Provider tokens with URN-based semantic naming
 *
 * URN Format: urn:tars:type:identifier
 *
 * Examples:
 * - urn:tars:provider:llm-providers (all LLM providers)
 * - urn:tars:provider:llm-registry (provider registry service)
 * - urn:tars:capability:tool-calling (tool calling capability)
 */

// Import types from existing services and providers
import type {
	LlmProvider,
	McpIntegration,
	McpToolInjector,
	ProviderRegistry,
} from "../providers";
import type {
	IDocumentService,
	ILogger,
	INotificationService,
	ISettingsService,
} from "../services";

/**
 * Token registry for provider-related dependencies
 */
export const tokens = {
	// === Core Provider Tokens ===
	Providers: new InjectionToken<LlmProvider[]>(urn.provider("llm-providers")),
	Provider: new InjectionToken<LlmProvider>(urn.provider("llm-provider")),
	Registry: new InjectionToken<ProviderRegistry>(urn.provider("llm-registry")),

	// === Core Service Tokens ===
	Logger: new InjectionToken<ILogger>(urn.service("logger")),
	Notification: new InjectionToken<INotificationService>(
		urn.service("notification"),
	),
	Settings: new InjectionToken<ISettingsService>(urn.service("settings")),
	Document: new InjectionToken<IDocumentService>(urn.service("document")),

	// === Capability-Specific Provider Tokens ===
	TextGenerationProviders: new InjectionToken<LlmProvider[]>(
		urn.provider("text-generation-providers"),
	),
	ToolCallingProviders: new InjectionToken<LlmProvider[]>(
		urn.provider("tool-calling-providers"),
	),
	VisionProviders: new InjectionToken<LlmProvider[]>(
		urn.provider("vision-providers"),
	),
	ImageGenerationProviders: new InjectionToken<LlmProvider[]>(
		urn.provider("image-generation-providers"),
	),

	// === MCP Integration Tokens ===
	McpIntegrationToken: new InjectionToken<McpIntegration>(
		urn.service("mcp-integration"),
	),
	McpToolInjectorToken: new InjectionToken<McpToolInjector>(
		urn.service("mcp-tool-injector"),
	),
} as const;

// Export commonly used tokens
export const {
	Providers,
	Provider,
	Registry,
	Logger,
	Notification,
	Settings,
	Document,
} = tokens;

// Type helpers
export type ProviderTokens = typeof tokens;
