import clsx from 'clsx'
import React, { forwardRef, useId } from 'react'
import { Input } from '../input/Input'
import { StatusBadge } from '../statusBadge/StatusBadge'
import styles from './FormControl.module.css'

export interface FormControlProps {
	// Label and description
	label?: string
	description?: string
	errorMessage?: string
	warningMessage?: string
	infoMessage?: string

	// Input props
	inputProps?: React.ComponentProps<typeof Input>
	children?: React.ReactNode

	// Layout and behavior
	required?: boolean
	disabled?: boolean
	loading?: boolean
	status?: 'idle' | 'success' | 'error' | 'warning'

	// Styling
	className?: string
	size?: 'sm' | 'md' | 'lg'
	fullWidth?: boolean
}

// Consolidated form control that combines input, label, error, and status
export const FormControl = forwardRef<HTMLDivElement, FormControlProps>(
	({
		label,
		description,
		errorMessage,
		warningMessage,
		infoMessage,
		inputProps = {},
		children,
		required = false,
		disabled = false,
		loading = false,
		status = 'idle',
		className,
		size = 'md',
		fullWidth = true
	}, ref) => {
		const generatedId = useId()
		const inputId = inputProps.id || generatedId
		const descriptionId = description ? `${inputId}-desc` : undefined
		const errorId = errorMessage ? `${inputId}-error` : undefined

		const hasError = !!errorMessage || status === 'error'
		const hasWarning = !!warningMessage || status === 'warning'

		const wrapperClasses = clsx(
			styles.formControl,
			styles[size],
			fullWidth && styles.fullWidth,
			hasError && styles.error,
			hasWarning && styles.warning,
			disabled && styles.disabled,
			className
		)

		const getStatusBadge = () => {
			if (loading) return 'generating'
			if (hasError) return 'error'
			if (hasWarning) return 'warning'
			if (status === 'success') return 'success'
			return 'idle'
		}

		return (
			<div ref={ref} className={wrapperClasses}>
				{label && (
					<label
						htmlFor={inputId}
						className={styles.label}
						aria-required={required}
					>
						{label}
						{required && <span className={styles.required}> *</span>}
					</label>
				)}

				{description && (
					<p id={descriptionId} className={styles.description}>
						{description}
					</p>
				)}

				<div className={styles.inputWrapper}>
					{children || (
						<Input
							{...inputProps}
							id={inputId}
							size={size}
							disabled={disabled}
							error={hasError ? errorMessage : undefined}
							aria-describedby={clsx(
								descriptionId,
								errorId,
								infoMessage && `${inputId}-info`
							)}
							aria-invalid={hasError}
							aria-required={required}
						/>
					)}

					{(loading || status !== 'idle') && (
						<div className={styles.statusIndicator}>
							<StatusBadge
								status={getStatusBadge()}
								size="sm"
								variant="subtle"
								showIcon
							/>
						</div>
					)}
				</div>

				{errorMessage && (
					<p id={errorId} className={styles.errorMessage} role="alert">
						{errorMessage}
					</p>
				)}

				{warningMessage && (
					<p className={styles.warningMessage}>
						{warningMessage}
					</p>
				)}

				{infoMessage && (
					<p className={styles.infoMessage}>
						{infoMessage}
					</p>
				)}
			</div>
		)
	}
)

FormControl.displayName = 'FormControl'

// Memoize for performance
const MemoizedFormControl = React.memo(FormControl, (prevProps, nextProps) => {
	return (
		prevProps.label === nextProps.label &&
		prevProps.description === nextProps.description &&
		prevProps.errorMessage === nextProps.errorMessage &&
		prevProps.warningMessage === nextProps.warningMessage &&
		prevProps.infoMessage === nextProps.infoMessage &&
		prevProps.required === nextProps.required &&
		prevProps.disabled === nextProps.disabled &&
		prevProps.loading === nextProps.loading &&
		prevProps.status === nextProps.status &&
		JSON.stringify(prevProps.inputProps) === JSON.stringify(nextProps.inputProps)
	)
})

export { MemoizedFormControl as FormControl }