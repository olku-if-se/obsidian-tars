import type React from 'react'
import { useCallback, useState } from 'react'
import { Modal, TabList } from '../../atoms'
import type { BridgeComponentProps } from '../../bridge/ReactBridge'
import type { ErrorInfo, ErrorLogEntry, MCPStatusInfo } from '../../types'
import { ErrorDetailView } from '../ErrorDetailView/ErrorDetailView'
import { MCPServerStatusTab } from '../MCPServerStatusTab'
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
	const [refreshStatus, setRefreshStatus] = useState<string>('')
	const [_isRefreshing, setIsRefreshing] = useState(false)

	const hasErrorData = errorLog.length > 0 || !!currentError

	const handleRefresh = useCallback(async () => {
		if (!onRefresh) {
			return
		}

		setIsRefreshing(true)
		setRefreshStatus('Starting refresh...')

		try {
			await onRefresh((message) => {
				setRefreshStatus(message)
			})
		} catch (error) {
			setRefreshStatus(`❌ Error: ${error instanceof Error ? error.message : String(error)}`)
			setTimeout(() => {
				setRefreshStatus('')
				setIsRefreshing(false)
			}, 3000)
		} finally {
			if (!refreshStatus.includes('Error')) {
				setRefreshStatus('')
				setIsRefreshing(false)
			}
		}
	}, [onRefresh, refreshStatus])

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
			content: <MCPServerStatusTab app={app} mcpStatus={mcpStatus} onRefresh={handleRefresh} />
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
		<Modal isOpen={true} onClose={onClose} title="MCP Server Status" size="lg">
			<div className={styles.mcpStatusModal}>
				<TabList
					tabs={tabs}
					activeTab={activeTab}
					onTabChange={(tabId: string) =>
						tabId === 'mcp' || tabId === 'errors' ? setActiveTab(tabId as 'mcp' | 'errors') : undefined
					}
					tabButtonClassName={styles.tabBar}
					activeTabClassName={styles.active}
					panelClassName={styles.panels}
				/>
			</div>
		</Modal>
	)
}
