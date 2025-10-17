import { Input, SettingRow, ValidationMessage } from '../../atoms'
import { useURLValidation } from '../../hooks/useSettingsValidation'
import styles from './AzureConfigPanel.module.css'

export interface AzureOptions {
	endpoint?: string
	apiVersion?: string
}

export interface AzureConfigPanelProps {
	options: AzureOptions
	onChange: (updates: Partial<AzureOptions>) => void
	disabled?: boolean
}

export const AzureConfigPanel = ({ options, onChange, disabled = false }: AzureConfigPanelProps) => {
	// URL validation for endpoint
	const endpointValidation = useURLValidation(options.endpoint || '', {
		requireProtocol: true,
		allowedProtocols: ['https'],
		allowEmpty: true
	})

	// Custom API version validation
	const validateApiVersion = (value: string): string | null => {
		const trimmed = value.trim()
		if (trimmed === '') return null // Empty is valid
		// Basic API version format validation (e.g., 2024-02-01-preview)
		if (!/^\d{4}-\d{2}-\d{2}(-preview)?$/.test(trimmed)) {
			return 'Invalid format. Expected: YYYY-MM-DD or YYYY-MM-DD-preview'
		}
		return null
	}

	const handleEndpointChange = (value: string) => {
		const trimmed = value.trim()
		if (trimmed === '') {
			// Empty string is valid, clearing endpoint
			onChange({ endpoint: '' })
			return
		}

		// Use validation to check if URL is valid
		if (endpointValidation.isValid) {
			onChange({ endpoint: trimmed })
		}
	}

	const handleApiVersionChange = (value: string) => {
		onChange({ apiVersion: value.trim() })
	}

	const apiVersionError = options.apiVersion ? validateApiVersion(options.apiVersion) : null

	return (
		<div className={styles.azureConfigPanel}>
			<SettingRow
				name="Endpoint"
				description="e.g. https://docs-test-001.openai.azure.com/"
			>
				<Input
					value={options.endpoint || ''}
					onChange={(e) => handleEndpointChange(e.target.value)}
					placeholder="https://your-resource.openai.azure.com/"
					disabled={disabled}
					className={`${styles.endpointInput} ${
						!endpointValidation.isValid ? styles.error : ''
					}`}
				/>
				{!endpointValidation.isValid && endpointValidation.errors.length > 0 && (
					<ValidationMessage
						type="error"
						message={endpointValidation.errors[0]}
						className={styles.validationMessage}
					/>
				)}
				{endpointValidation.warnings.length > 0 && (
					<ValidationMessage
						type="warning"
						message={endpointValidation.warnings[0]}
						className={styles.validationMessage}
					/>
				)}
			</SettingRow>

			<SettingRow
				name="API version"
				description="e.g. 2024-xx-xx-preview"
			>
				<Input
					value={options.apiVersion || ''}
					onChange={(e) => handleApiVersionChange(e.target.value)}
					placeholder="2024-02-01-preview"
					disabled={disabled}
					className={`${styles.apiVersionInput} ${
						apiVersionError ? styles.error : ''
					}`}
				/>
				{apiVersionError && (
					<ValidationMessage
						type="error"
						message={apiVersionError}
						className={styles.validationMessage}
					/>
				)}
			</SettingRow>

			<div className={styles.infoBox}>
				<h4>☁️ Azure OpenAI Configuration</h4>
				<ul>
					<li>
						<strong>Endpoint:</strong> The base URL for your Azure OpenAI resource
					</li>
						<li>
							<strong>API Version:</strong> The API version string for your deployment
						</li>
						<li>
							<strong>Resource Name:</strong> Found in your Azure portal under "Keys and Endpoint"
						</li>
						<li>
							<strong>Deployment Name:</strong> Specify the model deployment name if different from the model name
						</li>
				</ul>
			</div>

			<div className={styles.exampleBox}>
				<h5>🔗 Finding Your Endpoint</h5>
				<ol>
					<li>Navigate to Azure OpenAI Studio</li>
					<li>Select your resource</li>
					<li>Go to "Keys and Endpoint" section</li>
					<li>Copy the "Endpoint" URL</li>
					<li>Use the latest API version available</li>
				</ol>
			</div>
		</div>
	)
}