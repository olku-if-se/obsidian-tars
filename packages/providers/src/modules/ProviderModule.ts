import { Container } from '@needle-di/core'
import { MockMCPIntegration, MockMCPToolInjector } from '@tars/contracts/mocks'
import { tokens } from '@tars/contracts/tokens'
import {
	AzureStreamingProvider,
	ClaudeStreamingProvider,
	DeepseekStreamingProvider,
	GeminiStreamingProvider,
	GrokStreamingProvider,
	OllamaStreamingProvider,
	// New streaming providers with comprehensive callbacks
	OpenAIStreamingProvider,
	OpenRouterStreamingProvider,
	SiliconFlowStreamingProvider
} from '../implementations'

/**
 * Create provider container with mock/stub implementations for MCP services
 * This enables providers to work even without full MCP infrastructure
 */
export function createProviderContainer(): Container {
	const container = new Container()

	// Mock core services for demonstration
	container.bind({
		provide: tokens.Logger,
		useValue: {
			debug: () => {},
			info: () => {},
			warn: () => {},
			error: () => {}
		}
	})

	container.bind({ provide: tokens.Notification, useValue: { show: () => {} } })
	container.bind({ provide: tokens.Settings, useValue: { get: () => 'Tars' } })
	container.bind({ provide: tokens.Document, useValue: { normalizePath: (p: string) => p } })

	// Mock MCP integration services (fast way to complete the task)
	// These provide stub implementations that allow providers to function
	container.bind({
		provide: tokens.MCPIntegrationToken,
		useValue: new MockMCPIntegration()
	})

	container.bind({
		provide: tokens.MCPToolInjectorToken,
		useValue: new MockMCPToolInjector()
	})

	// New streaming providers with comprehensive callbacks (non-DI)
	const streamingProviders = [
		OpenAIStreamingProvider,
		GrokStreamingProvider,
		DeepseekStreamingProvider,
		OpenRouterStreamingProvider,
		SiliconFlowStreamingProvider,
		OllamaStreamingProvider,
		AzureStreamingProvider,
		ClaudeStreamingProvider,
		GeminiStreamingProvider
	]

	// Create a providers array with streaming providers
	container.bind({
		provide: tokens.Providers,
		useFactory: () => {
			const allProviders: any[] = []

			// Mock services for streaming providers
			const mockLoggingService = {
				debug: () => {},
				info: () => {},
				warn: () => {},
				error: () => {}
			}

			const mockSettingsService = {
				get: <T>(_key: string, defaultValue?: T): T => defaultValue as T,
				set: async () => {},
				has: () => false,
				watch: () => () => {},
				remove: async () => {},
				clear: async () => {},
				getAll: () => ({}),
				setAll: async () => {},
				initialize: async () => {}
			}

			// Add streaming providers
			streamingProviders.forEach((ProviderClass) => {
				try {
					// Create provider instances for demo purposes
					const provider = new ProviderClass(mockLoggingService, mockSettingsService)
					allProviders.push(provider)
				} catch (error) {
					console.warn(
						`Failed to instantiate ${ProviderClass.name}:`,
						error instanceof Error ? error.message : String(error)
					)
				}
			})

			return allProviders.filter(Boolean)
		}
	})

	return container
}
