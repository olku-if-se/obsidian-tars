import { useCallback } from 'react'
import { validateFormat } from '../utilities/validation'

// Type definitions for format conversion
type Format = 'url' | 'command' | 'json'

type ConversionResult = {
	value: string
	warnings: string[]
}

/**
 * Custom hook for handling format conversion between URL, command, and JSON formats
 * Provides safe conversion with validation and error handling
 */
export function useFormatConversion() {
	/**
	 * Converts a value from one format to another
	 * @param value - Value to convert
	 * @param fromFormat - Source format
	 * @param toFormat - Target format
	 * @returns Conversion result with value and warnings
	 */
	const convertFormat = useCallback((
		value: string,
		fromFormat: Format,
		toFormat: Format
	): ConversionResult => {
		const warnings: string[] = []

		// Early return if formats are the same
		if (fromFormat === toFormat) {
			return { value, warnings }
		}

		const trimmedValue = value.trim()

		if (!trimmedValue) {
			// Empty value stays empty in any format
			return { value: '', warnings }
		}

		try {
			// Validate the current format first
			const validation = validateFormat(trimmedValue, fromFormat)

			if (!validation.isValid) {
				// If current format is invalid, return empty value in target format
				warnings.push(`Cannot convert invalid ${fromFormat} format to ${toFormat}`)
				return { value: '', warnings }
			}

			// Perform format-specific conversions
			switch (fromFormat) {
				case 'url':
					return convertFromUrl(trimmedValue, toFormat, warnings)

				case 'command':
					return convertFromCommand(trimmedValue, toFormat, warnings)

				case 'json':
					return convertFromJson(trimmedValue, toFormat, warnings)

				default: {
					const _exhaustiveCheck: never = fromFormat
					throw new Error(`Unsupported source format: ${_exhaustiveCheck}`)
				}
			}
		} catch (error) {
			console.error(`Format conversion error (${fromFormat} -> ${toFormat}):`, error)
			warnings.push(`Failed to convert from ${fromFormat} to ${toFormat}`)
			return { value: '', warnings }
		}
	}, [])

	/**
	 * Gets the next format in the cycle for the format toggle button
	 * @param currentFormat - Current format
	 * @returns Next format in the cycle
	 */
	const getNextFormat = useCallback((currentFormat: Format): Format => {
		const formats: Format[] = ['url', 'command', 'json']
		const currentIndex = formats.indexOf(currentFormat)
		return formats[(currentIndex + 1) % formats.length]
	}, [])

	/**
	 * Gets all available formats for the current value
	 * @param value - Value to check
	 * @param currentFormat - Current format of the value
	 * @returns Array of formats that can represent the value
	 */
	const getAvailableFormats = useCallback((
		value: string,
		currentFormat: Format
	): Format[] => {
		try {
			const validation = validateFormat(value, currentFormat)
			const available: Format[] = [currentFormat]

			if (validation.formatCompatibility.canShowAsUrl) {
				available.push('url')
			}
			if (validation.formatCompatibility.canShowAsCommand) {
				available.push('command')
			}
			if (validation.formatCompatibility.canShowAsJson) {
				available.push('json')
			}

			// Remove duplicates while preserving order
			return [...new Set(available)]
		} catch {
			return [currentFormat]
		}
	}, [])

	return {
		convertFormat,
		getNextFormat,
		getAvailableFormats
	}
}

// Helper functions for format conversions
function convertFromUrl(url: string, toFormat: Format, warnings: string[]): ConversionResult {
	try {
		const parsedUrl = new URL(url)

		if (toFormat === 'command') {
			// Convert URL to curl command
			const command = `curl -X GET "${url}"`
			warnings.push('Converted URL to curl command for testing')
			return { value: command, warnings }
		}

		if (toFormat === 'json') {
			// Convert URL to Claude Desktop JSON format
			const jsonConfig = {
				mcpServers: {
					'remote-server': {
						command: 'curl',
						args: ['-X', 'GET', url]
					}
				}
			}
			const jsonString = JSON.stringify(jsonConfig, null, 2)
			warnings.push('Converted URL to Claude Desktop JSON format')
			return { value: jsonString, warnings }
		}

		// Should never reach here if we have proper format validation
		warnings.push(`Unsupported target format: ${toFormat}`)
		return { value: '', warnings }
	} catch (error) {
		warnings.push('Invalid URL format for conversion')
		return { value: '', warnings }
	}
}

function convertFromCommand(command: string, toFormat: Format, warnings: string[]): ConversionResult {
	const parts = command.trim().split(/\s+/).filter(p => p.length > 0)
	const [baseCommand, ...args] = parts

	if (!baseCommand) {
		warnings.push('Cannot convert empty command')
		return { value: '', warnings }
	}

	if (toFormat === 'url') {
		// Try to extract URL from curl command
		if (baseCommand === 'curl') {
			const urlIndex = args.findIndex(arg =>
				arg.startsWith('http://') || arg.startsWith('https://') ||
				(!arg.startsWith('-') && !arg.includes('='))
			)

			if (urlIndex !== -1) {
				const extractedUrl = args[urlIndex]
				warnings.push('Extracted URL from curl command')
				return { value: extractedUrl, warnings }
			}
		}

		warnings.push('Cannot convert command to URL format')
		return { value: '', warnings }
	}

	if (toFormat === 'json') {
		// Convert command to direct JSON format
		const jsonConfig = {
			command: baseCommand,
			args: args.length > 0 ? args : undefined
		}
		const jsonString = JSON.stringify(jsonConfig, null, 2)
		warnings.push('Converted command to JSON format')
		return { value: jsonString, warnings }
	}

	// Should never reach here if we have proper format validation
	warnings.push(`Unsupported target format: ${toFormat}`)
	return { value: '', warnings }
}

function convertFromJson(jsonString: string, toFormat: Format, warnings: string[]): ConversionResult {
	try {
		const parsed = JSON.parse(jsonString)

		if (typeof parsed !== 'object' || parsed === null) {
			warnings.push('JSON must be an object for conversion')
			return { value: '', warnings }
		}

		const obj = parsed as Record<string, unknown>

		if (toFormat === 'url') {
			// Try to extract URL from command-based configurations
			let extractedUrl: string | null = null

			// Claude Desktop format
			if ('mcpServers' in obj) {
				const servers = obj.mcpServers as Record<string, unknown>
				for (const serverConfig of Object.values(servers)) {
					if (typeof serverConfig === 'object' && serverConfig !== null) {
						const config = serverConfig as Record<string, unknown>
						if (config.command === 'curl' && Array.isArray(config.args)) {
							const urlArg = config.args.find((arg: unknown) =>
								typeof arg === 'string' &&
								(arg.startsWith('http://') || arg.startsWith('https://'))
							)
							if (urlArg) {
								extractedUrl = urlArg
								break
							}
						}
					}
				}
			}
			// Direct format
			else if ('command' in obj && obj.command === 'curl' && Array.isArray(obj.args)) {
				const urlArg = obj.args.find((arg: unknown) =>
					typeof arg === 'string' &&
					(arg.startsWith('http://') || arg.startsWith('https://'))
				)
				if (urlArg) {
					extractedUrl = urlArg
				}
			}

			if (extractedUrl) {
				warnings.push('Extracted URL from JSON configuration')
				return { value: extractedUrl, warnings }
			}

			warnings.push('Cannot convert JSON to URL format - no URL found')
			return { value: '', warnings }
		}

		if (toFormat === 'command') {
			let command = ''

			// Claude Desktop format - use first server
			if ('mcpServers' in obj) {
				const servers = obj.mcpServers as Record<string, unknown>
				const firstServer = Object.values(servers)[0] as Record<string, unknown>

				if (firstServer && typeof firstServer === 'object' && firstServer.command) {
					const cmd = firstServer.command as string
					const args = Array.isArray(firstServer.args)
						? firstServer.args.join(' ')
						: ''
					command = `${cmd} ${args}`.trim()
				}
			}
			// Direct format
			else if ('command' in obj && typeof obj.command === 'string') {
				const cmd = obj.command
				const args = Array.isArray(obj.args)
					? obj.args.join(' ')
					: ''
				command = `${cmd} ${args}`.trim()
			}

			if (command) {
				warnings.push('Converted JSON to command format')
				return { value: command, warnings }
			}

			warnings.push('Cannot convert JSON to command format - no command found')
			return { value: '', warnings }
		}

		// Should never reach here if we have proper format validation
		warnings.push(`Unsupported target format: ${toFormat}`)
		return { value: '', warnings }
	} catch (error) {
		warnings.push('Invalid JSON format for conversion')
		return { value: '', warnings }
	}
}