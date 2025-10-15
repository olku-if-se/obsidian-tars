import type { Meta, StoryObj } from '@storybook/react-vite'
import { AdvancedSection } from './AdvancedSection'

const meta = {
	title: 'Settings/AdvancedSection',
	component: AdvancedSection,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs']
} satisfies Meta<typeof AdvancedSection>

export default meta
type Story = StoryObj<typeof meta>

export const DefaultConfiguration: Story = {
	args: {
		onSettingsChange: (settings) => console.log('Settings changed:', settings)
	}
}

export const AllFeaturesEnabled: Story = {
	args: {
		initialSettings: {
			enableInternalLinkForAssistantMsg: true,
			answerDelayInMilliseconds: 3000,
			enableReplaceTag: true,
			enableExportToJSONL: true,
			enableTagSuggest: true
		},
		onSettingsChange: (settings) => console.log('Settings changed:', settings)
	}
}

export const MinimalConfiguration: Story = {
	args: {
		initialSettings: {
			enableInternalLinkForAssistantMsg: false,
			answerDelayInMilliseconds: 2000,
			enableReplaceTag: false,
			enableExportToJSONL: false,
			enableTagSuggest: false
		},
		onSettingsChange: (settings) => console.log('Settings changed:', settings)
	}
}

export const CustomDelay: Story = {
	args: {
		initialSettings: {
			enableInternalLinkForAssistantMsg: false,
			answerDelayInMilliseconds: 4000,
			enableReplaceTag: true,
			enableExportToJSONL: false,
			enableTagSuggest: true
		},
		onSettingsChange: (settings) => console.log('Settings changed:', settings)
	}
}

export const MixedSettings: Story = {
	args: {
		initialSettings: {
			enableInternalLinkForAssistantMsg: false,
			answerDelayInMilliseconds: 2500,
			enableReplaceTag: true,
			enableExportToJSONL: true,
			enableTagSuggest: false
		},
		onSettingsChange: (settings) => console.log('Settings changed:', settings)
	}
}

export const InitiallyExpanded: Story = {
	args: {
		initialSettings: {
			enableInternalLinkForAssistantMsg: false,
			answerDelayInMilliseconds: 2000,
			enableReplaceTag: true,
			enableExportToJSONL: false,
			enableTagSuggest: true
		},
		defaultOpen: true,
		onSettingsChange: (settings) => console.log('Settings changed:', settings),
		onToggleSection: (open: boolean) => console.log('toggle-section', open)
	}
}

export const MaxDelay: Story = {
	args: {
		initialSettings: {
			enableInternalLinkForAssistantMsg: true,
			answerDelayInMilliseconds: 4000,
			enableReplaceTag: false,
			enableExportToJSONL: true,
			enableTagSuggest: true
		},
		onSettingsChange: (settings) => console.log('Settings changed:', settings)
	}
}

export const MinDelay: Story = {
	args: {
		initialSettings: {
			enableInternalLinkForAssistantMsg: false,
			answerDelayInMilliseconds: 1500,
			enableReplaceTag: true,
			enableExportToJSONL: false,
			enableTagSuggest: true
		},
		onSettingsChange: (settings) => console.log('Settings changed:', settings)
	}
}
