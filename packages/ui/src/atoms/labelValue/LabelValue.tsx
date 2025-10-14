import clsx from 'clsx'
import type React from 'react'
import styles from './LabelValue.module.css'

/**
 * Atomic Element: Label-Value Row
 * Purpose: Renders a single label-value pair (smallest semantic unit)
 * Category: Atom
 */

// Type alias for better readability
type LabelValueProps = {
	label: string
	value: string | number
	className?: string
	labelClassName?: string
	valueClassName?: string
}

export const LabelValue: React.FC<LabelValueProps> = ({ label, value, className, labelClassName, valueClassName }) => {
	const containerClasses = clsx(styles.labelValue, className)
	const labelClasses = clsx(styles.label, labelClassName)
	const valueClasses = clsx(styles.value, valueClassName)

	return (
		<div className={containerClasses}>
			<span className={labelClasses}>
				{label}
			</span>
			<span className={valueClasses}>{value}</span>
		</div>
	)
}

/**
 * Atomic Element: Label-Value List
 * Purpose: Renders multiple label-value rows from data
 * Category: Atom (composition of LabelValue atoms)
 */

type LabelValueRow = {
	label: string
	value: string | number
}

type LabelValueListProps = {
	rows: LabelValueRow[]
	rowClassName?: string
	labelClassName?: string
	valueClassName?: string
}

export const LabelValueList: React.FC<LabelValueListProps> = ({
	rows,
	rowClassName,
	labelClassName,
	valueClassName
}) => {
	const listProps = {
		className: rowClassName,
		labelClassName,
		valueClassName
	}

	return (
		<>
			{rows.map((row, index) => (
				<LabelValue
					key={`${row.label}-${index}`}
					label={row.label}
					value={row.value}
					{...listProps}
				/>
			))}
		</>
	)
}
