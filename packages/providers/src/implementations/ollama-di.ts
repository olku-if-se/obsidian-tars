import type { Capability } from '@tars/contracts'
import { type BaseOptions, type DIBaseOptions, DIBaseProvider, type SendRequest } from '@tars/contracts'
import { ollamaVendor } from './ollama'

export class OllamaDIProvider extends DIBaseProvider {
	readonly name = 'Ollama'
	readonly websiteToObtainKey = 'https://ollama.com/'
	readonly capabilities: Capability[] = ['Text Generation', 'Image Vision', 'Tool Calling', 'Reasoning']

	get defaultOptions(): DIBaseOptions {
		const ollamaDefaults = ollamaVendor.defaultOptions

		return {
			...ollamaDefaults,
			// DI services automatically available
			loggingService: this.loggingService,
			notificationService: this.notificationService,
			settingsService: this.settingsService,
			documentService: this.documentService
		}
	}

	get models(): string[] {
		return ollamaVendor.models
	}

	createSendRequest(options: DIBaseOptions): SendRequest {
		// Create framework config from DI services
		const frameworkConfig = this.createFrameworkConfig()

		// Convert DI options to base options for the legacy provider
		const baseOptions: BaseOptions = {
			...options,
			frameworkConfig
		}

		// Delegate to the legacy Ollama vendor
		return ollamaVendor.sendRequestFunc(baseOptions)
	}
}
