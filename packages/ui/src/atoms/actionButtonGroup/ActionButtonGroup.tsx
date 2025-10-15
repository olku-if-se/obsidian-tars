import clsx from 'clsx'
import React, { forwardRef } from 'react'
import { Button } from '../button/Button'
import styles from './ActionButtonGroup.module.css'

export interface ActionButton {
	id: string
	label: string
	variant?: 'default' | 'primary' | 'danger'
	size?: 'sm' | 'md' | 'lg'
	disabled?: boolean
	loading?: boolean
	onClick?: () => void | Promise<void>
	icon?: React.ReactNode
	ariaLabel?: string
}

export interface ActionButtonGroupProps {
	actions: ActionButton[]
	variant?: 'horizontal' | 'vertical'
	size?: 'sm' | 'md' | 'lg'
	align?: 'left' | 'center' | 'right'
	compact?: boolean
	className?: string
}

// Group of action buttons with consistent styling and behavior
export const ActionButtonGroup = forwardRef<HTMLDivElement, ActionButtonGroupProps>(
	({
		actions,
		variant = 'horizontal',
		size = 'md',
		align = 'left',
		compact = false,
		className
	}, ref) => {
		const groupClasses = clsx(
			styles.actionButtonGroup,
			styles[variant],
			styles[align],
			styles[size],
			compact && styles.compact,
			className
		)

		const buttonClasses = (action: ActionButton) => clsx(
			styles.actionButton,
			action.loading && styles.loading,
			action.disabled && styles.disabled
		)

		const handleActionClick = async (action: ActionButton) => {
			if (action.disabled || action.loading) return

			try {
				await action.onClick?.()
			} catch (error) {
				console.error(`Action "${action.id}" failed:`, error)
			}
		}

		return (
			<div ref={ref} className={groupClasses} role="group">
				{actions.map((action) => (
					<Button
						key={action.id}
						variant={action.variant}
						size={action.size || size}
						disabled={action.disabled || action.loading}
						onClick={() => handleActionClick(action)}
						className={buttonClasses(action)}
						aria-label={action.ariaLabel || action.label}
						aria-busy={action.loading}
					>
						<span className={styles.buttonContent}>
							{action.loading && (
								<span className={styles.loadingSpinner} aria-hidden="true">
									⟳
								</span>
							)}
							{action.icon && !action.loading && (
								<span className={styles.icon} aria-hidden="true">
									{action.icon}
								</span>
							)}
							{!compact && (
								<span className={styles.label}>
									{action.label}
								</span>
							)}
						</span>
					</Button>
				))}
			</div>
		)
	}
)

ActionButtonGroup.displayName = 'ActionButtonGroup'

// Memoize for performance
const MemoizedActionButtonGroup = React.memo(ActionButtonGroup, (prevProps, nextProps) => {
	return (
		prevProps.variant === nextProps.variant &&
		prevProps.size === nextProps.size &&
		prevProps.align === nextProps.align &&
		prevProps.compact === nextProps.compact &&
		JSON.stringify(prevProps.actions) === JSON.stringify(nextProps.actions)
	)
})

export { MemoizedActionButtonGroup as ActionButtonGroup }