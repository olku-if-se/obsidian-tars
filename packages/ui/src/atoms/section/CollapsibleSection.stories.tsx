import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Button, Input, Toggle } from '~/atoms'
import { CollapsibleSection } from './CollapsibleSection'

const meta = {
	title: 'Atoms/CollapsibleSection',
	component: CollapsibleSection,
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component: `
CollapsibleSection atom provides a collapsible container with a heading.
It supports both controlled (open) and uncontrolled (defaultOpen) usage and fires onToggle when state changes.

## Usage
- Use for content that can be shown/hidden to save space
- Choose uncontrolled for local, component-managed state via defaultOpen
- Choose controlled for external state via open + onToggle
- Best for advanced settings or optional content sections
        `
			}
		}
	},
	tags: ['autodocs'],
	argTypes: {
		title: {
			description: 'The section title/heading',
			control: 'text'
		},
		defaultOpen: {
			description: 'Whether the section is open by default',
			control: 'boolean'
		},
		onToggle: {
			description: 'Callback fired when section is toggled',
			control: false
		},
		children: {
			description: 'Collapsible content',
			control: false
		},
		className: {
			description: 'Additional CSS classes',
			control: 'text'
		}
	}
} satisfies Meta<typeof CollapsibleSection>

export default meta
type Story = StoryObj<typeof meta>

// Basic collapsible section
export const Default: Story = {
	args: {
		title: 'Advanced Settings',
		defaultOpen: false,
		children: (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<div style={{ fontWeight: '500' }}>Enable debug mode</div>
					<div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
						Show additional debugging information
					</div>
					<Toggle
						checked={false}
						onChange={() => {
							/* Demo placeholder */
						}}
					/>
				</div>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<div style={{ fontWeight: '500' }}>Log level</div>
					<div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
						Set the minimum log level to display
					</div>
					<Input
						value='info'
						onChange={() => {
							/* Demo placeholder */
						}}
					/>
				</div>
			</div>
		)
	}
}

// Open by default
export const OpenByDefault: Story = {
	args: {
		title: 'System Configuration',
		defaultOpen: true,
		children: (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<div style={{ fontWeight: '500' }}>Cache size</div>
					<div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Maximum cache size in megabytes</div>
					<Input
						type='number'
						value='512'
						onChange={() => {
							/* Demo placeholder */
						}}
					/>
				</div>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<div style={{ fontWeight: '500' }}>Auto-cleanup</div>
					<div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
						Automatically clean up old cache files
					</div>
					<Toggle
						checked={true}
						onChange={() => {
							/* Demo placeholder */
						}}
					/>
				</div>
			</div>
		)
	}
}

// Section with form content
export const WithForm: Story = {
	args: {
		title: 'API Configuration',
		defaultOpen: false,
		children: (
			<form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<div style={{ fontWeight: '500' }}>API Endpoint</div>
					<div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>The base URL for API requests</div>
					<Input
						placeholder='https://api.example.com'
						value='https://api.example.com'
						onChange={() => {
							/* Demo placeholder */
						}}
					/>
				</div>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<div style={{ fontWeight: '500' }}>API Key</div>
					<div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Your secret API key</div>
					<Input
						type='password'
						value='sk-...'
						onChange={() => {
							/* Demo placeholder */
						}}
					/>
				</div>

				<div style={{ display: 'flex', gap: '12px' }}>
					<Button variant='primary'>Save Configuration</Button>
					<Button variant='default'>Test Connection</Button>
				</div>
			</form>
		)
	}
}

// Section with many items
export const ManyItems: Story = {
	args: {
		title: 'Developer Options',
		defaultOpen: false,
		children: (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
				{Array.from({ length: 8 }, (_, i) => (
					<div key={`developer-setting-${i + 1}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
						<div style={{ fontWeight: '500' }}>Developer Setting {i + 1}</div>
						<div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
							This is an advanced developer setting that should only be modified if you know what you're doing.
						</div>
						<Toggle
							checked={i % 3 === 0}
							onChange={() => {
								/* Demo placeholder */
							}}
						/>
					</div>
				))}
			</div>
		)
	}
}

// Interactive demo with state tracking
export const InteractiveDemo: Story = {
	args: {
		title: 'Interactive Demo',
		defaultOpen: false,
		children: null
	},
	render: () => {
		const [toggleCount, setToggleCount] = useState(0)
		const [lastToggleState, setLastToggleState] = useState(false)

		const handleToggle = (isOpen: boolean) => {
			setToggleCount((prev) => prev + 1)
			setLastToggleState(isOpen)
		}

		return (
			<div className='interactive-demo'>
				<div className='demo-info'>
					<strong>Interactive Demo:</strong>
					<br />
					Toggle count: {toggleCount}
					<br />
					Last state: {lastToggleState ? 'Open' : 'Closed'}
				</div>

				<CollapsibleSection title='Interactive Section' defaultOpen={false} onToggle={handleToggle}>
					<div className='demo-content'>
						<div className='demo-text'>
							This section tracks when it's opened and closed. Try toggling it multiple times!
						</div>
						<Toggle
							checked={true}
							onChange={() => {
								/* Demo placeholder */
							}}
						/>
						<Input
							value='Interactive content'
							onChange={() => {
								/* Demo placeholder */
							}}
						/>
					</div>
				</CollapsibleSection>
			</div>
		)
	}
}

// Controlled example using the `open` prop
export const Controlled: Story = {
	args: {
		title: 'Controlled Section',
		children: (
			<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
				<div>This section is controlled by parent state.</div>
				<Input
					value='Some value'
					onChange={() => {
						/* Demo placeholder */
					}}
				/>
			</div>
		)
	},
	render: (args) => {
		const [open, setOpen] = useState(false)
		return (
			<div>
				<div style={{ marginBottom: 12 }}>
					<Button variant='default' onClick={() => setOpen((v) => !v)}>
						Toggle from parent (current: {open ? 'open' : 'closed'})
					</Button>
				</div>
				<CollapsibleSection {...args} open={open} onToggle={(next) => setOpen(next)} />
			</div>
		)
	}
}

// Nested collapsible sections
export const NestedSections: Story = {
	args: {
		title: 'Parent Section',
		defaultOpen: true,
		children: null
	},
	render: () => (
		<CollapsibleSection title='Parent Section' defaultOpen={true}>
			<div className='nested-content'>
				<div className='nested-text'>This is the parent section content with nested sections inside.</div>

				<CollapsibleSection title='Nested Section 1' defaultOpen={false}>
					<div className='nested-section'>Content for the first nested section.</div>
				</CollapsibleSection>

				<CollapsibleSection title='Nested Section 2' defaultOpen={false}>
					<div className='nested-section'>Content for the second nested section.</div>
				</CollapsibleSection>

				<div className='nested-text'>More parent section content after the nested sections.</div>
			</div>
		</CollapsibleSection>
	)
}

// Section with action buttons
export const WithActions: Story = {
	args: {
		title: 'Account Management',
		defaultOpen: false,
		children: (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<div style={{ fontWeight: '500' }}>Account type</div>
					<div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Your current subscription tier</div>
					<Input value='Premium' disabled />
				</div>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<div style={{ fontWeight: '500' }}>Danger zone</div>
					<div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
						Irreversible actions that affect your account
					</div>
					<div style={{ display: 'flex', gap: '12px' }}>
						<Button variant='default'>Export Data</Button>
						<Button variant='danger'>Delete Account</Button>
					</div>
				</div>
			</div>
		)
	}
}
