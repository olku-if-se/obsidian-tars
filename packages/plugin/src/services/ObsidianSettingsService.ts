import { inject, injectable } from '@needle-di/core'
import type { ISettingsService } from '@tars/contracts'
import { AppToken, TarsPluginToken } from '@tars/contracts'
import { type App, type Plugin, TFile } from 'obsidian'
import type { PluginSettings } from '../settings'
import { DEFAULT_SETTINGS } from '../settings'

@injectable()
export class ObsidianSettingsService implements ISettingsService {
	private app: App
	private plugin: Plugin
	private settings: PluginSettings
	private watchers: Map<string, Set<(value: unknown) => void>> = new Map()
	private initialized = false

	constructor(app: App = inject(AppToken), plugin: Plugin = inject(TarsPluginToken)) {
		this.app = app
		this.plugin = plugin
		this.settings = { ...DEFAULT_SETTINGS }
	}

	/**
	 * Initialize settings by loading from Obsidian's storage
	 * This should be called once during plugin initialization
	 */
	async initialize(): Promise<void> {
		if (this.initialized) {
			return
		}

		try {
			const data = await this.loadData()
			this.settings = Object.assign({}, DEFAULT_SETTINGS, data)
			this.settings.uiState = {
				...DEFAULT_SETTINGS.uiState,
				...this.settings.uiState
			}
			this.initialized = true
		} catch (error) {
			console.error('Failed to load settings, using defaults:', error)
			this.settings = { ...DEFAULT_SETTINGS }
			this.initialized = true
		}
	}

	/**
	 * Load settings data from Obsidian's storage
	 */
	private async loadData(): Promise<Partial<PluginSettings>> {
		return await this.plugin.loadData()
	}

	get<T>(key: string, defaultValue?: T): T {
		const value = (this.settings as unknown as Record<string, unknown>)[key]
		return value !== undefined ? (value as T) : defaultValue
	}

	async set(key: string, value: unknown): Promise<void> {
		;(this.settings as unknown as Record<string, unknown>)[key] = value
		await this.saveSettings()
		this.notifyWatchers(key, value)
	}

	watch(key: string, callback: (value: unknown) => void): () => void {
		if (!this.watchers.has(key)) {
			this.watchers.set(key, new Set())
		}

		const keyWatchers = this.watchers.get(key)
		if (!keyWatchers) {
			return () => {} // Return empty function if somehow keyWatchers is undefined
		}

		keyWatchers.add(callback)

		// Return unsubscribe function
		return () => {
			keyWatchers.delete(callback)
			if (keyWatchers.size === 0) {
				this.watchers.delete(key)
			}
		}
	}

	getAll(): Record<string, unknown> {
		return { ...this.settings }
	}

	async setAll(settings: Record<string, unknown>): Promise<void> {
		this.settings = { ...this.settings, ...settings }
		await this.saveSettings()
		this.notifyAllWatchers()
	}

	has(key: string): boolean {
		return key in this.settings
	}

	async remove(key: string): Promise<void> {
		delete (this.settings as unknown as Record<string, unknown>)[key]
		await this.saveSettings()
		this.notifyWatchers(key, undefined)
	}

	async clear(): Promise<void> {
		this.settings = { ...DEFAULT_SETTINGS }
		await this.saveSettings()
		this.notifyAllWatchers()
	}

	/**
	 * Save settings to Obsidian's storage
	 */
	async saveSettings(): Promise<void> {
		await this.plugin.saveData(this.settings)
	}

	private notifyWatchers(key: string, value: unknown): void {
		const keyWatchers = this.watchers.get(key)
		if (keyWatchers) {
			keyWatchers.forEach((callback) => callback(value))
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
		// Try to get vault name from the active file or fallback to default
		const activeFile = this.app.workspace.getActiveFile()
		if (activeFile?.path) {
			const pathParts = activeFile.path.split('/')
			return pathParts.length > 1 ? pathParts[0] : 'Tars'
		}
		return 'Tars'
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
		try {
			const file = this.app.vault.getAbstractFileByPath(path)
			if (file instanceof TFile) {
				return await this.app.vault.read(file)
			}
			throw new Error(`File not found: ${path}`)
		} catch (error) {
			throw new Error(`Failed to read file ${path}: ${error instanceof Error ? error.message : String(error)}`)
		}
	}

	/**
	 * Write content to a file in the vault
	 */
	async writeFile(path: string, content: string): Promise<void> {
		try {
			const file = this.app.vault.getAbstractFileByPath(path)
			if (file instanceof TFile) {
				await this.app.vault.modify(file, content)
			} else {
				await this.app.vault.create(path, content)
			}
		} catch (error) {
			throw new Error(`Failed to write file ${path}: ${error instanceof Error ? error.message : String(error)}`)
		}
	}
}
