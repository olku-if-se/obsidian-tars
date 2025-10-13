import type { Meta, StoryObj } from '@storybook/react'
import { ParagraphList } from './ParagraphList'

const meta = {
	title: 'Atoms/ParagraphList',
	component: ParagraphList,
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component:
					'Atomic element for listing textual content. The smallest text unit for descriptions, summaries, and documentation.'
			}
		}
	},
	tags: ['autodocs'],
	argTypes: {
		items: {
			control: 'object',
			description: 'Array of paragraph items with content and optional className'
		},
		containerClassName: {
			control: 'text',
			description: 'CSS class for the container element'
		}
	}
} satisfies Meta<typeof ParagraphList>

export default meta
type Story = StoryObj<typeof meta>

export const SingleParagraph: Story = {
	args: {
		items: [{ content: 'This is a single paragraph of text.' }]
	}
}

export const MultipleParagraphs: Story = {
	args: {
		items: [
			{ content: 'This is the first paragraph of text.' },
			{ content: 'This is the second paragraph, demonstrating multiple items.' },
			{ content: 'And this is the third paragraph in the list.' }
		]
	}
}

export const WithCustomClasses: Story = {
	args: {
		items: [
			{ content: 'This paragraph has a custom class applied.', className: 'custom-paragraph' },
			{ content: 'This one has a different custom class.', className: 'another-paragraph' },
			{ content: 'This paragraph has no custom class.' }
		],
		containerClassName: 'paragraph-container'
	}
}

export const StatusSummary: Story = {
	args: {
		items: [
			{ content: 'Running: 5 / 8 servers' },
			{ content: 'Active Executions: 3', className: 'active-executions' },
			{ content: 'Retrying: 2 servers', className: 'retrying' },
			{ content: 'Available Tools: 45' },
			{ content: '📦 Cache: 120 entries, 87.3% hit rate', className: 'cache-stats' }
		],
		containerClassName: 'status-summary'
	}
}

export const SessionInformation: Story = {
	args: {
		items: [
			{ content: 'Sessions: 8 / 10', className: 'session-count' },
			{ content: '⚠️ Approaching session limit - consider creating a new document', className: 'session-warning' }
		],
		containerClassName: 'session-info'
	}
}

export const ErrorMessages: Story = {
	args: {
		items: [
			{ content: '❌ Failed to connect to claude-server', className: 'error-critical' },
			{ content: '🔄 Retrying in 15 seconds (attempt 3 of 5)', className: 'error-retry' },
			{ content: 'Last successful connection: 2 minutes ago', className: 'error-info' }
		],
		containerClassName: 'error-messages'
	}
}

export const LongContent: Story = {
	args: {
		items: [
			{
				content:
					'This is a very long paragraph that demonstrates how the component handles extended text content. It contains multiple sentences and shows how text wraps within the paragraph container. This is useful for testing how the component behaves with lengthy descriptions or detailed information that needs to be displayed to the user.'
			},
			{
				content:
					'Here is another lengthy paragraph that continues the test of handling substantial text content. This allows us to verify that the styling remains consistent and that the layout properly accommodates paragraphs with varying amounts of text content.'
			}
		],
		containerClassName: 'long-content'
	}
}

export const MixedContent: Story = {
	args: {
		items: [
			{ content: '✅ All systems operational' },
			{ content: 'Server uptime: 99.8%', className: 'uptime-stat' },
			{ content: 'Last maintenance: 2 days ago' },
			{ content: '⚡ Current load: 23%', className: 'load-indicator' },
			{ content: '📊 Response time: 45ms average', className: 'performance-stat' }
		],
		containerClassName: 'system-status'
	}
}

export const Documentation: Story = {
	args: {
		items: [
			{ content: 'MCP Server Status Monitor' },
			{
				content:
					'This interface displays real-time information about Model Context Protocol (MCP) servers running in your environment.'
			},
			{ content: 'You can view server connectivity, tool availability, and execution metrics through this dashboard.' },
			{ content: 'For detailed error information, click on the Error Details tab when available.' }
		],
		containerClassName: 'documentation'
	}
}

export const EmptyList: Story = {
	args: {
		items: [],
		containerClassName: 'empty-list'
	}
}
