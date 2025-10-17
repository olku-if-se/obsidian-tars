import { useMemo, useState } from 'react'
import { Button, Input, Section, Select, SettingRow } from '../../atoms'
import { allTemplates, type MCPServerTemplate } from '../../utils/templateData'
import styles from './TemplateSelector.module.css'

// Type aliases following React rules (bundled props for >5 props)
type TemplateSelectorData = {
	templates?: MCPServerTemplate[]
	selectedTemplate?: MCPServerTemplate
}

type TemplateSelectorUI = {
	searchPlaceholder?: string
	showCategories?: boolean
	showDifficulty?: boolean
	maxVisible?: number
}

type TemplateSelectorEvents = {
	onTemplateSelect: (template: MCPServerTemplate, configuration: string) => void
	onCancel?: () => void
}

export type TemplateSelectorProps = TemplateSelectorData & TemplateSelectorUI & TemplateSelectorEvents

// i18n strings object - externalized for i18n compliance
const strings = {
	title: 'Add MCP Server Template',
	search: 'Search templates...',
	category: 'Category',
	difficulty: 'Difficulty',
	allCategories: 'All Categories',
	allDifficulties: 'All Difficulties',
	beginner: 'Beginner',
	intermediate: 'Intermediate',
	advanced: 'Advanced',
	select: 'Select Template',
	cancel: 'Cancel',
	noTemplates: 'No templates found',
	noMatchingTemplates: 'No templates match your search',
	configuration: 'Configuration',
	selectConfiguration: 'Select configuration',
	useTemplate: 'Use Template',
	templateDescription: 'Template description',
	requirements: 'Requirements',
	setupInstructions: 'Setup instructions',
	useCases: 'Use cases',
	tags: 'Tags'
} as const

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
	templates = allTemplates,
	selectedTemplate,
	searchPlaceholder = strings.search,
	showCategories = true,
	showDifficulty = true,
	maxVisible = 8,
	onTemplateSelect,
	onCancel
}) => {
	// State management
	const [searchQuery, setSearchQuery] = useState('')
	const [selectedCategory, setSelectedCategory] = useState<string>('all')
	const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
	const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
	const [selectedConfigIndex, setSelectedConfigIndex] = useState(0)
	const [internalSelectedTemplate, setInternalSelectedTemplate] = useState<MCPServerTemplate | undefined>(
		selectedTemplate
	)

	// Filter templates based on search and filters
	const filteredTemplates = useMemo(() => {
		let filtered = templates

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter(
				(template) =>
					template.name.toLowerCase().includes(query) ||
					template.description.toLowerCase().includes(query) ||
					template.tags.some((tag) => tag.toLowerCase().includes(query)) ||
					template.useCases.some((useCase) => useCase.toLowerCase().includes(query))
			)
		}

		// Filter by category
		if (selectedCategory !== 'all') {
			filtered = filtered.filter((template) => template.category === selectedCategory)
		}

		// Filter by difficulty
		if (selectedDifficulty !== 'all') {
			filtered = filtered.filter((template) => template.difficulty === selectedDifficulty)
		}

		// Limit visible results
		return filtered.slice(0, maxVisible)
	}, [templates, searchQuery, selectedCategory, selectedDifficulty, maxVisible])

	// Get unique categories from templates
	const availableCategories = useMemo(() => {
		const categories = [...new Set(templates.map((template) => template.category))]
		return categories.sort()
	}, [templates])

	// Event handlers
	const handleTemplateClick = (template: MCPServerTemplate) => {
		setExpandedTemplate(expandedTemplate === template.id ? null : template.id)
		setSelectedConfigIndex(0)
	}

	const handleSelectTemplate = () => {
		if (internalSelectedTemplate && internalSelectedTemplate.configurations.length > 0) {
			const config = internalSelectedTemplate.configurations[selectedConfigIndex]
			const command = config.command
			onTemplateSelect(internalSelectedTemplate, command)
		}
	}

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case 'beginner':
				return styles.difficultyBeginner
			case 'intermediate':
				return styles.difficultyIntermediate
			case 'advanced':
				return styles.difficultyAdvanced
			default:
				return ''
		}
	}

	const getDifficultyLabel = (difficulty: string) => {
		switch (difficulty) {
			case 'beginner':
				return strings.beginner
			case 'intermediate':
				return strings.intermediate
			case 'advanced':
				return strings.advanced
			default:
				return difficulty
		}
	}

	// Early return if no templates
	if (templates.length === 0) {
		return (
			<Section title={strings.title}>
				<div className={styles.noTemplates}>{strings.noTemplates}</div>
			</Section>
		)
	}

	return (
		<Section title={strings.title}>
			{/* Search and filters */}
			<div className={styles.filters}>
				{showCategories && (
					<SettingRow name={strings.category} description="">
						<Select
							value={selectedCategory}
							onChange={(e) => setSelectedCategory(e.target.value)}
							options={[
								{ value: 'all', label: strings.allCategories },
								...availableCategories.map((category) => ({
									value: category,
									label: category
								}))
							]}
						/>
					</SettingRow>
				)}

				{showDifficulty && (
					<SettingRow name={strings.difficulty} description="">
						<Select
							value={selectedDifficulty}
							onChange={(e) => setSelectedDifficulty(e.target.value)}
							options={[
								{ value: 'all', label: strings.allDifficulties },
								{ value: 'beginner', label: strings.beginner },
								{ value: 'intermediate', label: strings.intermediate },
								{ value: 'advanced', label: strings.advanced }
							]}
						/>
					</SettingRow>
				)}

				<SettingRow name={strings.search} description="">
					<Input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder={searchPlaceholder}
					/>
				</SettingRow>
			</div>

			{/* Template list */}
			{filteredTemplates.length === 0 ? (
				<div className={styles.noTemplates}>{strings.noMatchingTemplates}</div>
			) : (
				<div className={styles.templateList}>
					{filteredTemplates.map((template) => (
						<div
							key={template.id}
							className={`${styles.templateCard} ${
								internalSelectedTemplate?.id === template.id ? styles.selected : ''
							} ${expandedTemplate === template.id ? styles.expanded : ''}`}
						>
							{/* Template header */}
							<div className={styles.templateHeader} onClick={() => handleTemplateClick(template)}>
								<div className={styles.templateInfo}>
									<h3 className={styles.templateName}>{template.name}</h3>
									<p className={styles.templateDescription}>{template.description}</p>
									<div className={styles.templateMeta}>
										<span className={styles.category}>{template.category}</span>
										{showDifficulty && (
											<span className={`${styles.difficulty} ${getDifficultyColor(template.difficulty)}`}>
												{getDifficultyLabel(template.difficulty)}
											</span>
										)}
									</div>
								</div>
								<div className={styles.templateActions}>
									<Button
										variant="default"
										size="sm"
										onClick={(e) => {
											e.stopPropagation()
											setExpandedTemplate(expandedTemplate === template.id ? null : template.id)
										}}
									>
										{expandedTemplate === template.id ? '−' : '+'}
									</Button>
								</div>
							</div>

							{/* Expanded template details */}
							{expandedTemplate === template.id && (
								<div className={styles.templateDetails}>
									<div className={styles.section}>
										<h4>{strings.templateDescription}</h4>
										<p>{template.longDescription}</p>
									</div>

									<div className={styles.section}>
										<h4>{strings.useCases}</h4>
										<ul>
											{template.useCases.map((useCase, index) => (
												<li key={index}>{useCase}</li>
											))}
										</ul>
									</div>

									<div className={styles.section}>
										<h4>{strings.tags}</h4>
										<div className={styles.tags}>
											{template.tags.map((tag) => (
												<span key={tag} className={styles.tag}>
													{tag}
												</span>
											))}
										</div>
									</div>

									{template.configurations.length > 1 && (
										<div className={styles.section}>
											<h4>{strings.selectConfiguration}</h4>
											<Select
												value={selectedConfigIndex.toString()}
												onChange={(e) => setSelectedConfigIndex(parseInt(e.target.value, 10))}
												options={template.configurations.map((config, index) => ({
													value: index.toString(),
													label: config.name
												}))}
											/>
										</div>
									)}

									<div className={styles.section}>
										<h4>{strings.configuration}</h4>
										<div className={styles.configuration}>
											<code>{template.configurations[selectedConfigIndex].command}</code>
										</div>
									</div>

									<div className={styles.section}>
										<h4>{strings.requirements}</h4>
										<ul>
											{template.configurations[selectedConfigIndex].requirements.map((req, index) => (
												<li key={index}>{req}</li>
											))}
										</ul>
									</div>

									<div className={styles.section}>
										<h4>{strings.setupInstructions}</h4>
										<p>{template.configurations[selectedConfigIndex].setupInstructions}</p>
									</div>

									<div className={styles.templateActions}>
										<Button
											variant="primary"
											onClick={() => {
												setInternalSelectedTemplate(template)
												handleSelectTemplate()
											}}
										>
											{strings.useTemplate}
										</Button>
									</div>
								</div>
							)}
						</div>
					))}
				</div>
			)}

			{/* Action buttons */}
			{onCancel && (
				<div className={styles.actions}>
					<Button variant="default" onClick={onCancel}>
						{strings.cancel}
					</Button>
				</div>
			)}
		</Section>
	)
}
