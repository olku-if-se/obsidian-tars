/**
 * DI-enabled Code Block Processor
 * Handles parsing and rendering of MCP tool invocation code blocks with full dependency injection
 */

import { injectable, inject } from '@needle-di/core'
import type { ErrorInfo, MCPServerConfig, ToolExecutionResult } from '@tars/mcp-hosting'
import { logError, YAMLParseError } from '@tars/mcp-hosting'
import { parse as parseYAML } from 'yaml'
import { renderToolResultToDOM } from './toolResultFormatter'
import type {
	ILoggingService,
	ICodeBlockProcessor,
	LoggingServiceToken,
	ServerConfigManagerToken
} from '@tars/contracts'

// Local interface for tool invocation (not exported from mcp-hosting)
interface ToolInvocation {
	serverId: string
	toolName: string
	parameters: Record<string, unknown>
}

/**
 * DI-enabled CodeBlockProcessor implementation
 * Fully migrated to dependency injection with no legacy fallback
 */
@injectable()
export class CodeBlockProcessor implements ICodeBlockProcessor {
	constructor(
		private loggingService = inject(LoggingServiceToken),
		private serverConfigManager = inject(ServerConfigManagerToken)
	) {}

	/**
	 * Process a code block containing MCP tool invocation
	 * Implementation of interface method
	 */
	async processCodeBlock(serverName: string, content: string): Promise<string> {
		const invocation = this.parseToolInvocation(content, serverName)
		if (!invocation) {
			return 'Invalid tool invocation format'
		}

		// This would integrate with ToolExecutor - for now return formatted result
		return `Tool "${invocation.toolName}" parsed successfully with ${Object.keys(invocation.parameters).length} parameters`
	}

	/**
	 * Render tool execution results in markdown format
	 * Implementation of interface method
	 */
	renderResults(results: unknown, metadata?: Record<string, unknown>): string {
		if (typeof results === 'object' && results !== null) {
			return JSON.stringify(results, null, 2)
		}
		return String(results)
	}

	/**
	 * Validate tool invocation syntax
	 * Implementation of interface method
	 */
	validateInvocation(content: string): boolean {
		return this.parseToolInvocation(content, 'test') !== null
	}

	/**
	 * Extract tool name and arguments from code block content
	 * Implementation of base interface method
	 */
	parseToolInvocation(content: string): { toolName: string; arguments: Record<string, unknown> } | null {
		const invocation = this.parseToolInvocationExtended(content, 'dummy')
		if (!invocation) {
			return null
		}

		return {
			toolName: invocation.toolName,
			arguments: invocation.parameters
		}
	}

	/**
	 * Parse code block content to extract tool invocation
	 * Enhanced version with DI logging service integration
	 */
	parseToolInvocationExtended(
		source: string,
		language: string
	): { serverId: string; toolName: string; parameters: Record<string, unknown> } | null {
		try {
			// Check if language matches a server name
			const serverConfig = this.serverConfigManager.getServerByName(language)
			if (!serverConfig) {
				this.loggingService.debug(`No server configuration found for language: ${language}`)
				return null // Not an MCP code block
			}

			const lines = source.trim().split('\n')
			if (lines.length === 0) {
				return null
			}

			// Find tool line (format: tool: tool_name)
			const toolLine = lines.find((line) => line.trim().startsWith('tool:'))
			if (!toolLine) {
				return null
			}

			const toolMatch = toolLine.trim().match(/^tool:\s*(.+)$/)
			if (!toolMatch) {
				return null
			}

			const toolName = toolMatch[1].trim()

			// Parse remaining lines as YAML parameters
			const yamlLines = lines.filter((line) => !line.trim().startsWith('tool:'))
			const parameters = this.parseYAMLParameters(yamlLines)

			this.loggingService.debug(`Parsed tool invocation`, {
				serverId: serverConfig.id,
				toolName,
				parameterCount: Object.keys(parameters).length
			})

			return {
				serverId: serverConfig.id,
				toolName,
				parameters
			}
		} catch (error) {
			this.loggingService.error('Failed to parse tool invocation', { error, source, language })
			logError('Failed to parse tool invocation', error)
			return null
		}
	}

	/**
	 * Render tool execution result in code block element
	 * Enhanced with DI logging service integration
	 */
	renderResult(
		el: HTMLElement,
		result: ToolExecutionResult,
		options: {
			collapsible?: boolean
			showMetadata?: boolean
		} = {}
	): void {
		this.loggingService.debug('Rendering tool result', {
			contentType: result.contentType,
			executionDuration: result.executionDuration,
			cached: result.cached
		})

		// Use shared formatter for consistent rendering
		renderToolResultToDOM(el, result, {
			collapsible: options.collapsible,
			showMetadata: options.showMetadata
		})
	}

	/**
	 * Render error state in code block element
	 * Enhanced with DI logging service integration
	 */
	renderError(el: HTMLElement, error: ErrorInfo): void {
		this.loggingService.error('Rendering tool error', {
			message: error.message,
			timestamp: error.timestamp
		})

		el.empty()

		const container = el.createDiv({ cls: 'mcp-tool-error' })

		// Error header
		const header = container.createDiv({ cls: 'mcp-error-header' })
		header.createSpan({
			text: '❌ Tool Execution Failed',
			cls: 'mcp-error-title'
		})

		// Error message
		const message = container.createDiv({ cls: 'mcp-error-message' })
		message.textContent = error.message

		// Error details (if available)
		if (error.details) {
			const details = container.createDiv({ cls: 'mcp-error-details' })
			details.createEl('pre').textContent = JSON.stringify(error.details, null, 2)
		}

		// Timestamp
		const timestamp = container.createDiv({ cls: 'mcp-error-timestamp' })
		timestamp.textContent = `Error occurred at ${new Date(error.timestamp).toLocaleString()}`
	}

	/**
	 * Render pending/executing state in code block element
	 * Enhanced with DI logging service integration
	 */
	renderStatus(el: HTMLElement, status: 'pending' | 'executing', onCancel?: () => void): void {
		this.loggingService.debug(`Rendering tool status: ${status}`)

		el.empty()

		const container = el.createDiv({ cls: 'mcp-tool-status' })

		const indicator = status === 'pending' ? '⏳' : '⚙️'
		const message = status === 'pending' ? 'Tool execution queued...' : 'Executing tool...'

		container.createSpan({
			text: `${indicator} ${message}`,
			cls: 'mcp-status-indicator'
		})

		// Add cancel button for executing tools
		if (status === 'executing' && onCancel) {
			const cancelButton = container.createEl('button', {
				text: 'Cancel',
				cls: 'mcp-cancel-button'
			})
			cancelButton.addEventListener('click', (event) => {
				event.preventDefault()
				event.stopPropagation()
				this.loggingService.debug('Tool execution cancelled by user')
				onCancel()
			})
		}
	}

	/**
	 * Parse YAML parameters from code block lines
	 * Enhanced with DI logging service integration
	 */
	parseYAMLParameters(lines: string[]): Record<string, unknown> {
		if (lines.length === 0) {
			return {}
		}

		const source = lines.join('\n')

		try {
			const parsed = parseYAML(source)
			if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
				this.loggingService.debug('YAML parameters parsed successfully', {
					parameterCount: Object.keys(parsed).length
				})
				return parsed as Record<string, unknown>
			}
			if (parsed === null || parsed === undefined) {
				return {}
			}
			this.loggingService.debug('Unexpected YAML root type for tool parameters, falling back', {
				rootType: typeof parsed
			})
		} catch (yamlError) {
			this.loggingService.debug('YAML parsing failed for tool parameters, falling back to manual parser', { yamlError })
		}

		// Fallback: simple key-value parser (legacy behaviour)
		try {
			const params: Record<string, unknown> = {}
			let currentKey = ''
			let currentValue: string[] = []

			for (const line of lines) {
				const trimmed = line.trim()
				if (trimmed === '') {
					continue
				}

				const keyValueMatch = trimmed.match(/^([^:]+):\s*(.*)$/)
				const leadingWhitespace = line.match(/^\s*/)?.[0]?.length ?? 0
				const isRootLevel = leadingWhitespace === 0

				if (keyValueMatch && isRootLevel) {
					if (currentKey) {
						params[currentKey] = this.parseYAMLValue(currentValue.join('\n'))
					}

					currentKey = keyValueMatch[1].trim()
					currentValue = [keyValueMatch[2].trim()]
				} else {
					currentValue.push(trimmed)
				}
			}

			if (currentKey) {
				params[currentKey] = this.parseYAMLValue(currentValue.join('\n'))
			}

			this.loggingService.debug('Manual YAML parameter parsing completed', {
				parameterCount: Object.keys(params).length
			})

			return params
		} catch (error) {
			this.loggingService.error('Manual YAML parsing failed', { error, lines })
			throw new YAMLParseError(undefined, error instanceof Error ? error.message : String(error))
		}
	}

	/**
	 * Parse individual YAML value
	 * Enhanced with DI logging service integration for complex cases
	 */
	private parseYAMLValue(value: string): unknown {
		const trimmed = value.trim()

		// Handle empty/null values
		if (trimmed === '' || trimmed === 'null') {
			return null
		}

		// Handle boolean values
		if (trimmed === 'true') return true
		if (trimmed === 'false') return false

		// Handle numeric values
		if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
			return parseFloat(trimmed)
		}

		// Handle JSON-like arrays/objects (e.g., [] or {})
		if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
			try {
				const parsed = JSON.parse(trimmed)
				this.loggingService.debug('Parsed JSON-like parameter value', {
					valueType: Array.isArray(parsed) ? 'array' : 'object'
				})
				return parsed
			} catch (error) {
				this.loggingService.debug('Failed to parse JSON-like parameter value', { value, error })
			}
		}

		// Handle quoted strings (remove quotes)
		if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
			return trimmed.slice(1, -1)
		}

		// Default to string
		return trimmed
	}

	/**
	 * Get server configuration by name
	 * Uses DI server config manager for consistency
	 */
	getServerByName(serverName: string): MCPServerConfig | undefined {
		return this.serverConfigManager.getServerByName(serverName)
	}
}
