import { type App, type Command, type Editor, type MarkdownView } from 'obsidian'
import { injectable, inject } from '@needle-di/core'
import type { ILoggingService, INotificationService, ISettingsService } from '@tars/contracts'
import type { PluginSettings } from 'src/settings'
import type { RequestController } from 'src/editor'
import type { TagCmdMeta } from '../tagCmd'
import { toSpeakMark } from 'src/suggest'
import { fetchTagMeta, insertMarkToBegin } from '../tagUtils'

// Runtime tokens for dependency injection (interfaces can't be used as tokens with isolatedModules)
const ILoggingServiceToken = Symbol('ILoggingService')
const INotificationServiceToken = Symbol('INotificationService')
const ISettingsServiceToken = Symbol('ISettingsService')

@injectable()
export class UserTagDICommand {
	constructor(
		@inject(ILoggingServiceToken) private loggingService: ILoggingService,
		@inject(INotificationServiceToken) private notificationService: INotificationService,
		@inject(ISettingsServiceToken) private settingsService: ISettingsService
	) {}

	createCommand(
		{ id, name, tag }: TagCmdMeta,
		app: App,
		settings: PluginSettings,
		statusBarManager: any,
		requestController: RequestController,
		mcpManager?: unknown,
		mcpExecutor?: unknown
	): Command {
		return {
			id,
			name,
			editorCallback: async (editor: Editor, _view: MarkdownView) => {
				try {
					// Use injected settings service when available, fall back to parameter
					const mark = toSpeakMark(tag)
					const { range } = fetchTagMeta(app, editor, settings)

					// Insert user tag
					const { tag: userTag } = insertMarkToBegin(editor, range, mark, 'user', '', null)
					this.notificationService.show(`User tag ${userTag} inserted`)
					this.loggingService.info(`User tag ${tag} executed successfully`)
				} catch (error) {
					this.loggingService.error(`Error executing user tag ${tag}:`, error)
					this.notificationService.error(
						`Failed to insert user tag: ${error instanceof Error ? error.message : 'Unknown error'}`
					)
				}
			}
		}
	}
}
