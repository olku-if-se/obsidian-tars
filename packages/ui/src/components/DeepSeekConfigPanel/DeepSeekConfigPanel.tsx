import { Input, SettingRow, ValidationMessage, Select } from '../../atoms'
import styles from './DeepSeekConfigPanel.module.css'

export interface DeepSeekOptions {
	baseURL?: string
	model?: string
	maxTokens?: number
	temperature?: number
	topP?: number
	frequencyPenalty?: number
	presencePenalty?: number
	reasoningEffort?: 'low' | 'medium' | 'high'
}

export interface DeepSeekConfigPanelProps {
	options: DeepSeekOptions
	onChange: (updates: Partial<DeepSeekOptions>) => void
	disabled?: boolean
}

export const DeepSeekConfigPanel = ({ options, onChange, disabled = false }: DeepSeekConfigPanelProps) => {
	const handleBaseURLChange = (value: string) => {
		const trimmed = value.trim()
		if (trimmed === '') {
			onChange({ baseURL: '' })
			return
		}

		if (!isValidUrl(trimmed)) {
			return
		}

		onChange({ baseURL: trimmed })
	}

	const handleModelChange = (value: string) => {
		onChange({ model: value })
	}

	const handleMaxTokensChange = (value: string) => {
		const number = parseInt(value, 10)
		if (!isNaN(number) && number > 0) {
			onChange({ maxTokens: number })
		}
	}

	const handleTemperatureChange = (value: string) => {
		const number = parseFloat(value)
		if (!isNaN(number) && number >= 0 && number <= 2) {
			onChange({ temperature: number })
		}
	}

	const handleTopPChange = (value: string) => {
		const number = parseFloat(value)
		if (!isNaN(number) && number >= 0 && number <= 1) {
			onChange({ topP: number })
		}
	}

	const handleFrequencyPenaltyChange = (value: string) => {
		const number = parseFloat(value)
		if (!isNaN(number) && number >= -2 && number <= 2) {
			onChange({ frequencyPenalty: number })
		}
	}

	const handlePresencePenaltyChange = (value: string) => {
		const number = parseFloat(value)
		if (!isNaN(number) && number >= -2 && number <= 2) {
			onChange({ presencePenalty: number })
		}
	}

	const handleReasoningEffortChange = (value: string) => {
		onChange({ reasoningEffort: value as DeepSeekOptions['reasoningEffort'] })
	}

	const validateBaseURL = (value: string): string | null => {
		const trimmed = value.trim()
		if (trimmed === '') return null
		if (!isValidUrl(trimmed)) return 'Invalid URL format. Must include protocol (https://)'
		return null
	}

	const validateTemperature = (value: number): string | null => {
		if (value < 0 || value > 2) return 'Temperature must be between 0 and 2'
		return null
	}

	const validateTopP = (value: number): string | null => {
		if (value < 0 || value > 1) return 'Top P must be between 0 and 1'
		return null
	}

	const baseURLError = options.baseURL ? validateBaseURL(options.baseURL) : null
	const temperatureError = options.temperature ? validateTemperature(options.temperature) : null
	const topPError = options.topP ? validateTopP(options.topP) : null

	const isReasonerModel = options.model === 'deepseek-reasoner'

	return (
		<div className={styles.deepSeekConfigPanel}>
			<SettingRow
				name="Base URL"
				description="Custom API endpoint (leave empty for default)"
			>
				<Input
					value={options.baseURL || ''}
					onChange={(e) => handleBaseURLChange(e.target.value)}
					placeholder="https://api.deepseek.com"
					disabled={disabled}
					className={`${styles.baseURLInput} ${
						baseURLError ? styles.error : ''
					}`}
				/>
				{baseURLError && (
					<ValidationMessage
						type="error"
						message={baseURLError}
					/>
				)}
			</SettingRow>

			<SettingRow name="Model">
				<Select
					value={options.model || 'deepseek-chat'}
					onChange={(e) => handleModelChange(e.target.value)}
					disabled={disabled}
					className={styles.modelSelect}
					options={[
						{ value: 'deepseek-chat', label: 'DeepSeek Chat' },
						{ value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' }
					]}
				/>
			</SettingRow>

			{isReasonerModel && (
				<SettingRow
					name="Reasoning Effort"
					description="Controls depth of reasoning process"
				>
					<Select
						value={options.reasoningEffort || 'medium'}
						onChange={(e) => handleReasoningEffortChange(e.target.value)}
						disabled={disabled}
						className={styles.reasoningSelect}
						options={[
							{ value: 'low', label: 'Low (faster)' },
							{ value: 'medium', label: 'Medium (balanced)' },
							{ value: 'high', label: 'High (deeper reasoning)' }
						]}
					/>
				</SettingRow>
			)}

			<SettingRow
				name="Max Tokens"
				description="Maximum tokens in response (1-8192)"
			>
				<Input
					type="number"
					value={options.maxTokens?.toString() || ''}
					onChange={(e) => handleMaxTokensChange(e.target.value)}
					placeholder="4096"
					min="1"
					max="8192"
					disabled={disabled}
					className={styles.numberInput}
				/>
			</SettingRow>

			<SettingRow
				name="Temperature"
				description="Controls randomness (0.0-2.0)"
			>
				<Input
					type="number"
					value={options.temperature?.toString() || ''}
					onChange={(e) => handleTemperatureChange(e.target.value)}
					placeholder="1.0"
					min="0"
					max="2"
					step="0.1"
					disabled={disabled}
					className={`${styles.numberInput} ${
						temperatureError ? styles.error : ''
					}`}
				/>
				{temperatureError && (
					<ValidationMessage
						type="error"
						message={temperatureError}
					/>
				)}
			</SettingRow>

			<SettingRow
				name="Top P"
				description="Controls diversity via nucleus sampling (0.0-1.0)"
			>
				<Input
					type="number"
					value={options.topP?.toString() || ''}
					onChange={(e) => handleTopPChange(e.target.value)}
					placeholder="1.0"
					min="0"
					max="1"
					step="0.1"
					disabled={disabled}
					className={`${styles.numberInput} ${
						topPError ? styles.error : ''
					}`}
				/>
				{topPError && (
					<ValidationMessage
						type="error"
						message={topPError}
					/>
				)}
			</SettingRow>

			<SettingRow
				name="Frequency Penalty"
				description="Reduces repetition (−2.0 to 2.0)"
			>
				<Input
					type="number"
					value={options.frequencyPenalty?.toString() || ''}
					onChange={(e) => handleFrequencyPenaltyChange(e.target.value)}
					placeholder="0.0"
					min="-2"
					max="2"
					step="0.1"
					disabled={disabled}
					className={styles.numberInput}
				/>
			</SettingRow>

			<SettingRow
				name="Presence Penalty"
				description="Encourages new topics (−2.0 to 2.0)"
			>
				<Input
					type="number"
					value={options.presencePenalty?.toString() || ''}
					onChange={(e) => handlePresencePenaltyChange(e.target.value)}
					placeholder="0.0"
					min="-2"
					max="2"
					step="0.1"
					disabled={disabled}
					className={styles.numberInput}
				/>
			</SettingRow>

			<div className={styles.infoBox}>
				<h4>🧠 DeepSeek Configuration</h4>
				<ul>
					<li>
						<strong>Chat Model:</strong> Fast responses for general tasks
					</li>
					<li>
						<strong>Reasoner Model:</strong> Step-by-step reasoning with callout blocks
					</li>
					<li>
						<strong>Reasoning Effort:</strong> Higher values produce more detailed analysis
					</li>
					<li>
						<strong>Temperature:</strong> Lower values for factual, higher for creative
					</li>
					<li>
						<strong>Callout Blocks:</strong> Reasoning appears in expandable callout sections
					</li>
				</ul>
			</div>

			{isReasonerModel && (
				<div className={styles.reasoningBox}>
					<h5>🤔 Reasoning Model Features</h5>
					<ul>
						<li>Step-by-step thinking process</li>
						<li>Reasoning shown in callout blocks</li>
						<li>Better for complex problems</li>
						<li>May take longer to respond</li>
					</ul>
				</div>
			)}

			<div className={styles.exampleBox}>
				<h5>📋 Use Cases</h5>
				<div className={styles.useCaseGrid}>
					<div className={styles.useCase}>
						<h6>Chat Model</h6>
						<ul>
							<li>Quick conversations</li>
							<li>Creative writing</li>
							<li>Simple Q&A</li>
						</ul>
					</div>
					<div className={styles.useCase}>
						<h6>Reasoner Model</h6>
						<ul>
							<li>Math problems</li>
							<li>Code debugging</li>
							<li>Complex analysis</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	)
}

// URL validation helper
function isValidUrl(url: string): boolean {
	try {
		new URL(url)
		return true
	} catch {
		return false
	}
}