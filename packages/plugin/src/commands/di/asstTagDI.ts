import {
	type App,
	type Command,
	type Editor,
	type MarkdownView,
	Notice
} from 'obsidian'
import { injectable, inject } from '@needle-di/core'
import {
	ILoggingService,
	INotificationService,
	ISettingsService,
	IStatusService
} from '@tars/contracts'
import { buildRunEnv, generate, type RequestController } from 'src/editor'
import { t } from 'src/lang/helper'
import type { ProviderSettings } from '@tars/providers'
import type { PluginSettings } from 'src/settings'
import { toSpeakMark } from 'src/suggest'
import type { TagCmdMeta } from '../tagCmd'
import {
	fetchTagMeta,
	HARD_LINE_BREAK,
	insertMarkToBegin,
	insertMarkToEmptyLines,
	insertText,
	isEmptyLines
} from '../tagUtils'

@injectable()
export class AssistantTagDICommand {
	constructor(
		@inject(ILoggingService) private loggingService: ILoggingService,
		@inject(INotificationService) private notificationService: INotificationService,
		@inject(ISettingsService) private settingsService: ISettingsService,
		@inject(IStatusService) private statusService: IStatusService
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
					const provider = settings.providers.find((p: ProviderSettings) => p.tag === tag)
					if (!provider) {
						this.notificationService.error(`Assistant ${tag} not found`)
						return
					}

					const defaultUserMark = toSpeakMark(settings.userTags[0])
					const mark = toSpeakMark(tag)
					const { range, role, tagContent, tagRange } = fetchTagMeta(app, editor, settings)

					// Update status using DI service
					this.statusService.updateStatus(`Generating response with ${provider.name}...`)

					// Insert assistant tag
					const insertResult = insertMarkToBegin(
						editor,
						range,
						mark,
						role,
						tagContent,
						tagRange
					)

					if (isEmptyLines(tagContent)) {
						insertMarkToEmptyLines(editor, insertResult, defaultUserMark, 'user')
					}

					// Generate response with DI services
					await generate({
						editor,
						app,
						settings,
						provider,
						range,
						role,
						tagContent,
						tagRange,
						requestController,
						afterTagInsert: (newRange) => {
							if (tagContent && tagContent.trim().length > 0 && !isEmptyLines(tagContent)) {
								insertText(editor, newRange.end, HARD_LINE_BREAK)
							}
						}
					})

					this.loggingService.info(`Assistant tag ${tag} executed successfully`)
				} catch (error) {
					this.loggingService.error(`Error executing assistant tag ${tag}:`, error)
					this.notificationService.error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`)
					this.statusService.setError()
				}
			}
		}
	}
}