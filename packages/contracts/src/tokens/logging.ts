export const LoggerFactoryToken = Symbol('LoggerFactory')
export const LoggingServiceToken = Symbol('LoggingService')

// Service tokens
export const ILoggingServiceToken = Symbol('ILoggingService')
export const INotificationServiceToken = Symbol('INotificationService')
export const ISettingsServiceToken = Symbol('ISettingsService')
export const IStatusServiceToken = Symbol('IStatusService')
export const IDocumentServiceToken = Symbol('IDocumentService')

// Type assertions to help TypeScript understand the token-service relationship
export type LoggingServiceToken = typeof LoggingServiceToken
export type ILoggingServiceToken = typeof ILoggingServiceToken
export type INotificationServiceToken = typeof INotificationServiceToken
export type ISettingsServiceToken = typeof ISettingsServiceToken
export type IStatusServiceToken = typeof IStatusServiceToken
export type IDocumentServiceToken = typeof IDocumentServiceToken
