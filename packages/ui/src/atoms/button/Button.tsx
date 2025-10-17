import clsx from 'clsx'
import type React from 'react'
import { forwardRef } from 'react'
import styles from './Button.module.css'

// Type alias for better readability
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: 'default' | 'danger' | 'primary'
	size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ variant = 'default', size = 'md', className, children, ...props }, ref) => {
		const buttonClasses = clsx(styles.button, styles[variant], styles[size], className)

		return (
			<button ref={ref} className={buttonClasses} {...props}>
				{children}
			</button>
		)
	}
)

Button.displayName = 'Button'
