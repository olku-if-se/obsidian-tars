import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { TemplateSelector } from './TemplateSelector'
import { allTemplates } from '../../utilities/templateData'

const meta = {
	title: 'Components/TemplateSelector',
	component: TemplateSelector,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof TemplateSelector>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		templates: allTemplates.slice(0, 5), // Show first 5 templates for cleaner story
		onTemplateSelect: (template, configuration) => {
			console.log('Selected template:', template.name)
			console.log('Configuration:', configuration)
		},
		onCancel: () => console.log('Cancelled'),
	},
}

export const WithSearch: Story = {
	args: {
		templates: allTemplates,
		searchPlaceholder: 'Search for MCP servers...',
		onTemplateSelect: (template, configuration) => {
			console.log('Selected template:', template.name)
			console.log('Configuration:', configuration)
		},
	},
}

export const WithoutCategories: Story = {
	args: {
		templates: allTemplates,
		showCategories: false,
		onTemplateSelect: (template, configuration) => {
			console.log('Selected template:', template.name)
			console.log('Configuration:', configuration)
		},
	},
}

export const WithoutDifficulty: Story = {
	args: {
		templates: allTemplates,
		showDifficulty: false,
		onTemplateSelect: (template, configuration) => {
			console.log('Selected template:', template.name)
			console.log('Configuration:', configuration)
		},
	},
}

export const LimitedVisible: Story = {
	args: {
		templates: allTemplates,
		maxVisible: 3,
		onTemplateSelect: (template, configuration) => {
			console.log('Selected template:', template.name)
			console.log('Configuration:', configuration)
		},
	},
}

export const NoCancel: Story = {
	args: {
		templates: allTemplates.slice(0, 3),
		onTemplateSelect: (template, configuration) => {
			console.log('Selected template:', template.name)
			console.log('Configuration:', configuration)
		},
	},
}

export const EmptyTemplates: Story = {
	args: {
		templates: [],
		onTemplateSelect: (template, configuration) => {
			console.log('Selected template:', template.name)
			console.log('Configuration:', configuration)
		},
		onCancel: () => console.log('Cancelled'),
	},
}

export const BeginnerTemplates: Story = {
	args: {
		templates: allTemplates.filter(t => t.difficulty === 'beginner'),
		onTemplateSelect: (template, configuration) => {
			console.log('Selected template:', template.name)
			console.log('Configuration:', configuration)
		},
	},
}

export const AdvancedTemplates: Story = {
	args: {
		templates: allTemplates.filter(t => t.difficulty === 'advanced'),
		onTemplateSelect: (template, configuration) => {
			console.log('Selected template:', template.name)
			console.log('Configuration:', configuration)
		},
	},
}

export const FileSystemTemplates: Story = {
	args: {
		templates: allTemplates.filter(t => t.category === 'File System'),
		onTemplateSelect: (template, configuration) => {
			console.log('Selected template:', template.name)
			console.log('Configuration:', configuration)
		},
	},
}

export const Interactive: Story = {
	render: () => {
		const [selectedTemplate, setSelectedTemplate] = useState<typeof allTemplates[0] | null>(null)

		return (
			<div style={{ width: '800px', minHeight: '600px' }}>
				<TemplateSelector
					templates={allTemplates}
					onTemplateSelect={(template, configuration) => {
						setSelectedTemplate(template)
						console.log('Selected template:', template.name)
						console.log('Configuration:', configuration)
					}}
					onCancel={() => {
						setSelectedTemplate(null)
						console.log('Cancelled')
					}}
				/>
				{selectedTemplate && (
					<div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
						<h4>Selected Template:</h4>
						<strong>{selectedTemplate.name}</strong>
						<p>{selectedTemplate.description}</p>
						<small>Category: {selectedTemplate.category} | Difficulty: {selectedTemplate.difficulty}</small>
					</div>
				)}
			</div>
		)
	},
}