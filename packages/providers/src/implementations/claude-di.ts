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
import { claudeVendor, ClaudeOptions } from './claude'
import type { Message, EmbedCache, Vendor } from '../interfaces/base'

export class ClaudeDIProvider extends DIBaseProvider {
	readonly name = 'Claude'
	readonly websiteToObtainKey = 'https://console.anthropic.com/'
	readonly capabilities = ['Text Generation', 'Image Vision', 'PDF Vision', 'Tool Calling', 'Reasoning']

	constructor(
		loggingService: ILoggingService,
		notificationService: INotificationService,
		settingsService: ISettingsService,
		documentService: IDocumentService
	) {
		super(loggingService, notificationService, settingsService, documentService)
	}

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