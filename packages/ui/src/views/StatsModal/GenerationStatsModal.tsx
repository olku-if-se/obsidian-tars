import type React from 'react'
import { Button, LabelValueList, Modal } from '../../atoms'
import type { BridgeComponentProps } from '../../bridge/ReactBridge'
import type { ErrorInfo, ErrorLogEntry } from '../../types/types'
import { formatDuration } from '../../utils/utilities'

export interface GenerationStats {
	round: number
	characters: number
	duration: string
	model: string
	vendor: string
	startTime: Date
	endTime: Date
}

export interface GenerationStatsModalProps extends BridgeComponentProps {
	stats: GenerationStats
	errorLog?: ErrorLogEntry[]
	onClearLogs?: () => void
	onRemoveLog?: (id: string) => void
	onClose: () => void
}

import styles from './GenerationStatsModal.module.css'

export const GenerationStatsModal: React.FC<GenerationStatsModalProps> = ({ stats, errorLog = [], onClose }) => {
	const handleViewErrorLogs = () => {
		// This would typically open the error detail modal
		// For now, we'll close this modal and let the parent handle opening the error modal
		onClose()

		// The parent component should handle opening the error modal with the first error
		const firstError = errorLog[0]
		if (firstError) {
			const currentError: ErrorInfo = {
				message: firstError.message || 'No current error',
				name: firstError.name,
				stack: firstError.stack,
				timestamp: firstError.timestamp || new Date()
			}
			// This would be handled by the parent component
			console.log('Would open error modal with:', currentError)
		}
	}

	// Define stats as data to drive the rendering - following DRY principles
	const statsRows = [
		{ label: 'Round:', value: stats.round.toString() },
		{ label: 'Model:', value: stats.model },
		{ label: 'Vendor:', value: stats.vendor },
		{ label: 'Characters:', value: stats.characters.toLocaleString() },
		{ label: 'Duration:', value: formatDuration(stats.duration) },
		{ label: 'Start Time:', value: stats.startTime.toLocaleTimeString() },
		{ label: 'End Time:', value: stats.endTime.toLocaleTimeString() }
	]

	return (
		<Modal isOpen={true} onClose={onClose} title='AI Generation Details' size='md'>
			<div className={styles.generationStatsModal}>
				{errorLog.length > 0 && (
					<div className={styles.actionButtons}>
						<Button onClick={handleViewErrorLogs} variant='default' size='sm'>
							View {errorLog.length} Error Log{errorLog.length === 1 ? '' : 's'}
						</Button>
					</div>
				)}

				<div className={styles.statsContainer}>
					<LabelValueList
						rows={statsRows}
						rowClassName={styles.statRow}
						labelClassName={styles.statLabel}
						valueClassName={styles.statValue}
					/>
				</div>
			</div>
		</Modal>
	)
}
