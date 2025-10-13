import type React from 'react'
import { useCallback, useState } from 'react'
import { Button, MCPServerStatusItem, MCPStatusSummary } from '../../atoms'
import type { BridgeComponentProps } from '../../bridge/ReactBridge'
import type { MCPStatusInfo } from '../../types'
import styles from './MCPServerStatusTab.module.css'

export interface MCPServerStatusTabProps extends BridgeComponentProps {
	mcpStatus: MCPStatusInfo
	onRefresh?: (updateStatus: (message: string) => void) => Promise<void>
}

export const MCPServerStatusTab: React.FC<MCPServerStatusTabProps> = ({ mcpStatus, onRefresh }) => {
	const [refreshStatus, setRefreshStatus] = useState<string>('')
	const [isRefreshing, setIsRefreshing] = useState(false)

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

	return (
		<div className={styles.mcpServerStatusTab}>
			{(onRefresh || refreshStatus) && (
				<div className={styles.panelHeader}>
					<div className={styles.refreshSection}>
						{onRefresh && (
							<Button onClick={handleRefresh} disabled={isRefreshing} variant="primary" size="sm">
								{isRefreshing ? 'Refreshing...' : '🔄 Refresh'}
							</Button>
						)}
						{refreshStatus && <div className={styles.refreshStatus}>{refreshStatus}</div>}
					</div>
				</div>
			)}

			<div className={styles.statusContainer}>
				<MCPStatusSummary status={mcpStatus} />

				{mcpStatus.servers.length > 0 && (
					<div className={styles.serversSection}>
						<h3>Servers</h3>
						<div className={styles.serverList}>
							{mcpStatus.servers.map((server) => (
								<MCPServerStatusItem key={server.id} server={server} />
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
