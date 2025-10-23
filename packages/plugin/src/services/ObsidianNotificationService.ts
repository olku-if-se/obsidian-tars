import { injectable } from '@needle-di/core'
import { Notice } from 'obsidian'
import { INotificationService } from '@tars/contracts'

@injectable()
export class ObsidianNotificationService implements INotificationService {
	show(message: string): void {
		new Notice(message)
	}

	warn(message: string): void {
		new Notice(`⚠️ ${message}`, 5000)
	}

	error(message: string): void {
		new Notice(`❌ ${message}`, 8000)
	}
}
