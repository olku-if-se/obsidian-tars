import { createPlugin } from '@tars/core'
import { createPluginLogger } from '@tars/shared'
import type { MCPCommand, MCPServer } from '@tars/types'
import { MCPClient } from '../client'
import { MCPServerImpl } from '../server'

const cliLogger = createPluginLogger('tars-mcp-cli')

export interface DemoCliOptions {
  serverName?: string
}

export async function runMcpCliDemo(options: DemoCliOptions = {}): Promise<{
  client: MCPClient
  server: MCPServer
}> {
  const plugin = createPlugin('mcp-cli-demo')
  cliLogger.info('Starting MCP CLI demo for plugin', plugin.name)

  const server = new MCPServerImpl({
    name: options.serverName ?? 'demo',
    port: 4000,
    host: '127.0.0.1',
  })
  await server.start()

  const client = new MCPClient()
  await client.connect(server.getServerInfo())

  const demoCommand: MCPCommand = {
    name: 'demo.echo',
    description: 'Echo a payload back to the caller',
    handler: async params => {
      cliLogger.debug('Echo handler invoked', params)
      return params
    },
  }

  await server.registerCommand(demoCommand)
  cliLogger.info('Registered demo command', demoCommand.name)

  return {
    client,
    server: server.getServerInfo(),
  }
}
