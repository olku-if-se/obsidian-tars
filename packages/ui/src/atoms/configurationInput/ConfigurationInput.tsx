import { forwardRef, useId } from 'react'
import { TextArea } from '../textarea/TextArea'
import { Input } from '../input/Input'
import { Button } from '../button/Button'
import { ValidationMessage } from '../validationMessage/ValidationMessage'
import { useValidation } from '../../hooks/useValidation'
import { useFormatConversion } from '../../hooks/useFormatConversion'
import { useDebouncedCallbackWithCleanup } from '../../hooks/useDebouncedCallback'
import type { ValidationResult } from '../../utilities/validation'
import { t } from '../../utilities/i18n'
import styles from './ConfigurationInput.module.css'

// Type aliases following React rules
type ConfigurationInputData = {
	value: string
	format: 'url' | 'command' | 'json'
	placeholder?: string
	disabled?: boolean
}

type ConfigurationInputUI = {
	autoFocus?: boolean
	showFormatToggle?: boolean
	resizable?: boolean
}

type ConfigurationInputEvents = {
	onChange: (value: string) => void
	onFormatChange: (format: 'url' | 'command' | 'json') => void
	onValidationChange: (validation: ValidationResult) => void
}

export type ConfigurationInputProps = ConfigurationInputData & ConfigurationInputUI & ConfigurationInputEvents


export const ConfigurationInput = forwardRef<HTMLDivElement, ConfigurationInputProps>(
	(
		{
			value,
			format,
			placeholder,
			disabled = false,
			autoFocus = false,
			showFormatToggle = true,
			resizable = true,
			onChange,
			onFormatChange,
			onValidationChange
		},
		ref
	) => {
		const inputId = useId()

		// Custom hooks for logic separation
		const validation = useValidation({ value, format, onValidationChange })
		const { convertFormat, getNextFormat } = useFormatConversion()

		// Debounced change handler to prevent excessive re-renders
		const debouncedOnChange = useDebouncedCallbackWithCleanup(onChange, 500)

		// Event handlers with proper typing
		const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			const newValue = event.target.value
			debouncedOnChange(newValue)
		}

		const handleFormatToggle = () => {
			const nextFormat = getNextFormat(format)
			const conversionResult = convertFormat(value, format, nextFormat)
			onFormatChange(nextFormat)
			if (conversionResult.value !== value) {
				onChange(conversionResult.value)
			}
		}

		const getFormatButtonLabel = () => {
			switch (getNextFormat(format)) {
				case 'url':
					return t('configurationInput.showAsUrl')
				case 'command':
					return t('configurationInput.showAsCommand')
				case 'json':
					return t('configurationInput.showAsJson')
			}
		}

		const getInputPlaceholder = () => {
			if (placeholder) {
				return placeholder
			}

			switch (format) {
				case 'url':
					return t('configurationInput.configPlaceholder.url')
				case 'command':
					return t('configurationInput.configPlaceholder.command')
				case 'json':
					return t('configurationInput.configPlaceholder.json')
			}
		}

		// Early return for disabled state
		if (disabled && !value) {
			return null
		}

		return (
			<div ref={ref} className={styles.configurationInput}>
				{/* Main input area */}
				<div className={styles.inputArea}>
					{format === 'json' ? (
						<TextArea
							id={inputId}
							value={value}
							onChange={handleInputChange}
							placeholder={getInputPlaceholder()}
							disabled={disabled}
							resizable={resizable}
							autoFocus={autoFocus}
							error={validation.errors[0]}
							className={styles.textarea}
						/>
					) : (
						<Input
							id={inputId}
							value={value}
							onChange={handleInputChange}
							placeholder={getInputPlaceholder()}
							disabled={disabled}
							autoFocus={autoFocus}
							error={validation.errors[0]}
							className={styles.input}
						/>
					)}
				</div>

				{/* Format toggle and validation area */}
				<div className={styles.controlsArea}>
					{showFormatToggle && (
						<div className={styles.formatControl}>
							<Button
								variant="default"
								size="sm"
								onClick={handleFormatToggle}
								disabled={disabled}
								className={styles.formatButton}
							>
								{getFormatButtonLabel()}
							</Button>
						</div>
					)}

					{/* Validation messages */}
					{(validation.errors.length > 0 || validation.warnings.length > 0) && (
						<div className={styles.validationArea}>
							{validation.errors.map((error) => (
								<ValidationMessage
									key={`error-${error.slice(0, 20)}`}
									message={error}
									type="error"
								/>
							))}
							{validation.warnings.map((warning) => (
								<ValidationMessage
									key={`warning-${warning.slice(0, 20)}`}
									message={warning}
									type="warning"
								/>
							))}
						</div>
					)}
				</div>
			</div>
		)
	}
)

ConfigurationInput.displayName = 'ConfigurationInput'