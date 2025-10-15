import clsx from 'clsx'
import type React from 'react'
import { forwardRef, useCallback, useState } from 'react'
import styles from './CollapsibleSection.module.css'

interface CollapsibleSectionProps
  extends Omit<React.ComponentPropsWithoutRef<'details'>, 'title' | 'onToggle'> {
	// Heading content for the summary; HTML 'title' is omitted above
	title: React.ReactNode
	defaultOpen?: boolean
	// Library-level toggle callback (not native Details onToggle)
	onToggle?: (open: boolean) => void | Promise<void>
}

export const CollapsibleSection = forwardRef<HTMLDetailsElement, CollapsibleSectionProps>(
	({ title, open, defaultOpen = false, onToggle, children, className, ...rest }, ref) => {
		const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
		const isControlled = open !== undefined
		const isOpen = isControlled ? (open as boolean) : uncontrolledOpen

		// Sync with native <details> toggle; read truth from the element
		const handleDetailsToggle = useCallback(
			(e: React.SyntheticEvent<HTMLDetailsElement>) => {
				const next = e.currentTarget.open
				if (!isControlled) setUncontrolledOpen(next)
				onToggle?.(next)
			},
			[isControlled, onToggle]
		)

		return (
			<details
				ref={ref}
				className={clsx(styles.collapsible, className)}
				open={isOpen}
				onToggle={handleDetailsToggle}
				{...rest}
			>
				<summary className={styles.summary}>
					<span className={styles.summaryText}>{title}</span>
					<span className={clsx(styles.arrow, isOpen && styles.arrowOpen)} aria-hidden="true">
						▼
					</span>
				</summary>
				<div className={styles.content}>{children}</div>
			</details>
		)
	}
)

CollapsibleSection.displayName = 'CollapsibleSection'
