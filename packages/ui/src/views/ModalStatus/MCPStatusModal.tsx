import type React from 'react'
import { useCallback, useState } from 'react'
import { Button, Modal, TabList } from '~/atoms'
import type { BridgeComponentProps } from '~/bridge/ReactBridge'
import type { ErrorInfo, ErrorLogEntry, MCPStatusInfo } from '~/types'
import { ErrorDetailView } from '../ErrorDetailView/ErrorDetailView'
import { MCPServerStatusTab } from '~/views'
import styles from './MCPStatusModal.module.css'

export interface MCPStatusModalProps extends BridgeComponentProps {
	mcpStatus: MCPStatusInfo
	errorLog?: ErrorLogEntry[]
	currentError?: ErrorInfo
	onClearLogs?: () => void
	onRemoveLog?: (id: string) => void
	onRefresh?: (updateStatus: (message: string) => void) => Promise<void>
	onClose: () => void
}

export const MCPStatusModal: React.FC<MCPStatusModalProps> = ({
	mcpStatus,
	errorLog = [],
	currentError,
	onClearLogs,
	onRemoveLog,
	onRefresh,
	onClose,
	app
}) => {
	const [activeTab, setActiveTab] = useState<'mcp' | 'errors'>(currentError ? 'errors' : 'mcp')
	const [isRefreshing, setIsRefreshing] = useState(false)

	const hasErrorData = errorLog.length > 0 || !!currentError

	const handleRefresh = useCallback(async () => {
		if (!onRefresh) {
			return
		}

		setIsRefreshing(true)

		try {
			await onRefresh(() => {
				// Status updates handled internally
			})
		} finally {
			setIsRefreshing(false)
		}
	}, [onRefresh])

	const handleClearLogs = useCallback(() => {
		onClearLogs?.()
	}, [onClearLogs])

	const handleRemoveLog = useCallback(
		(logId: string) => {
			onRemoveLog?.(logId)
		},
		[onRemoveLog]
	)

	// Define tabs as data - following DRY principles
	const tabs = [
		{
			id: 'mcp',
			label: 'MCP Server Status',
			content: <MCPServerStatusTab app={app} mcpStatus={mcpStatus} />
		},
		...(hasErrorData
			? [
					{
						id: 'errors',
						label: 'Error Details',
						content: (
							<ErrorDetailView
								currentError={currentError}
								errorLog={errorLog}
								onClearLogs={handleClearLogs}
								onRemoveLog={handleRemoveLog}
							/>
						)
					}
				]
			: [])
	]

	return (
		<Modal isOpen={true} onClose={onClose} title='MCP Server Status' size='lg'>
			<div className={styles.mcpStatusModal}>
				<div className={styles.tabHeader}>
					<TabList
						tabs={tabs}
						activeTab={activeTab}
						onTabChange={(tabId: string) =>
							tabId === 'mcp' || tabId === 'errors' ? setActiveTab(tabId as 'mcp' | 'errors') : undefined
						}
					/>
					{onRefresh && activeTab === 'mcp' && (
						<Button onClick={handleRefresh} disabled={isRefreshing} variant='primary' size='sm'>
							{isRefreshing ? 'Refreshing...' : '🔄 Refresh'}
						</Button>
					)}
				</div>
				<div className={styles.tabContent}>{tabs.find((tab) => tab.id === activeTab)?.content}</div>
			</div>
		</Modal>
	)
}
