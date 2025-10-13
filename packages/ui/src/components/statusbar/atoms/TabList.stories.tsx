import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { TabList } from './TabList'

const meta = {
	title: 'Atoms/TabList',
	component: TabList,
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component: 'Atomic element for interactive tab navigation. The smallest interactive navigation unit for modal tabs and navigation interfaces.'
			}
		}
	},
	tags: ['autodocs'],
	argTypes: {
		tabs: {
			control: 'object',
			description: 'Array of tab objects with id, label, and content'
		},
		activeTab: {
			control: 'text',
			description: 'ID of the currently active tab'
		},
		onTabChange: {
			action: 'tabChanged',
			description: 'Callback function when tab is clicked'
		},
		tabButtonClassName: {
			control: 'text',
			description: 'CSS class for tab buttons'
		},
		activeTabClassName: {
			control: 'text',
			description: 'CSS class for the active tab button'
		},
		panelClassName: {
			control: 'text',
			description: 'CSS class for the content panel'
		}
	}
} satisfies Meta<typeof TabList>

export default meta
type Story = StoryObj<typeof meta>

// Interactive wrapper component for stories
interface InteractiveTabListProps {
	tabs: Array<{
		id: string
		label: string
		content: React.ReactNode
	}>
	initialTab?: string
	tabButtonClassName?: string
	activeTabClassName?: string
	panelClassName?: string
}

const InteractiveTabList = ({ initialTab = 'tab1', ...props }: InteractiveTabListProps) => {
	const [activeTab, setActiveTab] = useState(initialTab)

	return (
		<TabList
			{...props}
			activeTab={activeTab}
			onTabChange={setActiveTab}
		/>
	)
}

export const Default: Story = {
	render: (args) => <InteractiveTabList {...args} />,
	args: {
		tabs: [
			{
				id: 'tab1',
				label: 'First Tab',
				content: <div style={{ padding: '20px' }}>Content for first tab</div>
			},
			{
				id: 'tab2',
				label: 'Second Tab',
				content: <div style={{ padding: '20px' }}>Content for second tab</div>
			}
		],
		initialTab: 'tab1'
	}
}

export const MultipleTabs: Story = {
	render: (args) => <InteractiveTabList {...args} />,
	args: {
		tabs: [
			{
				id: 'mcp',
				label: 'MCP Server Status',
				content: (
					<div style={{ padding: '20px' }}>
						<h3>MCP Server Status</h3>
						<p>Running: 5 / 8 servers</p>
						<p>Available Tools: 23</p>
					</div>
				)
			},
			{
				id: 'errors',
				label: 'Error Details',
				content: (
					<div style={{ padding: '20px' }}>
						<h3>Error Details</h3>
						<p>No errors detected.</p>
					</div>
				)
			},
			{
				id: 'settings',
				label: 'Settings',
				content: (
					<div style={{ padding: '20px' }}>
						<h3>Settings</h3>
						<p>Configuration options here.</p>
					</div>
				)
			}
		],
		initialTab: 'mcp'
	}
}

export const WithCustomClasses: Story = {
	render: (args) => <InteractiveTabList {...args} />,
	args: {
		tabs: [
			{
				id: 'overview',
				label: '📊 Overview',
				content: <div style={{ padding: '20px' }}>Overview content</div>
			},
			{
				id: 'details',
				label: '📋 Details',
				content: <div style={{ padding: '20px' }}>Detailed information</div>
			}
		],
		initialTab: 'overview',
		tabButtonClassName: 'custom-tab-button',
		activeTabClassName: 'custom-active-tab',
		panelClassName: 'custom-panel'
	}
}

export const ComplexContent: Story = {
	render: (args) => <InteractiveTabList {...args} />,
	args: {
		tabs: [
			{
				id: 'stats',
				label: 'Statistics',
				content: (
					<div style={{ padding: '20px' }}>
						<h3>Generation Statistics</h3>
						<div style={{ display: 'grid', gap: '10px' }}>
							<div><strong>Round:</strong> 3</div>
							<div><strong>Model:</strong> Claude-3.5-Sonnet</div>
							<div><strong>Characters:</strong> 1,234</div>
							<div><strong>Duration:</strong> 2.3s</div>
						</div>
					</div>
				)
			},
			{
				id: 'errors',
				label: 'Error Log',
				content: (
					<div style={{ padding: '20px' }}>
						<h3>Recent Errors</h3>
						<div style={{ backgroundColor: '#ffe6e6', padding: '10px', borderRadius: '4px' }}>
							<p><strong>Timeout Error</strong> - 2 minutes ago</p>
							<p>Connection to server timed out after 30 seconds</p>
						</div>
					</div>
				)
			},
			{
				id: 'servers',
				label: 'Servers',
				content: (
					<div style={{ padding: '20px' }}>
						<h3>Server Status</h3>
						<div style={{ display: 'grid', gap: '8px' }}>
							<div style={{ color: 'green' }}>🟢 claude-server - Connected</div>
							<div style={{ color: 'green' }}>🟢 openai-server - Connected</div>
							<div style={{ color: 'orange' }}>🟠 gemini-server - Retrying</div>
						</div>
					</div>
				)
			}
		],
		initialTab: 'stats'
	}
}

export const SingleTab: Story = {
	render: (args) => <InteractiveTabList {...args} />,
	args: {
		tabs: [
			{
				id: 'only',
				label: 'Only Tab',
				content: <div style={{ padding: '20px' }}>This is the only tab available</div>
			}
		],
		initialTab: 'only'
	}
}

export const LongLabels: Story = {
	render: (args) => <InteractiveTabList {...args} />,
	args: {
		tabs: [
			{
				id: 'very-long-tab-name',
				label: 'This is a very long tab label that might need to wrap',
				content: <div style={{ padding: '20px' }}>Content for tab with long label</div>
			},
			{
				id: 'another-extremely-long-tab-name',
				label: 'Another extremely long tab name for testing',
				content: <div style={{ padding: '20px' }}>Content for second tab with long label</div>
			}
		],
		initialTab: 'very-long-tab-name'
	}
}