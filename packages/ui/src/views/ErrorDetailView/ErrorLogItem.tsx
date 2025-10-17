import React, { useCallback } from 'react'
import type { ErrorLogEntry } from '~/types'
import { getErrorTypeIcon } from '~/utils/utilities'
import styles from './ErrorDetailView.module.css'

// Constants for user-facing text (will be replaced with i18n)
const STRINGS = {
	CONTEXT: 'Context',
	STACK_TRACE: 'Stack Trace',
	DISMISS_ERROR: 'Dismiss error'
} as const

export interface ErrorLogItemProps {
	// Data props
	error: ErrorLogEntry
	index: number
	// Event handlers
	onRemove: (id: string) => void
}

const ErrorLogItem = ({ error, index, onRemove }: ErrorLogItemProps): JSX.Element => {
	const handleRemove = useCallback(() => {
		onRemove(error.id)
	}, [error.id, onRemove])

	return (
		<div key={`${error.id}-${index}`} className={styles.errorLogItem} data-error-type={error.type}>
			<div className={styles.errorHeader}>
				<span className={styles.errorTypeIcon}>{getErrorTypeIcon(error.type)}</span>
				<span className={styles.errorName}>{error.name || 'Error'}</span>
				<span className={styles.errorTimestamp}>{error.timestamp.toLocaleString()}</span>
				<button
					type='button'
					className={styles.dismissButton}
					onClick={handleRemove}
					aria-label={STRINGS.DISMISS_ERROR}
				>
					×
				</button>
			</div>
			<div className={styles.errorMessage}>{error.message}</div>
			{error.context && (
				<details className={styles.errorContext}>
					<summary>{STRINGS.CONTEXT}</summary>
					<pre>{JSON.stringify(error.context, null, 2)}</pre>
				</details>
			)}
			{error.stack && (
				<details className={styles.errorStack}>
					<summary>{STRINGS.STACK_TRACE}</summary>
					<pre>{error.stack}</pre>
				</details>
			)}
		</div>
	)
}

// Wrap with React.memo for performance optimization with custom comparison
const MemoizedErrorLogItem = React.memo(ErrorLogItem, (prevProps, nextProps) => {
	// Only re-render if error data or onRemove callback changes
	return (
		prevProps.error === nextProps.error &&
		prevProps.index === nextProps.index &&
		prevProps.onRemove === nextProps.onRemove
	)
})

export { MemoizedErrorLogItem as ErrorLogItem }
