import { forwardRef } from 'react'
import styles from './Select.module.css'

interface SelectOption {
	value: string
	label: string
	disabled?: boolean
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
	label?: string
	description?: string
	options: SelectOption[]
	emptyOption?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
	({ label, description, options, emptyOption, className, disabled = false, ...props }, ref) => {
		const selectId = `select-${Math.random().toString(36).substr(2, 9)}`

		return (
			<div className={`${styles.select} ${className || ''}`}>
				{label && (
					<label className={styles.label} htmlFor={selectId}>
						{label}
					</label>
				)}
				<div className={styles.selectWrapper}>
					<select ref={ref} id={selectId} className={styles.input} disabled={disabled} {...props}>
						{emptyOption && (
							<option value='' disabled={!props.required}>
								{emptyOption}
							</option>
						)}
						{options.map((option) => (
							<option key={option.value} value={option.value} disabled={option.disabled}>
								{option.label}
							</option>
						))}
					</select>
					<div className={styles.arrow}>
						<svg width='12' height='8' viewBox='0 0 12 8' fill='none' aria-hidden='true'>
							<title>Dropdown arrow</title>
							<path
								d='M1 1.5L6 6.5L11 1.5'
								stroke='currentColor'
								strokeWidth='1.5'
								strokeLinecap='round'
								strokeLinejoin='round'
							/>
						</svg>
					</div>
				</div>
				{description && <div className={styles.description}>{description}</div>}
			</div>
		)
	}
)

Select.displayName = 'Select'
