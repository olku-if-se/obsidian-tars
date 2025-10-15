import clsx from 'clsx'
import React, { forwardRef } from 'react'
import styles from './StatusBadge.module.css'

// Status types for consistent styling
export type StatusType = 'idle' | 'generating' | 'success' | 'error' | 'warning' | 'info'

export type StatusVariant = 'default' | 'subtle' | 'filled'

export interface StatusBadgeProps {
	status: StatusType
	variant?: StatusVariant
	size?: 'sm' | 'md' | 'lg'
	children?: React.ReactNode
	className?: string
	showIcon?: boolean
}

// Status configuration - centralize all status-related logic
const STATUS_CONFIG = {
	idle: { icon: '', label: 'Idle' },
	generating: { icon: '🔄', label: 'Generating' },
	success: { icon: '✅', label: 'Success' },
	error: { icon: '🔴', label: 'Error' },
	warning: { icon: '⚠️', label: 'Warning' },
	info: { icon: 'ℹ️', label: 'Info' }
} as const

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
	({ status, variant = 'default', size = 'md', children, className, showIcon = true }, ref) => {
		const config = STATUS_CONFIG[status]

		const badgeClasses = clsx(
			styles.statusBadge,
			styles[variant],
			styles[status],
			styles[size],
			className
		)

		return (
			<span ref={ref} className={badgeClasses} data-status={status}>
				{showIcon && config.icon && (
					<span className={styles.icon} aria-hidden="true">
						{config.icon}
					</span>
				)}
				<span className={styles.text}>
					{children || config.label}
				</span>
			</span>
		)
	}
)

StatusBadge.displayName = 'StatusBadge'

// Memoize for performance
const MemoizedStatusBadge = React.memo(StatusBadge, (prevProps, nextProps) => {
	return (
		prevProps.status === nextProps.status &&
		prevProps.variant === nextProps.variant &&
		prevProps.size === nextProps.size &&
		prevProps.children === nextProps.children &&
		prevProps.showIcon === nextProps.showIcon
	)
})

export { MemoizedStatusBadge as StatusBadge }