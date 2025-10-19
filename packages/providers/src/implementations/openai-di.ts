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
import { openAIVendor } from './openAI'
import type { Message, EmbedCache, Vendor } from '../interfaces/base'

export class OpenAIDIProvider extends DIBaseProvider {
	readonly name = 'OpenAI'
	readonly websiteToObtainKey = 'https://platform.openai.com/api-keys'
	readonly capabilities = ['Text Generation', 'Image Vision', 'Image Generation', 'Tool Calling', 'Reasoning']

	constructor(
		loggingService: ILoggingService,
		notificationService: INotificationService,
		settingsService: ISettingsService,
		documentService: IDocumentService
	) {
		super(loggingService, notificationService, settingsService, documentService)
	}

	get defaultOptions(): DIBaseOptions {
		const openaiDefaults = openAIVendor.defaultOptions

		return {
			...openaiDefaults,
			// DI services automatically available
			loggingService: this.loggingService,
			notificationService: this.notificationService,
			settingsService: this.settingsService,
			documentService: this.documentService
		}
	}

	get models(): string[] {
		return openAIVendor.models
	}

	createSendRequest(options: DIBaseOptions): SendRequest {
		// Create framework config from DI services
		const frameworkConfig = this.createFrameworkConfig()

		// Convert DI options to base options for the legacy provider
		const baseOptions: BaseOptions = {
			...options,
			frameworkConfig
		}

		// Delegate to the legacy OpenAI vendor
		return openAIVendor.sendRequestFunc(baseOptions)
	}
}