import type { Meta, StoryObj } from '@storybook/react'
import { MCPServersSection } from './MCPServersSection'

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
      defaultTimeout: 30
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
      defaultTimeout: 45
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
      defaultTimeout: 60
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
        }
      }
    ],
    globalLimits: {
      concurrentExecutions: 1,
      sessionLimitPerDocument: 10,
      defaultTimeout: 15
    },
    expanded: true,
    ...mockHandlers
  }
}