import type { Meta, StoryObj } from '@storybook/react'
import { GenerationStatsModal } from './GenerationStatsModal'
import type { GenerationStats, ErrorLogEntry } from './GenerationStatsModal'

const meta: Meta<typeof GenerationStatsModal> = {
	title: 'Components/Status/GenerationStatsModal',
	component: GenerationStatsModal,
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component: 'Modal for displaying AI generation statistics including round, model, duration, and character count.'
			}
		}
	},
	tags: ['autodocs'],
	argTypes: {
		stats: {
			description: 'Generation statistics including model info, timing, and character count',
			control: 'object'
		},
		errorLog: {
			description: 'Array of error log entries from generation attempts',
			control: 'array'
		},
		onClearLogs: {
			description: 'Callback to clear all error logs',
			action: 'logsCleared'
		},
		onRemoveLog: {
			description: 'Callback to remove a specific error log entry',
			action: 'logRemoved'
		},
		onClose: {
			description: 'Callback to close the modal',
			action: 'modalClosed'
		}
	}
}

export default meta
type Story = StoryObj<typeof GenerationStatsModal>

// Mock app object
const mockApp = {
	vault: { getName: () => 'Test Vault' },
	workspace: { activeLeaf: () => null }
} as const

// Sample generation stats
const sampleStats: GenerationStats = {
	round: 1,
	characters: 1234,
	duration: '2.5s',
	model: 'claude-3-sonnet-20240229',
	vendor: 'claude',
	startTime: new Date(Date.now() - 2500),
	endTime: new Date()
}

// Sample generation stats with milliseconds
const sampleStatsMs: GenerationStats = {
	round: 3,
	characters: 2567,
	duration: '1250',
	model: 'gpt-4-turbo-preview',
	vendor: 'openai',
	startTime: new Date(Date.now() - 1250),
	endTime: new Date()
}

// Sample generation stats with long duration
const sampleStatsLong: GenerationStats = {
	round: 2,
	characters: 3456,
	duration: '15.7s',
	model: 'claude-3-opus-20240229',
	vendor: 'claude',
	startTime: new Date(Date.now() - 15700),
	endTime: new Date()
}

// Sample error logs
const sampleErrorLogs: ErrorLogEntry[] = [
	{
		id: 'error-1',
		type: 'generation',
		name: 'RateLimitError',
		message: 'Claude API rate limit exceeded. Please try again later.',
		timestamp: new Date(Date.now() - 5 * 60 * 1000),
		context: {
			provider: 'claude',
			requestId: 'req_abc123',
			rateLimitRemaining: 0
		}
	},
	{
		id: 'error-2',
		type: 'generation',
		name: 'NetworkError',
		message: 'Failed to connect to OpenAI API: Network timeout',
		timestamp: new Date(Date.now() - 10 * 60 * 1000),
		context: {
			provider: 'openai',
			timeout: 30000,
			attempts: 3
		}
	}
]

export const BasicStats: Story = {
	args: {
		app: mockApp,
		stats: sampleStats,
		errorLog: [],
		onClearLogs: () => console.log('Logs cleared'),
		onRemoveLog: (id) => console.log('Log removed:', id),
		onClose: () => console.log('Modal closed')
	}
}

export const WithMilliseconds: Story = {
	args: {
		app: mockApp,
		stats: sampleStatsMs,
		errorLog: [],
		onClearLogs: () => console.log('Logs cleared'),
		onRemoveLog: (id) => console.log('Log removed:', id),
		onClose: () => console.log('Modal closed')
	},
	parameters: {
		docs: {
			description: {
				story: 'Generation stats with duration in milliseconds format.'
			}
		}
	}
}

export const WithLongDuration: Story = {
	args: {
		app: mockApp,
		stats: sampleStatsLong,
		errorLog: [],
		onClearLogs: () => console.log('Logs cleared'),
		onRemoveLog: (id) => console.log('Log removed:', id),
		onClose: () => console.log('Modal closed')
	},
	parameters: {
		docs: {
			description: {
				story: 'Generation stats with long duration time.'
			}
		}
	}
}

export const WithErrors: Story = {
	args: {
		app: mockApp,
		stats: sampleStats,
		errorLog: sampleErrorLogs,
		onClearLogs: () => console.log('Logs cleared'),
		onRemoveLog: (id) => console.log('Log removed:', id),
		onClose: () => console.log('Modal closed')
	},
	parameters: {
		docs: {
			description: {
				story: 'Modal showing generation stats with error logs available for viewing.'
			}
		}
	}
}

export const HighCharacterCount: Story = {
	args: {
		app: mockApp,
		stats: {
			round: 1,
			characters: 15420,
			duration: '8.3s',
			model: 'claude-3-opus-20240229',
			vendor: 'claude',
			startTime: new Date(Date.now() - 8300),
			endTime: new Date()
		},
		errorLog: [],
		onClearLogs: () => console.log('Logs cleared'),
		onRemoveLog: (id) => console.log('Log removed:', id),
		onClose: () => console.log('Modal closed')
	},
	parameters: {
		docs: {
			description: {
				story: 'Generation stats with high character count showing formatted number.'
			}
		}
	}
}

export const MultipleRounds: Story = {
	args: {
		app: mockApp,
		stats: {
			round: 5,
			characters: 892,
			duration: '1.2s',
			model: 'gpt-4-turbo-preview',
			vendor: 'openai',
			startTime: new Date(Date.now() - 1200),
			endTime: new Date()
		},
		errorLog: [],
		onClearLogs: () => console.log('Logs cleared'),
		onRemoveLog: (id) => console.log('Log removed:', id),
		onClose: () => console.log('Modal closed')
	},
	parameters: {
		docs: {
			description: {
				story: 'Generation stats showing multiple rounds of conversation.'
			}
		}
	}
}

export const Interactive: Story = {
	args: {
		app: mockApp,
		stats: sampleStats,
		errorLog: sampleErrorLogs,
		onClearLogs: () => console.log('Logs cleared'),
		onRemoveLog: (id) => console.log('Log removed:', id),
		onClose: () => console.log('Modal closed')
	},
	parameters: {
		docs: {
			description: {
				story: 'Fully interactive modal with working error log viewer button.'
			}
		}
	}
}