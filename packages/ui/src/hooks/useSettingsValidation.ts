import { useState, useCallback, useMemo } from 'react'
import type { ValidationResult, TagValidationResult } from '~/utils/settingsValidation'
import {
	URLValidator,
	TagValidator,
	JSONValidator,
	VendorValidator,
	SettingsValidator
} from '~/utils/settingsValidation'

/**
 * Hook for validating URLs with real-time feedback
 */
export function useURLValidation(
	initialValue: string = '',
	options?: {
		requireProtocol?: boolean
		allowedProtocols?: string[]
		allowEmpty?: boolean
	}
) {
	const [value, setValue] = useState(initialValue)
	const [validation, setValidation] = useState<ValidationResult>(URLValidator.isValid(initialValue, options))

	const validate = useCallback(
		(newValue: string) => {
			const result = URLValidator.isValid(newValue, options)
			setValidation(result)
			return result
		},
		[options]
	)

	const handleChange = useCallback(
		(newValue: string) => {
			setValue(newValue)
			return validate(newValue)
		},
		[validate]
	)

	return {
		value,
		setValue: handleChange,
		validation,
		isValid: validation.isValid,
		errors: validation.errors,
		warnings: validation.warnings
	}
}

/**
 * Hook for validating tags with suggestions and duplicate detection
 */
export function useTagValidation(
	initialTags: string[] = [],
	options?: {
		allowEmpty?: boolean
		requireHashPrefix?: boolean
		maxLength?: number
		maxCount?: number
	}
) {
	const [tags, setTags] = useState(initialTags)
	const [validation, setValidation] = useState<TagValidationResult>(TagValidator.validateTags(initialTags, options))

	const validate = useCallback(
		(newTags: string[]) => {
			const result = TagValidator.validateTags(newTags, options)
			setValidation(result)
			return result
		},
		[options]
	)

	const handleChange = useCallback(
		(newTags: string[]) => {
			setTags(newTags)
			return validate(newTags)
		},
		[validate]
	)

	const addTag = useCallback(
		(newTag: string) => {
			const updatedTags = [...tags, newTag]
			return handleChange(updatedTags)
		},
		[tags, handleChange]
	)

	const removeTag = useCallback(
		(index: number) => {
			const updatedTags = tags.filter((_, i) => i !== index)
			return handleChange(updatedTags)
		},
		[tags, handleChange]
	)

	const updateTag = useCallback(
		(index: number, newTag: string) => {
			const updatedTags = [...tags]
			updatedTags[index] = newTag
			return handleChange(updatedTags)
		},
		[tags, handleChange]
	)

	const suggestions = useMemo(() => {
		const allSuggestions: string[] = []
		if (validation.suggestions) {
			allSuggestions.push(...validation.suggestions)
		}
		return [...new Set(allSuggestions)]
	}, [validation])

	return {
		tags,
		setTags: handleChange,
		addTag,
		removeTag,
		updateTag,
		validation,
		isValid: validation.isValid,
		errors: validation.errors,
		warnings: validation.warnings,
		suggestions,
		duplicates: validation.duplicates || []
	}
}

/**
 * Hook for validating JSON configuration
 */
export function useJSONValidation(
	initialValue: string = '',
	options?: {
		allowEmpty?: boolean
		schema?: any
		maxSize?: number
	}
) {
	const [value, setValue] = useState(initialValue)
	const [validation, setValidation] = useState<ValidationResult>(JSONValidator.isValid(initialValue, options))

	const validate = useCallback(
		(newValue: string) => {
			const result = JSONValidator.isValid(newValue, options)
			setValidation(result)
			return result
		},
		[options]
	)

	const handleChange = useCallback(
		(newValue: string) => {
			setValue(newValue)
			return validate(newValue)
		},
		[validate]
	)

	return {
		value,
		setValue: handleChange,
		validation,
		isValid: validation.isValid,
		errors: validation.errors,
		warnings: validation.warnings
	}
}

/**
 * Hook for validating vendor-specific configurations
 */
export function useVendorValidation(vendor: string, initialConfig: any = {}) {
	const [config, setConfig] = useState(initialConfig)
	const [validation, setValidation] = useState<ValidationResult>({ isValid: true, errors: [], warnings: [] })

	const validate = useCallback(
		(newConfig: any) => {
			let result: ValidationResult

			switch (vendor) {
				case 'Claude':
					result = VendorValidator.validateClaudeConfig(newConfig)
					break
				case 'OpenAI':
					result = VendorValidator.validateOpenAIConfig(newConfig)
					break
				case 'Ollama':
					result = VendorValidator.validateOllamaConfig(newConfig)
					break
				default:
					result = { isValid: true, errors: [], warnings: [] }
			}

			setValidation(result)
			return result
		},
		[vendor]
	)

	const handleChange = useCallback(
		(newConfig: any) => {
			setConfig(newConfig)
			return validate(newConfig)
		},
		[validate]
	)

	const updateField = useCallback(
		(field: string, value: any) => {
			const newConfig = { ...config, [field]: value }
			return handleChange(newConfig)
		},
		[config, handleChange]
	)

	return {
		config,
		setConfig: handleChange,
		updateField,
		validation,
		isValid: validation.isValid,
		errors: validation.errors,
		warnings: validation.warnings
	}
}

/**
 * Hook for comprehensive provider validation
 */
export function useProviderValidation(initialProvider: any = {}) {
	const [provider, setProvider] = useState(initialProvider)
	const [validation, setValidation] = useState<ValidationResult>(SettingsValidator.validateProvider(initialProvider))

	const validate = useCallback((newProvider: any) => {
		const result = SettingsValidator.validateProvider(newProvider)
		setValidation(result)
		return result
	}, [])

	const handleChange = useCallback(
		(newProvider: any) => {
			setProvider(newProvider)
			return validate(newProvider)
		},
		[validate]
	)

	const updateField = useCallback(
		(field: string, value: any) => {
			const newProvider = { ...provider, [field]: value }
			return handleChange(newProvider)
		},
		[provider, handleChange]
	)

	return {
		provider,
		setProvider: handleChange,
		updateField,
		validation,
		isValid: validation.isValid,
		errors: validation.errors,
		warnings: validation.warnings
	}
}
