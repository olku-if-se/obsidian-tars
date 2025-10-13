/**
 * Abstract adapters for host integration
 * These interfaces allow the MCP hosting library to integrate with any host application
 */

export { ConsoleLogger, type ILogger, NoOpLogger } from './ILogger'
export { type INotificationHandler, DefaultNotificationHandler } from './INotificationHandler'
export { type IStatusReporter, NoOpStatusReporter } from './IStatusReporter'
