import clsx from 'clsx'
import { forwardRef, useState } from 'react'
import styles from './Slider.module.css'

// Type alias for better readability
type SliderProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
	label?: string
	description?: string
	min?: number
	max?: number
	step?: number
	value?: number
	showValue?: boolean
	valueFormatter?: (value: number) => string
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
	(
		{
			label,
			description,
			min = 0,
			max = 100,
			step = 1,
			value: controlledValue,
			showValue = false,
			valueFormatter = (value) => value.toString(),
			onChange,
			className,
			...props
		},
		ref
	) => {
		const [internalValue, setInternalValue] = useState(controlledValue || min)
		const isControlled = controlledValue !== undefined
		const value = isControlled ? controlledValue : internalValue

		const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = Number(event.target.value)

			if (!isControlled) {
				setInternalValue(newValue)
			}

			if (onChange) {
				onChange(event)
			}
		}

		const sliderId = `slider-${Math.random().toString(36).substr(2, 9)}`

		// Calculate percentage for CSS custom property
		const percentage = max > min ? ((value - min) / (max - min)) * 100 : 0

		const trackFillStyles = {
			'--slider-percentage': `${percentage}%`
		} as React.CSSProperties

		return (
			<div className={clsx(styles.slider, className)}>
				{label && (
					<div className={styles.header}>
						<label className={styles.label} htmlFor={sliderId}>
							{label}
						</label>
						{showValue && <span className={styles.value}>{valueFormatter(value)}</span>}
					</div>
				)}
				<div className={styles.track}>
					<input
						ref={ref}
						id={sliderId}
						type="range"
						className={styles.input}
						min={min}
						max={max}
						step={step}
						value={value}
						onChange={handleChange}
						{...props}
					/>
					<div className={styles.trackBackground}>
						<div className={styles.trackFill} style={trackFillStyles} />
					</div>
				</div>
				{description && <div className={styles.description}>{description}</div>}
			</div>
		)
	}
)

Slider.displayName = 'Slider'
