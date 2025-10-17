import type { Meta, StoryObj } from '@storybook/react'
import { SettingsProvider } from '../../providers/settings/SettingsProvider'
import { SettingsTab } from './SettingsTab'

const meta = {
  title: 'Views/SettingsTab',
  component: SettingsTab,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story, context) => {
      // Extract initial state from story args
      const { initialState, onTestMCPConnection, ...rest } = context.args

      return (
        <SettingsProvider
          initialState={initialState}
          onStateChange={(state) => console.log('Settings state changed:', state)}
        >
          <Story args={{ onTestMCPConnection }} />
        </SettingsProvider>
      )
    }
  ]
} satisfies Meta<typeof SettingsTab>

export default meta
type Story = StoryObj<typeof meta>

// Mock handler for external MCP connection testing
const mockTestConnection = async (id: string) => ({
  success: true,
  message: 'Connected successfully',
  latency: 150
})

export const Default: Story = {
  args: {
    onTestMCPConnection: mockTestConnection
  }
}

export const WithProviders: Story = {
  args: {
    onTestMCPConnection: mockTestConnection,
    initialState: {
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
      ]
    }
  }
}

export const WithMCPServers: Story = {
  args: {
    onTestMCPConnection: mockTestConnection,
    initialState: {
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
        defaultTimeout: 30000
      }
    }
  }
}

export const WithReactFeatures: Story = {
  args: {
    onTestMCPConnection: mockTestConnection,
    initialState: {
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
      }
    }
  }
}

export const FullyConfigured: Story = {
  args: {
    onTestMCPConnection: mockTestConnection,
    initialState: {
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
        defaultTimeout: 60000
      },
      uiState: {
        systemMessageExpanded: true,
        advancedExpanded: true,
        mcpServersExpanded: true,
        reactFeaturesExpanded: true
      },
      advancedSettings: {
        enableInternalLinkForAssistantMsg: false,
        answerDelayInMilliseconds: 2000,
        enableReplaceTag: true,
        enableExportToJSONL: true,
        enableTagSuggest: true
      }
    }
  }
}

export const WithExpandedSections: Story = {
  args: {
    onTestMCPConnection: mockTestConnection,
    initialState: {
      uiState: {
        systemMessageExpanded: true,
        advancedExpanded: true,
        mcpServersExpanded: true,
        reactFeaturesExpanded: true
      }
    }
  }
}

export const DarkTheme: Story = {
  args: {
    onTestMCPConnection: mockTestConnection
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
}

export const LightTheme: Story = {
  args: {
    onTestMCPConnection: mockTestConnection
  },
  parameters: {
    backgrounds: {
      default: 'light',
    },
  },
}