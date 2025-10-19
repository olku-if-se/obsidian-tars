import {
	type App,
	type Command,
	type Editor,
	type MarkdownView
} from 'obsidian'
import { injectable, inject } from '@needle-di/core'
import {
	ILoggingService,
	INotificationService,
	ISettingsService
} from '@tars/contracts'
import type { PluginSettings } from 'src/settings'
import type { RequestController } from 'src/editor'
import type { TagCmdMeta } from '../tagCmd'
import { toSpeakMark } from 'src/suggest'
import { fetchTagMeta, insertMarkToBegin } from '../tagUtils'

@injectable()
export class UserTagDICommand {
	constructor(
		@inject(ILoggingService) private loggingService: ILoggingService,
		@inject(INotificationService) private notificationService: INotificationService,
		@inject(ISettingsService) private settingsService: ISettingsService
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
					this.notificationService.error(`Failed to insert user tag: ${error instanceof Error ? error.message : 'Unknown error'}`)
				}
			}
		}
	}
}