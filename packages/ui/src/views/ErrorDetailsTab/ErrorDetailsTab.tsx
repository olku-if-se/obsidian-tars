import type React from 'react'
import { useCallback } from 'react'
import type { ErrorInfo, ErrorLogEntry } from '../../types'
import { ErrorDetailView } from '../ErrorDetailView/ErrorDetailView'

export interface ErrorDetailsTabProps {
	currentError?: ErrorInfo
	errorLog?: ErrorLogEntry[]
	onClearLogs?: () => void
	onRemoveLog?: (id: string) => void
}

export const ErrorDetailsTab: React.FC<ErrorDetailsTabProps> = ({
	currentError,
	errorLog = [],
	onClearLogs,
	onRemoveLog
}) => {
	const handleClearLogs = useCallback(() => {
		onClearLogs?.()
	}, [onClearLogs])

	const handleRemoveLog = useCallback(
		(logId: string) => {
			onRemoveLog?.(logId)
		},
		[onRemoveLog]
	)

	return (
		<ErrorDetailView
			currentError={currentError}
			errorLog={errorLog}
			onClearLogs={handleClearLogs}
			onRemoveLog={handleRemoveLog}
		/>
	)
}
