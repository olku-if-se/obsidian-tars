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
import { fetchTagMeta, insertMarkToBegin, insertMarkToEmptyLines, isEmptyLines, replaceTag } from './tagUtils'

export const userTagCmd = ({ id, name, tag }: TagCmdMeta, app: App, settings: PluginSettings): Command => ({
  id,
  name,
  editorCallback:
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: preserving existing branching logic
    async (editor: Editor, _ctx: MarkdownView | MarkdownFileInfo) => {
      try {
        const mark = toSpeakMark(tag)
        const { range, role, tagContent, tagRange } = fetchTagMeta(app, editor, settings)
        console.debug('userTagCmd', { range, role, tagContent, tagRange })

        // If it's an empty line, directly insert the tag
        if (isEmptyLines(editor, range)) {
          return insertMarkToEmptyLines(editor, range.from, mark)
        }

        // If it's plain text, insert the tag at the beginning
        if (role === null) {
          return insertMarkToBegin(editor, range, mark)
        }

        // If it's a userTag, but different tag, replace it
        if (role === 'user') {
          if (tag !== tagContent && tagRange) {
            return replaceTag(editor, range, tagRange, tag)
          }
        } else {
          // Remaining types are incompatible types. Show a notice indicating the selected content is an xx message type, while keeping the text selected.
          editor.setSelection(range.from, range.to)
          new Notice(`${t('Conversion failed. Selected sections is a')} ${t(role)} ${t('message')}`)
        }
      } catch (error) {
        console.error(error)
        const err = error instanceof Error ? error : new Error(String(error ?? ''))
        new Notice(
          `🔴 ${Platform.isDesktopApp ? t('Check the developer console for error details. ') : ''}${err.message}`,
          10 * 1000
        )
      }
    },
})
