import { type App, PluginSettingTab } from 'obsidian'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { StrictMode } from 'react'
import type TarsPlugin from './main'
import type { PluginSettings } from './settings'
import { adaptObsidianToReact, mergeReactChanges } from './adapters/reactSettingsAdapter'
import { SettingsProvider } from '@tars/ui/providers'
import { SettingsTab } from '@tars/ui/views'

/**
 * React-based settings tab implementation
 * Bridges Obsidian's PluginSettingTab with React components
 */
export class ReactSettingsTab extends PluginSettingTab {
	plugin: TarsPlugin
	private reactRoot: Root | null = null
	private debounceTimer: NodeJS.Timeout | null = null
	private readonly DEBOUNCE_MS = 300

	constructor(app: App, plugin: TarsPlugin) {
		super(app, plugin)
		this.plugin = plugin
	}

	/**
	 * Clean up React root when tab is hidden
	 */
	hide(): void {
		// Build tag commands before hiding
		this.plugin.buildTagCommands()

		// Clean up React root
		if (this.reactRoot) {
			this.reactRoot.unmount()
			this.reactRoot = null
		}

		// Clear any pending debounced saves
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer)
			this.debounceTimer = null
		}

		super.hide()
	}

	/**
	 * Display the React settings interface
	 */
	display(): void {
		const { containerEl } = this
		containerEl.empty()

		// Check if React settings tab is enabled
		if (!this.plugin.settings.features?.reactSettingsTab) {
			this.renderFallbackMessage()
			return
		}

		try {
			// Create React root
			this.reactRoot = createRoot(containerEl)

			// Get initial React state from Obsidian settings
			const initialReactState = adaptObsidianToReact(this.plugin.settings)

			// Render React settings with provider
			this.reactRoot.render(
				<StrictMode>
					<SettingsProvider
						initialState={initialReactState}
						onStateChange={this.handleStateChange}
					>
						<SettingsTab
							onTestMCPConnection={this.handleTestMCPConnection}
						/>
					</SettingsProvider>
				</StrictMode>
			)
		} catch (error) {
			console.error('Failed to render React settings tab:', error)
			this.renderErrorFallback(error)
		}
	}

	/**
	 * Handle state changes from React components
	 * Debounced to avoid excessive save operations
	 */
	private handleStateChange = (reactState: any): void => {
		// Clear any pending timer
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer)
		}

		// Debounce the save operation
		this.debounceTimer = setTimeout(async () => {
			try {
				// Merge React changes with existing Obsidian settings
				const mergedSettings = mergeReactChanges(this.plugin.settings, reactState)

				// Update plugin settings
				Object.assign(this.plugin.settings, mergedSettings)

				// Save to disk
				await this.plugin.saveSettings()

				console.debug('React settings saved successfully')
			} catch (error) {
				console.error('Failed to save React settings:', error)
				// Optionally show user feedback about save failure
			}
		}, this.DEBOUNCE_MS)
	}

	/**
	 * Handle MCP connection testing from React components
	 */
	private handleTestMCPConnection = async (serverId: string): Promise<{ success: boolean; message: string; latency?: number }> => {
		try {
			// Import MCP manager dynamically to avoid circular dependencies
			const { MCPServerManager } = await import('@tars/mcp-hosting')

			// Test connection using existing MCP infrastructure
			const manager = MCPServerManager.getInstance()
			const result = await manager.testConnection(serverId)

			return result
		} catch (error) {
			console.error('MCP connection test failed:', error)
			return {
				success: false,
				message: error instanceof Error ? error.message : String(error)
			}
		}
	}

	/**
	 * Render fallback message when React settings are disabled
	 */
	private renderFallbackMessage(): void {
		const { containerEl } = this
		containerEl.createEl('div', {
			text: 'React settings tab is disabled. Enable it in the React Features section.',
			cls: 'setting-item-info'
		})
	}

	/**
	 * Render error fallback when React rendering fails
	 */
	private renderErrorFallback(error: unknown): void {
		const { containerEl } = this
		containerEl.empty()

		const errorEl = containerEl.createEl('div', { cls: 'setting-item-error' })
		errorEl.createEl('h3', { text: 'Settings Loading Error' })
		errorEl.createEl('p', {
			text: 'Failed to load the React-based settings interface. Falling back to basic mode.'
		})

		if (error instanceof Error) {
			const detailsEl = errorEl.createEl('details')
			detailsEl.createEl('summary', { text: 'Error Details' })
			detailsEl.createEl('pre', {
				text: error.stack || error.message,
				cls: 'setting-item-error-details'
			})
		}

		// Add button to retry React rendering
		const retryButton = errorEl.createEl('button', {
			text: 'Retry React Settings',
			cls: 'mod-cta'
		})
		retryButton.onclick = () => this.display()
	}

	/**
	 * Force refresh the React settings
	 */
	public refresh(): void {
		if (this.reactRoot) {
			this.display()
		}
	}

	/**
	 * Check if React settings are properly initialized
	 */
	public isReactInitialized(): boolean {
		return this.reactRoot !== null
	}
}