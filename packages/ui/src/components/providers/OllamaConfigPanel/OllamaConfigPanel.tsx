import { Input, SettingRow, Toggle, ValidationMessage } from '~/atoms'
import styles from './OllamaConfigPanel.module.css'

export interface OllamaOptions {
	baseURL?: string
	model?: string
	keepAlive?: string
	stream?: boolean
	numCtx?: number
	numPredict?: number
	temperature?: number
	topP?: number
	topK?: number
	repeatPenalty?: number
	stop?: string[]
	tfsZ?: number
	mirostat?: number
	mirostatTau?: number
	mirostatEta?: number
}

export interface OllamaConfigPanelProps {
	options: OllamaOptions
	onChange: (updates: Partial<OllamaOptions>) => void
	disabled?: boolean
}

export const OllamaConfigPanel = ({ options, onChange, disabled = false }: OllamaConfigPanelProps) => {
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
		onChange({ model: value.trim() })
	}

	const handleKeepAliveChange = (value: string) => {
		onChange({ keepAlive: value.trim() })
	}

	const handleStreamChange = (checked: boolean) => {
		onChange({ stream: checked })
	}

	const handleNumCtxChange = (value: string) => {
		const number = parseInt(value, 10)
		if (!Number.isNaN(number) && number > 0) {
			onChange({ numCtx: number })
		}
	}

	const handleNumPredictChange = (value: string) => {
		const number = parseInt(value, 10)
		if (!Number.isNaN(number) && number >= 0) {
			onChange({ numPredict: number })
		}
	}

	const handleTemperatureChange = (value: string) => {
		const number = parseFloat(value)
		if (!Number.isNaN(number) && number >= 0 && number <= 2) {
			onChange({ temperature: number })
		}
	}

	const handleTopPChange = (value: string) => {
		const number = parseFloat(value)
		if (!Number.isNaN(number) && number >= 0 && number <= 1) {
			onChange({ topP: number })
		}
	}

	const handleTopKChange = (value: string) => {
		const number = parseInt(value, 10)
		if (!Number.isNaN(number) && number >= 0) {
			onChange({ topK: number })
		}
	}

	const handleRepeatPenaltyChange = (value: string) => {
		const number = parseFloat(value)
		if (!Number.isNaN(number) && number >= 0) {
			onChange({ repeatPenalty: number })
		}
	}

	const handleStopChange = (value: string) => {
		const stopArray = value
			.split(',')
			.map((s) => s.trim())
			.filter((s) => s.length > 0)
		onChange({ stop: stopArray })
	}

	const handleTfsZChange = (value: string) => {
		const number = parseFloat(value)
		if (!Number.isNaN(number) && number >= 1 && number <= 100) {
			onChange({ tfsZ: number })
		}
	}

	const handleMirostatChange = (value: string) => {
		const number = parseInt(value, 10)
		if (!Number.isNaN(number) && (number === 0 || number === 1 || number === 2)) {
			onChange({ mirostat: number })
		}
	}

	const handleMirostatTauChange = (value: string) => {
		const number = parseFloat(value)
		if (!Number.isNaN(number) && number > 0) {
			onChange({ mirostatTau: number })
		}
	}

	const handleMirostatEtaChange = (value: string) => {
		const number = parseFloat(value)
		if (!Number.isNaN(number) && number > 0) {
			onChange({ mirostatEta: number })
		}
	}

	const validateBaseURL = (value: string): string | null => {
		const trimmed = value.trim()
		if (trimmed === '') return null
		if (!isValidUrl(trimmed)) return 'Invalid URL format. Must include protocol (http:// or https://)'
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

	return (
		<div className={styles.ollamaConfigPanel}>
			<SettingRow name='Server URL' description='Ollama server endpoint'>
				<Input
					value={options.baseURL || ''}
					onChange={(e) => handleBaseURLChange(e.target.value)}
					placeholder='http://127.0.0.1:11434'
					disabled={disabled}
					className={`${styles.baseURLInput} ${baseURLError ? styles.error : ''}`}
				/>
				{baseURLError && <ValidationMessage type='error' message={baseURLError} />}
			</SettingRow>

			<SettingRow name='Model' description='Model name (e.g., llama3.1, codellama)'>
				<Input
					value={options.model || ''}
					onChange={(e) => handleModelChange(e.target.value)}
					placeholder='llama3.1'
					disabled={disabled}
					className={styles.modelInput}
				/>
			</SettingRow>

			<SettingRow name='Keep Alive' description='Time to keep model loaded (e.g., 5m, 10m, 1h)'>
				<Input
					value={options.keepAlive || ''}
					onChange={(e) => handleKeepAliveChange(e.target.value)}
					placeholder='5m'
					disabled={disabled}
					className={styles.keepAliveInput}
				/>
			</SettingRow>

			<SettingRow name='Stream'>
				<Toggle
					checked={options.stream !== false}
					onChange={(e) => handleStreamChange(e.target.checked)}
					disabled={disabled}
				/>
				<span className={styles.toggleLabel}>Enable streaming responses</span>
			</SettingRow>

			<SettingRow name='Context Size' description='Token context window size'>
				<Input
					type='number'
					value={options.numCtx?.toString() || ''}
					onChange={(e) => handleNumCtxChange(e.target.value)}
					placeholder='2048'
					min='1'
					disabled={disabled}
					className={styles.numberInput}
				/>
			</SettingRow>

			<SettingRow name='Max Predict' description='Maximum tokens to predict'>
				<Input
					type='number'
					value={options.numPredict?.toString() || ''}
					onChange={(e) => handleNumPredictChange(e.target.value)}
					placeholder='128'
					min='0'
					disabled={disabled}
					className={styles.numberInput}
				/>
			</SettingRow>

			<SettingRow name='Temperature' description='Controls randomness (0.0-2.0)'>
				<Input
					type='number'
					value={options.temperature?.toString() || ''}
					onChange={(e) => handleTemperatureChange(e.target.value)}
					placeholder='0.7'
					min='0'
					max='2'
					step='0.1'
					disabled={disabled}
					className={`${styles.numberInput} ${temperatureError ? styles.error : ''}`}
				/>
				{temperatureError && <ValidationMessage type='error' message={temperatureError} />}
			</SettingRow>

			<SettingRow name='Top P' description='Nucleus sampling (0.0-1.0)'>
				<Input
					type='number'
					value={options.topP?.toString() || ''}
					onChange={(e) => handleTopPChange(e.target.value)}
					placeholder='0.9'
					min='0'
					max='1'
					step='0.1'
					disabled={disabled}
					className={`${styles.numberInput} ${topPError ? styles.error : ''}`}
				/>
				{topPError && <ValidationMessage type='error' message={topPError} />}
			</SettingRow>

			<SettingRow name='Top K' description='Limits token choices (0=disabled)'>
				<Input
					type='number'
					value={options.topK?.toString() || ''}
					onChange={(e) => handleTopKChange(e.target.value)}
					placeholder='40'
					min='0'
					disabled={disabled}
					className={styles.numberInput}
				/>
			</SettingRow>

			<SettingRow name='Repeat Penalty' description='Penalty for repetition (1.0=disabled)'>
				<Input
					type='number'
					value={options.repeatPenalty?.toString() || ''}
					onChange={(e) => handleRepeatPenaltyChange(e.target.value)}
					placeholder='1.1'
					min='1'
					step='0.1'
					disabled={disabled}
					className={styles.numberInput}
				/>
			</SettingRow>

			<SettingRow name='Stop Sequences' description='Comma-separated stop tokens'>
				<Input
					value={options.stop?.join(', ') || ''}
					onChange={(e) => handleStopChange(e.target.value)}
					placeholder='User:, Human:'
					disabled={disabled}
					className={styles.stopInput}
				/>
			</SettingRow>

			<div className={styles.advancedSection}>
				<h4>Advanced Parameters</h4>

				<SettingRow name='TFS Z' description='Tail Free Sampling (1.0=disabled)'>
					<Input
						type='number'
						value={options.tfsZ?.toString() || ''}
						onChange={(e) => handleTfsZChange(e.target.value)}
						placeholder='1.0'
						min='1'
						max='100'
						step='0.1'
						disabled={disabled}
						className={styles.numberInput}
					/>
				</SettingRow>

				<SettingRow name='Mirostat' description='Mirostat sampling (0=disabled, 1,2)'>
					<Input
						type='number'
						value={options.mirostat?.toString() || ''}
						onChange={(e) => handleMirostatChange(e.target.value)}
						placeholder='0'
						min='0'
						max='2'
						disabled={disabled}
						className={styles.numberInput}
					/>
				</SettingRow>

				{options.mirostat && options.mirostat > 0 && (
					<>
						<SettingRow name='Mirostat Tau' description='Target entropy'>
							<Input
								type='number'
								value={options.mirostatTau?.toString() || ''}
								onChange={(e) => handleMirostatTauChange(e.target.value)}
								placeholder='5.0'
								min='0'
								step='0.1'
								disabled={disabled}
								className={styles.numberInput}
							/>
						</SettingRow>

						<SettingRow name='Mirostat Eta' description='Learning rate'>
							<Input
								type='number'
								value={options.mirostatEta?.toString() || ''}
								onChange={(e) => handleMirostatEtaChange(e.target.value)}
								placeholder='0.1'
								min='0'
								step='0.01'
								disabled={disabled}
								className={styles.numberInput}
							/>
						</SettingRow>
					</>
				)}
			</div>

			<div className={styles.infoBox}>
				<h4>🦙 Ollama Configuration</h4>
				<ul>
					<li>
						<strong>Server URL:</strong> Local or remote Ollama instance
					</li>
					<li>
						<strong>Keep Alive:</strong> How long model stays in memory
					</li>
					<li>
						<strong>Temperature:</strong> Lower values = more focused responses
					</li>
					<li>
						<strong>Top K/P:</strong> Alternative sampling methods
					</li>
					<li>
						<strong>Mirostat:</strong> Advanced sampling for consistent quality
					</li>
				</ul>
			</div>

			<div className={styles.exampleBox}>
				<h5>🚀 Quick Start</h5>
				<ol>
					<li>
						Install Ollama: <code>curl -fsSL https://ollama.ai/install.sh | sh</code>
					</li>
					<li>
						Pull a model: <code>ollama pull llama3.1</code>
					</li>
					<li>
						Start server: <code>ollama serve</code>
					</li>
					<li>Configure this panel with default URL</li>
				</ol>
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
