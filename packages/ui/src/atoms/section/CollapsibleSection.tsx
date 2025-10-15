import clsx from 'clsx'
import type React from 'react'
import { forwardRef, useCallback, useState, useEffect } from 'react'
import styles from './CollapsibleSection.module.css'

interface CollapsibleSectionProps
  extends Omit<React.ComponentPropsWithoutRef<'details'>, 'title' | 'onToggle'> {
	// Required data props
	title: React.ReactNode
	// Optional data props
	defaultOpen?: boolean
	open?: boolean
	// UI state props
	children?: React.ReactNode
	className?: string
	// Event handlers
	onToggle?: (open: boolean) => void | Promise<void>
}

export const CollapsibleSection = forwardRef<HTMLDetailsElement, CollapsibleSectionProps>(
	({ title, open, defaultOpen = false, onToggle, children, className, ...rest }, ref) => {
		const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
		const isControlled = open !== undefined
		const isOpen = isControlled ? (open as boolean) : uncontrolledOpen

		// React 19: Add warning for controlled/uncontrolled mismatch
		useEffect(() => {
			if (process.env.NODE_ENV === 'development' && isControlled && uncontrolledOpen !== open) {
				console.warn(
					'CollapsibleSection is changing from uncontrolled to controlled. ' +
					'This is discouraged in React 19 for better predictability.'
				)
			}
		}, [isControlled, open, uncontrolledOpen])

		// Sync with native <details> toggle; read truth from the element
		const handleDetailsToggle = useCallback(
			async (e: React.SyntheticEvent<HTMLDetailsElement>) => {
				const next = e.currentTarget.open

				// React 19: Use startTransition for state updates when needed
				if (!isControlled) {
					// For React 19, wrap state updates in startTransition if they cause UI shifts
					if (typeof window !== 'undefined' && 'startTransition' in window) {
						// @ts-ignore - React 19 startTransition will be available globally
						window.startTransition(() => {
							setUncontrolledOpen(next)
						})
					} else {
						setUncontrolledOpen(next)
					}
				}

				// Handle async onToggle gracefully
				try {
					await onToggle?.(next)
				} catch (error) {
					console.error('Error in CollapsibleSection onToggle:', error)
				}
			},
			[isControlled, onToggle]
		)

		return (
			<details
				ref={ref}
				className={clsx(styles.collapsible, className)}
				open={isOpen}
				onToggle={handleDetailsToggle}
				data-state={isOpen ? 'open' : 'closed'}
				{...rest}
			>
				<summary className={styles.summary}>
					<span className={styles.summaryText}>{title}</span>
					<span
						className={clsx(styles.arrow, isOpen && styles.arrowOpen)}
						aria-hidden="true"
						data-open={isOpen}
					>
						▼
					</span>
				</summary>
				<div className={styles.content} data-hidden={!isOpen}>
					{children}
				</div>
			</details>
		)
	}
)

CollapsibleSection.displayName = 'CollapsibleSection'
