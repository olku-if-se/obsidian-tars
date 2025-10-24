/**
 * Error handling types and interfaces
 */

/**
 * Base Tars error interface
 */
export interface TarsError extends Error {
  /** Error code */
  code: ErrorCode
  /** Provider where error occurred */
  provider?: string
  /** Additional error details */
  details?: Record<string, unknown>
  /** Error timestamp */
  timestamp: Date
  /** Request ID if applicable */
  requestId?: string
  /** Whether error is retryable */
  retryable: boolean
}

/**
 * Error codes
 */
export type ErrorCode =
  | 'PROVIDER_NOT_FOUND'
  | 'PROVIDER_INIT_FAILED'
  | 'PROVIDER_AUTH_FAILED'
  | 'PROVIDER_RATE_LIMITED'
  | 'PROVIDER_QUOTA_EXCEEDED'
  | 'PROVIDER_MODEL_NOT_SUPPORTED'
  | 'MCP_CONNECTION_FAILED'
  | 'MCP_SERVER_ERROR'
  | 'MCP_TIMEOUT'
  | 'CONVERSATION_ERROR'
  | 'MESSAGE_PARSE_ERROR'
  | 'SETTINGS_INVALID'
  | 'NETWORK_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'FILE_NOT_FOUND'
  | 'FILE_ACCESS_DENIED'
  | 'FILE_CORRUPTED'
  | 'ATTACHMENT_TOO_LARGE'
  | 'ATTACHMENT_NOT_SUPPORTED'
  | 'GENERATION_TIMEOUT'
  | 'GENERATION_CANCELLED'
  | 'GENERATION_FAILED'
  | 'UNKNOWN_ERROR'

/**
 * Custom error classes
 */
export class TarsBaseError extends Error implements TarsError {
  code: ErrorCode
  provider?: string
  details?: Record<string, unknown>
  timestamp: Date
  requestId?: string
  retryable: boolean

  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      provider?: string
      details?: Record<string, unknown>
      requestId?: string
      retryable?: boolean
      cause?: Error
    }
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.provider = options?.provider
    this.details = options?.details
    this.requestId = options?.requestId
    this.retryable = options?.retryable ?? false
    this.timestamp = new Date()

    if (options?.cause) {
      this.cause = options.cause
    }

    // Ensure stack trace is captured
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Convert error to JSON
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      provider: this.provider,
      details: this.details,
      timestamp: this.timestamp,
      requestId: this.requestId,
      retryable: this.retryable,
      stack: this.stack,
    }
  }

  /**
   * Create user-friendly message
   */
  toUserMessage(): string {
    switch (this.code) {
      case 'PROVIDER_NOT_FOUND':
        return `Provider "${this.provider}" not found. Please check your configuration.`
      case 'PROVIDER_AUTH_FAILED':
        return `Authentication failed for provider "${this.provider}". Please check your API key.`
      case 'PROVIDER_RATE_LIMITED':
        return `Rate limit exceeded for provider "${this.provider}". Please try again later.`
      case 'PROVIDER_QUOTA_EXCEEDED':
        return `API quota exceeded for provider "${this.provider}". Please check your plan.`
      case 'MCP_CONNECTION_FAILED':
        return `Failed to connect to MCP server. Please check the server is running.`
      case 'GENERATION_TIMEOUT':
        return 'Request timed out. Please try again.'
      case 'GENERATION_CANCELLED':
        return 'Request was cancelled.'
      case 'NETWORK_ERROR':
        return 'Network error occurred. Please check your connection.'
      case 'ATTACHMENT_TOO_LARGE':
        return 'File attachment is too large. Please use a smaller file.'
      default:
        return this.message
    }
  }
}

/**
 * Provider-specific errors
 */
export class ProviderNotFoundError extends TarsBaseError {
  constructor(providerId: string, cause?: Error) {
    super('PROVIDER_NOT_FOUND', `Provider not found: ${providerId}`, {
      provider: providerId,
      retryable: false,
      cause,
    })
  }
}

export class ProviderAuthError extends TarsBaseError {
  constructor(providerId: string, details?: Record<string, unknown>, cause?: Error) {
    super('PROVIDER_AUTH_FAILED', `Authentication failed for provider: ${providerId}`, {
      provider: providerId,
      details,
      retryable: false,
      cause,
    })
  }
}

export class ProviderRateLimitError extends TarsBaseError {
  constructor(providerId: string, details?: Record<string, unknown>, cause?: Error) {
    super('PROVIDER_RATE_LIMITED', `Rate limit exceeded for provider: ${providerId}`, {
      provider: providerId,
      details,
      retryable: true,
      cause,
    })
  }
}

export class ProviderQuotaExceededError extends TarsBaseError {
  constructor(providerId: string, details?: Record<string, unknown>, cause?: Error) {
    super('PROVIDER_QUOTA_EXCEEDED', `API quota exceeded for provider: ${providerId}`, {
      provider: providerId,
      details,
      retryable: false,
      cause,
    })
  }
}

/**
 * MCP-specific errors
 */
export class MCPConnectionError extends TarsBaseError {
  constructor(serverId: string, details?: Record<string, unknown>, cause?: Error) {
    super('MCP_CONNECTION_FAILED', `Failed to connect to MCP server: ${serverId}`, {
      details: { serverId, ...details },
      retryable: true,
      cause,
    })
  }
}

export class MCPTimeoutError extends TarsBaseError {
  constructor(serverId: string, timeout: number, cause?: Error) {
    super('MCP_TIMEOUT', `MCP server timeout: ${serverId} (${timeout}ms)`, {
      details: { serverId, timeout },
      retryable: true,
      cause,
    })
  }
}

/**
 * Generation errors
 */
export class GenerationTimeoutError extends TarsBaseError {
  constructor(timeout: number, requestId?: string, cause?: Error) {
    super('GENERATION_TIMEOUT', `Generation timeout after ${timeout}ms`, {
      requestId,
      retryable: true,
      cause,
    })
  }
}

export class GenerationCancelledError extends TarsBaseError {
  constructor(requestId?: string, cause?: Error) {
    super('GENERATION_CANCELLED', 'Generation was cancelled', {
      requestId,
      retryable: false,
      cause,
    })
  }
}

/**
 * File and content errors
 */
export class FileNotFoundError extends TarsBaseError {
  constructor(filePath: string, cause?: Error) {
    super('FILE_NOT_FOUND', `File not found: ${filePath}`, {
      details: { filePath },
      retryable: false,
      cause,
    })
  }
}

export class AttachmentTooLargeError extends TarsBaseError {
  constructor(filename: string, size: number, maxSize: number, cause?: Error) {
    super('ATTACHMENT_TOO_LARGE', `File too large: ${filename} (${size} bytes, max: ${maxSize} bytes)`, {
      details: { filename, size, maxSize },
      retryable: false,
      cause,
    })
  }
}

/**
 * Validation errors
 */
export class ValidationError extends TarsBaseError {
  constructor(field: string, value: unknown, constraint: string, cause?: Error) {
    super('VALIDATION_ERROR', `Validation failed for ${field}: ${constraint}`, {
      details: { field, value, constraint },
      retryable: false,
      cause,
    })
  }
}

/**
 * Error factory functions
 */
export function createProviderError(
  code: ErrorCode,
  providerId: string,
  message: string,
  details?: Record<string, unknown>,
  cause?: Error
): TarsBaseError {
  return new TarsBaseError(code, message, {
    provider: providerId,
    details,
    retryable: ['PROVIDER_RATE_LIMITED', 'PROVIDER_TIMEOUT'].includes(code),
    cause,
  })
}

export function createNetworkError(
  message: string,
  details?: Record<string, unknown>,
  cause?: Error
): TarsBaseError {
  return new TarsBaseError('NETWORK_ERROR', message, {
    details,
    retryable: true,
    cause,
  })
}

/**
 * Error type guards
 */
export function isTarsError(error: unknown): error is TarsError {
  return error instanceof TarsBaseError ||
    (typeof error === 'object' && error !== null && 'code' in error && 'timestamp' in error)
}

export function isRetryableError(error: TarsError): boolean {
  return error.retryable
}

export function isProviderError(error: TarsError): error is TarsError & { provider: string } {
  return !!error.provider
}

/**
 * Error result type
 */
export type Result<T, E = TarsError> =
  | { success: true; data: T }
  | { success: false; error: E }

/**
 * Result helpers
 */
export function success<T>(data: T): Result<T> {
  return { success: true, data }
}

export function failure<E extends TarsError>(error: E): Result<never, E> {
  return { success: false, error }
}

/**
 * Validation result types
 */
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationWarning {
  code: string
  message: string
  path: string
  severity: 'warning'
}