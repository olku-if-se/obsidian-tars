// Central injection tokens for dependency injection
// Interfaces can't be used as tokens with isolatedModules

// Framework instance tokens
export const PluginSettingsToken = Symbol('PluginSettings')
export const StatusBarManagerToken = Symbol('StatusBarManager')

// Status bar tokens
export const StatusBarReactManagerToken = Symbol('StatusBarReactManager')

export const SettingsServiceToken = Symbol('SettingsService')

// Type assertions to help TypeScript understand the token-service relationship
export type PluginSettingsToken = typeof PluginSettingsToken
export type StatusBarManagerToken = typeof StatusBarManagerToken
export type SettingsServiceToken = typeof SettingsServiceToken
export type StatusBarReactManagerToken = typeof StatusBarReactManagerToken
