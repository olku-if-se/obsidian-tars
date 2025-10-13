import type { MCPServerManager, ToolServerInfo } from '@tars/mcp-hosting'

export async function buildToolServerMapping(manager: MCPServerManager): Promise<Map<string, ToolServerInfo>> {
	const cache = manager.getToolDiscoveryCache()
	return cache.getToolMapping()
}
