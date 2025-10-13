import { clsx } from 'clsx'
import type React from 'react'
import styles from './InfoSectionList.module.css'

/*
 * Atomic Element: Info Section
 * Purpose: Renders a section with multiple info items (semantic grouping)
 * Category: Atom
 */

export interface InfoSectionProps {
	content: string | number
	className?: string
}

export interface InfoSectionListProps {
	sections: InfoSectionProps[]
	containerClassName?: string
}

export const InfoSectionList: React.FC<InfoSectionListProps> = ({ sections, containerClassName }) => (
	<div className={containerClassName}>
		{sections.map((section, index) => (
			<span
				key={`${String(section.content).slice(0, 20)}-${index}`}
				className={clsx(section.className, styles.infoSectionListSpan)}
			>
				{section.content}
			</span>
		))}
	</div>
)
