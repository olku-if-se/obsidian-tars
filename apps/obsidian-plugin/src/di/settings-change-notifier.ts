import { EventEmitter } from 'node:events'
import { injectable, inject } from '@needle-di/core'
import type { PluginSettings, ProviderSettings } from '../settings'
import type {
  SettingsChangeEvent,
  SettingsChanges,
  ProviderChange,
  GeneralSettingChange,
  FieldChange,
  ConfigUpdateMetrics,
  ChangeHistoryEntry,
  ChangeStatistics,
  SettingsSubscription,
  UnsubscribeFunction,
} from './types'
import { Tokens } from './tokens'

// Error messages
const Errors = {
  invalid_settings: 'Invalid settings provided',
  comparison_failed: 'Failed to compare settings',
  event_emission_failed: 'Failed to emit settings change event',
  subscription_invalid: 'Invalid subscription function',
} as const

// Custom exceptions
export class SettingsChangeError extends Error {
  static invalidSettings = (cause?: unknown) =>
    Object.assign(new SettingsChangeError(`${Errors.invalid_settings}: ${cause}`), {
      code: 'INVALID_SETTINGS',
      cause,
    })

  static comparisonFailed = (cause?: unknown) =>
    Object.assign(new SettingsChangeError(`${Errors.comparison_failed}: ${cause}`), {
      code: 'COMPARISON_FAILED',
      cause,
    })

  static eventEmissionFailed = (cause?: unknown) =>
    Object.assign(new SettingsChangeError(`${Errors.event_emission_failed}: ${cause}`), {
      code: 'EVENT_EMISSION_FAILED',
      cause,
    })
}

/**
 * Utility functions for deep comparison and change detection
 */
const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true

  if (a == null || b == null) return a === b

  if (typeof a !== typeof b) return false

  if (typeof a !== 'object') return a === b

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, index) => deepEqual(item, b[index]))
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false

  const keysA = Object.keys(a as Record<string, unknown>)
  const keysB = Object.keys(b as Record<string, unknown>)

  if (keysA.length !== keysB.length) return false

  return keysA.every(key =>
    deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
  )
}

const generateChangeId = (): string =>
  `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

/**
 * Settings Change Notifier service
 * Provides reactive settings change detection and notification
 */
@injectable()
export class SettingsChangeNotifier extends EventEmitter {
  private currentSettings: PluginSettings | null = null
  private changeHistory: ChangeHistoryEntry[] = []
  private subscriptions: Set<SettingsSubscription> = new Set()
  private metrics: Map<string, ConfigUpdateMetrics> = new Map()

  constructor(private settings = inject(Tokens.AppSettings)) {
    super()
    this.currentSettings = settings
    this.setMaxListeners(100) // Allow many listeners for providers
  }

  /**
   * Notify that settings have changed
   */
  notifySettingsChanged(
    newSettings: PluginSettings,
    previousSettings?: PluginSettings | null
  ): void {
    try {
      const startTime = Date.now()
      const changeId = generateChangeId()

      const prev = previousSettings ?? this.currentSettings

      if (!newSettings || !prev) {
        throw SettingsChangeError.invalidSettings('Settings objects are required')
      }

      const changes = this.detectChanges(newSettings, prev)
      const timestamp = Date.now()

      const event: SettingsChangeEvent = {
        newSettings,
        previousSettings: prev,
        changes,
        timestamp,
        changeId,
      }

      // Update current settings
      this.currentSettings = newSettings

      // Record metrics
      const metrics: ConfigUpdateMetrics = {
        changeId,
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        providersUpdated: changes.providers?.length || 0,
        errorsCount: 0,
      }
      this.metrics.set(changeId, metrics)

      // Record in history
      const historyEntry: ChangeHistoryEntry = {
        changeId,
        changeType: 'settings',
        timestamp,
        duration: metrics.duration,
        success: true,
      }
      this.changeHistory.push(historyEntry)

      // Keep history size manageable
      if (this.changeHistory.length > 100) {
        this.changeHistory = this.changeHistory.slice(-50)
      }

      // Emit events
      this.emit('settingsChanged', event)
      this.notifySubscriptions(event)

    } catch (error) {
      throw SettingsChangeError.eventEmissionFailed(error)
    }
  }

  /**
   * Detect changes between two settings objects
   */
  private detectChanges(newSettings: PluginSettings, previousSettings: PluginSettings): SettingsChanges {
    const changes: SettingsChanges = {}

    // Detect provider changes
    const providerChanges = this.detectProviderChanges(
      newSettings.providers || [],
      previousSettings.providers || []
    )
    if (providerChanges.length > 0) {
      changes.providers = providerChanges
    }

    // Detect general setting changes
    const generalChanges = this.detectGeneralChanges(newSettings, previousSettings)
    if (generalChanges.length > 0) {
      changes.general = generalChanges
    }

    return changes
  }

  /**
   * Detect provider-specific changes
   */
  private detectProviderChanges(
    newProviders: ProviderSettings[],
    previousProviders: ProviderSettings[]
  ): ProviderChange[] {
    const changes: ProviderChange[] = []

    // Create maps for easier comparison
    const previousMap = new Map(previousProviders.map(p => [p.tag, p]))
    const newMap = new Map(newProviders.map(p => [p.tag, p]))

    // Find added providers
    for (const [tag, provider] of newMap) {
      if (!previousMap.has(tag)) {
        changes.push({
          type: 'added',
          path: `providers[${newProviders.indexOf(provider)}]`,
          newValue: provider,
        })
      }
    }

    // Find removed providers
    for (const [tag, provider] of previousMap) {
      if (!newMap.has(tag)) {
        changes.push({
          type: 'removed',
          path: `providers[${previousProviders.indexOf(provider)}]`,
          oldValue: provider,
        })
      }
    }

    // Find modified providers
    for (const [tag, newProvider] of newMap) {
      const previousProvider = previousMap.get(tag)
      if (previousProvider && !deepEqual(newProvider, previousProvider)) {
        const fieldChanges = this.detectFieldChanges(newProvider, previousProvider, tag)
        changes.push({
          type: 'modified',
          path: `providers[${newProviders.indexOf(newProvider)}]`,
          oldValue: previousProvider,
          newValue: newProvider,
          fieldChanges,
        })
      }
    }

    return changes
  }

  /**
   * Detect field-level changes within a provider
   */
  private detectFieldChanges(
    newProvider: ProviderSettings,
    previousProvider: ProviderSettings,
    tag: string
  ): FieldChange[] {
    const fieldChanges: FieldChange[] = []

    // Compare all fields
    const fields: (keyof ProviderSettings)[] = ['tag', 'vendor', 'options']

    for (const field of fields) {
      const newValue = newProvider[field]
      const oldValue = previousProvider[field]

      if (!deepEqual(newValue, oldValue)) {
        fieldChanges.push({
          path: `providers.${tag}.${field}`,
          oldValue,
          newValue,
        })
      }
    }

    // Deep dive into options
    if (newProvider.options && previousProvider.options) {
      const optionFields: (keyof NonNullable<ProviderSettings['options']>)[] = [
        'apiKey', 'baseURL', 'model', 'parameters', 'enableWebSearch'
      ]

      for (const field of optionFields) {
        const newValue = newProvider.options[field]
        const oldValue = previousProvider.options[field]

        if (!deepEqual(newValue, oldValue)) {
          fieldChanges.push({
            path: `providers.${tag}.options.${field}`,
            oldValue,
            newValue,
          })
        }
      }
    }

    return fieldChanges
  }

  /**
   * Detect general (non-provider) setting changes
   */
  private detectGeneralChanges(
    newSettings: PluginSettings,
    previousSettings: PluginSettings
  ): GeneralSettingChange[] {
    const changes: GeneralSettingChange[] = []

    // List of general settings to monitor (exclude providers)
    const generalFields: (keyof PluginSettings)[] = [
      'editorStatus',
      'systemTags',
      'newChatTags',
      'userTags',
      'roleEmojis',
      'promptTemplates',
      'enableInternalLink',
      'enableInternalLinkForAssistantMsg',
      'confirmRegenerate',
      'enableTagSuggest',
      'tagSuggestMaxLineLength',
      'answerDelayInMilliseconds',
      'enableExportToJSONL',
      'enableReplaceTag',
      'enableDefaultSystemMsg',
      'defaultSystemMsg',
      'enableStreamLog',
    ]

    for (const field of generalFields) {
      const newValue = newSettings[field]
      const oldValue = previousSettings[field]

      if (!deepEqual(newValue, oldValue)) {
        changes.push({
          type: 'modified',
          path: field,
          oldValue,
          newValue,
        })
      }
    }

    return changes
  }

  /**
   * Subscribe to settings changes
   */
  subscribe(callback: SettingsSubscription): UnsubscribeFunction {
    if (typeof callback !== 'function') {
      throw new Error(Errors.subscription_invalid)
    }

    this.subscriptions.add(callback)

    return () => {
      this.subscriptions.delete(callback)
    }
  }

  /**
   * Notify all subscribers
   */
  private notifySubscriptions(event: SettingsChangeEvent): void {
    for (const subscription of this.subscriptions) {
      try {
        subscription(event)
      } catch (error) {
        console.error('Error in settings subscription callback:', error)
      }
    }
  }

  /**
   * Get current settings snapshot
   */
  getCurrentSettings(): PluginSettings | null {
    return this.currentSettings ? { ...this.currentSettings } : null
  }

  /**
   * Get change history
   */
  getChangeHistory(): ChangeHistoryEntry[] {
    return [...this.changeHistory]
  }

  /**
   * Clear change history
   */
  clearChangeHistory(): void {
    this.changeHistory = []
  }

  /**
   * Get change statistics
   */
  getChangeStatistics(): ChangeStatistics {
    const stats: ChangeStatistics = {
      totalChanges: this.changeHistory.length,
      providersAdded: 0,
      providersRemoved: 0,
      providersModified: 0,
      settingsModified: 0,
      validationErrors: 0,
      lastChangeTime: 0,
    }

    if (this.changeHistory.length > 0) {
      stats.lastChangeTime = this.changeHistory[this.changeHistory.length - 1].timestamp
    }

    // Count recent provider changes from metrics
    for (const metrics of this.metrics.values()) {
      stats.providersModified += metrics.providersUpdated
    }

    return stats
  }

  /**
   * Get metrics for a specific change
   */
  getChangeMetrics(changeId: string): ConfigUpdateMetrics | undefined {
    return this.metrics.get(changeId)
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): ConfigUpdateMetrics[] {
    return Array.from(this.metrics.values())
  }

  /**
   * Clear old metrics
   */
  clearMetrics(olderThanMs: number = 300000): void { // Default: 5 minutes
    const cutoff = Date.now() - olderThanMs

    for (const [changeId, metrics] of this.metrics) {
      if (metrics.endTime < cutoff) {
        this.metrics.delete(changeId)
      }
    }
  }

  /**
   * Dispose of the notifier
   */
  dispose(): void {
    this.removeAllListeners()
    this.subscriptions.clear()
    this.changeHistory = []
    this.metrics.clear()
    this.currentSettings = null
  }

  /**
   * Static factory method for creating instances
   */
  static create(settings?: PluginSettings): SettingsChangeNotifier {
    return new SettingsChangeNotifier(settings)
  }
}