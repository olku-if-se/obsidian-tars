import type React from 'react'

/**
 * Atomic Element: Tab List
 * Purpose: Renders tab-based navigation interface (smallest interactive unit)
 * Category: Atom
 */

export interface TabItemProps {
	id: string
	label: string
	content: React.ReactNode
	isActive?: boolean
}

export interface TabListProps {
	tabs: TabItemProps[]
	activeTab: string
	onTabChange: (tabId: string) => void
	tabButtonClassName?: string
	activeTabClassName?: string
	panelClassName?: string
}

export const TabList: React.FC<TabListProps> = ({
	tabs,
	activeTab,
	onTabChange,
	tabButtonClassName,
	activeTabClassName,
	panelClassName
}) => {
	const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content

	return (
		<>
			{tabs.length > 1 && (
				<div className={tabButtonClassName}>
					{tabs.map((tab) => (
						<button
							key={tab.id}
							type="button"
							className={`${activeTab === tab.id ? activeTabClassName : ''}`}
							onClick={() => onTabChange(tab.id)}
						>
							{tab.label}
						</button>
					))}
				</div>
			)}
			<div className={panelClassName}>
				{activeTabContent}
			</div>
		</>
	)
}