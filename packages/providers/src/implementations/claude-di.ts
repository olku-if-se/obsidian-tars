import type { Capability } from '@tars/contracts'
import { type BaseOptions, type DIBaseOptions, DIBaseProvider, type SendRequest } from '@tars/contracts'
import { type ClaudeOptions, claudeVendor } from './claude'

export class ClaudeDIProvider extends DIBaseProvider {
	readonly name = 'Claude'
	readonly websiteToObtainKey = 'https://console.anthropic.com/'
	readonly capabilities: Capability[] = ['Text Generation', 'Image Vision', 'PDF Vision', 'Tool Calling', 'Reasoning']

	get defaultOptions(): DIBaseOptions {
		const claudeDefaults = claudeVendor.defaultOptions as ClaudeOptions

		return {
			...claudeDefaults,
			// DI services automatically available
			loggingService: this.loggingService,
			notificationService: this.notificationService,
			settingsService: this.settingsService,
			documentService: this.documentService
		}
	}

	get models(): string[] {
		return claudeVendor.models
	}

	createSendRequest(options: DIBaseOptions): SendRequest {
		// Create framework config from DI services
		const frameworkConfig = this.createFrameworkConfig()

		// Convert DI options to base options for the legacy provider
		const baseOptions: BaseOptions = {
			...options,
			frameworkConfig
		}

		// Delegate to the legacy Claude vendor
		return claudeVendor.sendRequestFunc(baseOptions)
	}
}
