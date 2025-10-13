import type React from 'react'
import type { MCPServerInfo } from '../../utils/utilities'
import { formatRetryInfo, getServerStatusIcon, getServerStatusText } from '../../utils/utilities'
import { InfoSectionList } from '../ilist/InfoSectionList'
import styles from './MCPServerStatusItem.module.css'

/**
 * Atomic Element: MCP Server Status Item
 * Purpose: Display core MCP server status metadata
 * Category: Atom
 */

export interface MCPServerStatusItemProps {
	server: MCPServerInfo
}

export const MCPServerStatusItem: React.FC<MCPServerStatusItemProps> = ({ server }) => {
	const infoSections = [
		{ content: getServerStatusIcon(server), className: styles.statusIcon },
		{ content: server.name, className: styles.serverName },
		{ content: `| Tools: ${server.toolCount}`, className: styles.toolsCount },
		{ content: `| Status: ${getServerStatusText(server, formatRetryInfo)}`, className: styles.serverStatus }
	]

	return (
		<div className={styles.container}>
			<InfoSectionList sections={infoSections} containerClassName={styles.infoContainer} />
		</div>
	)
}
