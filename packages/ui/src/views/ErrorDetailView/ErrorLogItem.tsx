import type React from 'react'
import type { ErrorLogEntry } from '../../types/types'
import { getErrorTypeIcon } from '../../utils/utilities'
import styles from './ErrorDetailView.module.css'

export interface ErrorLogItemProps {
	error: ErrorLogEntry
	index: number
	onRemove: (id: string) => void
}

export const ErrorLogItem: React.FC<ErrorLogItemProps> = ({ error, index, onRemove }) => {
	const handleRemove = () => {
		onRemove(error.id)
	}

	return (
		<div key={`${error.id}-${index}`} className={styles.errorLogItem} data-error-type={error.type}>
			<div className={styles.errorHeader}>
				<span className={styles.errorTypeIcon}>{getErrorTypeIcon(error.type)}</span>
				<span className={styles.errorName}>{error.name || 'Error'}</span>
				<span className={styles.errorTimestamp}>{error.timestamp.toLocaleString()}</span>
				<button type="button" className={styles.dismissButton} onClick={handleRemove} aria-label="Dismiss error">
					×
				</button>
			</div>
			<div className={styles.errorMessage}>{error.message}</div>
			{error.context && (
				<details className={styles.errorContext}>
					<summary>Context</summary>
					<pre>{JSON.stringify(error.context, null, 2)}</pre>
				</details>
			)}
			{error.stack && (
				<details className={styles.errorStack}>
					<summary>Stack Trace</summary>
					<pre>{error.stack}</pre>
				</details>
			)}
		</div>
	)
}
