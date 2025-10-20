/**
 * DI-enabled Server Configuration Manager
 * Manages MCP server configurations with dependency injection
 */

import { injectable, inject } from '@needle-di/core'
import type { MCPServerConfig } from '@tars/mcp-hosting'
import type { IServerConfigManager, ILoggingService, LoggingServiceToken } from '@tars/contracts'

/**
 * DI-enabled implementation of server configuration manager
 */
@injectable()
export class ServerConfigManager implements IServerConfigManager {
	private serverConfigs: MCPServerConfig[] = []

	constructor(
		private loggingService = inject(LoggingServiceToken)
	) {}

	/**
	 * Get current server configurations
	 */
	getServerConfigs(): MCPServerConfig[] {
		this.loggingService.debug('Retrieving server configurations', {
			count: this.serverConfigs.length
		})
		return [...this.serverConfigs] // Return copy to prevent mutation
	}

	/**
	 * Get server configuration by name
	 */
	getServerByName(serverName: string): MCPServerConfig | undefined {
		const config = this.serverConfigs.find((config) => config.name === serverName)
		this.loggingService.debug(`Looking up server by name: ${serverName}`, {
			found: !!config
		})
		return config
	}

	/**
	 * Update server configurations
	 */
	updateServerConfigs(configs: MCPServerConfig[]): void {
		this.loggingService.info('Updating server configurations', {
			oldCount: this.serverConfigs.length,
			newCount: configs.length
		})

		this.serverConfigs = [...configs] // Store copy to prevent mutation

		// Log enabled servers for debugging
		const enabledServers = configs.filter(config => config.enabled)
		this.loggingService.debug('Server configurations updated', {
			enabledCount: enabledServers.length,
			enabledServers: enabledServers.map(config => config.name)
		})
	}

	/**
	 * Get server configuration by ID
	 */
	getServerById(serverId: string): MCPServerConfig | undefined {
		const config = this.serverConfigs.find((config) => config.id === serverId)
		this.loggingService.debug(`Looking up server by ID: ${serverId}`, {
			found: !!config
		})
		return config
	}

	/**
	 * Get enabled server configurations only
	 */
	getEnabledServers(): MCPServerConfig[] {
		const enabledServers = this.serverConfigs.filter(config => config.enabled)
		this.loggingService.debug('Retrieving enabled servers', {
			enabledCount: enabledServers.length,
			totalCount: this.serverConfigs.length
		})
		return enabledServers
	}

	/**
	 * Validate server configuration
	 */
	validateConfig(config: MCPServerConfig): boolean {
		const errors: string[] = []

		if (!config.id || config.id.trim() === '') {
			errors.push('Server ID is required')
		}

		if (!config.name || config.name.trim() === '') {
			errors.push('Server name is required')
		}

		if (!config.deploymentType || !['managed', 'external'].includes(config.deploymentType)) {
			errors.push('Invalid deployment type')
		}

		if (!config.transport || !['stdio', 'sse'].includes(config.transport)) {
			errors.push('Invalid transport type')
		}

		const isValid = errors.length === 0

		if (!isValid) {
			this.loggingService.warn('Invalid server configuration', {
				serverName: config.name,
				errors
			})
		} else {
			this.loggingService.debug('Server configuration validation passed', {
				serverName: config.name
			})
		}

		return isValid
	}

	/**
	 * Add a new server configuration
	 */
	addServerConfig(config: MCPServerConfig): boolean {
		if (!this.validateConfig(config)) {
			return false
		}

		// Check for duplicates
		const existingById = this.getServerById(config.id)
		const existingByName = this.getServerByName(config.name)

		if (existingById) {
			this.loggingService.warn('Server configuration with ID already exists', {
				serverId: config.id,
				existingName: existingById.name
			})
			return false
		}

		if (existingByName) {
			this.loggingService.warn('Server configuration with name already exists', {
				serverName: config.name,
				existingId: existingByName.id
			})
			return false
		}

		this.serverConfigs.push(config)
		this.loggingService.info('Added new server configuration', {
			serverId: config.id,
			serverName: config.name
		})

		return true
	}

	/**
	 * Remove a server configuration by ID
	 */
	removeServerConfig(serverId: string): boolean {
		const initialLength = this.serverConfigs.length
		this.serverConfigs = this.serverConfigs.filter(config => config.id !== serverId)
		const wasRemoved = this.serverConfigs.length < initialLength

		if (wasRemoved) {
			this.loggingService.info('Removed server configuration', { serverId })
		} else {
			this.loggingService.warn('Server configuration not found for removal', { serverId })
		}

		return wasRemoved
	}

	/**
	 * Enable or disable a server configuration
	 */
	setServerEnabled(serverId: string, enabled: boolean): boolean {
		const config = this.getServerById(serverId)
		if (!config) {
			this.loggingService.warn('Server configuration not found for enable/disable', {
				serverId
			})
			return false
		}

		const wasEnabled = config.enabled
		config.enabled = enabled

		this.loggingService.info(`${enabled ? 'Enabled' : 'Disabled'} server configuration`, {
			serverId,
			serverName: config.name,
			wasEnabled
		})

		return true
	}
}