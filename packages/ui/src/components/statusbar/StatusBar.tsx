import React, { useCallback, useEffect, useMemo } from 'react'
import type { BridgeComponentProps } from '~/bridge/ReactBridge'
import type { ErrorInfo, MCPStatusInfo } from '~/types'
import type { GenerationStats } from '~/views'

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

// Constants for user-facing text (will be replaced with i18n)
const STRINGS = {
	READY: 'Tars',
	READY_TOOLTIP: 'Tars AI assistant is ready',
	STATUS_CLICK_DETAILS: 'Status: {{text}}. Click for details.'
} as const

import styles from './StatusBar.module.css'

export interface StatusBarProps extends BridgeComponentProps {
	// Data props
	state: StatusBarState
	// Event handlers
	onStateChange?: (state: StatusBarState) => void
	onClick?: () => void
	onOpenModal?: (type: 'mcp' | 'stats' | 'error') => void
}

const StatusBar = ({ state, onStateChange, onClick, onOpenModal }: StatusBarProps): JSX.Element => {
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

	// Memoize status indicator to prevent unnecessary re-renders
	const statusIndicator = useMemo((): { icon: string; className: string } => {
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
	}, [state.type])

	// Memoize idle state to prevent object creation on every render
	const idleState = useMemo(
		() => ({
			type: 'idle' as const,
			content: {
				text: STRINGS.READY,
				tooltip: STRINGS.READY_TOOLTIP
			},
			timestamp: new Date()
		}),
		[]
	)

	// Auto-clear timer effect
	useEffect(() => {
		let timer: NodeJS.Timeout | null = null

		// Only auto-clear non-idle states
		if (state.type !== 'idle' && state.type !== 'error') {
			// Set timer to return to idle after appropriate duration
			const duration = state.type === 'success' ? 5 * 60 * 1000 : 3 * 60 * 1000 // 5min for success, 3min for cancelled
			timer = setTimeout(() => {
				onStateChange?.(idleState)
			}, duration)
		}

		return () => {
			if (timer) {
				clearTimeout(timer)
			}
		}
	}, [state.type, onStateChange, idleState])

	// Memoize aria-label to prevent string creation on every render
	const ariaLabel = useMemo(() => {
		return STRINGS.STATUS_CLICK_DETAILS.replace('{{text}}', state.content.text)
	}, [state.content.text])

	return (
		<button
			type="button"
			className={`${styles.statusBar} ${statusIndicator.className}`}
			onClick={handleClick}
			title={state.content.tooltip}
			aria-label={ariaLabel}
		>
			<span className={styles.text}>
				{statusIndicator.icon && <span className={styles.icon}>{statusIndicator.icon}</span>}
				<span className={styles.content}>{state.content.text}</span>
			</span>
		</button>
	)
}

// Wrap with React.memo for performance optimization with custom comparison
const MemoizedStatusBar = React.memo(StatusBar, (prevProps, nextProps) => {
	// Only re-render if state or callbacks change
	return (
		prevProps.state === nextProps.state &&
		prevProps.onStateChange === nextProps.onStateChange &&
		prevProps.onClick === nextProps.onClick &&
		prevProps.onOpenModal === nextProps.onOpenModal
	)
})

export { MemoizedStatusBar as StatusBar }
