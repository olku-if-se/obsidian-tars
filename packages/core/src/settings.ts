import type { TarsSettings } from '@tars/types'

export interface PluginAdapter {
  loadData(): Promise<unknown>
  saveData(data: unknown): Promise<void>
}

export class TarsSettingsManager {
  private plugin: PluginAdapter

  constructor(plugin: PluginAdapter) {
    this.plugin = plugin
  }

  async loadSettings(): Promise<TarsSettings> {
    try {
      const data = await this.plugin.loadData()
      return this.mergeWithDefaults(data || {})
    } catch (error) {
      console.error('Failed to load settings:', error)
      return this.getDefaultSettings()
    }
  }

  async saveSettings(settings: TarsSettings): Promise<void> {
    try {
      await this.plugin.saveData(settings)
    } catch (error) {
      console.error('Failed to save settings:', error)
      throw error
    }
  }

  private getDefaultSettings(): TarsSettings {
    return {
      providers: new Map(),
      mcpServers: new Map(),
      tags: {
        user: '#User:',
        assistant: '#Claude:',
        system: '#System:',
        newChat: '#NewChat:',
      },
      features: {
        enableSuggestions: true,
        enableStreaming: true,
        maxTokens: 4000,
      },
    } as TarsSettings
  }

  private mergeWithDefaults(data: unknown): TarsSettings {
    const defaults = this.getDefaultSettings()
    // Type assertion needed because TarsSettings currently has an index signature with any
    // This will be improved when proper type definitions are added
    const settingsData = data as Partial<TarsSettings>
    return { ...defaults, ...settingsData }
  }

  updateSettings(
    currentSettings: TarsSettings,
    updates: Partial<TarsSettings>
  ): { success: boolean; errors?: string[] } {
    try {
      Object.assign(currentSettings, updates)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      }
    }
  }
}
