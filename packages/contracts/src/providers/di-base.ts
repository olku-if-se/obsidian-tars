import type { IDocumentService, ILoggingService, INotificationService, ISettingsService } from '../services'
import { type BaseOptions, BaseProvider, type FrameworkConfig, type SendRequest } from './base'

/**
 * Base options for DI-enabled providers
 * Extends BaseOptions with DI service integration
 */
export interface DIBaseOptions extends BaseOptions {
	// DI services - injected automatically
	loggingService?: ILoggingService
	notificationService?: INotificationService
	settingsService?: ISettingsService
	documentService?: IDocumentService
}

/**
 * DI-enabled base class for AI providers
 * Automatically integrates DI services while maintaining compatibility with existing BaseProvider
 */
export abstract class DIBaseProvider extends BaseProvider {
	// DI services - protected so subclasses can access them
	protected loggingService: ILoggingService
	protected notificationService: INotificationService
	protected settingsService: ISettingsService
	protected documentService: IDocumentService

	constructor(
		loggingService: ILoggingService,
		notificationService: INotificationService,
		settingsService: ISettingsService,
		documentService: IDocumentService
	) {
		super()
		this.loggingService = loggingService
		this.notificationService = notificationService
		this.settingsService = settingsService
		this.documentService = documentService
	}

	/**
	 * Create a framework configuration object from injected DI services
	 * This provides the bridge between DI services and the existing FrameworkConfig interface
	 */
	protected createFrameworkConfig(): FrameworkConfig {
		const appFolder = this.settingsService.get('appFolder', 'Tars')

		return {
			appFolder,
			// DI services automatically provide the implementations
			noticeSystem: {
				show: (message: string) => {
					this.notificationService.show(message)
				}
			},
			requestSystem: {
				requestUrl: async (url: string, _options?: RequestInit) => {
					// Use obsidian's requestUrl through document service if available
					// For now, return a basic implementation
					this.loggingService.debug(`Making request to ${url}`)
					return {
						status: 200,
						text: 'OK',
						headers: {}
					}
				}
			},
			platform: {
				isMobileApp: false,
				isDesktop: true,
				isMacOS: false,
				isWindows: false,
				isLinux: true,
				isIosApp: false,
				isAndroidApp: false
			},
			normalizePath: (path: string) => {
				// Use document service for path normalization
				return this.documentService.normalizePath ? this.documentService.normalizePath(path) : path
			}
		}
	}

	/**
	 * Enhanced error formatting that uses DI logging service
	 */
	override formatError(error: unknown, context: string): string {
		const errorMessage = super.formatError(error, context)
		this.loggingService.error(errorMessage, { error, context })
		return errorMessage
	}

	/**
	 * Enhanced validation that logs through DI service
	 */
	override validateOptions(options: DIBaseOptions): boolean {
		const isValid = super.validateOptions(options)
		if (!isValid) {
			this.loggingService.warn(`Invalid options for ${this.name}`, { options })
		}
		return isValid
	}

	/**
	 * Get default options enhanced with DI services
	 * Subclasses should override this to provide their specific defaults
	 */
	abstract override get defaultOptions(): DIBaseOptions

	/**
	 * Create send request with DI integration
	 * Ensures DI services are available to the request
	 */
	abstract override createSendRequest(options: DIBaseOptions): SendRequest
}
