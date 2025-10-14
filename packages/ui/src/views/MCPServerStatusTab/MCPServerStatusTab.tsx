import type React from 'react'
import { MCPServerStatusItem, MCPStatusSummary } from '../../atoms'
import type { BridgeComponentProps } from '../../bridge/ReactBridge'
import type { MCPStatusInfo } from '../../types'
import styles from './MCPServerStatusTab.module.css'

export interface MCPServerStatusTabProps extends BridgeComponentProps {
	mcpStatus: MCPStatusInfo
}

const formatCacheAge = (ageMs: number | null): string => {
	if (ageMs === null) return 'None'

	const seconds = Math.floor(ageMs / 1000)
	const minutes = Math.floor(seconds / 60)
	const hours = Math.floor(minutes / 60)
	const days = Math.floor(hours / 24)

	if (days > 0) return `${days}d ago`
	if (hours > 0) return `${hours}h ago`
	if (minutes > 0) return `${minutes}m ago`
	if (seconds > 5) return `${seconds}s ago`
	return 'Just now'
}

export const MCPServerStatusTab: React.FC<MCPServerStatusTabProps> = ({ mcpStatus }) => {
	return (
		<div className={styles.mcpServerStatusTab}>
			<div className={styles.statusContainer}>
				<MCPStatusSummary status={mcpStatus} />

				{mcpStatus.cacheStats && (
					<div className={styles.cacheSection}>
						<h3>Tool Result Cache</h3>
						<div className={styles.cacheStats}>
							<div className={styles.cacheStat}>
								<span className={styles.cacheStatLabel}>Hit Rate:</span>
								<span className={styles.cacheStatValue}>
									{mcpStatus.cacheStats.hitRate.toFixed(1)}%
								</span>
								<span className={styles.cacheStatDetail}>
									({mcpStatus.cacheStats.hits} hits, {mcpStatus.cacheStats.misses} misses)
								</span>
							</div>
							<div className={styles.cacheStat}>
								<span className={styles.cacheStatLabel}>Cache Size:</span>
								<span className={styles.cacheStatValue}>
									{mcpStatus.cacheStats.size} entries
								</span>
							</div>
							{mcpStatus.cacheStats.oldestEntryAge !== null && (
								<div className={styles.cacheStat}>
									<span className={styles.cacheStatLabel}>Oldest Entry:</span>
									<span className={styles.cacheStatValue}>
										{formatCacheAge(mcpStatus.cacheStats.oldestEntryAge)}
									</span>
								</div>
							)}
						</div>
					</div>
				)}

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
