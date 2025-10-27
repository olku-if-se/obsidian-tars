import { TarsCorePlugin, TarsSettingsManager } from '@tars/core'
import type { TarsPlugin as ITarsPlugin, TarsSettings } from '@tars/types'
import { Plugin } from 'obsidian'

interface PluginAdapter {
  loadData(): Promise<unknown>
  saveData(data: unknown): Promise<void>
}

export default class TarsPlugin extends Plugin implements ITarsPlugin, PluginAdapter {
  settings!: TarsSettings
  corePlugin!: InstanceType<typeof TarsCorePlugin>
  settingsManager!: InstanceType<typeof TarsSettingsManager>

  async onload() {
    console.log('Loading Tars Plugin')

    // Initialize settings manager
    this.settingsManager = new TarsSettingsManager(this)

    // Load settings
    this.settings = await this.settingsManager.loadSettings()

    // Initialize core plugin
    this.corePlugin = new TarsCorePlugin({
      settings: this.settings,
      eventBus: null, // Will be initialized later if needed
    })

    // Add basic command for testing
    this.addCommand({
      id: 'tars-test',
      name: 'Test Tars',
      callback: () => {
        console.log('Tars plugin is working!')
      },
    })
  }

  async onunload() {
    console.log('Unloading Tars Plugin')
  }

  async saveSettings() {
    await this.settingsManager.saveSettings(this.settings)
  }
}
