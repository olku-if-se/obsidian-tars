import type React from 'react'
import { useEffect, useCallback } from 'react'
import type { BridgeComponentProps } from '../bridge/ReactBridge'

// Import types from other components
import type { MCPStatusInfo, ErrorInfo } from './MCPStatusModal'
import type { GenerationStats } from './GenerationStatsModal'

export type StatusBarType = 'idle' | 'generating' | 'success' | 'error'

export interface StatusBarContent {
	text: string
	tooltip: string
}

export interface StatusBarState {
	type: StatusBarType
	content: StatusBarContent
	data?: GenerationStats | ErrorInfo
	mcpStatus?: MCPStatusInfo
	timestamp: Date
}
import styles from './StatusBar.module.css'

export interface StatusBarProps extends BridgeComponentProps {
	state: StatusBarState
	onStateChange?: (state: StatusBarState) => void
	onClick?: () => void
	onOpenModal?: (type: 'mcp' | 'stats' | 'error') => void
}

export const StatusBar: React.FC<StatusBarProps> = ({
	state,
	onStateChange,
	onClick,
	onOpenModal
}) => {
	const handleClick = useCallback(() => {
		onClick?.()

		// Priority: MCP Status > Error Details > Generation Stats
		if (state.mcpStatus) {
			onOpenModal?.('mcp')
		} else if (state.type === 'error') {
			onOpenModal?.('error')
		} else if (state.type === 'success') {
			onOpenModal?.('stats')
		}
	}, [state, onClick, onOpenModal])

	// Auto-clear timer effect
	useEffect(() => {
		let timer: NodeJS.Timeout | null = null

		// Only auto-clear non-idle states
		if (state.type !== 'idle' && state.type !== 'error') {
			// Set timer to return to idle after appropriate duration
			const duration = state.type === 'success' ? 5 * 60 * 1000 : 3 * 60 * 1000 // 5min for success, 3min for cancelled
			timer = setTimeout(() => {
				onStateChange?.({
					type: 'idle',
					content: {
						text: 'Tars',
						tooltip: 'Tars AI assistant is ready'
					},
					timestamp: new Date()
				})
			}, duration)
		}

		return () => {
			if (timer) {
				clearTimeout(timer)
			}
		}
	}, [state.type, onStateChange])

	// Determine status indicator
	const getStatusIndicator = (): { icon: string; className: string } => {
		switch (state.type) {
			case 'generating':
				return { icon: '🔄', className: styles.generating }
			case 'success':
				return { icon: '✅', className: styles.success }
			case 'error':
				return { icon: '🔴', className: styles.error }
			default:
				return { icon: '', className: styles.idle }
		}
	}

	const { icon, className: statusClassName } = getStatusIndicator()

	return (
		<button
			type="button"
			className={`${styles.statusBar} ${statusClassName}`}
			onClick={handleClick}
			title={state.content.tooltip}
			aria-label={`Status: ${state.content.text}. Click for details.`}
		>
			<span className={styles.text}>
				{icon && <span className={styles.icon}>{icon}</span>}
				<span className={styles.content}>{state.content.text}</span>
			</span>
		</button>
	)
}