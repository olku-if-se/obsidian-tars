import { useState } from 'react'
import { Button, ValidationMessage } from '~/atoms'
import type { ConnectionResult } from '../ModelSelector/ModelSelector'
import styles from './ConnectionTestButton.module.css'

export interface ConnectionTestButtonProps {
	onTest: () => Promise<ConnectionResult>
	disabled?: boolean
	size?: 'sm' | 'md' | 'lg'
	variant?: 'primary' | 'danger' | 'default'
	className?: string
}

export const ConnectionTestButton = ({
	onTest,
	disabled = false,
	size = 'sm',
	variant = 'default',
	className
}: ConnectionTestButtonProps) => {
	const [isTesting, setIsTesting] = useState(false)
	const [lastResult, setLastResult] = useState<ConnectionResult | null>(null)
	const [showResult, setShowResult] = useState(false)

	const handleTest = async () => {
		if (isTesting || disabled) return

		setIsTesting(true)
		setShowResult(false)

		try {
			const result = await onTest()
			setLastResult(result)
			setShowResult(true)

			// Auto-hide success messages after 3 seconds
			if (result.success) {
				setTimeout(() => {
					setShowResult(false)
				}, 3000)
			}
		} catch (error) {
			const errorResult: ConnectionResult = {
				success: false,
				message: error instanceof Error ? error.message : 'Connection test failed'
			}
			setLastResult(errorResult)
			setShowResult(true)
		} finally {
			setIsTesting(false)
		}
	}

	const getButtonText = () => {
		if (isTesting) return 'Testing...'
		if (lastResult?.success) return '✅ Connected'
		if (lastResult && !lastResult.success) return '❌ Failed'
		return 'Test'
	}

	const getResultIcon = () => {
		if (!lastResult) return null
		if (lastResult.success) return '✅'
		return '❌'
	}

	const getResultMessage = () => {
		if (!lastResult) return ''

		let message = lastResult.message
		if (lastResult.latency !== undefined) {
			message += ` (${lastResult.latency}ms)`
		}
		if (lastResult.models && lastResult.models.length > 0) {
			message += ` - ${lastResult.models.length} models available`
		}

		return message
	}

	const getResultType = () => {
		if (!lastResult) return 'info'
		return lastResult.success ? 'info' : 'error'
	}

	return (
		<div className={`${styles.connectionTestButton} ${className || ''}`}>
			<Button
				onClick={handleTest}
				disabled={disabled || isTesting}
				size={size}
				variant={variant}
				className={`${styles.testButton} ${isTesting ? styles.testing : ''} ${
					lastResult?.success ? styles.success : ''
				} ${lastResult && !lastResult.success ? styles.error : ''}`}
			>
				{getButtonText()}
			</Button>

			{showResult && lastResult && (
				<div className={`${styles.resultContainer} ${lastResult.success ? styles.successResult : styles.errorResult}`}>
					<ValidationMessage type={getResultType()} message={getResultMessage()} />
				</div>
			)}
		</div>
	)
}
