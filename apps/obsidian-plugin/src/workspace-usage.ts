import { createPlugin } from '@tars/core'
import { MCPClient } from '@tars/mcp'
import { OpenAIVendor } from '@tars/providers'
import { createPluginLogger, summarizeMessage } from '@tars/shared'
import { createTestResponse, TEST_UTILS } from '@tars/testing'
import type { Message } from '@tars/types'

const workspaceLogger = createPluginLogger('tars-workspace-usage')

export function ensureWorkspacePackageUsage(): void {
  const placeholderMessage: Message = {
    role: 'system',
    content: 'Workspace dependency check bootstrap',
  }

  const pluginStub = createPlugin('workspace-usage-stub')
  const mcpClient = new MCPClient()
  const vendor = new OpenAIVendor()
  const summary = summarizeMessage(placeholderMessage)
  const testResponse = createTestResponse(placeholderMessage)

  workspaceLogger.debug('Workspace package usage placeholder', {
    summary,
    vendor: vendor.name,
    plugin: pluginStub.name,
    testingVersion: TEST_UTILS.version,
    mcpConnected: mcpClient.getConnectionStatus(),
    testResponse: testResponse.content,
  })
}
