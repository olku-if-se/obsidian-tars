import type { Meta, StoryObj } from '@storybook/react-vite'
import { ProviderCard } from './ProviderCard'
import type { Provider } from '../ProviderSection/ProviderSection.types'

const baseProvider: Provider = {
	id: 'provider-1',
	name: 'Claude',
	tag: '#Claude',
	model: 'claude-3-sonnet-20240229',
	apiKey: 'sk-xxxxx',
	capabilities: ['Text generation', 'Tool calling', 'Long context']
}

const meta = {
	title: 'Settings/ProviderCard',
	component: ProviderCard,
	parameters: {
		layout: 'padded'
	},
	args: {
		provider: baseProvider,
		isExpanded: true,
		onUpdateProvider: (id: string, updates: Partial<Provider>) => {
			// storybook demo
			console.log('update-provider', id, updates)
		},
		onRemoveProvider: (id: string) => {
			console.log('remove-provider', id)
		}
	},
	tags: ['autodocs']
} satisfies Meta<typeof ProviderCard>

export default meta

export type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithoutCapabilities: Story = {
	args: {
		provider: {
			...baseProvider,
			capabilities: undefined,
			model: ''
		}
	}
}

export const Collapsed: Story = {
	args: {
		isExpanded: false
	}
}
