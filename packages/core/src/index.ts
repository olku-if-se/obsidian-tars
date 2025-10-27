// Core plugin logic for Tars Obsidian Plugin
// This will be expanded with proper plugin logic as migration progresses

// Re-export from plugin.ts
export { TarsCorePlugin } from './plugin'
export type { TarsCorePluginOptions } from './plugin'

// Re-export from settings.ts
export { TarsSettingsManager } from './settings'
export type { PluginAdapter } from './settings'

// Re-export from types.ts
export type { EventBus } from './types'

// Legacy exports for backward compatibility
export class TarsPlugin {
  // Plugin core functionality will be defined here
  name: string

  constructor(name: string) {
    // Given: plugin name
    // When: initializing core plugin
    // Then: create new plugin instance
    this.name = name
  }

  initialize(): void {
    // Given: plugin instance
    // When: initializing plugin
    // Then: setup plugin functionality
    console.log(`Initializing ${this.name} plugin`)
  }
}

export function createPlugin(name: string): TarsPlugin {
  // Given: plugin name
  // When: creating new plugin
  // Then: return plugin instance
  return new TarsPlugin(name)
}

// Core functionality is already exported above
