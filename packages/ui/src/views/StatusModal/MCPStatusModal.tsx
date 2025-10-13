import type React from 'react'
import { useCallback, useState } from 'react'
import { Button, InfoSectionList, Modal, ParagraphList, TabList } from '../../atoms'
import type { BridgeComponentProps } from '../../bridge/ReactBridge'
import type { ErrorInfo, ErrorLogEntry, MCPStatusInfo } from '../../types/types'
import {
	formatRetryInfo,
	formatSessionStatus,
	getServerStatusIcon,
	getServerStatusText,
	type MCPServerInfo
} from '../../utils/utilities'
import { ErrorDetailView } from '../ErrorDetailView/ErrorDetailView'
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
	onClose
}) => {
	const [activeTab, setActiveTab] = useState<'mcp' | 'errors'>(currentError ? 'errors' : 'mcp')
	const [refreshStatus, setRefreshStatus] = useState<string>('')
	const [isRefreshing, setIsRefreshing] = useState(false)

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

	const ServerStatusItem = useCallback(({ server }: { server: MCPServerInfo }) => {
		// Data-driven approach for server info sections - following DRY principles
		const serverInfoSections = [
			{ content: getServerStatusIcon(server), className: styles.statusIcon },
			{ content: server.name, className: styles.serverName },
			{ content: `| Tools: ${server.toolCount}`, className: styles.toolsCount },
			{ content: `| Status: ${getServerStatusText(server, formatRetryInfo)}`, className: styles.serverStatus }
		]

		return (
			<div key={`${server.id}-${server.name}`} className={styles.serverItem}>
				<InfoSectionList sections={serverInfoSections} containerClassName={styles.serverInfo} />
			</div>
		)
	}, [])

	const SummarySection = useCallback(() => {
		// Data-driven approach for summary items - following DRY principles
		const summaryItems = [
			{
				content: `Running: ${mcpStatus.runningServers} / ${mcpStatus.totalServers} servers`
			},
			...(mcpStatus.activeExecutions && mcpStatus.activeExecutions > 0
				? [
						{
							content: `Active Executions: ${mcpStatus.activeExecutions}`,
							className: styles.activeExecutions
						}
					]
				: []),
			...(mcpStatus.currentDocumentSessions !== undefined &&
			mcpStatus.sessionLimit !== undefined &&
			mcpStatus.sessionLimit > 0
				? (() => {
						const sessionStatus = formatSessionStatus(mcpStatus.currentDocumentSessions, mcpStatus.sessionLimit, styles)
						return [
							{
								content: sessionStatus.text,
								className: sessionStatus.className
							}
						]
					})()
				: []),
			...(mcpStatus.retryingServers > 0
				? [
						{
							content: `Retrying: ${mcpStatus.retryingServers} servers`,
							className: styles.retrying
						}
					]
				: []),
			...(mcpStatus.failedServers && mcpStatus.failedServers > 0
				? [
						{
							content: `Failed: ${mcpStatus.failedServers} servers`,
							className: styles.failed
						}
					]
				: []),
			{
				content: `Available Tools: ${mcpStatus.availableTools}`
			},
			...(mcpStatus.cacheStats
				? [
						{
							content: `📦 Cache: ${mcpStatus.cacheStats.size} entries, ${mcpStatus.cacheStats.hitRate.toFixed(1)}% hit rate`,
							className: styles.cacheStats
						}
					]
				: [])
		]

		return <ParagraphList items={summaryItems} containerClassName={styles.summary} />
	}, [mcpStatus])

	// Define tabs as data - following DRY principles
	const tabs = [
		{
			id: 'mcp',
			label: 'MCP Server Status',
			content: (
				<>
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
						<SummarySection />

						{mcpStatus.servers.length > 0 && (
							<div className={styles.serversSection}>
								<h3>Servers</h3>
								<div className={styles.serverList}>
									{mcpStatus.servers.map((server) => (
										<ServerStatusItem key={server.id} server={server} />
									))}
								</div>
							</div>
						)}
					</div>
				</>
			)
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
