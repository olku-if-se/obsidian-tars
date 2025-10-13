import type React from 'react'

/**
 * Atomic Element: Label-Value Row
 * Purpose: Renders a single label-value pair (smallest semantic unit)
 * Category: Atom
 */

export interface LabelValueProps {
	label: string
	value: string | number
	className?: string
	labelClassName?: string
	valueClassName?: string
}

export const LabelValue: React.FC<LabelValueProps> = ({ label, value, className, labelClassName, valueClassName }) => (
	<div className={className}>
		<span className={labelClassName} style={{ paddingRight: '0.5em' }}>
			{label}
		</span>
		<span className={valueClassName}>{value}</span>
	</div>
)

/**
 * Atomic Element: Label-Value List
 * Purpose: Renders multiple label-value rows from data
 * Category: Atom (composition of LabelValue atoms)
 */

export interface LabelValueRow {
	label: string
	value: string | number
}

export interface LabelValueListProps {
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
}) => (
	<>
		{rows.map((row, index) => (
			<LabelValue
				key={`${row.label}-${index}`}
				label={row.label}
				value={row.value}
				{...(rowClassName && { className: rowClassName })}
				{...(labelClassName && { labelClassName })}
				{...(valueClassName && { valueClassName })}
			/>
		))}
	</>
)
