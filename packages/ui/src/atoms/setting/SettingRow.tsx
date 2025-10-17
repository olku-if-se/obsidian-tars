import clsx from 'clsx'
import type { ReactNode } from 'react'
import styles from './SettingRow.module.css'

type LayoutRatio = [number, number]

interface SettingRowProps {
	name: string
	description?: string
	children: ReactNode
	className?: string
	/**
	 * Forces the layout into a stacked (vertical) arrangement regardless of screen size.
	 * Useful when a control needs the full width even on desktop.
	 */
	vertical?: boolean
	/**
	 * Adjusts the relative space taken by the information (left) and control (right) columns.
	 * Accepts a tuple where the first value represents the info column flex grow value,
	 * and the second value represents the control column flex grow value. Defaults to [1, 1].
	 */
	layoutRatio?: LayoutRatio
}

const DEFAULT_RATIO: LayoutRatio = [8, 2]

export const SettingRow = ({
	name,
	description,
	children,
	className,
	vertical = false,
	layoutRatio
}: SettingRowProps) => {
	const [infoGrow, controlGrow] = layoutRatio ?? DEFAULT_RATIO

	return (
		<div className={clsx(styles.settingRow, vertical && styles.vertical, className)}>
			<div className={styles.settingInfo} style={{ flexGrow: infoGrow }}>
				<div className={styles.settingName}>{name}</div>
				{description && <div className={styles.settingDescription}>{description}</div>}
			</div>
			<div className={styles.settingControl} style={{ flexGrow: controlGrow }}>
				{children}
			</div>
		</div>
	)
}
