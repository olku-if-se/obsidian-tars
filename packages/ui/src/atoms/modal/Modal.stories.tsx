import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Button } from '..'
import { Modal } from './Modal'

interface ModalWrapperProps {
	children?: React.ReactNode
	isOpen?: boolean
	title?: string
	size?: 'sm' | 'md' | 'lg' | 'xl'
	showCloseButton?: boolean
	closeOnBackdropClick?: boolean
	closeOnEscape?: boolean
	className?: string
}

const meta = {
	title: 'Atoms/Modal',
	component: Modal,
	parameters: {
		layout: {
			constrainWidth: false, // Modals should use full viewport
			center: true
		},
		// Disable viewport for modals since they use portal rendering
		viewport: {
			disable: true
		}
	},
	tags: ['autodocs'],
	argTypes: {
		isOpen: {
			control: 'boolean',
			description: 'Whether the modal is open'
		},
		title: {
			control: 'text',
			description: 'Modal title'
		},
		size: {
			control: 'select',
			options: ['sm', 'md', 'lg', 'xl'],
			description: 'Modal size'
		},
		showCloseButton: {
			control: 'boolean',
			description: 'Show close button in header'
		},
		closeOnBackdropClick: {
			control: 'boolean',
			description: 'Close modal when clicking backdrop'
		},
		closeOnEscape: {
			control: 'boolean',
			description: 'Close modal when pressing Escape'
		}
	}
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

// Wrapper component for modal stories
const ModalWrapper = ({ children, ...args }: ModalWrapperProps) => {
	const [isOpen, setIsOpen] = useState(args.isOpen || false)

	return (
		<div style={{ padding: '20px' }}>
			<Button onClick={() => setIsOpen(true)}>Open Modal</Button>
			<Modal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)}>
				{children}
			</Modal>
		</div>
	)
}

export const Default: Story = {
	args: {
		title: 'Modal Title',
		size: 'md',
		children: (
			<div>
				<p>This is a modal with some content.</p>
				<p>You can put any React components here.</p>
			</div>
		)
	},
	render: (args) => <ModalWrapper {...args} />
}

export const Small: Story = {
	args: {
		title: 'Small Modal',
		size: 'sm',
		children: <p>This is a small modal for simple content.</p>
	},
	render: (args) => <ModalWrapper {...args} />
}

export const Large: Story = {
	args: {
		title: 'Large Modal',
		size: 'lg',
		children: (
			<div>
				<h3>Large Content Area</h3>
				<p>This modal has more space for complex content.</p>
				<p>You can include forms, tables, or other complex components here.</p>
				<div
					style={{
						height: '200px',
						backgroundColor: 'var(--background-secondary)',
						borderRadius: '8px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center'
					}}
				>
					<p>Content area placeholder</p>
				</div>
			</div>
		)
	},
	render: (args) => <ModalWrapper {...args} />
}

export const WithoutCloseButton: Story = {
	args: {
		title: 'No Close Button',
		showCloseButton: false,
		closeOnBackdropClick: false,
		closeOnEscape: false,
		children: (
			<div>
				<p>This modal has no close button.</p>
				<p>You'll need to close it programmatically.</p>
				<Button onClick={() => window.location.reload()}>Reload to Close</Button>
			</div>
		)
	},
	render: (args) => <ModalWrapper {...args} />
}

export const NoTitle: Story = {
	args: {
		size: 'sm',
		children: (
			<div>
				<p>This modal has no title.</p>
				<p>Only the close button is shown.</p>
			</div>
		)
	},
	render: (args) => <ModalWrapper {...args} />
}
