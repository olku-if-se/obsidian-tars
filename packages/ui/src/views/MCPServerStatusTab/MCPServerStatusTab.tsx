import type React from 'react'
import { MCPServerStatusItem, MCPStatusSummary } from '../../atoms'
import type { BridgeComponentProps } from '../../bridge/ReactBridge'
import type { MCPStatusInfo } from '../../types'
import styles from './MCPServerStatusTab.module.css'

export interface MCPServerStatusTabProps extends BridgeComponentProps {
	mcpStatus: MCPStatusInfo
}

export const MCPServerStatusTab: React.FC<MCPServerStatusTabProps> = ({ mcpStatus }) => {
	return (
		<div className={styles.mcpServerStatusTab}>
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
