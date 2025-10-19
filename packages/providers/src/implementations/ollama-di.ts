import {
	DIBaseProvider,
	DIBaseOptions,
	SendRequest,
	ILoggingService,
	INotificationService,
	ISettingsService,
	IDocumentService,
	BaseOptions
} from '@tars/contracts'
import { ollamaVendor } from './ollama'
import type { Message, EmbedCache, Vendor } from '../interfaces/base'

export class OllamaDIProvider extends DIBaseProvider {
	readonly name = 'Ollama'
	readonly websiteToObtainKey = 'https://ollama.com/'
	readonly capabilities = ['Text Generation', 'Image Vision', 'Tool Calling', 'Reasoning']

	constructor(
		loggingService: ILoggingService,
		notificationService: INotificationService,
		settingsService: ISettingsService,
		documentService: IDocumentService
	) {
		super(loggingService, notificationService, settingsService, documentService)
	}

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