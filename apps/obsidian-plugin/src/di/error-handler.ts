import type { ValidationError } from './interfaces'
import { Tokens } from './tokens'

// Error message templates
const ErrorMessages = {
  // Container errors
  container_not_initialized: 'DI container has not been initialized. Call setupDIContainer() first.',
  container_disposed: 'DI container has been disposed and cannot be used.',
  container_setup_failed: 'Failed to setup DI container: {cause}',

  // Token errors
  token_not_registered: 'Dependency token "{token}" is not registered in the DI container.',
  token_resolution_failed: 'Failed to resolve dependency token "{token}": {cause}',
  token_invalid: 'Invalid dependency token provided: {token}',

  // Service errors
  service_instantiation_failed: 'Failed to instantiate service "{token}": {cause}',
  service_dependency_missing: 'Service "{token}" depends on unregistered dependency "{dependency}".',
  service_dependency_circular: 'Circular dependency detected: {path}',
  service_factory_failed: 'Factory function failed for service "{token}": {cause}',
  service_validation_failed: 'Service "{token}" failed validation: {errors}',

  // Configuration errors
  config_invalid: 'Invalid DI configuration: {errors}',
  config_token_binding_failed: 'Failed to bind token "{token}": {cause}',
  config_validation_failed: 'Configuration validation failed: {errors}',

  // Provider errors
  provider_not_found: 'Provider "{tag}" not found in configuration.',
  provider_registration_failed: 'Failed to register provider "{tag}": {cause}',
  provider_invalid_config: 'Provider "{tag}" has invalid configuration: {errors}',
  provider_factory_missing: 'No factory available for provider "{tag}" with vendor "{vendor}".',

  // Settings errors
  settings_not_available: 'Settings are not available in the current context.',
  settings_invalid: 'Invalid settings provided: {errors}',
  settings_load_failed: 'Failed to load settings: {cause}',

  // Performance errors
  performance_threshold_exceeded: 'Operation exceeded performance threshold: {operation} took {duration}ms (limit: {limit}ms)',

  // Generic errors
  unknown_error: 'An unknown error occurred: {cause}',
  operation_failed: 'Operation "{operation}" failed: {cause}',
  operation_timeout: 'Operation "{operation}" timed out after {duration}ms.',
} as const

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error context information
export interface ErrorContext {
  token?: string
  operation?: string
  duration?: number
  dependencies?: string[]
  stack?: string
  timestamp?: number
  container?: string
}

// Enhanced error class for DI errors
export class DIError extends Error {
  public readonly code: string
  public readonly severity: ErrorSeverity
  public readonly context: ErrorContext
  public readonly cause?: unknown
  public readonly timestamp: number

  constructor(
    message: string,
    code: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: ErrorContext = {},
    cause?: unknown
  ) {
    super(message)
    this.name = 'DIError'
    this.code = code
    this.severity = severity
    this.context = { timestamp: Date.now(), ...context }
    this.cause = cause
    this.timestamp = Date.now()

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DIError)
    }
  }

  /**
   * Create a formatted error message with context
   */
  toFormattedString(): string {
    let message = `[${this.severity.toUpperCase()}] ${this.code}: ${this.message}`

    if (this.context.token) {
      message += `\n  Token: ${this.context.token}`
    }

    if (this.context.operation) {
      message += `\n  Operation: ${this.context.operation}`
    }

    if (this.context.duration) {
      message += `\n  Duration: ${this.context.duration}ms`
    }

    if (this.context.dependencies?.length) {
      message += `\n  Dependencies: ${this.context.dependencies.join(', ')}`
    }

    if (this.cause) {
      message += `\n  Cause: ${this.cause instanceof Error ? this.cause.message : String(this.cause)}`
    }

    return message
  }

  /**
   * Check if this error is related to a specific token
   */
  isRelatedToToken(token: string): boolean {
    return this.context.token === token ||
           this.context.dependencies?.includes(token) ||
           this.message.includes(token)
  }

  /**
   * Check if this error is critical
   */
  isCritical(): boolean {
    return this.severity === ErrorSeverity.CRITICAL
  }

  /**
   * Get a user-friendly version of this error
   */
  toUserFriendlyString(): string {
    switch (this.code) {
      case 'TOKEN_NOT_REGISTERED':
        return `A required component is missing: ${this.context.token}`
      case 'SERVICE_DEPENDENCY_MISSING':
        return `Missing dependency for ${this.context.token}: ${this.context.dependencies?.[0]}`
      case 'SERVICE_DEPENDENCY_CIRCULAR':
        return `Circular dependency detected: ${this.context.dependencies?.join(' -> ') || 'unknown path'}`
      case 'PROVIDER_NOT_FOUND':
        return `AI provider "${this.context.token}" is not configured`
      case 'SETTINGS_NOT_AVAILABLE':
        return 'Plugin settings are not available'
      default:
        return this.message
    }
  }
}

/**
 * DI Error Handler provides centralized error creation and management
 */
export class DIErrorHandler {
  private static instance: DIErrorHandler
  private errorHistory: DIError[] = []
  private maxHistorySize = 100

  private constructor() {}

  static getInstance(): DIErrorHandler {
    if (!DIErrorHandler.instance) {
      DIErrorHandler.instance = new DIErrorHandler()
    }
    return DIErrorHandler.instance
  }

  /**
   * Create and log a DI error
   */
  createError(
    template: keyof typeof ErrorMessages,
    context: Record<string, string | number | undefined> = {},
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    cause?: unknown
  ): DIError {
    // Format the error message
    let message = ErrorMessages[template]
    for (const [key, value] of Object.entries(context)) {
      message = message.replace(new RegExp(`{${key}}`, 'g'), String(value))
    }

    // Determine error code
    const code = template.toUpperCase().replace(/\s+/g, '_')

    // Create error
    const error = new DIError(message, code, severity, context, cause)

    // Log and store error
    this.logError(error)
    this.storeError(error)

    return error
  }

  /**
   * Create a container initialization error
   */
  containerInitializationError(cause?: unknown): DIError {
    return this.createError(
      'container_setup_failed',
      { cause: cause instanceof Error ? cause.message : String(cause) },
      ErrorSeverity.CRITICAL,
      cause
    )
  }

  /**
   * Create a token not registered error
   */
  tokenNotRegisteredError(token: string, operation?: string): DIError {
    return this.createError(
      'token_not_registered',
      { token, operation },
      ErrorSeverity.HIGH
    )
  }

  /**
   * Create a service dependency missing error
   */
  serviceDependencyMissingError(token: string, dependency: string): DIError {
    return this.createError(
      'service_dependency_missing',
      { token, dependency },
      ErrorSeverity.HIGH
    )
  }

  /**
   * Create a circular dependency error
   */
  circularDependencyError(path: string[]): DIError {
    return this.createError(
      'service_dependency_circular',
      { path: path.join(' -> ') },
      ErrorSeverity.CRITICAL
    )
  }

  /**
   * Create a provider not found error
   */
  providerNotFoundError(tag: string): DIError {
    return this.createError(
      'provider_not_found',
      { tag },
      ErrorSeverity.MEDIUM
    )
  }

  /**
   * Create a provider configuration error
   */
  providerConfigurationError(tag: string, errors: string[]): DIError {
    return this.createError(
      'provider_invalid_config',
      { tag, errors: errors.join('; ') },
      ErrorSeverity.HIGH
    )
  }

  /**
   * Create a service instantiation error
   */
  serviceInstantiationError(token: string, cause?: unknown): DIError {
    return this.createError(
      'service_instantiation_failed',
      {
        token,
        cause: cause instanceof Error ? cause.message : String(cause)
      },
      ErrorSeverity.HIGH,
      cause
    )
  }

  /**
   * Create a validation error
   */
  validationError(errors: ValidationError[], operation?: string): DIError {
    return this.createError(
      'config_validation_failed',
      {
        errors: errors.map(e => e.message).join('; '),
        operation
      },
      ErrorSeverity.HIGH
    )
  }

  /**
   * Create a performance error
   */
  performanceError(operation: string, duration: number, limit: number): DIError {
    return this.createError(
      'performance_threshold_exceeded',
      { operation, duration: duration.toString(), limit: limit.toString() },
      ErrorSeverity.MEDIUM
    )
  }

  /**
   * Wrap an existing error as a DI error
   */
  wrapError(error: unknown, operation?: string, token?: string): DIError {
    if (error instanceof DIError) {
      return error
    }

    const message = error instanceof Error ? error.message : String(error)
    return this.createError(
      'unknown_error',
      {
        cause: message,
        operation,
        token
      },
      ErrorSeverity.MEDIUM,
      error
    )
  }

  /**
   * Get error history
   */
  getErrorHistory(): DIError[] {
    return [...this.errorHistory]
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): DIError[] {
    return this.errorHistory.filter(error => error.severity === severity)
  }

  /**
   * Get errors by token
   */
  getErrorsByToken(token: string): DIError[] {
    return this.errorHistory.filter(error => error.isRelatedToToken(token))
  }

  /**
   * Get recent errors
   */
  getRecentErrors(minutes: number = 10): DIError[] {
    const cutoff = Date.now() - (minutes * 60 * 1000)
    return this.errorHistory.filter(error => error.timestamp >= cutoff)
  }

  /**
   * Clear error history
   */
  clearHistory(): void {
    this.errorHistory = []
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number
    bySeverity: Record<ErrorSeverity, number>
    byCode: Record<string, number>
    recent: number
  } {
    const bySeverity: Record<ErrorSeverity, number> = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.CRITICAL]: 0,
    }

    const byCode: Record<string, number> = {}

    for (const error of this.errorHistory) {
      bySeverity[error.severity]++
      byCode[error.code] = (byCode[error.code] || 0) + 1
    }

    const recent = this.getRecentErrors(10).length

    return {
      total: this.errorHistory.length,
      bySeverity,
      byCode,
      recent,
    }
  }

  /**
   * Log error to console with appropriate level
   */
  private logError(error: DIError): void {
    const formattedError = error.toFormattedString()

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error(formattedError)
        if (error.cause) {
          console.error('Caused by:', error.cause)
        }
        break
      case ErrorSeverity.HIGH:
        console.error(formattedError)
        break
      case ErrorSeverity.MEDIUM:
        console.warn(formattedError)
        break
      case ErrorSeverity.LOW:
        console.info(formattedError)
        break
    }
  }

  /**
   * Store error in history
   */
  private storeError(error: DIError): void {
    this.errorHistory.push(error)

    // Maintain history size
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize)
    }
  }

  /**
   * Create a user-friendly error report
   */
  createUserReport(): string {
    const stats = this.getErrorStats()
    const recentErrors = this.getRecentErrors(60) // Last hour
    const criticalErrors = this.getErrorsBySeverity(ErrorSeverity.CRITICAL)

    let report = `DI System Error Report\n`
    report += `======================\n\n`

    report += `Total Errors: ${stats.total}\n`
    report += `Recent (1h): ${stats.recent}\n`
    report += `Critical: ${criticalErrors.length}\n\n`

    if (criticalErrors.length > 0) {
      report += `Critical Errors:\n`
      report += `---------------\n`
      for (const error of criticalErrors.slice(0, 5)) {
        report += `${error.toUserFriendlyString()}\n`
      }
      report += `\n`
    }

    if (recentErrors.length > 0) {
      report += `Recent Error Summary:\n`
      report += `---------------------\n`
      const errorCounts = recentErrors.reduce((acc, error) => {
        acc[error.code] = (acc[error.code] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      for (const [code, count] of Object.entries(errorCounts)) {
        report += `${code}: ${count} occurrence(s)\n`
      }
    }

    return report
  }
}

// Convenience exports
export const errorHandler = DIErrorHandler.getInstance()

// Factory functions for common errors
export const createContainerError = (cause?: unknown) =>
  errorHandler.containerInitializationError(cause)

export const createTokenError = (token: string, operation?: string) =>
  errorHandler.tokenNotRegisteredError(token, operation)

export const createDependencyError = (token: string, dependency: string) =>
  errorHandler.serviceDependencyMissingError(token, dependency)

export const createCircularDependencyError = (path: string[]) =>
  errorHandler.circularDependencyError(path)

export const createProviderError = (tag: string) =>
  errorHandler.providerNotFoundError(tag)

export const createValidationError = (errors: ValidationError[], operation?: string) =>
  errorHandler.validationError(errors, operation)