import { circularDependencyDetector } from './circular-dependency-detector'
import { errorHandler } from './error-handler'
import type { ValidationError } from './interfaces'

/**
 * Debug configuration for DI system
 */
export interface DebugConfig {
  enabled: boolean
  logLevel: 'none' | 'error' | 'warn' | 'info' | 'debug' | 'trace'
  trackResolutions: boolean
  trackPerformance: boolean
  trackDependencies: boolean
  maxLogEntries: number
  enableCircularDetection: boolean
  enableValidation: boolean
  outputToFile: boolean
  outputToConsole: boolean
}

/**
 * Resolution tracking entry
 */
export interface ResolutionEntry {
  token: string
  timestamp: number
  duration?: number
  dependencies?: string[]
  success: boolean
  error?: string
  stack?: string[]
}

/**
 * Performance tracking entry
 */
export interface PerformanceEntry {
  operation: string
  token?: string
  startTime: number
  endTime: number
  duration: number
  success: boolean
  metadata?: Record<string, any>
}

/**
 * Debug mode provides comprehensive debugging capabilities for DI system
 */
export class DIMode {
  private static instance: DIMode
  private config: DebugConfig
  private resolutionLog: ResolutionEntry[] = []
  private performanceLog: PerformanceEntry[] = []
  private debugTimers: Map<string, number> = new Map()

  private constructor() {
    this.config = this.getDefaultConfig()
  }

  static getInstance(): DIMode {
    if (!DIMode.instance) {
      DIMode.instance = new DIMode()
    }
    return DIMode.instance
  }

  /**
   * Get default debug configuration
   */
  private getDefaultConfig(): DebugConfig {
    return {
      enabled: process.env.NODE_ENV === 'development',
      logLevel: 'info',
      trackResolutions: true,
      trackPerformance: true,
      trackDependencies: true,
      maxLogEntries: 1000,
      enableCircularDetection: true,
      enableValidation: true,
      outputToFile: false,
      outputToConsole: true,
    }
  }

  /**
   * Configure debug mode
   */
  configure(config: Partial<DebugConfig>): void {
    this.config = { ...this.config, ...config }

    // Apply configuration to other systems
    circularDependencyDetector.setDetectionEnabled(this.config.enableCircularDetection)

    this.log('debug', 'Debug mode configuration updated', { config: this.config })
  }

  /**
   * Get current configuration
   */
  getConfig(): DebugConfig {
    return { ...this.config }
  }

  /**
   * Check if debug mode is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled
  }

  /**
   * Check if a specific log level is enabled
   */
  isLogLevelEnabled(level: DebugConfig['logLevel']): boolean {
    if (!this.config.enabled) return false

    const levels = ['none', 'error', 'warn', 'info', 'debug', 'trace'] as const
    const currentLevelIndex = levels.indexOf(this.config.logLevel)
    const checkLevelIndex = levels.indexOf(level)

    return checkLevelIndex <= currentLevelIndex
  }

  /**
   * Log a message with the specified level
   */
  log(level: DebugConfig['logLevel'], message: string, metadata?: any): void {
    if (!this.isLogLevelEnabled(level)) {
      return
    }

    const entry = {
      level,
      message,
      timestamp: Date.now(),
      metadata,
    }

    if (this.config.outputToConsole) {
      this.outputToConsole(entry)
    }

    if (this.config.outputToFile) {
      this.outputToFile(entry)
    }
  }

  /**
   * Start tracking a resolution
   */
  startResolution(token: string): void {
    if (!this.config.trackResolutions) return

    const entry: ResolutionEntry = {
      token,
      timestamp: Date.now(),
      success: false,
    }

    // Add circular detection
    if (this.config.enableCircularDetection) {
      try {
        circularDependencyDetector.startResolution(token)
        entry.stack = [...(circularDependencyDetector.getAllResolutionStacks().get(token) || [])]
      } catch (error) {
        this.log('error', 'Circular dependency detected', { token, error })
        throw error
      }
    }

    this.resolutionLog.push(entry)
    this.maintainLogSize()

    this.log('trace', `Starting resolution for ${token}`)
  }

  /**
   * End tracking a resolution
   */
  endResolution(token: string, success: boolean = true, error?: string): void {
    if (!this.config.trackResolutions) return

    const entry = this.resolutionLog
      .slice()
      .reverse()
      .find(e => e.token === token && !e.duration)

    if (entry) {
      entry.duration = Date.now() - entry.timestamp
      entry.success = success
      if (error) {
        entry.error = error
      }

      // End circular detection
      if (this.config.enableCircularDetection) {
        circularDependencyDetector.endResolution(token)
      }

      this.log(
        success ? 'debug' : 'error',
        `Resolution ${success ? 'completed' : 'failed'} for ${token}`,
        {
          duration: entry.duration,
          success,
          error,
        }
      )
    }
  }

  /**
   * Track a dependency relationship
   */
  trackDependency(from: string, to: string): void {
    if (!this.config.trackDependencies) return

    circularDependencyDetector.addDependency(from, to)

    this.log('trace', `Dependency tracked`, { from, to })

    // Update current resolution entry if active
    const entry = this.resolutionLog
      .slice()
      .reverse()
      .find(e => e.token === from && !e.duration)

    if (entry) {
      if (!entry.dependencies) {
        entry.dependencies = []
      }
      entry.dependencies.push(to)
    }
  }

  /**
   * Start performance tracking
   */
  startPerformanceTimer(operation: string, token?: string, metadata?: any): string {
    if (!this.config.trackPerformance) return ''

    const timerId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.debugTimers.set(timerId, Date.now())

    this.log('trace', `Performance timer started`, { operation, token, timerId, metadata })

    return timerId
  }

  /**
   * End performance tracking
   */
  endPerformanceTimer(timerId: string, success: boolean = true, metadata?: any): number {
    if (!this.config.trackPerformance) return 0

    const startTime = this.debugTimers.get(timerId)
    if (!startTime) return 0

    const endTime = Date.now()
    const duration = endTime - startTime

    this.debugTimers.delete(timerId)

    // Try to extract operation and token from timerId
    const [operation] = timerId.split('_')

    const entry: PerformanceEntry = {
      operation,
      startTime,
      endTime,
      duration,
      success,
      metadata,
    }

    this.performanceLog.push(entry)
    this.maintainLogSize()

    this.log('debug', `Performance timer ended`, {
      operation,
      duration,
      success,
      metadata,
    })

    return duration
  }

  /**
   * Track a performance operation with a callback
   */
  trackPerformance<T>(
    operation: string,
    callback: () => T,
    token?: string,
    metadata?: any
  ): T {
    const timerId = this.startPerformanceTimer(operation, token, metadata)

    try {
      const result = callback()
      this.endPerformanceTimer(timerId, true, metadata)
      return result
    } catch (error) {
      this.endPerformanceTimer(timerId, false, { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  /**
   * Track an async performance operation
   */
  async trackPerformanceAsync<T>(
    operation: string,
    callback: () => Promise<T>,
    token?: string,
    metadata?: any
  ): Promise<T> {
    const timerId = this.startPerformanceTimer(operation, token, metadata)

    try {
      const result = await callback()
      this.endPerformanceTimer(timerId, true, metadata)
      return result
    } catch (error) {
      this.endPerformanceTimer(timerId, false, { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  /**
   * Get resolution statistics
   */
  getResolutionStats(): {
    total: number
    successful: number
    failed: number
    averageDuration: number
    slowestResolutions: ResolutionEntry[]
    fastestResolutions: ResolutionEntry[]
    mostResolved: Array<{ token: string; count: number }>
  } {
    const total = this.resolutionLog.length
    const successful = this.resolutionLog.filter(e => e.success).length
    const failed = total - successful

    const completed = this.resolutionLog.filter(e => e.duration !== undefined)
    const averageDuration = completed.length > 0
      ? completed.reduce((sum, e) => sum + (e.duration || 0), 0) / completed.length
      : 0

    const slowestResolutions = completed
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 5)

    const fastestResolutions = completed
      .sort((a, b) => (a.duration || 0) - (b.duration || 0))
      .slice(0, 5)

    const tokenCounts = this.resolutionLog.reduce((acc, entry) => {
      acc[entry.token] = (acc[entry.token] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostResolved = Object.entries(tokenCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([token, count]) => ({ token, count }))

    return {
      total,
      successful,
      failed,
      averageDuration,
      slowestResolutions,
      fastestResolutions,
      mostResolved,
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    total: number
    averageDuration: number
    slowestOperations: PerformanceEntry[]
    fastestOperations: PerformanceEntry[]
    operationsByType: Record<string, { count: number; averageDuration: number }>
  } {
    const total = this.performanceLog.length
    const averageDuration = total > 0
      ? this.performanceLog.reduce((sum, e) => sum + e.duration, 0) / total
      : 0

    const slowestOperations = this.performanceLog
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)

    const fastestOperations = this.performanceLog
      .sort((a, b) => a.duration - b.duration)
      .slice(0, 5)

    const operationsByType = this.performanceLog.reduce((acc, entry) => {
      if (!acc[entry.operation]) {
        acc[entry.operation] = { count: 0, totalDuration: 0 }
      }
      acc[entry.operation].count++
      acc[entry.operation].totalDuration += entry.duration
      return acc
    }, {} as Record<string, { count: number; totalDuration: number }>)

    // Calculate averages
    for (const key in operationsByType) {
      operationsByType[key].averageDuration = operationsByType[key].totalDuration / operationsByType[key].count
    }

    return {
      total,
      averageDuration,
      slowestOperations,
      fastestOperations,
      operationsByType: Object.fromEntries(
        Object.entries(operationsByType).map(([key, value]) => [key, {
          count: value.count,
          averageDuration: value.averageDuration
        }])
      ),
    }
  }

  /**
   * Get recent logs
   */
  getRecentLogs(minutes: number = 10, type: 'resolution' | 'performance' | 'both' = 'both'): {
    resolutions: ResolutionEntry[]
    performance: PerformanceEntry[]
  } {
    const cutoff = Date.now() - (minutes * 60 * 1000)

    const resolutions = type === 'performance' ? [] :
      this.resolutionLog.filter(e => e.timestamp >= cutoff)

    const performance = type === 'resolution' ? [] :
      this.performanceLog.filter(e => e.startTime >= cutoff)

    return { resolutions, performance }
  }

  /**
   * Generate a debug report
   */
  generateDebugReport(): string {
    const resolutionStats = this.getResolutionStats()
    const performanceStats = this.getPerformanceStats()
    const recent = this.getRecentLogs(60)
    const dependencyAnalysis = circularDependencyDetector.analyzeDependencyGraph()

    let report = 'DI System Debug Report\n'
    report += '=====================\n\n'

    report += `Configuration:\n`
    report += `- Enabled: ${this.config.enabled}\n`
    report += `- Log Level: ${this.config.logLevel}\n`
    report += `- Track Resolutions: ${this.config.trackResolutions}\n`
    report += `- Track Performance: ${this.config.trackPerformance}\n`
    report += `- Circular Detection: ${this.config.enableCircularDetection}\n\n`

    report += `Resolution Statistics:\n`
    report += `- Total: ${resolutionStats.total}\n`
    report += `- Successful: ${resolutionStats.successful}\n`
    report += `- Failed: ${resolutionStats.failed}\n`
    report += `- Average Duration: ${resolutionStats.averageDuration.toFixed(2)}ms\n\n`

    if (resolutionStats.mostResolved.length > 0) {
      report += `Most Resolved Tokens:\n`
      for (const { token, count } of resolutionStats.mostResolved) {
        report += `- ${token}: ${count} times\n`
      }
      report += '\n'
    }

    report += `Performance Statistics:\n`
    report += `- Total Operations: ${performanceStats.total}\n`
    report += `- Average Duration: ${performanceStats.averageDuration.toFixed(2)}ms\n\n`

    if (performanceStats.operationsByType && Object.keys(performanceStats.operationsByType).length > 0) {
      report += `Operations by Type:\n`
      for (const [operation, stats] of Object.entries(performanceStats.operationsByType)) {
        report += `- ${operation}: ${stats.count} times, avg ${stats.averageDuration.toFixed(2)}ms\n`
      }
      report += '\n'
    }

    report += `Dependency Graph:\n`
    report += `- Total Nodes: ${dependencyAnalysis.totalNodes}\n`
    report += `- Total Edges: ${dependencyAnalysis.totalEdges}\n`
    report += `- Circular Dependencies: ${dependencyAnalysis.circularDependencies.length}\n`
    report += `- Max Depth: ${dependencyAnalysis.maxDepth}\n\n`

    report += `Recent Activity (1h):\n`
    report += `- Resolutions: ${recent.resolutions.length}\n`
    report += `- Performance: ${recent.performance.length}\n\n`

    if (dependencyAnalysis.circularDependencies.length > 0) {
      report += `Circular Dependencies:\n`
      for (const cycle of dependencyAnalysis.circularDependencies) {
        report += `- ${cycle.join(' -> ')}\n`
      }
      report += '\n'
    }

    return report
  }

  /**
   * Clear all debug logs
   */
  clearLogs(): void {
    this.resolutionLog = []
    this.performanceLog = []
    this.debugTimers.clear()
    this.log('info', 'Debug logs cleared')
  }

  /**
   * Export debug data to JSON
   */
  exportData(): {
    config: DebugConfig
    resolutions: ResolutionEntry[]
    performance: PerformanceEntry[]
    dependencyGraph: Map<string, Set<string>>
    timestamp: number
  } {
    return {
      config: this.config,
      resolutions: this.resolutionLog,
      performance: this.performanceLog,
      dependencyGraph: circularDependencyDetector.getDependencyGraph(),
      timestamp: Date.now(),
    }
  }

  /**
   * Maintain log size by removing old entries
   */
  private maintainLogSize(): void {
    if (this.resolutionLog.length > this.config.maxLogEntries) {
      this.resolutionLog = this.resolutionLog.slice(-this.config.maxLogEntries)
    }

    if (this.performanceLog.length > this.config.maxLogEntries) {
      this.performanceLog = this.performanceLog.slice(-this.config.maxLogEntries)
    }
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: any): void {
    const timestamp = new Date(entry.timestamp).toISOString()
    const prefix = `[DI][${entry.level.toUpperCase()}][${timestamp}]`

    switch (entry.level) {
      case 'error':
        console.error(prefix, entry.message, entry.metadata || '')
        break
      case 'warn':
        console.warn(prefix, entry.message, entry.metadata || '')
        break
      case 'info':
        console.info(prefix, entry.message, entry.metadata || '')
        break
      case 'debug':
        console.debug(prefix, entry.message, entry.metadata || '')
        break
      case 'trace':
        console.log(prefix, entry.message, entry.metadata || '')
        break
    }
  }

  /**
   * Output log entry to file (placeholder for future implementation)
   */
  private outputToFile(entry: any): void {
    // TODO: Implement file logging
    // This could write to a log file in the plugin directory
  }

  /**
   * Validate configuration with validation errors
   */
  validateConfiguration(errors: ValidationError[]): void {
    if (!this.config.enableValidation) return

    this.log('warn', 'Configuration validation failed', { errors })

    for (const error of errors) {
      this.log('error', `Validation error: ${error.message}`, error)
    }
  }

  /**
   * Create a debug context for operations
   */
  createDebugContext(operation: string, token?: string): {
    log: (level: DebugConfig['logLevel'], message: string, metadata?: any) => void
    trackPerformance: <T>(callback: () => T, metadata?: any) => T
    trackDependency: (dependency: string) => void
  } {
    return {
      log: (level, message, metadata) => {
        this.log(level, `[${operation}${token ? `:${token}` : ''}] ${message}`, metadata)
      },
      trackPerformance: (callback, metadata) => {
        return this.trackPerformance(operation, callback, token, metadata)
      },
      trackDependency: (dependency) => {
        if (token) {
          this.trackDependency(token, dependency)
        }
      },
    }
  }
}

// Export singleton instance
export const diDebug = DIMode.getInstance()

// Convenience functions
export const configureDebug = (config: Partial<DebugConfig>) => {
  diDebug.configure(config)
}

export const debugLog = (level: DebugConfig['logLevel'], message: string, metadata?: any) => {
  diDebug.log(level, message, metadata)
}

export const trackResolution = (token: string, resolver: () => any) => {
  diDebug.startResolution(token)
  try {
    const result = resolver()
    diDebug.endResolution(token, true)
    return result
  } catch (error) {
    diDebug.endResolution(token, false, error instanceof Error ? error.message : String(error))
    throw error
  }
}

export const trackPerformance = <T>(operation: string, callback: () => T, token?: string) => {
  return diDebug.trackPerformance(operation, callback, token)
}

export const trackDependency = (from: string, to: string) => {
  diDebug.trackDependency(from, to)
}