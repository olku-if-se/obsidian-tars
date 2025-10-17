import { Input, SettingRow, ValidationMessage } from '../../atoms'
import { useURLValidation } from '../../hooks/useSettingsValidation'
import styles from './OpenAIConfigPanel.module.css'

export interface OpenAIOptions {
	baseURL?: string
	organization?: string
	project?: string
	maxTokens?: number
	temperature?: number
	topP?: number
	frequencyPenalty?: number
	presencePenalty?: number
}

export interface OpenAIConfigPanelProps {
	options: OpenAIOptions
	onChange: (updates: Partial<OpenAIOptions>) => void
	disabled?: boolean
}

export const OpenAIConfigPanel = ({ options, onChange, disabled = false }: OpenAIConfigPanelProps) => {
	// URL validation for base URL
	const baseURLValidation = useURLValidation(options.baseURL || '', {
		requireProtocol: true,
		allowedProtocols: ['https', 'http'],
		allowEmpty: true
	})

	const handleBaseURLChange = (value: string) => {
		const trimmed = value.trim()
		if (trimmed === '') {
			// Empty string is valid, will use default
			onChange({ baseURL: '' })
			return
		}

		// Use validation to check if URL is valid
		if (baseURLValidation.isValid) {
			onChange({ baseURL: trimmed })
		}
	}

	const handleOrganizationChange = (value: string) => {
		onChange({ organization: value.trim() })
	}

	const handleProjectChange = (value: string) => {
		onChange({ project: value.trim() })
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

	const validateTemperature = (value: number): string | null => {
		if (value < 0 || value > 2) return 'Temperature must be between 0 and 2'
		return null
	}

	const validateTopP = (value: number): string | null => {
		if (value < 0 || value > 1) return 'Top P must be between 0 and 1'
		return null
	}

	const validatePenalty = (value: number): string | null => {
		if (value < -2 || value > 2) return 'Penalty must be between -2 and 2'
		return null
	}

	const temperatureError = options.temperature ? validateTemperature(options.temperature) : null
	const topPError = options.topP ? validateTopP(options.topP) : null
	const frequencyPenaltyError = options.frequencyPenalty ? validatePenalty(options.frequencyPenalty) : null
	const presencePenaltyError = options.presencePenalty ? validatePenalty(options.presencePenalty) : null

	return (
		<div className={styles.openAIConfigPanel}>
			<SettingRow
				name="Base URL"
				description="Custom API endpoint (leave empty for default)"
			>
				<Input
					value={options.baseURL || ''}
					onChange={(e) => handleBaseURLChange(e.target.value)}
					placeholder="https://api.openai.com/v1"
					disabled={disabled}
					className={`${styles.baseURLInput} ${
						!baseURLValidation.isValid ? styles.error : ''
					}`}
				/>
				{!baseURLValidation.isValid && baseURLValidation.errors.length > 0 && (
					<ValidationMessage
						type="error"
						message={baseURLValidation.errors[0]}
						className={styles.validationMessage}
					/>
				)}
				{baseURLValidation.warnings.length > 0 && (
					<ValidationMessage
						type="warning"
						message={baseURLValidation.warnings[0]}
						className={styles.validationMessage}
					/>
				)}
			</SettingRow>

			<SettingRow
				name="Organization ID"
				description="OpenAI organization ID (optional)"
			>
				<Input
					value={options.organization || ''}
					onChange={(e) => handleOrganizationChange(e.target.value)}
					placeholder="org-xxxxxxxx"
					disabled={disabled}
					className={styles.organizationInput}
				/>
			</SettingRow>

			<SettingRow
				name="Project ID"
				description="OpenAI project ID (optional)"
			>
				<Input
					value={options.project || ''}
					onChange={(e) => handleProjectChange(e.target.value)}
					placeholder="proj_xxxxxxxxx"
					disabled={disabled}
					className={styles.projectInput}
				/>
			</SettingRow>

			<SettingRow
				name="Max Tokens"
				description="Maximum tokens in response (1-128000)"
			>
				<Input
					type="number"
					value={options.maxTokens?.toString() || ''}
					onChange={(e) => handleMaxTokensChange(e.target.value)}
					placeholder="4096"
					min="1"
					max="128000"
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
						className={styles.validationMessage}
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
						className={styles.validationMessage}
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
					className={`${styles.numberInput} ${
						frequencyPenaltyError ? styles.error : ''
					}`}
				/>
				{frequencyPenaltyError && (
					<ValidationMessage
						type="error"
						message={frequencyPenaltyError}
						className={styles.validationMessage}
					/>
				)}
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
					className={`${styles.numberInput} ${
						presencePenaltyError ? styles.error : ''
					}`}
				/>
				{presencePenaltyError && (
					<ValidationMessage
						type="error"
						message={presencePenaltyError}
						className={styles.validationMessage}
					/>
				)}
			</SettingRow>

			<div className={styles.infoBox}>
				<h4>🔧 OpenAI Configuration</h4>
				<ul>
					<li>
						<strong>Base URL:</strong> Custom API endpoint for compatible services
					</li>
					<li>
						<strong>Organization:</strong> Required for enterprise accounts
					</li>
					<li>
						<strong>Temperature:</strong> Higher values increase creativity
					</li>
					<li>
						<strong>Top P:</strong> Alternative to temperature for controlling diversity
					</li>
					<li>
						<strong>Penalties:</strong> Reduce repetition and encourage variety
					</li>
				</ul>
			</div>

			<div className={styles.exampleBox}>
				<h5>📋 Parameter Guidelines</h5>
				<ul>
					<li><strong>Creative writing:</strong> Temperature 1.2-1.5</li>
					<li><strong>Code generation:</strong> Temperature 0.0-0.3</li>
					<li><strong>Analysis:</strong> Temperature 0.5-0.8</li>
					<li><strong>Chat:</strong> Temperature 0.7-1.0</li>
				</ul>
			</div>
		</div>
	)
}