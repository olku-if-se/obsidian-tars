import clsx from 'clsx'
import { forwardRef } from 'react'
import styles from './Input.module.css'

// Type alias for better readability
type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & {
	label?: string
	error?: string
	size?: 'sm' | 'md' | 'lg'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ label, error, size = 'md', className, id, ...props }, ref) => {
		const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

		const wrapperClasses = clsx(
			styles.inputWrapper,
			styles[size],
			className
		)

		const inputClasses = clsx(
			styles.input,
			error && styles.error
		)

		return (
			<div className={wrapperClasses}>
				{label && (
					<label htmlFor={inputId} className={styles.label}>
						{label}
					</label>
				)}
				<input
					ref={ref}
					id={inputId}
					className={inputClasses}
					{...props}
				/>
				{error && (
					<div className={styles.errorText}>
						{error}
					</div>
				)}
			</div>
		)
	}
)

Input.displayName = 'Input'
