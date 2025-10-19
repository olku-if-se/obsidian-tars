import { injectable } from '@needle-di/core'
import { App, TFile } from 'obsidian'
import { ISettingsService } from '@tars/contracts'
import { PluginSettings } from '@tars/contracts/providers'

@injectable()
export class ObsidianSettingsService implements ISettingsService {
	private app: App
	private plugin: any // TarsPlugin instance
	private settings: PluginSettings
	private watchers: Map<string, Set<(value: any) => void>> = new Map()

	constructor(app: App, plugin: any, initialSettings: PluginSettings) {
		this.app = app
		this.plugin = plugin
		this.settings = { ...initialSettings }
	}

	get<T>(key: string, defaultValue?: T): T {
		const value = (this.settings as any)[key]
		return value !== undefined ? value : defaultValue
	}

	set(key: string, value: any): void {
		(this.settings as any)[key] = value
		this.saveSettings()
		this.notifyWatchers(key, value)
	}

	watch(key: string, callback: (value: any) => void): () => void {
		if (!this.watchers.has(key)) {
			this.watchers.set(key, new Set())
		}

		const keyWatchers = this.watchers.get(key)!
		keyWatchers.add(callback)

		// Return unsubscribe function
		return () => {
			keyWatchers.delete(callback)
			if (keyWatchers.size === 0) {
				this.watchers.delete(key)
			}
		}
	}

	getAll(): Record<string, any> {
		return { ...this.settings }
	}

	setAll(settings: Record<string, any>): void {
		this.settings = { ...this.settings, ...settings }
		this.saveSettings()
		this.notifyAllWatchers()
	}

	has(key: string): boolean {
		return key in this.settings
	}

	remove(key: string): void {
		delete (this.settings as any)[key]
		this.saveSettings()
		this.notifyWatchers(key, undefined)
	}

	clear(): void {
		this.settings = {}
		this.saveSettings()
		this.notifyAllWatchers()
	}

	private async saveSettings(): Promise<void> {
		if (this.plugin && this.plugin.saveSettings) {
			await this.plugin.saveSettings()
		}
	}

	private notifyWatchers(key: string, value: any): void {
		const keyWatchers = this.watchers.get(key)
		if (keyWatchers) {
			keyWatchers.forEach(callback => callback(value))
		}
	}

	private notifyAllWatchers(): void {
		for (const [key, value] of Object.entries(this.settings)) {
			this.notifyWatchers(key, value)
		}
	}

	// Additional Obsidian-specific methods

	/**
	 * Get the app folder name for logging
	 */
	getAppFolder(): string {
		const adapter = this.app.vault.adapter
		const basePath = adapter.getBasePath()
		return basePath ? basePath.split('/').pop() || 'Tars' : 'Tars'
	}

	/**
	 * Get the current active file path
	 */
	getActiveFilePath(): string | null {
		const activeFile = this.app.workspace.getActiveFile()
		return activeFile ? activeFile.path : null
	}

	/**
	 * Read a file from the vault
	 */
	async readFile(path: string): Promise<string> {
		const file = this.app.vault.getAbstractFileByPath(path)
		if (file instanceof TFile) {
			return await this.app.vault.read(file)
		}
		throw new Error(`File not found: ${path}`)
	}

	/**
	 * Write content to a file in the vault
	 */
	async writeFile(path: string, content: string): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(path)
		if (file instanceof TFile) {
			await this.app.vault.modify(file, content)
		} else {
			await this.app.vault.create(path, content)
		}
	}
}