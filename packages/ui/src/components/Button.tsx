import { forwardRef } from 'react'
import styles from './Button.module.css'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'default' | 'danger' | 'primary'
	size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ variant = 'default', size = 'md', className, children, ...props }, ref) => {
		return (
			<button ref={ref} className={`${styles.button} ${styles[variant]} ${styles[size]} ${className || ''}`} {...props}>
				{children}
			</button>
		)
	}
)

Button.displayName = 'Button'
