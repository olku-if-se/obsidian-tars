import clsx from 'clsx'
import React, { useEffect } from 'react'
import { useNotifications, type Notification } from '../../providers/notification/NotificationContext'
import { StatusBadge } from '../../atoms/statusBadge/StatusBadge'
import { Button } from '../../atoms/button/Button'
import styles from './NotificationToast.module.css'

export interface NotificationToastProps {
	notification: Notification
	onDismiss: (id: string) => void
	className?: string
}

// Individual notification toast component
export function NotificationToast({ notification, onDismiss, className }: NotificationToastProps) {
	const { type, title, message, actions = [], persistent } = notification

	const handleAction = async (action: any) => {
		try {
			await action.onClick()
		} catch (error) {
			console.error('Notification action failed:', error)
		}
	}

	// Auto-dismiss on hover pause
	useEffect(() => {
		if (persistent) return

		const handleMouseEnter = () => {
			// Pause auto-dismiss
		}

		const handleMouseLeave = () => {
			// Resume auto-dismiss
		}

		const element = document.getElementById(`notification-${notification.id}`)
		if (element) {
			element.addEventListener('mouseenter', handleMouseEnter)
			element.addEventListener('mouseleave', handleMouseLeave)

			return () => {
				element.removeEventListener('mouseenter', handleMouseEnter)
				element.removeEventListener('mouseleave', handleMouseLeave)
			}
		}
	}, [notification.id, persistent])

	const toastClasses = clsx(
		styles.notificationToast,
		styles[type],
		className
	)

	return (
		<div
			id={`notification-${notification.id}`}
			className={toastClasses}
			role="alert"
			aria-live={type === 'error' ? 'assertive' : 'polite'}
		>
			<div className={styles.content}>
				<div className={styles.header}>
					<StatusBadge
						status={type}
						variant="subtle"
						size="sm"
						className={styles.statusBadge}
					/>
					<span className={styles.title}>{title}</span>
					{!persistent && (
						<button
							onClick={() => onDismiss(notification.id)}
							className={styles.dismissButton}
							aria-label="Dismiss notification"
						>
							×
						</button>
					)}
				</div>

				{message && (
					<p className={styles.message}>{message}</p>
				)}

				{actions.length > 0 && (
					<div className={styles.actions}>
						{actions.map(action => (
							<Button
								key={action.id}
								variant={action.variant || 'default'}
								size="sm"
								onClick={() => handleAction(action)}
								className={styles.actionButton}
							>
								{action.label}
							</Button>
						))}
					</div>
				)}
			</div>

			{!persistent && (
				<div
					className={styles.progressBar}
					style={{
						animationDuration: `${notification.duration || 5000}ms`
					}}
				/>
			)}
		</div>
	)
}

// Container for all notifications
export function NotificationContainer({ className }: { className?: string }) {
	const { notifications, removeNotification } = useNotifications()

	if (notifications.length === 0) return null

	const containerClasses = clsx(
		styles.notificationContainer,
		className
	)

	return (
		<div className={containerClasses}>
			{notifications.map(notification => (
				<NotificationToast
					key={notification.id}
					notification={notification}
					onDismiss={removeNotification}
				/>
			))}
		</div>
	)
}