import { injectable } from '@needle-di/core'
import { Notice } from 'obsidian'

// Error messages
const Errors = {
  notification_failed: 'Failed to create notification',
  cleanup_failed: 'Failed to cleanup notification',
  invalid_message: 'Message must be a non-empty string',
  invalid_timeout: 'Timeout must be a positive number',
} as const

// Constants
const DEFAULT_TIMEOUT = 5000 as const
const MAX_ACTIVE_NOTIFICATIONS = 10 as const
const MIN_TIMEOUT = 1000 as const
const MAX_TIMEOUT = 30000 as const

// Type contracts
interface Options {
  message: string
  timeout?: number
  type?: 'info' | 'success' | 'warning' | 'error'
}

type Result = {
  notice: Notice
  id: string
}

// Custom exceptions
export class NotificationError extends Error {
  static createFailed = (message: string, cause?: unknown) =>
    Object.assign(new NotificationError(`${Errors.notification_failed}: ${message}`), { cause })

  static invalidMessage = () =>
    Object.assign(new NotificationError(Errors.invalid_message), { code: 'INVALID_MESSAGE' })

  static invalidTimeout = () =>
    Object.assign(new NotificationError(Errors.invalid_timeout), { code: 'INVALID_TIMEOUT' })
}

// Pure utilities
const generateId = (): string => `notice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const validateMessage = (message: unknown): message is string => {
  return typeof message === 'string' && message.trim().length > 0
}

const validateTimeout = (timeout?: number): timeout is number => {
  return typeof timeout === 'number' && timeout >= MIN_TIMEOUT && timeout <= MAX_TIMEOUT
}

const shouldAutoCleanup = (timeout?: number): timeout is number => validateTimeout(timeout)

// Main composable class
@injectable()
export class NotificationsService {
  private readonly activeNotices = new Map<string, Notice>()

  // Constructor removed - dependency injection will be implemented when needed

  // Static factory for clean API
  static show = (_message: string, _options: Partial<Options> = {}): Promise<Result> => {
    // Implementation would use container to get instance
    throw new Error('Static factory requires DI container - use instance method instead')
  }

  show(options: Options): Result {
    // GIVEN: User wants to show a notification
    try {
      // WHEN: Validating the input parameters
      if (!validateMessage(options.message)) {
        throw NotificationError.invalidMessage()
      }

      if (options.timeout !== undefined && !validateTimeout(options.timeout)) {
        throw NotificationError.invalidTimeout()
      }

      // THEN: Create and display the notification
      const config = {
        timeout: options.timeout ?? DEFAULT_TIMEOUT,
        message: options.message.trim(),
        type: options.type ?? 'info',
      }

      const notice = new Notice(config.message, config.timeout)
      const id = generateId()

      // Track the notification for cleanup
      this.activeNotices.set(id, notice)

      // Auto-cleanup if timeout is specified
      if (shouldAutoCleanup(config.timeout)) {
        setTimeout(() => this.remove(id), config.timeout)
      }

      return { notice, id }
    } catch (error) {
      throw NotificationError.createFailed(options.message, error)
    }
  }

  remove(id: string): void {
    // GIVEN: User wants to remove a specific notification
    try {
      const notice = this.activeNotices.get(id)
      if (notice) {
        // WHEN: Hiding the notification
        notice.hide()
        this.activeNotices.delete(id)
        // THEN: Notification is removed from tracking
      }
    } catch (error) {
      // Log error but don't throw - cleanup should be resilient
      console.warn(`${Errors.cleanup_failed}: ${id}`, error)
    }
  }

  clearAll(): void {
    // GIVEN: User wants to clear all notifications
    // WHEN: Iterating through all active notifications
    for (const [id] of this.activeNotices) {
      this.remove(id)
    }
    // THEN: All notifications are cleared
  }

  getActiveCount(): number {
    // GIVEN: User wants to know how many notifications are active
    // WHEN: Returning the count of tracked notifications
    // THEN: Return the current active notification count
    return this.activeNotices.size
  }

  getActiveIds(): string[] {
    // GIVEN: User wants to know which notifications are active
    // WHEN: Returning array of notification IDs
    // THEN: Return all active notification IDs
    return Array.from(this.activeNotices.keys())
  }

  hasActiveNotifications(): boolean {
    // GIVEN: User wants to know if any notifications are active
    // WHEN: Checking if there are any tracked notifications
    // THEN: Return true if there are active notifications
    return this.activeNotices.size > 0
  }

  // Convenience methods for different notification types
  showInfo(message: string, timeout?: number): Result {
    return this.show({ message, timeout, type: 'info' })
  }

  showSuccess(message: string, timeout?: number): Result {
    return this.show({ message, timeout, type: 'success' })
  }

  showWarning(message: string, timeout?: number): Result {
    return this.show({ message, timeout, type: 'warning' })
  }

  showError(message: string, timeout?: number): Result {
    return this.show({ message, timeout, type: 'error' })
  }

  // Bulk operations
  showMultiple(messages: Array<{ message: string; timeout?: number; type?: Options['type'] }>): Result[] {
    return messages.map(options => this.show(options))
  }

  clearByType(type: Options['type']): void {
    // GIVEN: User wants to clear notifications of a specific type
    // WHEN: This would require tracking notification types (enhancement)
    // THEN: Clear notifications of the specified type
    // Note: This would require tracking notification types, which is an enhancement
    console.warn(`Clear by type (${type}) not implemented - would require type tracking enhancement`)
  }

  // Resource management
  dispose(): void {
    // GIVEN: Service is being disposed
    // WHEN: Clearing all active notifications
    this.clearAll()
    // THEN: All resources are cleaned up
  }

  // Health check
  isHealthy(): boolean {
    // GIVEN: System wants to check if notification service is healthy
    // WHEN: Checking if active notifications are within reasonable limits
    const isWithinLimits = this.activeNotices.size <= MAX_ACTIVE_NOTIFICATIONS
    // THEN: Return health status
    return isWithinLimits
  }

  getHealthStatus(): {
    isHealthy: boolean
    activeCount: number
    maxAllowed: number
    utilization: number
  } {
    const activeCount = this.activeNotices.size
    const maxAllowed = MAX_ACTIVE_NOTIFICATIONS
    const utilization = activeCount / maxAllowed

    return {
      isHealthy: this.isHealthy(),
      activeCount,
      maxAllowed,
      utilization,
    }
  }

  // Private helper methods will be implemented when needed for notification management
}
