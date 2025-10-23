import type { EmbedCache } from '../providers/base'
import type { DocumentWriteLock, IDocumentService, INotificationService, ISettingsService } from '../services'

class NoopDocumentWriteLock implements DocumentWriteLock {
	async runExclusive<T>(fn: () => T | Promise<T>): Promise<T> {
		return await fn()
	}

	isLocked(): boolean {
		return false
	}

	tryAcquire(): boolean {
		return true
	}

	release(): void {}
}

export class MockNotificationService implements INotificationService {
	show(_message: string): void {}

	warn(_message: string): void {}

	error(_message: string): void {}
}

export class MockSettingsService implements ISettingsService {
	private store = new Map<string, unknown>()
	private watchers = new Map<string, Set<(value: unknown) => void>>()

	async initialize(): Promise<void> {}

	get<T>(key: string, defaultValue?: T): T {
		if (this.store.has(key)) {
			return this.store.get(key) as T
		}
		return defaultValue as T
	}

	async set(key: string, value: unknown): Promise<void> {
		this.store.set(key, value)
		this.notify(key, value)
	}

	watch(key: string, callback: (value: unknown) => void): () => void {
		const callbacks = this.watchers.get(key) ?? new Set<(value: unknown) => void>()
		callbacks.add(callback)
		this.watchers.set(key, callbacks)
		return () => {
			callbacks.delete(callback)
			if (callbacks.size === 0) {
				this.watchers.delete(key)
			}
		}
	}

	getAll(): Record<string, unknown> {
		return Object.fromEntries(this.store.entries())
	}

	async setAll(settings: Record<string, unknown>): Promise<void> {
		this.store = new Map(Object.entries(settings))
		for (const [key, value] of this.store.entries()) {
			this.notify(key, value)
		}
	}

	has(key: string): boolean {
		return this.store.has(key)
	}

	async remove(key: string): Promise<void> {
		this.store.delete(key)
		this.notify(key, undefined)
	}

	async clear(): Promise<void> {
		const keys = Array.from(this.store.keys())
		this.store.clear()
		for (const key of keys) {
			this.notify(key, undefined)
		}
	}

	private notify(key: string, value: unknown): void {
		const callbacks = this.watchers.get(key)
		if (!callbacks) return
		for (const cb of callbacks) {
			cb(value)
		}
	}
}

export class MockDocumentService implements IDocumentService {
	getCurrentDocumentPath(): string {
		return ''
	}

	async resolveEmbedAsBinary(_embed: EmbedCache): Promise<ArrayBuffer> {
		return new ArrayBuffer(0)
	}

	async createPlainText(_filePath: string, _text: string): Promise<void> {}

	getDocumentWriteLock(): DocumentWriteLock {
		return new NoopDocumentWriteLock()
	}

	normalizePath(path: string): string {
		return path
	}

	getFileBasename(): string {
		return ''
	}

	getFileExtension(): string {
		return ''
	}

	getFolderPath(): string {
		return ''
	}

	fileExists(_path: string): boolean {
		return false
	}

	async readFile(_path: string): Promise<string> {
		return ''
	}

	async writeFile(_path: string, _content: string): Promise<void> {}

	getFolderFiles(_folderPath: string, _extension?: string): string[] {
		return []
	}
}

export function createMockNotificationService(): INotificationService {
	return new MockNotificationService()
}

export function createMockSettingsService(): ISettingsService {
	return new MockSettingsService()
}

export function createMockDocumentService(): IDocumentService {
	return new MockDocumentService()
}
