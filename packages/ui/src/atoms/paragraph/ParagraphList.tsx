import type React from 'react'

/**
 * Atomic Element: Paragraph List
 * Purpose: Renders a list of paragraphs from data (smallest text unit)
 * Category: Atom
 */

export interface ParagraphItemProps {
	content: string
	className?: string
}

export interface ParagraphListProps {
	items: ParagraphItemProps[]
	containerClassName?: string
}

export const ParagraphList: React.FC<ParagraphListProps> = ({ items, containerClassName }) => (
	<div className={containerClassName}>
		{items.map((item, index) => (
			<p key={`${item.content.slice(0, 20)}-${index}`} className={item.className}>
				{item.content}
			</p>
		))}
	</div>
)
