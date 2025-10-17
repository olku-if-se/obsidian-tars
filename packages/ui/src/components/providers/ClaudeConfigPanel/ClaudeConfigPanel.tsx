import { Input, SettingRow, Toggle } from '~/atoms'
import { ValidationMessage } from '~/atoms/validationMessage/ValidationMessage'
import styles from './ClaudeConfigPanel.module.css'

export interface ClaudeOptions {
	enableThinking?: boolean
	budget_tokens?: number
	max_tokens?: number
}

export interface ClaudeConfigPanelProps {
	options: ClaudeOptions
	onChange: (updates: Partial<ClaudeOptions>) => void
	disabled?: boolean
}

export const ClaudeConfigPanel = ({ options, onChange, disabled = false }: ClaudeConfigPanelProps) => {
	const handleToggleThinking = (enabled: boolean) => {
		onChange({ enableThinking: enabled })
	}

	const handleBudgetTokensChange = (value: string) => {
		const number = parseInt(value, 10)
		if (!Number.isNaN(number) && number >= 1024) {
			onChange({ budget_tokens: number })
		}
	}

	const handleMaxTokensChange = (value: string) => {
		const number = parseInt(value, 10)
		if (!Number.isNaN(number) && number >= 256) {
			onChange({ max_tokens: number })
		}
	}

	const validateBudgetTokens = (value: string): string | null => {
		const number = parseInt(value, 10)
		if (Number.isNaN(number)) return 'Please enter a number'
		if (number < 1024) return 'Minimum value is 1024'
		return null
	}

	const validateMaxTokens = (value: string): string | null => {
		const number = parseInt(value, 10)
		if (Number.isNaN(number)) return 'Please enter a number'
		if (number < 256) return 'Minimum value is 256'
		return null
	}

	const budgetTokensError = options.budget_tokens ? validateBudgetTokens(options.budget_tokens.toString()) : null
	const maxTokensError = options.max_tokens ? validateMaxTokens(options.max_tokens.toString()) : null

	return (
		<div className={styles.claudeConfigPanel}>
			<SettingRow
				name='Thinking'
				description='When enabled, Claude will show its reasoning process before giving the final answer.'
			>
				<Toggle
					checked={options.enableThinking ?? false}
					onChange={(e) => handleToggleThinking(e.target.checked)}
					disabled={disabled}
				/>
			</SettingRow>

			<SettingRow name='Budget tokens for thinking' description='Must be ≥1024 and less than max_tokens'>
				<div className={styles.inputContainer}>
					<Input
						value={options.budget_tokens?.toString() || '1600'}
						onChange={(e) => handleBudgetTokensChange(e.target.value)}
						placeholder='1600'
						disabled={disabled}
						className={`${styles.tokenInput} ${budgetTokensError ? styles.error : ''}`}
					/>
					<span className={styles.inputSuffix}>tokens</span>
				</div>
				{budgetTokensError && <ValidationMessage type='error' message={budgetTokensError} />}
			</SettingRow>

			<SettingRow name='Max tokens' description='Refer to the technical documentation'>
				<div className={styles.inputContainer}>
					<Input
						value={options.max_tokens?.toString() || '4096'}
						onChange={(e) => handleMaxTokensChange(e.target.value)}
						placeholder='4096'
						disabled={disabled}
						className={`${styles.tokenInput} ${maxTokensError ? styles.error : ''}`}
					/>
					<span className={styles.inputSuffix}>tokens</span>
				</div>
				{maxTokensError && <ValidationMessage type='error' message={maxTokensError} />}
			</SettingRow>

			<div className={styles.infoBox}>
				<h4>💡 Claude Tips</h4>
				<ul>
					<li>
						<strong>Thinking Mode:</strong> Allows Claude to show step-by-step reasoning, improving transparency
					</li>
					<li>
						<strong>Budget Tokens:</strong> Allocates tokens for the thinking process
					</li>
					<li>
						<strong>Max Tokens:</strong> Controls the total response length including thinking
					</li>
				</ul>
			</div>
		</div>
	)
}
