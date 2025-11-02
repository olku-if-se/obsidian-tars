import { InjectionToken } from '@needle-di/core'
import type { App, Notice } from 'obsidian'
import type { Vendor } from '../providers/index'
import type { PluginSettings } from '../settings'

// Command interface
export interface Command {
  id: string
  name: string
  // biome-ignore lint/suspicious/noExplicitAny: Obsidian editor and view types are complex and not worth fully typing for this interface
  editorCallback?: (editor: any, view: any) => void
  callback?: () => void
}

// Command collection token
export const Commands = new InjectionToken<Command[]>('Commands')

// Notifications service token
export const NotificationsService = new InjectionToken<NotificationsService>('NotificationsService')

// Notification config token (optional for customization)
export const NotificationConfig = new InjectionToken<{ timeout?: number; maxActive?: number }>('NotificationConfig')

// Core Obsidian token
export const ObsidianApp = new InjectionToken<App>('ObsidianApp')

// App settings token
export const AppSettings = new InjectionToken<PluginSettings>('AppSettings')

// AI providers collection token
export const AiProviders = new InjectionToken<Vendor[]>('AiProviders')

// Tars plugin token
export const TarsPlugin = new InjectionToken<unknown>('TarsPlugin')

// Organized tokens object for clean imports
export const Tokens = {
  Commands,
  NotificationsService,
  NotificationConfig,
  AiProviders,
  TarsPlugin,
  ObsidianApp,
  AppSettings,
} as const

// Legacy exports for backward compatibility (deprecated)
export const OBSIDIAN_APP = ObsidianApp
export const TARS_PLUGIN_DEPRECATED = TarsPlugin
export const APP_SETTINGS = AppSettings
export const AI_PROVIDERS = AiProviders
export const COMMANDS_DEPRECATED = Commands
export const NOTIFICATIONS_SERVICE = NotificationsService

// Type interfaces for services
export interface NotificationsService {
  show(options: { message: string; timeout?: number; type?: 'info' | 'success' | 'warning' | 'error' }): {
    notice: Notice
    id: string
  }
  remove(id: string): void
  clearAll(): void
  getActiveCount(): number
}

export interface CommandRegistry {
  register(): void
  unregister(): void
}

export interface ProviderRegistry {
  getProvider(name: string): Vendor | null
  getAllProviders(): Vendor[]
  registerProvider(provider: Vendor): void
}

export interface StatusBarService {
  initialize(): void
  updateStatus(text: string): void
  dispose(): void
}

export interface EditorSuggestService {
  register(): void
  unregister(): void
}

export interface SettingsService {
  load(): Promise<void>
  save(): Promise<void>
  get<T>(key: string): T
  set<T>(key: string, value: T): void
  onChange(callback: (settings: PluginSettings) => void): () => void
}
