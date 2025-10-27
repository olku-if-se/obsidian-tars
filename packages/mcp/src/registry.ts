/**
 * MCP registry functionality
 */

import type { MCPCommand, MCPServer } from '@tars/types'
import { MCPServerImpl, type MCPServerOptions } from './server'

export interface MCPServerConfig extends MCPServerOptions {
  id?: string
  autoStart?: boolean
}

export class MCPRegistry {
  private servers: Map<string, MCPServerImpl> = new Map()
  private commands: Map<string, MCPCommand> = new Map()

  async registerServer(config: MCPServerConfig): Promise<string> {
    const serverId = config.id || Date.now().toString()

    if (this.servers.has(serverId)) {
      throw new Error(`MCP server with ID ${serverId} already exists`)
    }

    const server = new MCPServerImpl(config)
    this.servers.set(serverId, server)

    if (config.autoStart) {
      await server.start()
    }

    console.log(`Registered MCP server: ${config.name} with ID: ${serverId}`)
    return serverId
  }

  async unregisterServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId)
    if (!server) {
      throw new Error(`MCP server with ID ${serverId} not found`)
    }

    if (server.isServerRunning()) {
      await server.stop()
    }

    this.servers.delete(serverId)
    console.log(`Unregistered MCP server with ID: ${serverId}`)
  }

  getServer(serverId: string): MCPServerImpl | undefined {
    return this.servers.get(serverId)
  }

  getAllServers(): MCPServer[] {
    return Array.from(this.servers.values()).map(server =>
      server.getServerInfo()
    )
  }

  getOnlineServers(): MCPServer[] {
    return this.getAllServers().filter(server => server.status === 'online')
  }

  async startServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId)
    if (!server) {
      throw new Error(`MCP server with ID ${serverId} not found`)
    }

    await server.start()
  }

  async stopServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId)
    if (!server) {
      throw new Error(`MCP server with ID ${serverId} not found`)
    }

    await server.stop()
  }

  async startAllServers(): Promise<void> {
    const startPromises = Array.from(this.servers.values()).map(server =>
      server.start()
    )
    await Promise.all(startPromises)
    console.log('All MCP servers started')
  }

  async stopAllServers(): Promise<void> {
    const stopPromises = Array.from(this.servers.values()).map(server =>
      server.stop()
    )
    await Promise.all(stopPromises)
    console.log('All MCP servers stopped')
  }

  registerCommand(command: MCPCommand): void {
    this.commands.set(command.name, command)
    console.log(`Registered MCP command: ${command.name}`)
  }

  unregisterCommand(commandName: string): void {
    if (this.commands.delete(commandName)) {
      console.log(`Unregistered MCP command: ${commandName}`)
    }
  }

  getCommand(commandName: string): MCPCommand | undefined {
    return this.commands.get(commandName)
  }

  getAllCommands(): MCPCommand[] {
    return Array.from(this.commands.values())
  }

  getRegistryStats(): {
    totalServers: number
    onlineServers: number
    offlineServers: number
    totalCommands: number
  } {
    const servers = this.getAllServers()
    const onlineServers = servers.filter(s => s.status === 'online').length
    const offlineServers = servers.filter(s => s.status === 'offline').length

    return {
      totalServers: servers.length,
      onlineServers,
      offlineServers,
      totalCommands: this.commands.size,
    }
  }
}
