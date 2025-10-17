import type { Meta, StoryObj } from '@storybook/react'
import { Button, Input, Toggle } from '~/atoms'
import { Section } from './Section'

const meta = {
	title: 'Atoms/Section',
	component: Section,
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component: `
Section atom provides a container with a heading for grouping related settings.
It's used for creating organized sections in settings panels and forms.

## Usage
- Use for grouping related settings under a common heading
- Provides consistent spacing and typography for section titles
- Can contain any React components as children
- Best for non-collapsible content sections
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
		children: {
			description: 'Section content (settings, controls, etc.)',
			control: false
		},
		className: {
			description: 'Additional CSS classes',
			control: 'text'
		}
	}
} satisfies Meta<typeof Section>

export default meta
type Story = StoryObj<typeof meta>

// Basic section with toggle settings
export const Basic: Story = {
	args: {
		title: 'Basic Settings',
		children: (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<div style={{ fontWeight: '500' }}>Enable notifications</div>
					<div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
						Receive notifications when new messages arrive
					</div>
					<Toggle
						checked={true}
						onChange={() => {
							/* Demo placeholder */
						}}
					/>
				</div>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<div style={{ fontWeight: '500' }}>Auto-save</div>
					<div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
						Automatically save your work every 5 minutes
					</div>
					<Toggle
						checked={false}
						onChange={() => {
							/* Demo placeholder */
						}}
					/>
				</div>
			</div>
		)
	}
}

// Section with input fields
export const WithInputs: Story = {
	args: {
		title: 'Account Settings',
		children: (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<div style={{ fontWeight: '500' }}>Username</div>
					<div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
						Your unique username for the platform
					</div>
					<Input
						value="john_doe"
						onChange={() => {
							/* Demo placeholder */
						}}
					/>
				</div>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<div style={{ fontWeight: '500' }}>Email</div>
					<div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Contact email for notifications</div>
					<Input
						type="email"
						value="john@example.com"
						onChange={() => {
							/* Demo placeholder */
						}}
					/>
				</div>
			</div>
		)
	}
}

// Section with mixed content types
export const MixedContent: Story = {
	args: {
		title: 'Privacy Settings',
		children: (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<div style={{ fontWeight: '500' }}>Profile visibility</div>
					<div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Control who can see your profile</div>
					<Toggle
						checked={true}
						onChange={() => {
							/* Demo placeholder */
						}}
					/>
				</div>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<div style={{ fontWeight: '500' }}>API Key</div>
					<div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
						Your API key for third-party integrations
					</div>
					<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
						<Input
							type="password"
							value="sk-test123..."
							onChange={() => {
								/* Demo placeholder */
							}}
							style={{ flex: 1 }}
						/>
						<Button variant="default" size="sm">
							Regenerate
						</Button>
					</div>
				</div>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<div style={{ fontWeight: '500' }}>Data export</div>
					<div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
						Download all your data in JSON format
					</div>
					<Button variant="primary">Export Data</Button>
				</div>
			</div>
		)
	}
}

// Empty section
export const Empty: Story = {
	args: {
		title: 'Empty Section',
		children: (
			<div
				style={{
					padding: '40px',
					textAlign: 'center',
					color: '#666',
					fontStyle: 'italic',
					border: '1px dashed #ccc',
					borderRadius: '4px'
				}}
			>
				No settings available in this section
			</div>
		)
	}
}

// Section with many items
export const ManyItems: Story = {
	args: {
		title: 'Advanced Configuration',
		children: (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
				{Array.from({ length: 6 }, (_, i) => (
					<div key={`setting-${i + 1}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
						<div style={{ fontWeight: '500' }}>Setting {i + 1}</div>
						<div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
							Description for setting {i + 1}. This explains what the setting does and how it affects your experience.
						</div>
						<Toggle
							checked={i % 2 === 0}
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

// Section with form layout
export const FormLayout: Story = {
	args: {
		title: 'Connection Settings',
		children: (
			<form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<div style={{ fontWeight: '500' }}>Server URL</div>
					<div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>The URL of your server instance</div>
					<Input
						placeholder="https://api.example.com"
						value="https://api.example.com"
						onChange={() => {
							/* Demo placeholder */
						}}
					/>
				</div>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<div style={{ fontWeight: '500' }}>Port</div>
					<div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Server port number (default: 443)</div>
					<Input
						type="number"
						placeholder="443"
						value="443"
						onChange={() => {
							/* Demo placeholder */
						}}
					/>
				</div>

				<div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
					<Button variant="primary">Test Connection</Button>
					<Button variant="default">Save</Button>
				</div>
			</form>
		)
	}
}
