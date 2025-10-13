import { forwardRef } from 'react'
import styles from './Toggle.module.css'

interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
	label?: string
	description?: string
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
	({ label, description, className, checked, onChange, disabled = false, ...props }, ref) => {
		const toggleId = `toggle-${Math.random().toString(36).substr(2, 9)}`

		return (
			<div className={`${styles.toggle} ${className || ''}`}>
				<label className={styles.label} htmlFor={toggleId}>
					<div className={styles.inputWrapper}>
						<input
							ref={ref}
							id={toggleId}
							type='checkbox'
							className={styles.input}
							checked={checked}
							onChange={onChange}
							disabled={disabled}
							{...props}
						/>
						<div className={styles.switch}>
							<div className={styles.slider}></div>
						</div>
					</div>
					{(label || description) && (
						<div className={styles.text}>
							{label && <div className={styles.labelText}>{label}</div>}
							{description && <div className={styles.description}>{description}</div>}
						</div>
					)}
				</label>
			</div>
		)
	}
)

Toggle.displayName = 'Toggle'
