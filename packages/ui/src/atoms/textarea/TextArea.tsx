import clsx from 'clsx'
import { forwardRef } from 'react'
import styles from './TextArea.module.css'

// Type alias for better readability
type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
	label?: string
	description?: string
	error?: string
	resizable?: boolean
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
	({ label, description, error, resizable = true, className, ...props }, ref) => {
		const textareaId = `textarea-${Math.random().toString(36).substr(2, 9)}`

		const wrapperClasses = clsx(styles.textArea, className)
		const textareaClasses = clsx(styles.input, error && styles.error, !resizable && styles.notResizable)

		return (
			<div className={wrapperClasses}>
				{label && (
					<label className={styles.label} htmlFor={textareaId}>
						{label}
					</label>
				)}
				<textarea ref={ref} id={textareaId} className={textareaClasses} {...props} />
				{description && !error && <div className={styles.description}>{description}</div>}
				{error && <div className={styles.errorMessage}>{error}</div>}
			</div>
		)
	}
)

TextArea.displayName = 'TextArea'
