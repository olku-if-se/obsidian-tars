/**
 * Comprehensive validation utilities for React settings
 * Provides URL, JSON, tag, and vendor-specific validation
 */

export interface ValidationResult {
	isValid: boolean
	errors: string[]
	warnings: string[]
}

export interface TagValidationResult extends ValidationResult {
	suggestions?: string[]
	duplicates?: string[]
}

/**
 * URL validation utilities
 */
export class URLValidator {
	/**
	 * Validate a URL with optional protocol requirements
	 */
	static isValid(
		url: string,
		options: {
			requireProtocol?: boolean
			allowedProtocols?: string[]
			allowEmpty?: boolean
		} = {}
	): ValidationResult {
		const { requireProtocol = true, allowedProtocols = ['http', 'https'], allowEmpty = false } = options

		const errors: string[] = []
		const warnings: string[] = []

		// Check empty value
		if (!url || url.trim() === '') {
			if (allowEmpty) {
				return { isValid: true, errors: [], warnings: [] }
			} else {
				return { isValid: false, errors: ['URL is required'], warnings: [] }
			}
		}

		const trimmedUrl = url.trim()

		// Check protocol
		if (requireProtocol) {
			const hasProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmedUrl)
			if (hasProtocol) {
				const protocol = trimmedUrl.split(':')[0].toLowerCase()
				if (!allowedProtocols.includes(protocol)) {
					errors.push(`Protocol must be one of: ${allowedProtocols.join(', ')}`)
				}
			} else {
				errors.push('URL must include protocol (e.g., https://)')
			}
		}

		// Basic URL format validation
		try {
			const urlObj = new URL(trimmedUrl)

			// Validate hostname
			if (!urlObj.hostname) {
				errors.push('URL must have a valid hostname')
			}

			// Check for common patterns
			if (urlObj.hostname === 'localhost' && urlObj.port) {
				const port = parseInt(urlObj.port, 10)
				if (port < 1 || port > 65535) {
					errors.push('Port must be between 1 and 65535')
				}
			}

			// Warn about common issues
			if (urlObj.hostname.includes('example.com')) {
				warnings.push('Using example.com - this is likely a placeholder')
			}
		} catch (error) {
			errors.push('Invalid URL format')
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings
		}
	}

	/**
	 * Validate OpenAI-style API base URLs
	 */
	static validateAPIBaseURL(url: string): ValidationResult {
		const result = URLValidator.isValid(url, {
			requireProtocol: true,
			allowedProtocols: ['https', 'http'],
			allowEmpty: true
		})

		// Add API-specific warnings
		if (url && url.trim() !== '') {
			const trimmedUrl = url.trim()

			// Check for common API base URL patterns
			if (!trimmedUrl.includes('/v1') && !trimmedUrl.includes('/api')) {
				result.warnings.push('API base URLs typically end with /v1 or /api')
			}

			// Warn about non-HTTPS for production
			if (trimmedUrl.startsWith('http://') && !trimmedUrl.includes('localhost') && !trimmedUrl.includes('127.0.0.1')) {
				result.warnings.push('HTTPS is recommended for API endpoints')
			}
		}

		return result
	}

	/**
	 * Validate Azure OpenAI endpoint URLs
	 */
	static validateAzureEndpoint(url: string): ValidationResult {
		const result = URLValidator.isValid(url, {
			requireProtocol: true,
			allowedProtocols: ['https'],
			allowEmpty: false
		})

		if (url && url.trim() !== '') {
			const trimmedUrl = url.trim()

			// Azure OpenAI URL patterns
			if (!trimmedUrl.includes('openai.azure.com')) {
				result.warnings.push('Azure OpenAI endpoints typically contain "openai.azure.com"')
			}

			if (!trimmedUrl.endsWith('/')) {
				result.warnings.push('Azure endpoints typically end with /')
			}
		}

		return result
	}
}

/**
 * JSON validation utilities
 */
export class JSONValidator {
	/**
	 * Validate JSON string with optional schema validation
	 */
	static isValid(
		jsonString: string,
		options: {
			allowEmpty?: boolean
			schema?: any
			maxSize?: number
		} = {}
	): ValidationResult {
		const { allowEmpty = true, schema, maxSize = 1024 * 1024 } = options // 1MB default

		const errors: string[] = []
		const warnings: string[] = []

		// Check empty value
		if (!jsonString || jsonString.trim() === '') {
			if (allowEmpty) {
				return { isValid: true, errors: [], warnings: [] }
			} else {
				return { isValid: false, errors: ['JSON is required'], warnings: [] }
			}
		}

		// Check size
		if (jsonString.length > maxSize) {
			errors.push(`JSON exceeds maximum size of ${maxSize} bytes`)
		}

		let parsed: any
		try {
			parsed = JSON.parse(jsonString)
		} catch (error) {
			errors.push(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
			return { isValid: false, errors, warnings }
		}

		// Schema validation if provided
		if (schema) {
			const schemaErrors = JSONValidator.validateAgainstSchema(parsed, schema)
			errors.push(...schemaErrors)
		}

		// Warn about common issues
		if (typeof parsed === 'object' && parsed !== null) {
			const keys = Object.keys(parsed)
			if (keys.length === 0) {
				warnings.push('JSON object is empty')
			}

			// Check for potential sensitive data patterns
			for (const key of keys) {
				if (key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')) {
					warnings.push('JSON contains potentially sensitive information')
					break
				}
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings
		}
	}

	/**
	 * Simple JSON schema validation
	 */
	private static validateAgainstSchema(data: any, schema: any): string[] {
		const errors: string[] = []

		// Basic type validation
		if (schema.type) {
			const expectedType = schema.type
			const actualType = Array.isArray(data) ? 'array' : typeof data

			if (actualType !== expectedType) {
				errors.push(`Expected type ${expectedType}, got ${actualType}`)
			}
		}

		// Required properties
		if (schema.required && Array.isArray(schema.required) && typeof data === 'object' && data !== null) {
			for (const requiredProp of schema.required) {
				if (!(requiredProp in data)) {
					errors.push(`Missing required property: ${requiredProp}`)
				}
			}
		}

		// Property validation
		if (schema.properties && typeof data === 'object' && data !== null) {
			for (const [propName, propSchema] of Object.entries(schema.properties)) {
				if (propName in data) {
					const propErrors = JSONValidator.validateAgainstSchema(data[propName], propSchema)
					errors.push(...propErrors.map((e) => `${propName}: ${e}`))
				}
			}
		}

		return errors
	}
}

/**
 * Tag validation utilities
 */
export class TagValidator {
	/**
	 * Validate Obsidian-style tags
	 */
	static validateTags(
		tags: string[],
		options: {
			allowEmpty?: boolean
			requireHashPrefix?: boolean
			maxLength?: number
			maxCount?: number
		} = {}
	): TagValidationResult {
		const { allowEmpty = true, requireHashPrefix = true, maxLength = 100, maxCount = 50 } = options

		const errors: string[] = []
		const warnings: string[] = []
		const suggestions: string[] = []
		const duplicates: string[] = []

		// Check empty array
		if (tags.length === 0) {
			if (allowEmpty) {
				return { isValid: true, errors: [], warnings: [], suggestions, duplicates }
			} else {
				return { isValid: false, errors: ['At least one tag is required'], warnings: [], suggestions, duplicates }
			}
		}

		// Check tag count
		if (tags.length > maxCount) {
			errors.push(`Maximum ${maxCount} tags allowed`)
		}

		const normalizedTags = new Set<string>()
		const seenTags = new Map<string, string>()

		for (let i = 0; i < tags.length; i++) {
			const tag = tags[i].trim()

			// Skip empty tags
			if (!tag) {
				warnings.push(`Empty tag at position ${i + 1}`)
				continue
			}

			// Check length
			if (tag.length > maxLength) {
				errors.push(`Tag "${tag}" exceeds maximum length of ${maxLength} characters`)
			}

			// Check hash prefix requirement
			if (requireHashPrefix && !tag.startsWith('#')) {
				errors.push(`Tag "${tag}" must start with #`)
				suggestions.push(`#${tag}`)
			}

			// Check for invalid characters
			const invalidChars = /[<>:"\\|?*\x00-\x1f]/
			if (invalidChars.test(tag)) {
				errors.push(`Tag "${tag}" contains invalid characters`)
			}

			// Check for spaces
			if (tag.includes(' ')) {
				warnings.push(`Tag "${tag}" contains spaces, consider using hyphens or underscores`)
				suggestions.push(tag.replace(/\s+/g, '-'))
			}

			// Check for duplicates (case-insensitive)
			const normalizedTag = tag.toLowerCase()
			if (normalizedTags.has(normalizedTag)) {
				const originalTag = seenTags.get(normalizedTag)
				if (originalTag && !duplicates.includes(tag)) {
					duplicates.push(tag)
					warnings.push(`Tag "${tag}" is a duplicate of "${originalTag}"`)
				}
			} else {
				normalizedTags.add(normalizedTag)
				seenTags.set(normalizedTag, tag)
			}

			// Check tag format suggestions
			if (requireHashPrefix && tag.startsWith('#') && tag.length === 1) {
				warnings.push('Single character tag "#" may not be useful')
			}

			// Suggest improvements for common patterns
			if (tag.match(/^[A-Z][a-z]+[A-Z][a-z]+$/)) {
				suggestions.push(tag.replace(/([A-Z])/g, '-$1').toLowerCase())
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
			suggestions: [...new Set(suggestions)], // Remove duplicates
			duplicates
		}
	}

	/**
	 * Validate a single tag
	 */
	static validateSingleTag(
		tag: string,
		options: {
			requireHashPrefix?: boolean
			maxLength?: number
		} = {}
	): ValidationResult {
		const { requireHashPrefix = true, maxLength = 100 } = options

		const errors: string[] = []
		const warnings: string[] = []

		if (!tag || tag.trim() === '') {
			return { isValid: false, errors: ['Tag cannot be empty'], warnings: [] }
		}

		const trimmedTag = tag.trim()

		// Length check
		if (trimmedTag.length > maxLength) {
			errors.push(`Tag exceeds maximum length of ${maxLength} characters`)
		}

		// Hash prefix check
		if (requireHashPrefix && !trimmedTag.startsWith('#')) {
			errors.push('Tag must start with #')
		}

		// Invalid characters
		const invalidChars = /[<>:"\\|?*\x00-\x1f]/
		if (invalidChars.test(trimmedTag)) {
			errors.push('Tag contains invalid characters')
		}

		// Warnings
		if (trimmedTag.includes(' ')) {
			warnings.push('Tag contains spaces, consider using hyphens or underscores')
		}

		if (requireHashPrefix && trimmedTag.startsWith('#') && trimmedTag.length === 1) {
			warnings.push('Single character tag "#" may not be useful')
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings
		}
	}

	/**
	 * Suggest improvements for a tag
	 */
	static suggestImprovements(tag: string): string[] {
		const suggestions: string[] = []
		const trimmedTag = tag.trim()

		if (!trimmedTag) return suggestions

		// Add hash prefix if missing
		if (!trimmedTag.startsWith('#')) {
			suggestions.push(`#${trimmedTag}`)
		}

		// Replace spaces with hyphens
		if (trimmedTag.includes(' ')) {
			suggestions.push(trimmedTag.replace(/\s+/g, '-'))
		}

		// Convert camelCase to kebab-case
		if (trimmedTag.match(/^[A-Z][a-zA-Z0-9]*$/) || trimmedTag.match(/^[a-z]+[A-Z][a-zA-Z0-9]*$/)) {
			suggestions.push(
				trimmedTag
					.replace(/([A-Z])/g, '-$1')
					.toLowerCase()
					.replace(/^-/, '#')
			)
		}

		return [...new Set(suggestions)] // Remove duplicates
	}
}

/**
 * Vendor-specific validation utilities
 */
export class VendorValidator {
	/**
	 * Validate Claude-specific configuration
	 */
	static validateClaudeConfig(config: {
		thinkingMode?: string
		budgetTokens?: number
		maxTokens?: number
		temperature?: number
		topP?: number
		topK?: number
	}): ValidationResult {
		const errors: string[] = []
		const warnings: string[] = []

		// Thinking mode validation
		if (config.thinkingMode && !['auto', 'enabled', 'disabled'].includes(config.thinkingMode)) {
			errors.push('Thinking mode must be: auto, enabled, or disabled')
		}

		// Token validation
		if (config.budgetTokens !== undefined) {
			if (typeof config.budgetTokens !== 'number' || config.budgetTokens < 1024) {
				errors.push('Budget tokens must be at least 1024')
			}
			if (config.budgetTokens > 200000) {
				warnings.push('Budget tokens over 200k may be expensive')
			}
		}

		if (config.maxTokens !== undefined) {
			if (typeof config.maxTokens !== 'number' || config.maxTokens < 1) {
				errors.push('Max tokens must be at least 1')
			}
			if (config.maxTokens > 8192) {
				warnings.push('Max tokens over 8192 may not be supported by all models')
			}
		}

		// Temperature validation
		if (config.temperature !== undefined) {
			if (typeof config.temperature !== 'number' || config.temperature < 0 || config.temperature > 1) {
				errors.push('Temperature must be between 0 and 1')
			}
		}

		// Top P validation
		if (config.topP !== undefined) {
			if (typeof config.topP !== 'number' || config.topP < 0 || config.topP > 1) {
				errors.push('Top P must be between 0 and 1')
			}
		}

		// Top K validation
		if (config.topK !== undefined) {
			if (typeof config.topK !== 'number' || config.topK < 0 || !Number.isInteger(config.topK)) {
				errors.push('Top K must be a non-negative integer')
			}
		}

		return { isValid: errors.length === 0, errors, warnings }
	}

	/**
	 * Validate OpenAI-specific configuration
	 */
	static validateOpenAIConfig(config: {
		baseURL?: string
		organization?: string
		project?: string
		maxTokens?: number
		temperature?: number
		topP?: number
		frequencyPenalty?: number
		presencePenalty?: number
	}): ValidationResult {
		const errors: string[] = []
		const warnings: string[] = []

		// Base URL validation
		if (config.baseURL) {
			const urlValidation = URLValidator.validateAPIBaseURL(config.baseURL)
			errors.push(...urlValidation.errors)
			warnings.push(...urlValidation.warnings)
		}

		// Token validation
		if (config.maxTokens !== undefined) {
			if (typeof config.maxTokens !== 'number' || config.maxTokens < 1) {
				errors.push('Max tokens must be at least 1')
			}
			if (config.maxTokens > 128000) {
				warnings.push('Max tokens over 128k may not be supported by all models')
			}
		}

		// Temperature validation
		if (config.temperature !== undefined) {
			if (typeof config.temperature !== 'number' || config.temperature < 0 || config.temperature > 2) {
				errors.push('Temperature must be between 0 and 2')
			}
		}

		// Top P validation
		if (config.topP !== undefined) {
			if (typeof config.topP !== 'number' || config.topP < 0 || config.topP > 1) {
				errors.push('Top P must be between 0 and 1')
			}
		}

		// Penalty validation
		for (const [key, value] of Object.entries({
			frequencyPenalty: config.frequencyPenalty,
			presencePenalty: config.presencePenalty
		})) {
			if (value !== undefined) {
				if (typeof value !== 'number' || value < -2 || value > 2) {
					errors.push(`${key} must be between -2 and 2`)
				}
			}
		}

		return { isValid: errors.length === 0, errors, warnings }
	}

	/**
	 * Validate Ollama-specific configuration
	 */
	static validateOllamaConfig(config: {
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
	}): ValidationResult {
		const errors: string[] = []
		const warnings: string[] = []

		// Base URL validation
		if (config.baseURL) {
			const urlValidation = URLValidator.isValid(config.baseURL, {
				requireProtocol: true,
				allowedProtocols: ['http', 'https'],
				allowEmpty: false
			})
			errors.push(...urlValidation.errors)
			warnings.push(...urlValidation.warnings)
		}

		// Keep alive validation
		if (config.keepAlive) {
			const keepAlivePattern = /^\d+[smh]$/
			if (!keepAlivePattern.test(config.keepAlive)) {
				errors.push('Keep alive must be in format: number + s/m/h (e.g., 5m, 1h)')
			}
		}

		// Numeric parameters
		const numericParams = {
			numCtx: { min: 1, max: 32768, name: 'Context size' },
			numPredict: { min: 0, max: 32768, name: 'Max predict' },
			temperature: { min: 0, max: 2, name: 'Temperature' },
			topP: { min: 0, max: 1, name: 'Top P' },
			topK: { min: 0, max: 100, name: 'Top K' },
			repeatPenalty: { min: 1, max: 2, name: 'Repeat penalty' }
		}

		for (const [key, { min, max, name }] of Object.entries(numericParams)) {
			const value = config[key as keyof typeof config] as number | undefined
			if (value !== undefined) {
				if (typeof value !== 'number' || value < min || value > max) {
					errors.push(`${name} must be between ${min} and ${max}`)
				}
			}
		}

		return { isValid: errors.length === 0, errors, warnings }
	}
}

/**
 * Composite validation for complete settings
 */
export class SettingsValidator {
	/**
	 * Validate complete provider configuration
	 */
	static validateProvider(provider: {
		name: string
		tag: string
		apiKey?: string
		model?: string
		vendorConfig?: any
	}): ValidationResult {
		const errors: string[] = []
		const warnings: string[] = []

		// Basic provider validation
		if (!provider.name || provider.name.trim() === '') {
			errors.push('Provider name is required')
		}

		if (!provider.tag || provider.tag.trim() === '') {
			errors.push('Provider tag is required')
		} else {
			const tagValidation = TagValidator.validateSingleTag(provider.tag)
			errors.push(...tagValidation.errors)
			warnings.push(...tagValidation.warnings)
		}

		// Vendor-specific validation
		if (provider.vendorConfig) {
			switch (provider.name) {
				case 'Claude': {
					const claudeValidation = VendorValidator.validateClaudeConfig(provider.vendorConfig.claude || {})
					errors.push(...claudeValidation.errors)
					warnings.push(...claudeValidation.warnings)
					break
				}
				case 'OpenAI': {
					const openaiValidation = VendorValidator.validateOpenAIConfig(provider.vendorConfig.openai || {})
					errors.push(...openaiValidation.errors)
					warnings.push(...openaiValidation.warnings)
					break
				}
				case 'Ollama': {
					const ollamaValidation = VendorValidator.validateOllamaConfig(provider.vendorConfig.ollama || {})
					errors.push(...ollamaValidation.errors)
					warnings.push(...ollamaValidation.warnings)
					break
				}
			}
		}

		return { isValid: errors.length === 0, errors, warnings }
	}
}
