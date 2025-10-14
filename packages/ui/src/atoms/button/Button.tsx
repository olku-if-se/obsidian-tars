import { forwardRef } from 'react'
import { useSemanticColors } from '../../components/atoms/ThemeProvider'
import styles from './Button.module.css'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'default' | 'danger' | 'primary'
	size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ variant = 'default', size = 'md', className, children, ...props }, ref) => {
		const colors = useSemanticColors()

		// Apply inline styles for theme colors as fallback
		const getVariantStyles = () => {
			switch (variant) {
				case 'primary':
					return {
						backgroundColor: colors.accent,
						color: colors.onAccent,
						borderColor: colors.accent
					}
				case 'danger':
					return {
						backgroundColor: colors.error,
						color: colors.onAccent,
						borderColor: colors.error
					}
				default:
					return {
						backgroundColor: colors.interactive,
						color: colors.text,
						borderColor: colors.border
					}
			}
		}

		const getSizeStyles = () => {
			switch (size) {
				case 'sm':
					return {
						padding: 'var(--size-2-1) var(--size-4-1)',
						fontSize: 'var(--font-ui-small)'
					}
				case 'lg':
					return {
						padding: 'var(--size-2-3) var(--size-4-4)',
						fontSize: 'var(--font-ui-large)'
					}
				default:
					return {
						padding: 'var(--size-2-2) var(--size-4-2)',
						fontSize: 'var(--font-ui-medium)'
					}
			}
		}

		const style = {
			...getVariantStyles(),
			...getSizeStyles(),
			borderRadius: 'var(--radius-m)',
			borderWidth: 'var(--border-width)',
			fontFamily: 'var(--font-interface)',
			fontWeight: 'var(--font-medium)',
			cursor: 'pointer',
			transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease'
		}

		return (
			<button
				ref={ref}
				className={`${styles.button} ${styles[variant]} ${styles[size]} ${className || ''}`}
				style={style}
				{...props}
			>
				{children}
			</button>
		)
	}
)

Button.displayName = 'Button'
