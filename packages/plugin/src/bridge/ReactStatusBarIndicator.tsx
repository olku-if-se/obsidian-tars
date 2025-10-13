import React, { useEffect, useState } from 'react'
import type { BridgeComponentProps } from './ReactBridge'

export interface ReactStatusBarIndicatorProps extends BridgeComponentProps {
	enabledFeatures: string[]
}

export const ReactStatusBarIndicator: React.FC<ReactStatusBarIndicatorProps> = ({
	enabledFeatures
}) => {
	const [mountedTime, setMountedTime] = useState<Date>(new Date())

	useEffect(() => {
		const timer = setInterval(() => {
			setMountedTime(new Date())
		}, 1000)

		return () => clearInterval(timer)
	}, [])

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString('en-US', {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		})
	}

	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: '8px',
				padding: '2px 8px',
				backgroundColor: 'var(--interactive-accent)',
				color: 'var(--text-on-accent)',
				borderRadius: '12px',
				fontSize: '12px',
				fontFamily: 'var(--font-monospace)',
				fontWeight: '500',
				minWidth: '140px',
				justifyContent: 'space-between',
				cursor: 'pointer',
				transition: 'opacity 0.2s ease'
			}}
			title={`React UI Features: ${enabledFeatures.join(', ')}\nClick to test React components`}
			onClick={() => {
				// This will open the test modal
				const event = new CustomEvent('react-test-request', {
					detail: { source: 'status-bar' }
				})
				document.dispatchEvent(event)
			}}
		>
			<span
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '4px'
				}}
			>
				⚛️ React
				<span
					style={{
						backgroundColor: 'var(--background-modifier-error)',
						color: 'white',
						borderRadius: '8px',
						padding: '1px 4px',
						fontSize: '10px'
					}}
				>
					BETA
				</span>
			</span>
			<span
				style={{
					fontSize: '10px',
					opacity: 0.8
				}}
			>
				{formatTime(mountedTime)}
			</span>
		</div>
	)
}