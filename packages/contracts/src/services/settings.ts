/**
 * Settings service interface for managing plugin configuration
 */
export interface ISettingsService {
	/**
	 * Get a setting value with optional default
	 */
	get<T>(key: string, defaultValue?: T): T

	/**
	 * Set a setting value
	 */
	set(key: string, value: unknown): void

	/**
	 * Watch for changes to a setting value
	 * Returns an unsubscribe function
	 */
	watch(key: string, callback: (value: unknown) => void): () => void

	/**
	 * Get all settings as an object
	 */
	getAll(): Record<string, unknown>

	/**
	 * Set multiple settings at once
	 */
	setAll(settings: Record<string, unknown>): void

	/**
	 * Check if a setting exists
	 */
	has(key: string): boolean

	/**
	 * Remove a setting
	 */
	remove(key: string): void

	/**
	 * Clear all settings
	 */
	clear(): void
}
