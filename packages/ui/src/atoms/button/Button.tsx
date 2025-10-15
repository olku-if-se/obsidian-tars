import clsx from 'clsx'
import React, { forwardRef } from 'react'
import styles from './Button.module.css'

// Define variants and sizes as constants for better type safety
const BUTTON_VARIANTS = ['default', 'danger', 'primary'] as const
const BUTTON_SIZES = ['sm', 'md', 'lg'] as const

type ButtonVariant = typeof BUTTON_VARIANTS[number]
type ButtonSize = typeof BUTTON_SIZES[number]

// Type alias for better readability with React 19 improvements
type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> & {
	variant?: ButtonVariant
	size?: ButtonSize
	// Add React 19 compliance props
	as?: React.ElementType
	children: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ variant = 'default', size = 'md', className, children, as: Component = 'button', ...props }, ref) => {
		// Validate props for React 19 compliance
		if (process.env.NODE_ENV === 'development') {
			if (!BUTTON_VARIANTS.includes(variant as ButtonVariant)) {
				console.warn(`Invalid variant "${variant}". Valid variants: ${BUTTON_VARIANTS.join(', ')}`)
			}
			if (!BUTTON_SIZES.includes(size as ButtonSize)) {
				console.warn(`Invalid size "${size}". Valid sizes: ${BUTTON_SIZES.join(', ')}`)
			}
		}

		const buttonClasses = clsx(
			styles.button,
			styles[variant],
			styles[size],
			className
		)

		return (
			<Component
				ref={ref}
				className={buttonClasses}
				{...props}
			>
				{children}
			</Component>
		)
	}
)

Button.displayName = 'Button'

// Wrap with React.memo for performance optimization
const MemoizedButton = React.memo(Button)
export { MemoizedButton as Button }
