import {
  type App,
  type Command,
  type Editor,
  type MarkdownFileInfo,
  type MarkdownView,
  Notice,
  Platform,
} from 'obsidian'
import { t } from '../lang/helper'
import type { PluginSettings } from '../settings'
import { toSpeakMark } from '../suggest'
import type { TagCmdMeta } from './tagCmd'
import {
  fetchTagMeta,
  insertMarkToBegin,
  insertMarkToEmptyLines,
  isEmptyLines,
  replaceTag,
} from './tagUtils'

export const systemTagCmd = (
  { id, name, tag }: TagCmdMeta,
  app: App,
  settings: PluginSettings
): Command => ({
  id,
  name,
  editorCallback:
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: preserving existing branching logic
    async (editor: Editor, _ctx: MarkdownView | MarkdownFileInfo) => {
    try {
      const mark = toSpeakMark(tag)
      const { range, role, tagContent, tagRange } = fetchTagMeta(
        app,
        editor,
        settings
      )
      console.debug('systemTagCmd', { range, role, tagContent, tagRange })

      // If it's an empty line, directly insert the tag
      if (isEmptyLines(editor, range)) {
        return insertMarkToEmptyLines(editor, range.from, mark)
      }

      // If it's plain text, insert the tag at the beginning
      if (role === null) {
        return insertMarkToBegin(editor, range, mark)
      }

      // If it's a system tag, but different tag, replace it
      if (role === 'system') {
        if (tag !== tagContent && tagRange) {
          return replaceTag(editor, range, tagRange, tag)
        }
      } else {
        // For the remaining types, which are incompatible types, show a notice indicating what message type was selected and keep the text selected.
        editor.setSelection(range.from, range.to)
        new Notice(
          `${t('Conversion failed. Selected sections is a')} ${t(role)} ${t('message')}`
        )
      }
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
