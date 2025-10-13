import React from 'react'
import type { BridgeComponentProps } from './ReactBridge'

export interface HelloTestProps extends BridgeComponentProps {
	message?: string
	onButtonClick?: () => void
}

export const HelloTest: React.FC<HelloTestProps> = ({ app, message = 'Hello from React!', onButtonClick }) => {
	return (
		<div
			style={{
				padding: '16px',
				border: '2px solid var(--interactive-accent)',
				borderRadius: '8px',
				backgroundColor: 'var(--background-primary)',
				color: 'var(--text-normal)',
				fontFamily: 'var(--font-interface)'
			}}
		>
			<h3 style={{ margin: '0 0 12px 0', color: 'var(--interactive-accent)' }}>React Bridge Test</h3>
			<p style={{ margin: '0 0 12px 0' }}>{message}</p>
			<p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-muted)' }}>Vault: {app.vault.getName()}</p>
			<button
				onClick={onButtonClick}
				style={{
					padding: '8px 16px',
					backgroundColor: 'var(--interactive-accent)',
					color: 'white',
					border: 'none',
					borderRadius: '4px',
					cursor: 'pointer'
				}}
			>
				Test React Integration
			</button>
		</div>
	)
}
