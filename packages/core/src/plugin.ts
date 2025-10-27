import type { TarsPlugin, TarsSettings } from '@tars/types'
import type { EventBus } from './types'

export interface TarsCorePluginOptions {
  settings: TarsSettings
  eventBus: EventBus | null
}

export class TarsCorePlugin implements Partial<TarsPlugin> {
  public eventBus: EventBus | null = null
  public settings: TarsSettings

  constructor(options: TarsCorePluginOptions) {
    this.settings = options.settings
    this.eventBus = options.eventBus
  }

  // Basic core functionality will be added here
  initialize(): void {
    console.log('Tars Core Plugin initialized')
  }

  updateSettings(newSettings: TarsSettings): void {
    this.settings = newSettings
  }
}
