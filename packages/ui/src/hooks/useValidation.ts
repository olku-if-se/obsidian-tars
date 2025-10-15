import { useEffect, useRef, useCallback, useState } from 'react'
import { validateFormat, type ValidationResult } from '../utilities/validation'

// Type definitions for the hook
type UseValidationProps = {
	value: string
	format: 'url' | 'command' | 'json'
	onValidationChange?: (validation: ValidationResult) => void
	debounceMs?: number
}

type UseValidationReturn = ValidationResult & {
	isValidating: boolean
	lastValidated: string
}

/**
 * Custom hook for validating MCP server configuration formats
 * Features debounced validation and result caching
 */
export function useValidation({
	value,
	format,
	onValidationChange,
	debounceMs = 500
}: UseValidationProps): UseValidationReturn {
	// Refs for managing debounced validation and caching
	const timeoutRef = useRef<number | null>(null)
	const lastValidationRef = useRef<ValidationResult | null>(null)
	const lastValidatedValueRef = useRef<string>('')

	// Current validation state
	const [currentValidation, setCurrentValidation] = useState<ValidationResult>({
		isValid: true,
		errors: [],
		warnings: [],
		formatCompatibility: {
			canShowAsUrl: false,
			canShowAsCommand: false,
			canShowAsJson: false
		}
	})

	const [isValidating, setIsValidating] = useState(false)

	// Validation function with debouncing
	const validateWithDebounce = useCallback((newValue: string, newFormat: 'url' | 'command' | 'json') => {
		// Clear existing timeout
		if (timeoutRef.current !== null) {
			clearTimeout(timeoutRef.current)
		}

		// Check if we have a cached result for this value
		if (lastValidatedValueRef.current === newValue && lastValidationRef.current) {
			setCurrentValidation(lastValidationRef.current)
			onValidationChange?.(lastValidationRef.current)
			return
		}

		setIsValidating(true)

		// Set up debounced validation
		timeoutRef.current = window.setTimeout(() => {
			try {
				const validationResult = validateFormat(newValue, newFormat)

				// Update cache
				lastValidationRef.current = validationResult
				lastValidatedValueRef.current = newValue

				// Update state
				setCurrentValidation(validationResult)
				onValidationChange?.(validationResult)
			} catch (error) {
				console.error('Validation error:', error)

				const errorResult: ValidationResult = {
					isValid: false,
					errors: ['Validation failed'],
					warnings: [],
					formatCompatibility: {
						canShowAsUrl: false,
						canShowAsCommand: false,
						canShowAsJson: false
					}
				}

				setCurrentValidation(errorResult)
				onValidationChange?.(errorResult)
			} finally {
				setIsValidating(false)
			}
		}, debounceMs)
	}, [onValidationChange, debounceMs])

	// Effect to trigger validation when value or format changes
	useEffect(() => {
		validateWithDebounce(value, format)
	}, [value, format, validateWithDebounce])

	// Cleanup effect
	useEffect(() => {
		return () => {
			if (timeoutRef.current !== null) {
				clearTimeout(timeoutRef.current)
			}
		}
	}, [])

	// Immediate validation for critical cases (e.g., when value becomes empty)
	const validateImmediate = useCallback((newValue: string, newFormat: 'url' | 'command' | 'json') => {
		if (timeoutRef.current !== null) {
			clearTimeout(timeoutRef.current)
		}

		try {
			const validationResult = validateFormat(newValue, newFormat)

			lastValidationRef.current = validationResult
			lastValidatedValueRef.current = newValue

			setCurrentValidation(validationResult)
			onValidationChange?.(validationResult)
		} catch (error) {
			console.error('Immediate validation error:', error)
		}
	}, [onValidationChange])

	return {
		...currentValidation,
		isValidating,
		lastValidated: lastValidatedValueRef.current
	}
}