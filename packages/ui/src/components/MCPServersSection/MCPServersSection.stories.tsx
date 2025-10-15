import type { Meta, StoryObj } from '@storybook/react'
import { MCPServersSection } from './MCPServersSection'
import type { MCPServerConfig } from './MCPServersSection'

const meta = {
  title: 'Settings/MCPServersSection',
  component: MCPServersSection,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MCPServersSection>

export default meta
type Story = StoryObj<typeof meta>

// Shared fixtures
const defaultValidationState: MCPServerConfig['validationState'] = {
  isValid: true,
  errors: [],
  warnings: []
}

const managedServerBase: Pick<MCPServerConfig, 'configInput' | 'displayMode' | 'validationState' | 'failureCount' | 'autoDisabled' | 'retryPolicy' | 'timeout'> = {
  configInput: 'npx @modelcontextprotocol/server-filesystem /vault',
  displayMode: 'command',
  validationState: defaultValidationState,
  failureCount: 0,
  autoDisabled: false,
  retryPolicy: {
    maxRetries: 3,
    backoffMs: 1000
  },
  timeout: 30
}

const externalServerBase: Pick<MCPServerConfig, 'configInput' | 'displayMode' | 'validationState' | 'failureCount' | 'autoDisabled' | 'timeout'> = {
  configInput: 'https://api.example.com/mcp',
  displayMode: 'url',
  validationState: defaultValidationState,
  failureCount: 0,
  autoDisabled: false,
  timeout: 45
}

// Mock handlers
const mockHandlers = {
  onAddServer: () => console.log('Add server clicked'),
  onRemoveServer: (id: string) => console.log('Remove server:', id),
  onUpdateServer: (id: string, updates: any) => console.log('Update server:', id, updates),
  onToggleServer: (id: string, enabled: boolean) => console.log('Toggle server:', id, enabled),
  onTestConnection: async (id: string) => ({ success: true, message: 'Connected successfully', latency: 150 }),
  onToggleSection: (open: boolean) => console.log('Section toggled:', open),
  onUpdateGlobalLimits: (limits: any) => console.log('Update global limits:', limits)
}

export const Empty: Story = {
  args: {
    servers: [],
    globalLimits: {
      concurrentExecutions: 5,
      sessionLimitPerDocument: 50,
      defaultTimeout: 30000,
      parallelExecutionEnabled: false,
      llmUtilityEnabled: false,
      maxParallelTools: 3
    },
    expanded: true,
    ...mockHandlers
  }
}

export const WithServers: Story = {
  args: {
    servers: [
      {
        id: 'filesystem',
        name: 'Filesystem Access',
        enabled: true,
        ...managedServerBase,
        deploymentType: 'managed',
        transport: 'stdio',
        dockerConfig: {
          image: 'mcp/filesystem',
          name: 'tars-filesystem-server',
          env: {
            'ALLOWED_DIRECTORIES': '/Users/username/Documents'
          }
        }
      },
      {
        id: 'web-search',
        name: 'Web Search',
        enabled: false,
        ...externalServerBase,
        deploymentType: 'external',
        transport: 'sse',
        sseConfig: {
          url: 'https://api.example.com/mcp/sse'
        }
      }
    ],
    globalLimits: {
      concurrentExecutions: 3,
      sessionLimitPerDocument: 25,
      defaultTimeout: 45000,
      parallelExecutionEnabled: false,
      llmUtilityEnabled: false,
      maxParallelTools: 3
    },
    expanded: true,
    selectedServerId: 'filesystem',
    ...mockHandlers
  }
}

export const ManyServers: Story = {
  args: {
    servers: [
      {
        id: 'filesystem',
        name: 'Filesystem Access',
        enabled: true,
        ...managedServerBase,
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
        enabled: true,
        ...externalServerBase,
        deploymentType: 'external',
        transport: 'sse',
        sseConfig: {
          url: 'https://api.example.com/mcp/sse'
        }
      },
      {
        id: 'database',
        name: 'Database Query',
        enabled: false,
        ...managedServerBase,
        deploymentType: 'managed',
        transport: 'stdio',
        dockerConfig: {
          image: 'mcp/postgres',
          name: 'tars-db-server',
          env: {
            'DATABASE_URL': 'postgresql://localhost:5432/mydb'
          }
        }
      },
      {
        id: 'git',
        name: 'Git Operations',
        enabled: true,
        ...managedServerBase,
        deploymentType: 'external',
        transport: 'stdio',
        dockerConfig: {
          image: 'mcp/git',
          name: 'tars-git-server'
        }
      }
    ],
    globalLimits: {
      concurrentExecutions: 10,
      sessionLimitPerDocument: 100,
      defaultTimeout: 60000,
      parallelExecutionEnabled: true,
      llmUtilityEnabled: true,
      maxParallelTools: 5
    },
    expanded: true,
    ...mockHandlers
  }
}

export const SelectedServer: Story = {
  args: {
    ...WithServers.args,
    selectedServerId: 'web-search'
  }
}

export const CustomLimits: Story = {
  args: {
    servers: [
      {
        id: 'filesystem',
        name: 'Filesystem Access',
        enabled: true,
        deploymentType: 'managed',
        transport: 'stdio',
        dockerConfig: {
          image: 'mcp/filesystem',
          name: 'tars-filesystem-server'
        },
        configInput: 'npx @modelcontextprotocol/server-filesystem /vault',
        displayMode: 'command',
        validationState: defaultValidationState,
        failureCount: 0,
        autoDisabled: false,
        retryPolicy: {
          maxRetries: 3,
          backoffMs: 1000
        },
        timeout: 30
      }
    ],
    globalLimits: {
      concurrentExecutions: 1,
      sessionLimitPerDocument: 10,
      defaultTimeout: 15000,
      parallelExecutionEnabled: false,
      llmUtilityEnabled: false,
      maxParallelTools: 1
    },
    expanded: true,
    ...mockHandlers
  }
}