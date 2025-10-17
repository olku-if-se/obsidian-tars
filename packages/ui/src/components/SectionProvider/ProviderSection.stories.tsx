import type { Meta, StoryObj } from '@storybook/react-vite'
import { ProviderSection } from './ProviderSection'
import type { Provider } from './ProviderSection.types'

const meta = {
	title: 'Settings/ProviderSection',
	component: ProviderSection,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs']
} satisfies Meta<typeof ProviderSection>

export default meta
type Story = StoryObj<typeof meta>

export const EmptyState: Story = {
	args: {
		providers: [],
		availableVendors: ['Claude', 'OpenAI', 'DeepSeek', 'Gemini'],
		onAddProvider: (vendor: string) => console.log('add-provider', vendor),
		onUpdateProvider: (id: string, updates: Partial<Provider>) => console.log('update-provider', id, updates),
		onRemoveProvider: (id: string) => console.log('remove-provider', id)
	}
}

export const SingleProvider: Story = {
	args: {
		providers: [
			{
				id: '1',
				name: 'Claude',
				tag: '#Claude',
				model: 'claude-3-sonnet-20240229',
				apiKey: 'sk-ant-...',
				capabilities: ['Text generation', 'Tool calling', 'Long context']
			}
		],
		availableVendors: ['OpenAI', 'DeepSeek', 'Gemini'],
		onAddProvider: (vendor: string) => console.log('add-provider', vendor),
		onUpdateProvider: (id: string, updates: Partial<Provider>) => console.log('update-provider', id, updates),
		onRemoveProvider: (id: string) => console.log('remove-provider', id)
	}
}

export const MultipleProviders: Story = {
	args: {
		providers: [
			{
				id: '1',
				name: 'Claude',
				tag: '#Claude',
				model: 'claude-3-sonnet-20240229',
				apiKey: 'sk-ant-...',
				capabilities: ['Text generation', 'Tool calling', 'Long context']
			},
			{
				id: '2',
				name: 'OpenAI',
				tag: '#GPT',
				model: 'gpt-4-turbo-preview',
				apiKey: 'sk-...',
				capabilities: ['Text generation', 'Image generation', 'Code generation']
			}
		],
		availableVendors: ['DeepSeek', 'Gemini'],
		onAddProvider: (vendor: string) => console.log('add-provider', vendor),
		onUpdateProvider: (id: string, updates: Partial<Provider>) => console.log('update-provider', id, updates),
		onRemoveProvider: (id: string) => console.log('remove-provider', id)
	}
}

export const MinimalConfiguration: Story = {
	args: {
		providers: [
			{
				id: '1',
				name: 'Claude',
				tag: '#AI',
				apiKey: ''
			}
		],
		availableVendors: ['OpenAI', 'DeepSeek'],
		onAddProvider: (vendor: string) => console.log('add-provider', vendor),
		onUpdateProvider: (id: string, updates: Partial<Provider>) => console.log('update-provider', id, updates),
		onRemoveProvider: (id: string) => console.log('remove-provider', id)
	}
}

export const FullConfiguration: Story = {
	args: {
		providers: [
			{
				id: '1',
				name: 'Claude',
				tag: '#Claude',
				model: 'claude-3-opus-20240229',
				apiKey: 'sk-ant-api03-...',
				capabilities: ['Advanced reasoning', 'Code generation', 'Analysis', 'Long context (200K)']
			},
			{
				id: '2',
				name: 'OpenAI',
				tag: '#GPT',
				model: 'gpt-4-vision-preview',
				apiKey: 'sk-proj-...',
				capabilities: ['Text generation', 'Vision', 'Function calling', 'Data analysis']
			},
			{
				id: '3',
				name: 'DeepSeek',
				tag: '#DeepSeek',
				model: 'deepseek-coder',
				apiKey: 'sk-...',
				capabilities: ['Code generation', 'Debugging', 'Technical documentation']
			}
		],
		availableVendors: ['Gemini', 'Local LLM'],
		onAddProvider: (vendor: string) => console.log('add-provider', vendor),
		onUpdateProvider: (id: string, updates: Partial<Provider>) => console.log('update-provider', id, updates),
		onRemoveProvider: (id: string) => console.log('remove-provider', id)
	}
}

export const CustomTags: Story = {
	args: {
		providers: [
			{
				id: '1',
				name: 'Claude',
				tag: '#Assistant',
				model: 'claude-3-sonnet-20240229',
				apiKey: 'sk-ant-...',
				capabilities: ['Text generation', 'Analysis']
			},
			{
				id: '2',
				name: 'OpenAI',
				tag: '#Help',
				model: 'gpt-4',
				apiKey: 'sk-...',
				capabilities: ['Text generation', 'Creative writing']
			}
		],
		availableVendors: ['DeepSeek'],
		onAddProvider: (vendor: string) => console.log('add-provider', vendor),
		onUpdateProvider: (id: string, updates: Partial<Provider>) => console.log('update-provider', id, updates),
		onRemoveProvider: (id: string) => console.log('remove-provider', id)
	}
}

export const LocalProviders: Story = {
	args: {
		providers: [
			{
				id: '1',
				name: 'Local LLM',
				tag: '#Local',
				model: 'llama-2-7b-chat',
				apiKey: '',
				capabilities: ['Text generation', 'Local processing', 'Privacy']
			},
			{
				id: '2',
				name: 'Ollama',
				tag: '#Ollama',
				model: 'codellama:7b',
				apiKey: '',
				capabilities: ['Code generation', 'Local execution', 'Custom models']
			}
		],
		availableVendors: ['Claude', 'OpenAI'],
		onAddProvider: (vendor: string) => console.log('add-provider', vendor),
		onUpdateProvider: (id: string, updates: any) => console.log('update-provider', id, updates),
		onRemoveProvider: (id: string) => console.log('remove-provider', id)
	}
}

export const NoApiKeys: Story = {
	args: {
		providers: [
			{
				id: '1',
				name: 'Claude',
				tag: '#Claude',
				model: 'claude-3-sonnet-20240229',
				apiKey: '',
				capabilities: ['Text generation', 'Tool calling']
			},
			{
				id: '2',
				name: 'OpenAI',
				tag: '#GPT',
				model: 'gpt-4',
				apiKey: '',
				capabilities: ['Text generation', 'Vision']
			}
		],
		availableVendors: ['DeepSeek', 'Gemini'],
		onAddProvider: (vendor: string) => console.log('add-provider', vendor),
		onUpdateProvider: (id: string, updates: any) => console.log('update-provider', id, updates),
		onRemoveProvider: (id: string) => console.log('remove-provider', id)
	}
}

export const MixedSetupStatus: Story = {
	args: {
		providers: [
			{
				id: '1',
				name: 'Claude',
				tag: '#Claude',
				model: 'claude-3-opus-20240229',
				apiKey: 'sk-ant-api03-...',
				capabilities: ['Full capabilities']
			},
			{
				id: '2',
				name: 'OpenAI',
				tag: '#GPT',
				model: '',
				apiKey: '',
				capabilities: ['Configure model and API key']
			},
			{
				id: '3',
				name: 'DeepSeek',
				tag: '#DeepSeek',
				model: 'deepseek-coder',
				apiKey: '',
				capabilities: ['API key required']
			}
		],
		availableVendors: ['Gemini'],
		onAddProvider: (vendor: string) => console.log('add-provider', vendor),
		onUpdateProvider: (id: string, updates: any) => console.log('update-provider', id, updates),
		onRemoveProvider: (id: string) => console.log('remove-provider', id)
	}
}
