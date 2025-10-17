// Exact replica of the failing test scenario
import { describe, it, expect } from 'vitest'
import { adaptObsidianToReact, adaptReactToObsidian } from '../../src/adapters/reactSettingsAdapter'

describe('Exact replica test for top_k issue', () => {
	it('should preserve top_k parameter through exact test scenario', () => {
		// Exact comprehensiveSettings from the test
		const comprehensiveSettings = {
  providers: [
    {
      tag: 'claude',
      vendor: 'Claude',
      options: {
        apiKey: 'sk-ant-api-test-key-12345',
        model: 'claude-3-5-sonnet-20241022',
        baseURL: 'https://api.anthropic.com',
        parameters: {
          temperature: 0.7,
          max_tokens: 4000,
          top_p: 0.9,
          top_k: 250,
          thinkingMode: 'auto',
          budget_tokens: 8000,
          stop: ['</response>', '<END>']
        }
      }
    },
    {
      tag: 'openai',
      vendor: 'OpenAI',
      options: {
        apiKey: 'sk-OpenAI-test-key-67890',
        model: 'gpt-4-turbo-preview',
        baseURL: 'https://api.openai.com/v1',
        parameters: {
          temperature: 0.5,
          max_tokens: 2000,
          top_p: 0.8,
          frequency_penalty: 0.1,
          presence_penalty: 0.1,
          organization: 'org-test-123',
          project: 'project-test-456'
        }
      }
    },
    {
      tag: 'ollama',
      vendor: 'Ollama',
      options: {
        apiKey: '',
        model: 'llama3.2:70b',
        baseURL: 'http://localhost:11434',
        parameters: {
          temperature: 0.3,
          top_p: 0.7,
          top_k: 100,
          repeatPenalty: 1.1,
          stop: ['</response>'],
          numCtx: 4096,
          numPredict: 2048,
          keepAlive: '5m',
          stream: true,
          mirostat: 2,
          mirostatTau: 5.0,
          mirostatEta: 0.1,
          tfsZ: 1.0
        }
      }
    },
    {
      tag: 'azure',
      vendor: 'Azure',
      options: {
        apiKey: 'azure-test-key',
        model: 'gpt-4',
        baseURL: 'https://test-resource.openai.azure.com',
        parameters: {
          temperature: 0.6,
          max_tokens: 3000,
          top_p: 0.85,
          frequency_penalty: 0.05,
          presence_penalty: 0.05,
          apiVersion: '2024-02-15-preview',
          endpoint: 'https://test-resource.openai.azure.com'
        }
      }
    },
    {
      tag: 'deepseek',
      vendor: 'DeepSeek',
      options: {
        apiKey: 'sk-deepseek-test-key',
        model: 'deepseek-chat',
        baseURL: 'https://api.deepseek.com',
        parameters: {
          temperature: 0.4,
          max_tokens: 2500,
          top_p: 0.75,
          frequency_penalty: 0.2,
          presence_penalty: 0.2,
          reasoningEffort: 'medium'
        }
      }
    }
  ],
  newChatTags: ['#NewChat', '#Start', '#Fresh', '#Begin'],
  userTags: ['#User', '#Human', '#Person', '#Individual', '#Me'],
  systemTags: ['#System', '#Instructions', '#Setup', '#Context'],
  roleEmojis: {
    newChat: '🆕',
    user: '👤',
    system: '⚙️',
    assistant: '✨'
  },
  confirmRegenerate: true,
  enableInternalLink: true,
  enableDefaultSystemMsg: true,
  defaultSystemMsg: 'You are a helpful AI assistant. Please respond thoughtfully and accurately to user queries.',
  enableInternalLinkForAssistantMsg: true,
  answerDelayInMilliseconds: 750,
  enableReplaceTag: true,
  enableExportToJSONL: true,
  enableTagSuggest: true,
  mcpServers: [
    {
      id: 'file-operations',
      name: 'File Operations Server',
      enabled: true,
      deploymentType: 'managed',
      transport: 'stdio',
      dockerConfig: {
        image: 'mcp/file-ops:latest',
        containerName: 'file-ops-container',
        ports: ['3000:3000', '8080:8080'],
        volumes: ['/data:/app/data', '/config:/app/config'],
        environment: {
          'NODE_ENV': 'production',
          'LOG_LEVEL': 'debug',
          'API_KEY': 'file-ops-secret-key'
        },
        networks: ['mcp-network', 'default'],
        restartPolicy: 'unless-stopped'
      },
      healthCheckConfig: {
        enabled: true,
        interval: 30000,
        timeout: 5000,
        failureThreshold: 3,
        successThreshold: 2
      },
      retryConfig: {
        maxAttempts: 5,
        backoffMultiplier: 2.0,
        initialDelay: 1000,
        maxDelay: 60000
      },
      configInput: JSON.stringify({
        workingDirectory: '/data',
        maxFileSize: '100MB',
        allowedExtensions: ['.txt', '.md', '.json', '.csv']
      }, null, 2)
    }
  ],
  mcpConcurrentLimit: 15,
  mcpSessionLimit: 75,
  mcpGlobalTimeout: 90000,
  mcpParallelExecution: true,
  mcpMaxParallelTools: 25,
  features: {
    reactSettingsTab: true,
    reactStatusBar: true,
    reactModals: true,
    reactMcpUI: true
  },
  uiState: {
    systemMessageExpanded: true,
    advancedExpanded: true,
    mcpServersExpanded: true
  }
}

console.log('=== Running exact replica test ===')

		const reactState = adaptObsidianToReact(comprehensiveSettings)
		const obsidianUpdates = adaptReactToObsidian(reactState)

		// Exact check from the failing test
		const claudeParams = obsidianUpdates.providers?.find(p => p.vendor === 'Claude')?.options.parameters

		console.log('Original comprehensiveSettings top_k:', comprehensiveSettings.providers[0].options.parameters.top_k)
		console.log('React vendorConfig claude.topK:', reactState.providers[0].vendorConfig.claude.topK)
		console.log('Obsidian updates top_k:', obsidianUpdates.providers[0].options.parameters.top_k)
		console.log('Claude params from find():', claudeParams)
		console.log('typeof claudeParams?.top_k:', typeof claudeParams?.top_k)
		console.log('claudeParams?.top_k value:', claudeParams?.top_k)

		expect(typeof claudeParams?.top_k).toBe('number')
		expect(claudeParams?.top_k).toBe(250)
	})
})