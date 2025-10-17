/**
 * Validation utilities for MCP server configuration formats
 * Following TypeScript best practices with proper type safety
 */

// Type definition for validation results
export type ValidationResult = {
	isValid: boolean
	errors: string[]
	warnings: string[]
	formatCompatibility: {
		canShowAsUrl: boolean
		canShowAsCommand: boolean
		canShowAsJson: boolean
	}
}

// Dangerous commands blacklist for security
const DANGEROUS_COMMANDS = [
	'rm',
	'rmdir',
	'mv',
	'cp',
	'chmod',
	'chown',
	'sudo',
	'su',
	'doas',
	'pkexec',
	'systemctl',
	'service',
	'init',
	'shutdown',
	'reboot',
	'halt',
	'poweroff',
	'fdisk',
	'mkfs',
	'mount',
	'umount',
	'iptables',
	'ufw',
	'firewall-cmd'
] as const

/**
 * Validates URL format for MCP server configuration
 * @param url - URL string to validate
 * @returns Validation result with errors and compatibility info
 */
export const validateUrlFormat = (url: string): ValidationResult => {
	const errors: string[] = []
	const warnings: string[] = []
	const trimmed = url.trim()

	if (!trimmed) {
		errors.push('URL is required')
		return {
			isValid: false,
			errors,
			warnings,
			formatCompatibility: {
				canShowAsUrl: true,
				canShowAsCommand: false,
				canShowAsJson: false
			}
		}
	}

	try {
		const parsed = new URL(trimmed)

		// Protocol validation
		if (!['http:', 'https:'].includes(parsed.protocol)) {
			errors.push('URL must use http:// or https:// protocol')
		}

		// Hostname validation
		if (!parsed.hostname) {
			errors.push('URL must have a valid hostname')
		}

		// Length validation
		if (trimmed.length > 2048) {
			errors.push('URL is too long (max 2048 characters)')
		}

		// Security warnings
		if (parsed.protocol === 'http:') {
			warnings.push('Using HTTP instead of HTTPS is not secure')
		}

		// Check for localhost usage
		if (parsed.hostname === 'localhost' || parsed.hostname.startsWith('127.')) {
			warnings.push('Localhost URLs will not work in production environments')
		}

		// Format compatibility analysis
		const canShowAsCommand = convertUrlToCommand(trimmed) !== null
		const canShowAsJson = convertUrlToJson(trimmed) !== null

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
			formatCompatibility: {
				canShowAsUrl: true,
				canShowAsCommand,
				canShowAsJson
			}
		}
	} catch (_error) {
		errors.push('Invalid URL format')
		return {
			isValid: false,
			errors,
			warnings,
			formatCompatibility: {
				canShowAsUrl: false,
				canShowAsCommand: false,
				canShowAsJson: false
			}
		}
	}
}

/**
 * Validates command format for MCP server configuration
 * @param command - Command string to validate
 * @returns Validation result with errors and compatibility info
 */
export const validateCommandFormat = (command: string): ValidationResult => {
	const errors: string[] = []
	const warnings: string[] = []
	const trimmed = command.trim()

	if (!trimmed) {
		errors.push('Command is required')
		return {
			isValid: false,
			errors,
			warnings,
			formatCompatibility: {
				canShowAsUrl: false,
				canShowAsCommand: true,
				canShowAsJson: false
			}
		}
	}

	// Parse command parts
	const parts = trimmed.split(/\s+/).filter((p) => p.length > 0)
	const [baseCommand, ...args] = parts

	if (!baseCommand) {
		errors.push('Command must specify a program to run')
		return {
			isValid: false,
			errors,
			warnings,
			formatCompatibility: {
				canShowAsUrl: false,
				canShowAsCommand: false,
				canShowAsJson: false
			}
		}
	}

	// Security validation
	if (DANGEROUS_COMMANDS.includes(baseCommand as (typeof DANGEROUS_COMMANDS)[number])) {
		errors.push(`Dangerous command not allowed: ${baseCommand}`)
	}

	// Argument limits
	if (args.length > 100) {
		errors.push('Too many arguments (max 100)')
	}

	for (const [index, arg] of args.entries()) {
		if (arg.length > 1000) {
			errors.push(`Argument ${index + 1} is too long (max 1000 characters)`)
		}
	}

	// Security warnings
	if (baseCommand.startsWith('sudo') || baseCommand.startsWith('doas')) {
		warnings.push('Running commands with elevated privileges is not recommended')
	}

	// Format compatibility analysis
	const canShowAsUrl = convertCommandToUrl(trimmed) !== null
	const canShowAsJson = convertCommandToJson(trimmed) !== null

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
		formatCompatibility: {
			canShowAsUrl,
			canShowAsCommand: true,
			canShowAsJson
		}
	}
}

/**
 * Validates JSON format for MCP server configuration
 * @param jsonString - JSON string to validate
 * @returns Validation result with errors and compatibility info
 */
export const validateJsonFormat = (jsonString: string): ValidationResult => {
	const errors: string[] = []
	const warnings: string[] = []
	const trimmed = jsonString.trim()

	if (!trimmed) {
		errors.push('JSON configuration is required')
		return {
			isValid: false,
			errors,
			warnings,
			formatCompatibility: {
				canShowAsUrl: false,
				canShowAsCommand: false,
				canShowAsJson: true
			}
		}
	}

	let parsed: unknown

	try {
		parsed = JSON.parse(trimmed)
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error'
		errors.push(`Invalid JSON: ${errorMessage}`)
		return {
			isValid: false,
			errors,
			warnings,
			formatCompatibility: {
				canShowAsUrl: false,
				canShowAsCommand: false,
				canShowAsJson: false
			}
		}
	}

	// Type validation
	if (typeof parsed !== 'object' || parsed === null) {
		errors.push('JSON must be an object')
		return {
			isValid: false,
			errors,
			warnings,
			formatCompatibility: {
				canShowAsUrl: false,
				canShowAsCommand: false,
				canShowAsJson: false
			}
		}
	}

	const obj = parsed as Record<string, unknown>

	// Claude Desktop format validation
	if ('mcpServers' in obj) {
		if (typeof obj.mcpServers !== 'object' || obj.mcpServers === null) {
			errors.push('mcpServers must be an object')
		} else {
			const serverNames = Object.keys(obj.mcpServers as Record<string, unknown>)
			if (serverNames.length === 0) {
				errors.push('At least one server must be defined in mcpServers')
			}

			// Validate each server configuration
			for (const [serverName, serverConfig] of Object.entries(obj.mcpServers as Record<string, unknown>)) {
				if (typeof serverConfig !== 'object' || serverConfig === null) {
					errors.push(`Server "${serverName}" configuration must be an object`)
					continue
				}

				const config = serverConfig as Record<string, unknown>
				if (!config.command || typeof config.command !== 'string') {
					errors.push(`Server "${serverName}" must have a command field`)
				}
			}
		}
	}
	// Direct format validation
	else if ('command' in parsed) {
		if (!parsed.command || typeof parsed.command !== 'string') {
			errors.push('Server configuration must have a command field')
		}
	} else {
		errors.push('JSON must contain either mcpServers object or command field')
	}

	// Security warnings
	const jsonStr = JSON.stringify(parsed).toLowerCase()
	const dangerousPatterns = ['password', 'secret', 'key', 'token']
	for (const pattern of dangerousPatterns) {
		if (jsonStr.includes(pattern)) {
			warnings.push('JSON appears to contain sensitive information')
			break
		}
	}

	// Format compatibility analysis
	const canShowAsCommand = convertJsonToCommand(trimmed) !== null
	const canShowAsUrl = convertJsonToUrl(trimmed) !== null

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
		formatCompatibility: {
			canShowAsUrl,
			canShowAsCommand,
			canShowAsJson: true
		}
	}
}

/**
 * Generic validation function that routes to appropriate validator
 * @param value - Value to validate
 * @param format - Format type
 * @returns Validation result
 */
export const validateFormat = (value: string, format: 'url' | 'command' | 'json'): ValidationResult => {
	switch (format) {
		case 'url':
			return validateUrlFormat(value)
		case 'command':
			return validateCommandFormat(value)
		case 'json':
			return validateJsonFormat(value)
		default: {
			throw new Error(`Unsupported format: ${format}`)
		}
	}
}

// Format conversion helper functions (simplified implementations)
export const convertUrlToCommand = (url: string): string | null => {
	try {
		const parsed = new URL(url)
		if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
			return `curl -X GET "${url}"`
		}
		return null
	} catch {
		return null
	}
}

export const convertUrlToJson = (url: string): string | null => {
	try {
		const parsed = new URL(url)
		if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
			return JSON.stringify(
				{
					mcpServers: {
						'remote-server': {
							command: 'curl',
							args: ['-X', 'GET', url]
						}
					}
				},
				null,
				2
			)
		}
		return null
	} catch {
		return null
	}
}

export const convertCommandToUrl = (command: string): string | null => {
	// Simple heuristic - if command contains curl with a URL
	const curlMatch = command.match(/curl\s+(?:['"]?)(https?:\/\/[^'"\s]+)/)
	if (curlMatch) {
		return curlMatch[1]
	}
	return null
}

export const convertCommandToJson = (command: string): string | null => {
	const parts = command.trim().split(/\s+/)
	if (parts.length > 0) {
		const [cmd, ...args] = parts
		return JSON.stringify(
			{
				command: cmd,
				args: args
			},
			null,
			2
		)
	}
	return null
}

export const convertJsonToCommand = (jsonString: string): string | null => {
	try {
		const parsed = JSON.parse(jsonString)
		if (typeof parsed === 'object' && parsed !== null) {
			const obj = parsed as Record<string, unknown>

			// Claude Desktop format
			if ('mcpServers' in obj) {
				const servers = obj.mcpServers as Record<string, unknown>
				const firstServer = Object.values(servers)[0] as Record<string, unknown>
				if (firstServer?.command && typeof firstServer.command === 'string') {
					const args = Array.isArray(firstServer.args) ? firstServer.args.join(' ') : ''
					return `${firstServer.command} ${args}`.trim()
				}
			}
			// Direct format
			else if ('command' in obj && typeof obj.command === 'string') {
				const args = Array.isArray(obj.args) ? obj.args.join(' ') : ''
				return `${obj.command} ${args}`.trim()
			}
		}
		return null
	} catch {
		return null
	}
}

export const convertJsonToUrl = (jsonString: string): string | null => {
	try {
		const parsed = JSON.parse(jsonString)
		if (typeof parsed === 'object' && parsed !== null) {
			const obj = parsed as Record<string, unknown>

			// Look for URL in curl command
			if ('command' in obj && obj.command === 'curl') {
				const args = Array.isArray(obj.args) ? obj.args : []
				for (const arg of args) {
					if (typeof arg === 'string' && (arg.startsWith('http://') || arg.startsWith('https://'))) {
						return arg
					}
				}
			}
		}
		return null
	} catch {
		return null
	}
}
