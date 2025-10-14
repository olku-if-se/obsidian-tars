import { forwardRef } from 'react'
import { useSemanticColors } from '../../providers/themes/ThemeProvider'
import styles from './Input.module.css'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
	label?: string
	error?: string
	size?: 'sm' | 'md' | 'lg'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ label, error, size = 'md', className, id, ...props }, ref) => {
		const colors = useSemanticColors()
		const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

		return (
			<div className={`${styles.inputWrapper} ${styles[size]} ${className || ''}`}>
				{label && (
					<label htmlFor={inputId} className={styles.label} style={{ color: colors.textMuted }}>
						{label}
					</label>
				)}
				<input
					ref={ref}
					id={inputId}
					className={`${styles.input} ${error ? styles.error : ''}`}
					style={{
						backgroundColor: colors.backgroundSecondary,
						color: colors.text,
						borderColor: error ? colors.error : colors.border,
						fontFamily: 'var(--font-interface)',
						fontSize: 'var(--font-ui-medium)'
					}}
					{...props}
				/>
				{error && (
					<div className={styles.errorText} style={{ color: colors.error }}>
						{error}
					</div>
				)}
			</div>
		)
	}
)

Input.displayName = 'Input'
