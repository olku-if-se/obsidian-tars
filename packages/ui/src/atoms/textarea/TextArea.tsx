import { forwardRef } from 'react'
import styles from './TextArea.module.css'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string
	description?: string
	error?: string
	resizable?: boolean
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
	({ label, description, error, resizable = true, className, ...props }, ref) => {
		const textareaId = `textarea-${Math.random().toString(36).substr(2, 9)}`

		return (
			<div className={`${styles.textArea} ${className || ''}`}>
				{label && (
					<label className={styles.label} htmlFor={textareaId}>
						{label}
					</label>
				)}
				<textarea
					ref={ref}
					id={textareaId}
					className={`${styles.input} ${error ? styles.error : ''} ${resizable ? '' : styles.notResizable}`}
					{...props}
				/>
				{description && !error && <div className={styles.description}>{description}</div>}
				{error && <div className={styles.errorMessage}>{error}</div>}
			</div>
		)
	}
)

TextArea.displayName = 'TextArea'
