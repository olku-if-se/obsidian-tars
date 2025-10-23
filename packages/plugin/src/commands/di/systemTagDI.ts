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
export class SystemTagDICommand {
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
					const settings = this.settingsService.getAll()
					const mark = toSpeakMark(tag)
					const { range } = fetchTagMeta(app, editor, settings)

					// Insert system tag
					const { tag: systemTag } = insertMarkToBegin(editor, range, mark, 'system', '', null)
					this.notificationService.show(`System tag ${systemTag} inserted`)
					this.loggingService.info(`System tag ${tag} executed successfully`)
				} catch (error) {
					this.loggingService.error(`Error executing system tag ${tag}:`, error)
					this.notificationService.error(
						`Failed to insert system tag: ${error instanceof Error ? error.message : 'Unknown error'}`
					)
				}
			}
		}
	}
}
