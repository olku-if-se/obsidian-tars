import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input } from './Input'

const meta = {
	title: 'Atoms/Input',
	component: Input,
	parameters: {
		layout: {
			constrainWidth: true,
			center: true
		}
	},
	tags: ['autodocs']
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		placeholder: 'Enter text...'
	}
}

export const WithLabel: Story = {
	args: {
		label: 'Username',
		placeholder: 'Enter your username'
	}
}

export const WithError: Story = {
	args: {
		label: 'Email',
		placeholder: 'Enter your email',
		error: 'Please enter a valid email address'
	}
}

export const Small: Story = {
	args: {
		label: 'Small Input',
		placeholder: 'Small input',
		size: 'sm'
	}
}

export const Large: Story = {
	args: {
		label: 'Large Input',
		placeholder: 'Large input',
		size: 'lg'
	}
}

export const Disabled: Story = {
	args: {
		label: 'Disabled Input',
		placeholder: 'Disabled input',
		disabled: true
	}
}

export const WithValue: Story = {
	args: {
		label: 'Input with value',
		defaultValue: 'Some default text'
	}
}

// Responsive form layouts
export const ResponsiveForm: Story = {
	render: () => (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
			<Input label='First Name' placeholder='Enter first name' />
			<Input label='Last Name' placeholder='Enter last name' />
			<Input label='Email' placeholder='Enter email' />
			<Input label='Message' placeholder='Enter your message' />
		</div>
	),
	parameters: {
		layout: {
			constrainWidth: true,
			center: true
		}
	}
}

export const ResponsiveTwoColumn: Story = {
	render: () => (
		<div
			style={{
				display: 'grid',
				gridTemplateColumns: '1fr 1fr',
				gap: '1rem',
				width: '100%',
				'@media (max-width: 768px)': {
					gridTemplateColumns: '1fr'
				}
			}}
		>
			<Input label='First Name' placeholder='Enter first name' />
			<Input label='Last Name' placeholder='Enter last name' />
			<Input label='Email' placeholder='Enter email' style={{ gridColumn: '1 / -1' }} />
			<Input label='Phone' placeholder='Enter phone' />
			<Input label='Address' placeholder='Enter address' />
		</div>
	),
	parameters: {
		layout: {
			constrainWidth: true,
			center: true
		},
		docs: {
			description: {
				story:
					'Responsive two-column layout that respects container width. The inputs now properly use box-sizing: border-box to prevent overflow issues with padding and borders.'
			}
		}
	}
}

// Story to demonstrate the box-sizing fix
export const ContainerRespectDemo: Story = {
	render: () => (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: '1rem',
				width: '100%',
				padding: '1rem',
				border: '2px solid var(--interactive-accent)',
				borderRadius: 'var(--radius-m)',
				backgroundColor: 'var(--background-secondary)'
			}}
		>
			<div
				style={{
					fontSize: 'var(--font-ui-small)',
					color: 'var(--text-muted)',
					marginBottom: 'var(--size-2-2)'
				}}
			>
				Container with fixed border - inputs should NOT overflow
			</div>

			<Input label='Input with padding fix' placeholder='This input respects container boundaries' />

			<Input
				label='Another input'
				placeholder='Both inputs fit perfectly within the container'
				error='This error state also respects container width'
			/>

			<div
				style={{
					fontSize: 'var(--font-ui-smaller)',
					color: 'var(--text-faint)',
					marginTop: 'var(--size-2-2)'
				}}
			>
				✅ Fixed: box-sizing: border-box prevents width + padding overflow
			</div>
		</div>
	),
	parameters: {
		layout: {
			constrainWidth: true,
			center: true
		},
		docs: {
			description: {
				story:
					'Demonstrates the box-sizing fix. Before the fix, inputs would overflow the container by 18px (width: 100% + padding + border). After the fix, inputs properly respect container boundaries.'
			}
		}
	}
}
