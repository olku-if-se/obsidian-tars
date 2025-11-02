import { EventEmitter } from 'node:events'
import { injectable, inject } from '@needle-di/core'
import type { PluginSettings } from '../settings'
import type { ConfigUpdateMetrics, SettingsChangeEvent } from './types'
import { Tokens } from './tokens'

// Error messages
const Errors = {
  performance_monitoring_disabled: 'Performance monitoring is disabled',
  invalid_metrics: 'Invalid performance metrics provided',
  aggregation_failed: 'Failed to aggregate performance metrics',
} as const

// Custom exceptions
export class PerformanceMonitorError extends Error {
  static monitoringDisabled = () =>
    Object.assign(new PerformanceMonitorError(Errors.performance_monitoring_disabled), {
      code: 'MONITORING_DISABLED'
    })

  static invalidMetrics = (cause?: unknown) =>
    Object.assign(new PerformanceMonitorError(`${Errors.invalid_metrics}: ${cause}`), {
      code: 'INVALID_METRICS',
      cause,
    })

  static aggregationFailed = (cause?: unknown) =>
    Object.assign(new PerformanceMonitorError(`${Errors.aggregation_failed}: ${cause}`), {
      code: 'AGGREGATION_FAILED',
      cause,
    })
}

/**
 * Performance statistics aggregation
 */
interface PerformanceStats {
  readonly count: number
  readonly average: number
  readonly min: number
  readonly max: number
  readonly median: number
  readonly p95: number
  readonly p99: number
  readonly total: number
}

/**
 * Performance monitor for configuration updates
 */
@injectable()
export class PerformanceMonitor extends EventEmitter {
  private readonly metrics: ConfigUpdateMetrics[] = []
  private readonly maxMetrics = 1000 // Keep last 1000 measurements
  private isEnabled = true

  constructor(settings = inject(Tokens.AppSettings)) {
    super()
    this.isEnabled = this.isPerformanceMonitoringEnabled(settings)
  }

  /**
   * Record a configuration update performance measurement
   */
  recordMetrics(metrics: ConfigUpdateMetrics): void {
    if (!this.isEnabled) {
      return
    }

    try {
      // Validate metrics
      this.validateMetrics(metrics)

      // Add to collection
      this.metrics.push(metrics)

      // Trim collection if needed
      if (this.metrics.length > this.maxMetrics) {
        this.metrics.splice(0, this.metrics.length - this.maxMetrics)
      }

      // Emit event for real-time monitoring
      this.emit('metricsRecorded', metrics)

    } catch (error) {
      console.error('Failed to record performance metrics:', error)
    }
  }

  /**
   * Start timing a configuration update
   */
  startTiming(changeId: string): {
    stop: () => ConfigUpdateMetrics
    setProvidersUpdated: (count: number) => void
    setErrorsCount: (count: number) => void
  } {
    if (!this.isEnabled) {
      return {
        stop: () => this.createEmptyMetrics(changeId),
        setProvidersUpdated: () => {},
        setErrorsCount: () => {}
      }
    }

    const startTime = Date.now()
    let endTime = startTime
    let providersUpdated = 0
    let errorsCount = 0

    return {
      stop: (override?: Partial<ConfigUpdateMetrics>) => {
        endTime = Date.now()
        const metrics: ConfigUpdateMetrics = {
          changeId,
          startTime,
          endTime,
          duration: endTime - startTime,
          providersUpdated: override?.providersUpdated ?? providersUpdated,
          errorsCount: override?.errorsCount ?? errorsCount,
          validationTime: override?.validationTime,
          propagationTime: override?.propagationTime,
        }

        this.recordMetrics(metrics)
        return metrics
      },

      setProvidersUpdated: (count: number) => {
        providersUpdated = count
      },

      setErrorsCount: (count: number) => {
        errorsCount = count
      }
    }
  }

  /**
   * Get all recorded metrics
   */
  getAllMetrics(): ConfigUpdateMetrics[] {
    return [...this.metrics]
  }

  /**
   * Get metrics for a specific change ID
   */
  getMetrics(changeId: string): ConfigUpdateMetrics | undefined {
    return this.metrics.find(m => m.changeId === changeId)
  }

  /**
   * Get metrics within a time range
   */
  getMetricsInTimeRange(startTime: number, endTime: number): ConfigUpdateMetrics[] {
    return this.metrics.filter(m => m.endTime >= startTime && m.endTime <= endTime)
  }

  /**
   * Get recent metrics (last N measurements)
   */
  getRecentMetrics(count: number = 10): ConfigUpdateMetrics[] {
    return this.metrics.slice(-count)
  }

  /**
   * Get performance statistics for configuration updates
   */
  getConfigurationUpdateStats(): PerformanceStats {
    if (!this.isEnabled || this.metrics.length === 0) {
      return this.createEmptyStats()
    }

    try {
      const durations = this.metrics.map(m => m.duration)
      const sortedDurations = [...durations].sort((a, b) => a - b)

      return {
        count: this.metrics.length,
        average: this.average(durations),
        min: Math.min(...durations),
        max: Math.max(...durations),
        median: this.median(sortedDurations),
        p95: this.percentile(sortedDurations, 95),
        p99: this.percentile(sortedDurations, 99),
        total: durations.reduce((sum, d) => sum + d, 0),
      }
    } catch (error) {
      throw PerformanceMonitorError.aggregationFailed(error)
    }
  }

  /**
   * Get provider update statistics
   */
  getProviderUpdateStats(): PerformanceStats {
    if (!this.isEnabled || this.metrics.length === 0) {
      return this.createEmptyStats()
    }

    try {
      const providerCounts = this.metrics.map(m => m.providersUpdated)
      const sortedCounts = [...providerCounts].sort((a, b) => a - b)

      return {
        count: this.metrics.length,
        average: this.average(providerCounts),
        min: Math.min(...providerCounts),
        max: Math.max(...providerCounts),
        median: this.median(sortedCounts),
        p95: this.percentile(sortedCounts, 95),
        p99: this.percentile(sortedCounts, 99),
        total: providerCounts.reduce((sum, c) => sum + c, 0),
      }
    } catch (error) {
      throw PerformanceMonitorError.aggregationFailed(error)
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): PerformanceStats {
    if (!this.isEnabled || this.metrics.length === 0) {
      return this.createEmptyStats()
    }

    try {
      const errorCounts = this.metrics.map(m => m.errorsCount)
      const sortedErrors = [...errorCounts].sort((a, b) => a - b)

      return {
        count: this.metrics.length,
        average: this.average(errorCounts),
        min: Math.min(...errorCounts),
        max: Math.max(...errorCounts),
        median: this.median(sortedErrors),
        p95: this.percentile(sortedErrors, 95),
        p99: this.percentile(sortedErrors, 99),
        total: errorCounts.reduce((sum, e) => sum + e, 0),
      }
    } catch (error) {
      throw PerformanceMonitorError.aggregationFailed(error)
    }
  }

  /**
   * Get performance summary for the last hour
   */
  getLastHourSummary(): {
    configuration: PerformanceStats
    providers: PerformanceStats
    errors: PerformanceStats
    timestamp: number
  } {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    const recentMetrics = this.getMetricsInTimeRange(oneHourAgo, Date.now())

    if (recentMetrics.length === 0) {
      return {
        configuration: this.createEmptyStats(),
        providers: this.createEmptyStats(),
        errors: this.createEmptyStats(),
        timestamp: Date.now(),
      }
    }

    // Create temporary calculations without accessing private properties
    const durations = recentMetrics.map(m => m.duration)
    const providerCounts = recentMetrics.map(m => m.providersUpdated)
    const errorCounts = recentMetrics.map(m => m.errorsCount)

    return {
      configuration: this.calculateStats(durations),
      providers: this.calculateStats(providerCounts),
      errors: this.calculateStats(errorCounts),
      timestamp: Date.now(),
    }
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.length = 0
    this.emit('metricsCleared')
  }

  /**
   * Clear metrics older than specified time
   */
  clearOldMetrics(olderThanMs: number = 300000): void { // Default: 5 minutes
    const cutoff = Date.now() - olderThanMs
    const initialLength = this.metrics.length

    for (let i = this.metrics.length - 1; i >= 0; i--) {
      if (this.metrics[i].endTime < cutoff) {
        this.metrics.splice(0, i + 1)
        break
      }
    }

    if (this.metrics.length < initialLength) {
      this.emit('oldMetricsCleared', { cleared: initialLength - this.metrics.length })
    }
  }

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    if (this.isEnabled !== enabled) {
      this.isEnabled = enabled
      this.emit('monitoringToggled', { enabled })
    }
  }

  /**
   * Check if performance monitoring is enabled
   */
  isMonitoringEnabled(): boolean {
    return this.isEnabled
  }

  /**
   * Get performance threshold warnings
   */
  getPerformanceWarnings(): {
    slowUpdates: string[]
    highErrorRates: string[]
    recommendations: string[]
  } {
    const warnings = {
      slowUpdates: [] as string[],
      highErrorRates: [] as string[],
      recommendations: [] as string[],
    }

    if (!this.isEnabled || this.metrics.length < 10) {
      return warnings
    }

    const stats = this.getConfigurationUpdateStats()

    // Check for slow updates
    if (stats.p95 > 1000) { // > 1 second
      warnings.slowUpdates.push(`95th percentile update time is ${(stats.p95 / 1000).toFixed(2)}s`)
    }

    if (stats.average > 500) { // > 500ms
      warnings.slowUpdates.push(`Average update time is ${(stats.average / 1000).toFixed(2)}s`)
    }

    // Check for high error rates
    const errorStats = this.getErrorStats()
    const errorRate = errorStats.average / stats.count

    if (errorRate > 0.1) { // > 10% error rate
      warnings.highErrorRates.push(`Error rate is ${(errorRate * 100).toFixed(1)}%`)
    }

    // Generate recommendations
    if (warnings.slowUpdates.length > 0) {
      warnings.recommendations.push('Consider optimizing configuration update logic')
      warnings.recommendations.push('Check for blocking operations in update pipeline')
    }

    if (warnings.highErrorRates.length > 0) {
      warnings.recommendations.push('Investigate configuration validation failures')
      warnings.recommendations.push('Review error handling in provider updates')
    }

    return warnings
  }

  /**
   * Validate performance metrics
   */
  private validateMetrics(metrics: ConfigUpdateMetrics): void {
    if (!metrics || typeof metrics !== 'object') {
      throw PerformanceMonitorError.invalidMetrics('Metrics object is required')
    }

    if (typeof metrics.changeId !== 'string' || !metrics.changeId.trim()) {
      throw PerformanceMonitorError.invalidMetrics('Valid changeId is required')
    }

    if (typeof metrics.startTime !== 'number' || metrics.startTime <= 0) {
      throw PerformanceMonitorError.invalidMetrics('Valid startTime is required')
    }

    if (typeof metrics.endTime !== 'number' || metrics.endTime <= 0) {
      throw PerformanceMonitorError.invalidMetrics('Valid endTime is required')
    }

    if (metrics.endTime < metrics.startTime) {
      throw PerformanceMonitorError.invalidMetrics('endTime must be greater than or equal to startTime')
    }

    if (typeof metrics.duration !== 'number' || metrics.duration < 0) {
      throw PerformanceMonitorError.invalidMetrics('Valid duration is required')
    }
  }

  /**
   * Check if performance monitoring is enabled in settings
   */
  private isPerformanceMonitoringEnabled(settings: PluginSettings): boolean {
    // This would check actual settings when available
    // For now, return true as default
    return true
  }

  /**
   * Calculate average
   */
  private average(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length : 0
  }

  /**
   * Calculate median
   */
  private median(sortedNumbers: number[]): number {
    if (sortedNumbers.length === 0) return 0

    const mid = Math.floor(sortedNumbers.length / 2)
    return sortedNumbers.length % 2 === 0
      ? (sortedNumbers[mid - 1] + sortedNumbers[mid]) / 2
      : sortedNumbers[mid]
  }

  /**
   * Calculate statistics from numbers array
   */
  private calculateStats(numbers: number[]): PerformanceStats {
    if (numbers.length === 0) {
      return this.createEmptyStats()
    }

    const sortedNumbers = [...numbers].sort((a, b) => a - b)

    return {
      count: numbers.length,
      average: this.average(numbers),
      min: Math.min(...numbers),
      max: Math.max(...numbers),
      median: this.median(sortedNumbers),
      p95: this.percentile(sortedNumbers, 95),
      p99: this.percentile(sortedNumbers, 99),
      total: numbers.reduce((sum, n) => sum + n, 0),
    }
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedNumbers: number[], p: number): number {
    if (sortedNumbers.length === 0) return 0

    const index = Math.ceil((p / 100) * sortedNumbers.length) - 1
    return sortedNumbers[Math.max(0, Math.min(index, sortedNumbers.length - 1))]
  }

  /**
   * Create empty statistics
   */
  private createEmptyStats(): PerformanceStats {
    return {
      count: 0,
      average: 0,
      min: 0,
      max: 0,
      median: 0,
      p95: 0,
      p99: 0,
      total: 0,
    }
  }

  /**
   * Create empty metrics
   */
  private createEmptyMetrics(changeId: string): ConfigUpdateMetrics {
    const now = Date.now()
    return {
      changeId,
      startTime: now,
      endTime: now,
      duration: 0,
      providersUpdated: 0,
      errorsCount: 0,
    }
  }

  /**
   * Dispose of the performance monitor
   */
  dispose(): void {
    this.clearMetrics()
    this.removeAllListeners()
  }

  /**
   * Static factory method
   */
  static create(settings?: PluginSettings): PerformanceMonitor {
    return new PerformanceMonitor(settings)
  }
}