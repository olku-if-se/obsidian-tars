import type React from 'react'
import styles from './TabList.module.css'

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
}

export const TabList: React.FC<TabListProps> = ({ tabs, activeTab, onTabChange }) => {
	return (
		<>
			{tabs.length > 1 && (
				<div className={styles.tabBar}>
					{tabs.map((tab) => (
						<button
							key={tab.id}
							type='button'
							className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
							onClick={() => onTabChange(tab.id)}
						>
							{tab.label}
						</button>
					))}
				</div>
			)}
		</>
	)
}
