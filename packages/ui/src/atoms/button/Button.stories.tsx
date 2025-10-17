import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'

const meta = {
	title: 'Atoms/Button',
	component: Button,
	parameters: {
		layout: {
			constrainWidth: true,
			center: true
		},
		// Add viewport parameter for responsive testing
		viewport: {
			viewports: {
				mobile: {
					name: 'Mobile',
					styles: {
						width: '375px',
						height: '667px'
					}
				},
				tablet: {
					name: 'Tablet',
					styles: {
						width: '768px',
						height: '1024px'
					}
				},
				desktop: {
					name: 'Desktop',
					styles: {
						width: '1024px',
						height: '768px'
					}
				}
			}
		}
	},
	tags: ['autodocs']
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		children: 'Click me'
	}
}

export const Primary: Story = {
	args: {
		children: 'Primary Button',
		variant: 'primary'
	}
}

export const Danger: Story = {
	args: {
		children: 'Danger Button',
		variant: 'danger'
	}
}

export const Small: Story = {
	args: {
		children: 'Small Button',
		size: 'sm'
	}
}

export const Large: Story = {
	args: {
		children: 'Large Button',
		size: 'lg'
	}
}

export const Disabled: Story = {
	args: {
		children: 'Disabled Button',
		disabled: true
	}
}

export const WithIcon: Story = {
	args: {
		children: '⚡ Button',
		variant: 'primary'
	}
}

// Responsive layout stories
export const ResponsiveButtonGroup: Story = {
	render: () => (
		<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
			<Button variant='primary'>Primary</Button>
			<Button variant='secondary'>Secondary</Button>
			<Button variant='danger'>Danger</Button>
		</div>
	),
	parameters: {
		layout: {
			constrainWidth: true,
			center: true
		}
	}
}

export const ResponsiveFullWidth: Story = {
	render: () => (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
			<Button variant='primary' style={{ width: '100%' }}>
				Full Width Button
			</Button>
			<div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
				<Button variant='secondary' style={{ flex: 1 }}>
					First Half
				</Button>
				<Button variant='secondary' style={{ flex: 1 }}>
					Second Half
				</Button>
			</div>
		</div>
	),
	parameters: {
		layout: {
			constrainWidth: true,
			center: true
		}
	}
}
