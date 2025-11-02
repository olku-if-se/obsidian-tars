import type { PluginSettings } from '../settings'
import type { BaseOptions, ProviderSettings } from '../providers/index'

/**
 * Settings change event type
 */
export interface SettingsChangeEvent {
  readonly newSettings: PluginSettings
  readonly previousSettings: PluginSettings
  readonly changes: SettingsChanges
  readonly timestamp: number
  readonly changeId: string
}

/**
 * Detailed change information
 */
export interface SettingsChanges {
  providers?: ProviderChange[]
  general?: GeneralSettingChange[]
  [key: string]: unknown
}

/**
 * Provider-specific change information
 */
export interface ProviderChange {
  readonly type: 'added' | 'removed' | 'modified'
  readonly path: string
  readonly oldValue?: ProviderSettings
  readonly newValue?: ProviderSettings
  readonly fieldChanges?: FieldChange[]
}

/**
 * General setting change information
 */
export interface GeneralSettingChange {
  readonly type: 'modified'
  readonly path: string
  readonly oldValue: unknown
  readonly newValue: unknown
}

/**
 * Individual field change within a provider
 */
export interface FieldChange {
  readonly path: string
  readonly oldValue: unknown
  readonly newValue: unknown
}

/**
 * Configuration binding options
 */
export interface ConfigBindingOptions {
  readonly autoApply?: boolean
  readonly validateOnChange?: boolean
  readonly debounceMs?: number
  readonly notifyOnNoChange?: boolean
}

/**
 * Performance metrics for configuration updates
 */
export interface ConfigUpdateMetrics {
  readonly changeId: string
  readonly startTime: number
  readonly endTime: number
  readonly duration: number
  readonly providersUpdated: number
  readonly errorsCount: number
  readonly validationTime?: number
  readonly propagationTime?: number
}

/**
 * Change history entry
 */
export interface ChangeHistoryEntry {
  readonly changeId: string
  readonly changeType: 'settings' | 'validation' | 'propagation'
  readonly timestamp: number
  readonly duration?: number
  readonly success: boolean
  readonly error?: string
}

/**
 * Change statistics
 */
export interface ChangeStatistics {
  totalChanges: number
  providersAdded: number
  providersRemoved: number
  providersModified: number
  settingsModified: number
  validationErrors: number
  lastChangeTime: number
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  readonly isValid: boolean
  readonly errors: ConfigValidationError[]
  readonly warnings: ConfigValidationWarning[]
}

/**
 * Configuration validation error
 */
export interface ConfigValidationError {
  readonly path: string
  readonly message: string
  readonly code: string
  readonly severity: 'error' | 'warning'
}

/**
 * Configuration validation warning
 */
export interface ConfigValidationWarning {
  readonly path: string
  readonly message: string
  readonly code: string
}

/**
 * Event types for settings change notifications
 */
export type SettingsEventTypes = {
  settingsChanged: SettingsChangeEvent
  validationError: ConfigValidationResult
  propagationComplete: { changeId: string; success: boolean; providerCount: number }
  propagationError: { changeId: string; error: string; providerTag?: string }
}

/**
 * Subscription function for settings changes
 */
export type SettingsSubscription = (event: SettingsChangeEvent) => void

/**
 * Unsubscribe function
 */
export type UnsubscribeFunction = () => void