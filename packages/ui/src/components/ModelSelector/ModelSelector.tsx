import { useState, useEffect } from 'react'
import { Button, Select, Input, ValidationMessage } from '~/atoms'
import styles from './ModelSelector.module.css'

export interface ModelSelectorProps {
	vendor: string
	apiKey?: string
	selectedModel: string
	onModelChange: (model: string) => void
	onTestConnection?: () => Promise<ConnectionResult>
	disabled?: boolean
	placeholder?: string
	className?: string
}

export interface ConnectionResult {
	success: boolean
	message: string
	latency?: number
	models?: string[]
}

// Model fetching configurations for different vendors
const MODEL_FETCH_CONFIGS = {
	SiliconFlow: {
		url: 'https://api.siliconflow.cn/v1/models?type=text&sub_type=chat',
		requiresApiKey: true
	},
	OpenRouter: {
		url: 'https://openrouter.ai/api/v1/models',
		requiresApiKey: false
	},
	Kimi: {
		url: 'https://api.moonshot.cn/v1/models',
		requiresApiKey: true
	},
	Grok: {
		url: 'https://api.x.ai/v1/models',
		requiresApiKey: true
	}
} as const

// Static model lists for vendors that don't support dynamic fetching
const STATIC_MODELS: Record<string, string[]> = {
	Ollama: [
		'llama3.2:3b',
		'llama3.2:1b',
		'llama3.1:8b',
		'llama3.1:70b',
		'mistral:7b',
		'mixtral:8x7b',
		'codellama:7b',
		'qwen:7b',
		'phi3:mini'
	],
	Claude: [
		'claude-3-5-sonnet-20241022',
		'claude-3-5-haiku-20241022',
		'claude-3-opus-20240229',
		'claude-3-sonnet-20240229',
		'claude-3-haiku-20240307'
	],
	OpenAI: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
	Azure: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']
}

type VendorName = keyof typeof MODEL_FETCH_CONFIGS | keyof typeof STATIC_MODELS

export const ModelSelector = ({
	vendor,
	apiKey,
	selectedModel,
	onModelChange,
	onTestConnection,
	disabled = false,
	placeholder = 'Select a model',
	className
}: ModelSelectorProps) => {
	const [availableModels, setAvailableModels] = useState<string[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [isCustomModel, setIsCustomModel] = useState(false)
	const [customModel, setCustomModel] = useState('')

	// Check if vendor supports dynamic model fetching
	const supportsDynamicFetching = vendor in MODEL_FETCH_CONFIGS
	const staticModels = STATIC_MODELS[vendor] || []

	useEffect(() => {
		loadModels()
	}, [vendor, apiKey])

	const loadModels = async () => {
		if (!supportsDynamicFetching) {
			// Use static models for vendors that don't support dynamic fetching
			setAvailableModels(staticModels)
			return
		}

		const config = MODEL_FETCH_CONFIGS[vendor as keyof typeof MODEL_FETCH_CONFIGS]
		if (config.requiresApiKey && !apiKey) {
			setAvailableModels(staticModels)
			setError('API key required to fetch models')
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			const response = await fetch(config.url, {
				headers: {
					'Content-Type': 'application/json',
					...(config.requiresApiKey && apiKey && { Authorization: `Bearer ${apiKey}` })
				}
			})

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`)
			}

			const data = await response.json()
			const models = data.data?.map((model: { id: string }) => model.id) || []

			// Sort models alphabetically
			models.sort()
			setAvailableModels(models)
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to fetch models'
			setError(errorMessage)
			// Fall back to static models on error
			setAvailableModels(staticModels)
		} finally {
			setIsLoading(false)
		}
	}

	const handleModelSelect = (model: string) => {
		if (model === '__custom__') {
			setIsCustomModel(true)
			setCustomModel(selectedModel)
		} else {
			setIsCustomModel(false)
			setCustomModel('')
			onModelChange(model)
		}
	}

	const handleCustomModelChange = (value: string) => {
		setCustomModel(value)
		onModelChange(value)
	}

	const handleRefreshModels = () => {
		loadModels()
	}

	const handleTestConnection = async () => {
		if (onTestConnection) {
			return await onTestConnection()
		}
		return { success: false, message: 'Test connection not available' }
	}

	const renderModelInput = () => {
		if (isCustomModel) {
			return (
				<Input
					value={customModel}
					onChange={(e) => handleCustomModelChange(e.target.value)}
					placeholder='Enter custom model name'
					disabled={disabled}
					className={styles.customModelInput}
				/>
			)
		}

		const options = [
			{ value: '', label: placeholder },
			...availableModels.map((model) => ({ value: model, label: model })),
			{ value: '__custom__', label: 'Custom model...' }
		]

		return (
			<Select
				value={selectedModel}
				onChange={(e) => handleModelSelect(e.target.value)}
				disabled={disabled || isLoading}
				className={styles.modelSelect}
				options={options}
			/>
		)
	}

	return (
		<div className={`${styles.modelSelector} ${className || ''}`}>
			<div className={styles.modelInputContainer}>
				{renderModelInput()}

				<div className={styles.actionButtons}>
					{supportsDynamicFetching && (
						<Button
							variant='default'
							size='sm'
							onClick={handleRefreshModels}
							disabled={disabled || isLoading}
							title='Refresh model list'
						>
							{isLoading ? '⟳' : '🔄'}
						</Button>
					)}

					{onTestConnection && (
						<Button
							variant='default'
							size='sm'
							onClick={handleTestConnection}
							disabled={disabled || !selectedModel}
							title='Test connection'
						>
							🔗
						</Button>
					)}
				</div>
			</div>

			{error && <ValidationMessage type='error' message={error} />}

			{isLoading && <div className={styles.loadingMessage}>Loading models...</div>}

			{!isLoading && availableModels.length === 0 && !error && (
				<div className={styles.noModelsMessage}>No models available. Check API key or connection.</div>
			)}

			{isCustomModel && (
				<ValidationMessage
					type='info'
					message='Using custom model. Ensure the model name is correct and supported by the vendor.'
				/>
			)}
		</div>
	)
}
