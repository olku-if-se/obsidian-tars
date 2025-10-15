import clsx from 'clsx'
import { t } from '../../utilities/i18n'
import styles from './ValidationMessage.module.css'

// Type aliases for better readability
type ValidationMessageData = {
	message: string
	type: 'error' | 'warning' | 'info'
}

type ValidationMessageUI = {
	size?: 'sm' | 'md' | 'lg'
	dismissible?: boolean
}

type ValidationMessageEvents = {
	onDismiss?: () => void
}

export type ValidationMessageProps = ValidationMessageData & ValidationMessageUI & ValidationMessageEvents


export const ValidationMessage: React.FC<ValidationMessageProps> = ({
	message,
	type,
	size = 'md',
	dismissible = false,
	onDismiss
}) => {
	// Early return for empty message
	if (!message.trim()) {
		return null
	}

	const getIcon = () => {
		switch (type) {
			case 'error':
				return '⚠️'
			case 'warning':
				return '⚡'
			case 'info':
				return 'ℹ️'
		}
	}

	const getTypeLabel = () => {
		switch (type) {
			case 'error':
				return t('validation.error')
			case 'warning':
				return t('validation.warning')
			case 'info':
				return t('validation.info')
		}
	}

	const getDismissLabel = () => {
		switch (type) {
			case 'error':
				return t('validation.dismiss')
			case 'warning':
				return t('validation.dismissWarning')
			case 'info':
				return t('validation.dismissInfo')
		}
	}

	const handleDismiss = () => {
		if (onDismiss) {
			onDismiss()
		}
	}

	const messageClasses = clsx(
		styles.validationMessage,
		styles[type],
		styles[size]
	)

	const iconClasses = clsx(
		styles.icon,
		styles[`${type}Icon`]
	)

	return (
		<div className={messageClasses} role="alert" aria-live="polite">
			<div className={styles.content}>
				<span className={iconClasses} aria-hidden="true">
					{getIcon()}
				</span>
				<span className={styles.text}>
					<strong>{getTypeLabel()}:</strong> {message}
				</span>
			</div>
			{dismissible && onDismiss && (
				<button
					type="button"
					className={styles.dismissButton}
					onClick={handleDismiss}
					aria-label={getDismissLabel()}
				>
					×
				</button>
			)}
		</div>
	)
}