import type React from 'react'
import type { MCPStatusInfo } from '../../types'
import { formatSessionStatus } from '../../utils/utilities'
import { ParagraphList } from '../paragraph/ParagraphList'
import styles from './MCPStatusSummary.module.css'

/**
 * Atomic Element: MCP Status Summary
 * Purpose: Render summarized MCP runtime metrics
 * Category: Atom
 */

export interface MCPStatusSummaryProps {
	status: MCPStatusInfo
}

export const MCPStatusSummary: React.FC<MCPStatusSummaryProps> = ({ status }) => {
	const summaryItems = [
		{ content: `Running: ${status.runningServers} / ${status.totalServers} servers` },
		...(status.activeExecutions && status.activeExecutions > 0
			? [
					{
						content: `Active Executions: ${status.activeExecutions}`,
						className: styles.activeExecutions
					}
				]
			: []),
		...(status.currentDocumentSessions !== undefined && status.sessionLimit !== undefined && status.sessionLimit > 0
			? (() => {
					const sessionStatus = formatSessionStatus(status.currentDocumentSessions, status.sessionLimit, {
						sessionsNormal: styles.sessionsNormal,
						sessionsWarning: styles.sessionsWarning,
						sessionsCritical: styles.sessionsCritical
					})
					return [
						{
							content: sessionStatus.text,
							className: sessionStatus.className
						}
					]
				})()
			: []),
		...(status.retryingServers > 0
			? [
					{
						content: `Retrying: ${status.retryingServers} servers`,
						className: styles.retrying
					}
				]
			: []),
		...(status.failedServers && status.failedServers > 0
			? [
					{
						content: `Failed: ${status.failedServers} servers`,
						className: styles.failed
					}
				]
			: []),
		{ content: `Available Tools: ${status.availableTools}` },
		...(status.cacheStats
			? [
					{
						content: `📦 Cache: ${status.cacheStats.size} entries, ${status.cacheStats.hitRate.toFixed(1)}% hit rate`,
						className: styles.cacheStats
					}
				]
			: [])
	]

	return <ParagraphList items={summaryItems} containerClassName={styles.summary} />
}
