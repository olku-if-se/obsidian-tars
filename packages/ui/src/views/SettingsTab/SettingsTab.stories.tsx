import type { Meta, StoryObj } from '@storybook/react'
import { SettingsTab } from './SettingsTab'

const meta = {
  title: 'Views/SettingsTab',
  component: SettingsTab,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SettingsTab>

export default meta
type Story = StoryObj<typeof meta>

// Mock handlers for all new features
const mockHandlers = {
  // Provider handlers
  onAddProvider: (vendor: string) => console.log('Add provider:', vendor),
  onUpdateProvider: (id: string, updates: any) => console.log('Update provider:', id, updates),
  onRemoveProvider: (id: string) => console.log('Remove provider:', id),
  // Message tags handlers
  onMessageTagsChange: (tags: any) => console.log('Message tags changed:', tags),
  // System message handlers
  onSystemMessageChange: (enabled: boolean, message: string) => console.log('System message changed:', enabled, message),
  // Basic settings handlers
  onBasicSettingsChange: (settings: any) => console.log('Basic settings changed:', settings),
  // Section toggle handlers
  onToggleSection: (section: string, open: boolean) => console.log('Section toggled:', section, open),
  // MCP server handlers
  onAddMCPServer: () => console.log('Add MCP server'),
  onRemoveMCPServer: (id: string) => console.log('Remove MCP server:', id),
  onUpdateMCPServer: (id: string, updates: any) => console.log('Update MCP server:', id, updates),
  onToggleMCPServer: (id: string, enabled: boolean) => console.log('Toggle MCP server:', id, enabled),
  onTestMCPConnection: async (id: string) => ({ success: true, message: 'Connected successfully', latency: 150 }),
  onUpdateGlobalLimits: (limits: any) => console.log('Update global limits:', limits),
  // React features handlers
  onToggleReactFeature: (feature: string, enabled: boolean) => console.log('Toggle React feature:', feature, enabled),
  onEnableAllReactFeatures: () => console.log('Enable all React features'),
  onDisableAllReactFeatures: () => console.log('Disable all React features'),
  // Advanced settings handlers
  onToggleInternalLinkForAssistant: (enabled: boolean) => console.log('Toggle internal links for assistant:', enabled),
  onDelayChange: (delay: number) => console.log('Delay changed:', delay),
  onToggleReplaceTag: (enabled: boolean) => console.log('Toggle replace tag:', enabled),
  onToggleExportToJSONL: (enabled: boolean) => console.log('Toggle export to JSONL:', enabled),
  onToggleTagSuggest: (enabled: boolean) => console.log('Toggle tag suggest:', enabled)
}

export const Default: Story = {
  args: {
    ...mockHandlers
  }
}

export const WithProviders: Story = {
  args: {
    providers: [
      {
        id: 'openai-provider',
        name: 'OpenAI',
        tag: 'GPT',
        model: 'gpt-4',
        apiKey: 'sk-...key',
        capabilities: ['Text Generation', 'Tool Calling']
      },
      {
        id: 'claude-provider',
        name: 'Claude',
        tag: 'Claude',
        model: 'claude-3-5-sonnet-20241022',
        apiKey: 'sk-ant-...key',
        capabilities: ['Text Generation', 'Tool Calling', 'Thinking']
      }
    ],
    ...mockHandlers
  }
}

export const WithMCPServers: Story = {
  args: {
    providers: [
      {
        id: 'openai-provider',
        name: 'OpenAI',
        tag: 'GPT',
        model: 'gpt-4',
        apiKey: 'sk-...key',
        capabilities: ['Text Generation']
      }
    ],
    mcpServers: [
      {
        id: 'filesystem',
        name: 'Filesystem Access',
        enabled: true,
        deploymentType: 'managed',
        transport: 'stdio',
        dockerConfig: {
          image: 'mcp/filesystem',
          name: 'tars-filesystem-server'
        }
      },
      {
        id: 'web-search',
        name: 'Web Search',
        enabled: false,
        deploymentType: 'external',
        transport: 'sse',
        sseConfig: {
          url: 'https://api.example.com/mcp/sse'
        }
      }
    ],
    globalLimits: {
      concurrentExecutions: 5,
      sessionLimitPerDocument: 50,
      defaultTimeout: 30
    },
    ...mockHandlers
  }
}

export const WithReactFeatures: Story = {
  args: {
    providers: [
      {
        id: 'openai-provider',
        name: 'OpenAI',
        tag: 'GPT',
        model: 'gpt-4',
        apiKey: 'sk-...key',
        capabilities: ['Text Generation']
      }
    ],
    reactFeatures: {
      reactSettingsTab: true,
      reactStatusBar: false,
      reactModals: true,
      reactMcpUI: false
    },
    ...mockHandlers
  }
}

export const FullyConfigured: Story = {
  args: {
    providers: [
      {
        id: 'openai-provider',
        name: 'OpenAI',
        tag: 'GPT',
        model: 'gpt-4',
        apiKey: 'sk-...key',
        capabilities: ['Text Generation', 'Tool Calling']
      },
      {
        id: 'claude-provider',
        name: 'Claude',
        tag: 'Claude',
        model: 'claude-3-5-sonnet-20241022',
        apiKey: 'sk-ant-...key',
        capabilities: ['Text Generation', 'Tool Calling', 'Thinking']
      }
    ],
    mcpServers: [
      {
        id: 'filesystem',
        name: 'Filesystem Access',
        enabled: true,
        deploymentType: 'managed',
        transport: 'stdio',
        dockerConfig: {
          image: 'mcp/filesystem',
          name: 'tars-filesystem-server'
        }
      },
      {
        id: 'database',
        name: 'Database Query',
        enabled: true,
        deploymentType: 'managed',
        transport: 'stdio',
        dockerConfig: {
          image: 'mcp/postgres',
          name: 'tars-db-server'
        }
      }
    ],
    reactFeatures: {
      reactSettingsTab: true,
      reactStatusBar: true,
      reactModals: true,
      reactMcpUI: true
    },
    globalLimits: {
      concurrentExecutions: 10,
      sessionLimitPerDocument: 100,
      defaultTimeout: 60
    },
    systemMessageExpanded: true,
    advancedExpanded: true,
    mcpServersExpanded: true,
    reactFeaturesExpanded: true,
    ...mockHandlers,
    // Advanced settings props
    enableInternalLinkForAssistantMsg: false,
    answerDelayInMilliseconds: 2000,
    enableReplaceTag: true,
    enableExportToJSONL: true,
    enableTagSuggest: true
  }
}

export const WithExpandedSections: Story = {
  render: () => (
    <div>
      <style>{`
        details {
          open: true;
        }
      `}</style>
      <SettingsTab />
    </div>
  ),
}

export const DarkTheme: Story = {
  args: {},
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
}

export const LightTheme: Story = {
  args: {},
  parameters: {
    backgrounds: {
      default: 'light',
    },
  },
}