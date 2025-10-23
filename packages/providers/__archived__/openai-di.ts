import type { Capability } from '@tars/contracts'
import { type BaseOptions, type DIBaseOptions, DIBaseProvider, type SendRequest } from '@tars/contracts'
import type { LlmModel } from '@tars/contracts/providers'
import { openAIVendor } from './openAI'

export class OpenAIDIProvider extends DIBaseProvider {
	readonly name = 'OpenAI'
	readonly websiteToObtainKey = 'https://platform.openai.com/api-keys'
	readonly capabilities: Capability[] = [
		'Text Generation',
		'Image Vision',
		'Image Generation',
		'Tool Calling',
		'Reasoning'
	]

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

	get models(): LlmModel[] {
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
