import type React from 'react'
import { Button } from '../../atoms'
import type { ErrorInfo, ErrorLogEntry } from '../../types/types'
import styles from './ErrorDetailView.module.css'
import { ErrorLogItem } from './ErrorLogItem'

export interface ErrorDetailViewProps {
	currentError?: ErrorInfo | undefined
	errorLog: ErrorLogEntry[]
	onClearLogs: () => void
	onRemoveLog: (id: string) => void
}

export const ErrorDetailView: React.FC<ErrorDetailViewProps> = ({
	currentError,
	errorLog,
	onClearLogs,
	onRemoveLog
}) => {
	return (
		<div className={styles.errorDetailModal}>
			{currentError && (
				<div className={styles.currentErrorSection}>
					<h3>Current Error</h3>
					<div className={styles.errorDetails}>
						<p>
							<strong>Error Type:</strong> {currentError.name || 'Unknown Error'}
						</p>
						<p>
							<strong>Error Message:</strong> {currentError.message}
						</p>
						<p>
							<strong>Occurrence Time:</strong> {currentError.timestamp.toLocaleString()}
						</p>
						{currentError.stack && (
							<details className={styles.stackTrace} open>
								<summary>Stack Trace</summary>
								<pre className={styles.stackTracePre}>{currentError.stack}</pre>
							</details>
						)}
					</div>
				</div>
			)}

			{errorLog.length > 0 && (
				<details className={styles.errorLogDetails} open>
					<summary>Recent Errors ({errorLog.length})</summary>
					<div className={styles.errorLogContainer}>
						{errorLog.length === 0 ? (
							<div className={styles.emptyLog}>No recent errors</div>
						) : (
							errorLog.map((error, index) => (
								<ErrorLogItem key={error.id} error={error} index={index} onRemove={onRemoveLog} />
							))
						)}
					</div>
					<div className={styles.errorLogActions}>
						<Button onClick={onClearLogs} disabled={errorLog.length === 0} variant="danger" size="sm">
							Clear All Logs
						</Button>
					</div>
				</details>
			)}
		</div>
	)
}
