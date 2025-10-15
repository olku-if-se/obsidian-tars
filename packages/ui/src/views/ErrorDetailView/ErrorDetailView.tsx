import React from 'react'
import { Button } from '../../atoms'
import { COMMON_STRINGS, ERROR_STRINGS } from '../../constants/strings'
import type { ErrorInfo, ErrorLogEntry } from '../../types/types'
import styles from './ErrorDetailView.module.css'
import { ErrorLogItem } from './ErrorLogItem'

export interface ErrorDetailViewProps {
	// Data props
	currentError?: ErrorInfo | undefined
	errorLog: ErrorLogEntry[]
	// Event handlers
	onClearLogs: () => void
	onRemoveLog: (id: string) => void
}

const ErrorDetailView = ({
	currentError,
	errorLog,
	onClearLogs,
	onRemoveLog
}: ErrorDetailViewProps): JSX.Element => {
	return (
		<div className={styles.errorDetailModal}>
			{currentError && (
				<div className={styles.currentErrorSection}>
					<h3>{COMMON_STRINGS.MESSAGE.ERROR}</h3>
					<div className={styles.errorDetails}>
						<p>
							<strong>{ERROR_STRINGS.TYPES.VALIDATION}:</strong> {currentError.name || COMMON_STRINGS.MESSAGE.UNKNOWN_ERROR}
						</p>
						<p>
							<strong>{COMMON_STRINGS.FORM.INVALID}:</strong> {currentError.message}
						</p>
						<p>
							<strong>{ERROR_STRINGS.MESSAGES.SERVER_ERROR}:</strong> {currentError.timestamp.toLocaleString()}
						</p>
						{currentError.stack && (
							<details className={styles.stackTrace} open>
								<summary>{ERROR_STRINGS.MESSAGES.SERVER_ERROR}</summary>
								<pre className={styles.stackTracePre}>{currentError.stack}</pre>
							</details>
						)}
					</div>
				</div>
			)}

			{errorLog.length > 0 && (
				<details className={styles.errorLogDetails} open>
					<summary>{ERROR_STRINGS.MESSAGES.INVALID_RESPONSE} ({errorLog.length})</summary>
					<div className={styles.errorLogContainer}>
						{errorLog.length === 0 ? (
							<div className={styles.emptyLog}>{COMMON_STRINGS.MESSAGE.NO_DATA}</div>
						) : (
							errorLog.map((error, index) => (
								<ErrorLogItem key={error.id} error={error} index={index} onRemove={onRemoveLog} />
							))
						)}
					</div>
					<div className={styles.errorLogActions}>
						<Button onClick={onClearLogs} disabled={errorLog.length === 0} variant='danger' size='sm'>
							{COMMON_STRINGS.ACTION.CLEAR}
						</Button>
					</div>
				</details>
			)}
		</div>
	)
}

// Wrap with React.memo for performance optimization
const MemoizedErrorDetailView = React.memo(ErrorDetailView, (prevProps, nextProps) => {
	return (
		prevProps.currentError === nextProps.currentError &&
		prevProps.errorLog === nextProps.errorLog &&
		prevProps.onClearLogs === nextProps.onClearLogs &&
		prevProps.onRemoveLog === nextProps.onRemoveLog
	)
})

export { MemoizedErrorDetailView as ErrorDetailView }
