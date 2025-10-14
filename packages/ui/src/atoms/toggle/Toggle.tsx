import clsx from 'clsx'
import { forwardRef, useState } from 'react'
import styles from './Toggle.module.css'

// Type alias for better readability
type ToggleProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
	label?: string
	description?: string
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
	({ label, description, className, checked: controlledChecked, onChange, disabled = false, ...props }, ref) => {
		const [internalChecked, setInternalChecked] = useState(controlledChecked || false)
		const toggleId = `toggle-${Math.random().toString(36).substr(2, 9)}`

		// Determine if this is a controlled or uncontrolled component
		const isControlled = controlledChecked !== undefined
		const isChecked = isControlled ? controlledChecked : internalChecked

		const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
			const newChecked = event.target.checked

			// Update internal state for uncontrolled component
			if (!isControlled) {
				setInternalChecked(newChecked)
			}

			// Call external onChange if provided
			if (onChange) {
				onChange(event)
			}
		}

		const toggleClasses = clsx(styles.toggle, className)

		return (
			<div className={toggleClasses}>
				<label className={styles.label} htmlFor={toggleId}>
					<div className={styles.inputWrapper}>
						<input
							ref={ref}
							id={toggleId}
							type='checkbox'
							className={styles.input}
							checked={isChecked}
							onChange={handleChange}
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
