import React, { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
	id: string
	type: NotificationType
	title: string
	message?: string
	duration?: number // Auto-dismiss in ms, null = manual dismiss
	actions?: NotificationAction[]
	persistent?: boolean // Don't auto-dismiss
	timestamp: Date
}

export interface NotificationAction {
	id: string
	label: string
	variant?: 'primary' | 'default' | 'danger'
	onClick: () => void | Promise<void>
}

export interface NotificationContextValue {
	notifications: Notification[]
	addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string
	removeNotification: (id: string) => void
	clearAll: () => void
	clearByType: (type: NotificationType) => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

export interface NotificationProviderProps {
	children: React.ReactNode
	maxNotifications?: number
	defaultDuration?: number
}

// Provider for managing notifications across the app
export function NotificationProvider({
	children,
	maxNotifications = 5,
	defaultDuration = 5000
}: NotificationProviderProps) {
	const [notifications, setNotifications] = useState<Notification[]>([])
	const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

	// Clean up timeouts on unmount
	useEffect(() => {
		return () => {
			timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
		}
	}, [])

	const addNotification = useCallback((
		notification: Omit<Notification, 'id' | 'timestamp'>
	): string => {
		const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
		const newNotification: Notification = {
			...notification,
			id,
			timestamp: new Date(),
			duration: notification.duration ?? defaultDuration
		}

		setNotifications(prev => {
			const updated = [...prev, newNotification]
			// Keep only the most recent notifications
			return updated.slice(-maxNotifications)
		})

		// Set up auto-dismiss if not persistent
		if (!notification.persistent && notification.duration !== null) {
			const timeout = setTimeout(() => {
				removeNotification(id)
			}, notification.duration ?? defaultDuration)

			timeoutsRef.current.set(id, timeout)
		}

		return id
	}, [defaultDuration, maxNotifications])

	const removeNotification = useCallback((id: string) => {
		setNotifications(prev => prev.filter(n => n.id !== id))

		const timeout = timeoutsRef.current.get(id)
		if (timeout) {
			clearTimeout(timeout)
			timeoutsRef.current.delete(id)
		}
	}, [])

	const clearAll = useCallback(() => {
		setNotifications([])
		timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
		timeoutsRef.current.clear()
	}, [])

	const clearByType = useCallback((type: NotificationType) => {
		setNotifications(prev => prev.filter(n => n.type !== type))

		prev.forEach(notification => {
			if (notification.type === type) {
				const timeout = timeoutsRef.current.get(notification.id)
				if (timeout) {
					clearTimeout(timeout)
					timeoutsRef.current.delete(notification.id)
				}
			}
		})
	}, [])

	const contextValue: NotificationContextValue = {
		notifications,
		addNotification,
		removeNotification,
		clearAll,
		clearByType
	}

	return (
		<NotificationContext.Provider value={contextValue}>
			{children}
		</NotificationContext.Provider>
	)
}

// Hook for using notifications
export function useNotifications() {
	const context = useContext(NotificationContext)
	if (context === undefined) {
		throw new Error('useNotifications must be used within a NotificationProvider')
	}
	return context
}

// Convenience hooks for specific notification types
export function useSuccessNotification() {
	const { addNotification } = useNotifications()

	return useCallback((title: string, message?: string, options?: Partial<Notification>) => {
		return addNotification({
			type: 'success',
			title,
			message,
			...options
		})
	}, [addNotification])
}

export function useErrorNotification() {
	const { addNotification } = useNotifications()

	return useCallback((title: string, message?: string, options?: Partial<Notification>) => {
		return addNotification({
			type: 'error',
			title,
			message,
			duration: null, // Errors persist by default
			...options
		})
	}, [addNotification])
}

export function useWarningNotification() {
	const { addNotification } = useNotifications()

	return useCallback((title: string, message?: string, options?: Partial<Notification>) => {
		return addNotification({
			type: 'warning',
			title,
			message,
			...options
		})
	}, [addNotification])
}

export function useInfoNotification() {
	const { addNotification } = useNotifications()

	return useCallback((title: string, message?: string, options?: Partial<Notification>) => {
		return addNotification({
			type: 'info',
			title,
			message,
			...options
		})
	}, [addNotification])
}