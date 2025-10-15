import clsx from 'clsx'
import React, { forwardRef, useId } from 'react'
import { validateProps, VALIDATION_RULES } from '../../utils/validation'
import styles from './Input.module.css'

// Type alias for better readability
type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & {
	label?: string
	error?: string
	size?: 'sm' | 'md' | 'lg'
}

// Prop validation for Input
const validateInputProps = (props: InputProps, componentName: string) => {
	return validateProps(props, {
		label: VALIDATION_RULES.string,
		error: VALIDATION_RULES.string
	}, componentName)
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ label, error, size = 'md', className, id, ...props }, ref) => {
		// Validate props in development
		if (process.env.NODE_ENV === 'development') {
			validateInputProps({ label, error, size, className, id, ...props }, 'Input')
		}

		const generatedId = useId()
		const inputId = id || generatedId

		// Security: Ensure no dangerous attributes are passed through
		const safeProps = { ...props }
		delete (safeProps as any).dangerouslySetInnerHTML

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
					{...safeProps}
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

// Wrap with React.memo for performance optimization
const MemoizedInput = React.memo(Input)
export { MemoizedInput as Input }
