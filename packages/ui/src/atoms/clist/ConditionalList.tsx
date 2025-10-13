import type React from 'react'

/**
 * Atomic Element: Conditional List
 * Purpose: Renders items conditionally based on data (smallest conditional unit)
 * Category: Atom
 */

export interface ConditionalInfoItemProps {
	condition?: boolean
	content: string
	className?: string
}

export interface ConditionalListProps {
	items: ConditionalInfoItemProps[]
	containerClassName?: string
	itemClassName?: string
}

export const ConditionalList: React.FC<ConditionalListProps> = ({ items, containerClassName, itemClassName }) => {
	const filteredItems = items.filter((item) => item.condition ?? true)

	if (filteredItems.length === 0) {
		return null
	}

	return (
		<div className={containerClassName}>
			{filteredItems.map((item, index) => (
				<div key={`${item.content.slice(0, 20)}-${index}`} className={itemClassName}>
					{item.content}
				</div>
			))}
		</div>
	)
}
