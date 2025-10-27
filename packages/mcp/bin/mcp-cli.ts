#!/usr/bin/env node
import { runMcpCliDemo } from '../src/cli/mcp-cli'

async function main() {
  const result = await runMcpCliDemo({ serverName: 'workspace-mcp' })
  console.log('[tars/mcp] Demo server bootstrap complete:', {
    server: result.server,
    clientConnected: result.client.getConnectionStatus(),
  })
}

void main()
