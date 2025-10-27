import {
  type Command,
  type Editor,
  type MarkdownFileInfo,
  type MarkdownView,
  Notice,
  Platform,
} from 'obsidian'
import { t } from '../lang/helper'
import { toNewChatMark } from '../suggest'
import type { TagCmdMeta } from './tagCmd'

export const newChatTagCmd = ({ id, name, tag }: TagCmdMeta): Command => ({
  id,
  name,
  editorCallback: async (
    editor: Editor,
    _ctx: MarkdownView | MarkdownFileInfo
  ) => {
    try {
      // Keep it simple for now, just insert directly. No other checks or line break handling.
      const cursor = editor.getCursor()
      const mark = toNewChatMark(tag)
      editor.replaceRange(mark, cursor)
      editor.setCursor(cursor.line, cursor.ch + mark.length)
    } catch (error) {
      console.error(error)
      const err =
        error instanceof Error ? error : new Error(String(error ?? ''))
      new Notice(
        `🔴 ${Platform.isDesktopApp ? t('Check the developer console for error details. ') : ''}${err.message}`,
        10 * 1000
      )
    }
  },
})
