/**
 * Notification service interface for showing user notifications
 */
export interface INotificationService {
	show(message: string): void
	warn(message: string): void
	error(message: string): void
}
