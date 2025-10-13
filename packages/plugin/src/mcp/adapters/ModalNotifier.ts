/**
 * Obsidian-specific notification handler implementation
 * Implements INotificationHandler interface using Obsidian's Notice and Modal system
 */

import type { INotificationHandler } from '@tars/mcp-hosting'
import { Notice } from 'obsidian'

export class ModalNotifier implements INotificationHandler {
	constructor(_app: any) {}

	async onSessionLimitReached(documentPath: string, limit: number, current: number): Promise<'continue' | 'cancel'> {
		return new Promise((resolve) => {
			try {
				const notice: any = new Notice('', 0)
				const root = notice?.noticeEl?.createDiv?.({ cls: 'mcp-session-notice' }) ?? null
				const container = root ?? notice?.noticeEl
				if (!container) {
					resolve('cancel')
					return
				}

				if (typeof container.empty === 'function') {
					container.empty()
				} else {
					if ('innerHTML' in container) {
						;(container as HTMLElement).innerHTML = ''
					}
					if ('textContent' in container) {
						container.textContent = ''
					}
				}

				container.createEl?.('p', {
					text: `Session limit reached for this document (total across all servers).`
				})
				container.createEl?.('p', {
					cls: 'mcp-session-limit-meta',
					text: `Document: ${documentPath} — ${current}/${limit}`
				})

				const actions = container.createDiv?.({ cls: 'mcp-session-actions' }) ?? container

				const cleanup = (result: 'continue' | 'cancel') => {
					if (typeof notice?.hide === 'function') {
						notice.hide()
					}
					resolve(result)
				}

				const continueBtn = actions.createEl?.('button', {
					cls: 'mod-cta',
					text: 'Continue'
				})
				continueBtn?.addEventListener('click', () => cleanup('continue'))

				const cancelBtn = actions.createEl?.('button', { text: 'Cancel' })
				cancelBtn?.addEventListener('click', () => cleanup('cancel'))
			} catch {
				resolve('cancel')
			}
		})
	}

	onSessionReset(documentPath: string): void {
		try {
			new Notice(`Session counter reset for ${documentPath}`, 4000)
		} catch {
			// Ignore notice failures in environments without UI
		}
	}

	onServerAutoDisabled(_serverId: string, serverName: string, failureCount: number): void {
		try {
			new Notice(`MCP server "${serverName}" has been automatically disabled after ${failureCount} failures`, 6000)
		} catch {
			// Ignore notice failures in environments without UI
		}
	}
}
