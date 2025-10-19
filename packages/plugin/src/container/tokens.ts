// Central injection tokens for dependency injection
// Interfaces can't be used as tokens with isolatedModules

import type {
	ILoggingService,
	INotificationService,
	ISettingsService,
	IStatusService,
	IDocumentService
} from '@tars/contracts'

export const ILoggingServiceToken = Symbol('ILoggingService')
export const INotificationServiceToken = Symbol('INotificationService')
export const ISettingsServiceToken = Symbol('ISettingsService')
export const IStatusServiceToken = Symbol('IStatusService')
export const IDocumentServiceToken = Symbol('IDocumentService')

// Framework instance tokens
export const AppToken = Symbol('App')
export const TarsPluginToken = Symbol('TarsPlugin')
export const PluginSettingsToken = Symbol('PluginSettings')
export const StatusBarManagerToken = Symbol('StatusBarManager')

// Type assertions to help TypeScript understand the token-service relationship
export type ILoggingServiceToken = typeof ILoggingServiceToken
export type INotificationServiceToken = typeof INotificationServiceToken
export type ISettingsServiceToken = typeof ISettingsServiceToken
export type IStatusServiceToken = typeof IStatusServiceToken
export type IDocumentServiceToken = typeof IDocumentServiceToken
export type AppToken = typeof AppToken
export type TarsPluginToken = typeof TarsPluginToken
export type PluginSettingsToken = typeof PluginSettingsToken
export type StatusBarManagerToken = typeof StatusBarManagerToken