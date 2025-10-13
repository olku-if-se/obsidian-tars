/**
 * Display mode utilities for MCP server configuration
 */

// Local type definition
type ConfigDisplayMode = 'simple' | 'command'

export const CommandDisplayMode = {
	Simple: 'simple' as ConfigDisplayMode,
	Command: 'command' as ConfigDisplayMode
} as const

export type CommandDisplayModeValue = (typeof CommandDisplayMode)[keyof typeof CommandDisplayMode]

export type ConversionFormat = 'json' | 'url' | 'shell'

export interface ConversionCapability {
	canShowAsJson: boolean
	canShowAsUrl: boolean
	canShowAsShell: boolean
	currentFormat: ConversionFormat
	mcpRemoteCompatible: boolean
}

/**
 * Convert a remote URL to a shell command using mcp-remote
 */
export function remoteUrlToCommand(url: string): string {
	const trimmedUrl = url.trim()
	return `npx -y mcp-remote ${trimmedUrl}`
}

/**
 * Extract a remote URL from a shell command
 */
export function commandToRemoteUrl(command: string): string | null {
	const trimmedCommand = command.trim()

	// Match patterns like:
	// - npx -y mcp-remote https://example.com
	// - npx mcp-remote https://example.com
	// - npx    -y\tmcp-remote    https://example.com
	const match = trimmedCommand.match(/npx\s+(?:-y\s+)?mcp-remote\s+(\S+)/i)
	if (match) {
		return match[1]
	}

	return null
}

/**
 * Normalize display mode value to a valid enum value
 */
export function normalizeDisplayMode(value?: unknown): CommandDisplayModeValue {
	if (typeof value === 'string') {
		const lowerValue = value.toLowerCase()
		if (lowerValue === CommandDisplayMode.Simple) {
			return CommandDisplayMode.Simple
		}
		if (lowerValue === CommandDisplayMode.Command) {
			return CommandDisplayMode.Command
		}
	}

	return CommandDisplayMode.Command
}

/**
 * Check if a value is a valid remote URL
 */
export function isValidRemoteUrl(value: string): boolean {
	try {
		const parsed = new URL(value.trim())
		return parsed.protocol === 'http:' || parsed.protocol === 'https:'
	} catch (_error) {
		return false
	}
}

/**
 * Detect conversion capabilities for a given configuration
 */
export function detectConversionCapability(config: { configInput?: string }): {
	canShowAsJson: boolean
	canShowAsUrl: boolean
	canShowAsShell: boolean
	currentFormat: 'json' | 'url' | 'shell'
	mcpRemoteCompatible: boolean
} {
	const configInput = config.configInput || ''

	// Check if it's a URL
	if (configInput.startsWith('http://') || configInput.startsWith('https://')) {
		return {
			canShowAsJson: false,
			canShowAsUrl: true,
			canShowAsShell: true,
			currentFormat: 'url',
			mcpRemoteCompatible: true
		}
	}

	// Check if it's JSON
	try {
		const parsed = JSON.parse(configInput)
		const isJson = typeof parsed === 'object' && parsed !== null

		if (isJson) {
			// Check if it's an mcp-remote command
			const hasRemoteCommand =
				(parsed.command === 'npx' && parsed.args?.includes('mcp-remote')) ||
				(typeof parsed.command === 'string' && parsed.command.includes('mcp-remote'))

			return {
				canShowAsJson: true,
				canShowAsUrl: hasRemoteCommand,
				canShowAsShell: true,
				currentFormat: 'json',
				mcpRemoteCompatible: hasRemoteCommand
			}
		}
	} catch {
		// Not JSON, continue to shell check
	}

	// Check if it's a shell command with mcp-remote
	const isRemoteCommand = commandToRemoteUrl(configInput) !== null

	return {
		canShowAsJson: !!configInput, // Valid shell commands can be shown as JSON
		canShowAsUrl: isRemoteCommand,
		canShowAsShell: true,
		currentFormat: 'shell',
		mcpRemoteCompatible: isRemoteCommand
	}
}
