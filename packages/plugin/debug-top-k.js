// Debug script to test the specific top_k parameter issue
import { adaptObsidianToReact, adaptReactToObsidian } from './src/adapters/reactSettingsAdapter.js'

// Create test settings with top_k parameter
const testSettings = {
  providers: [{
    tag: 'claude',
    vendor: 'Claude',
    options: {
      apiKey: 'sk-ant-test-key',
      model: 'claude-3-5-sonnet-20241022',
      baseURL: 'https://api.anthropic.com',
      parameters: {
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 0.9,
        top_k: 250,  // This is the parameter that's getting lost
        thinkingMode: 'auto',
        budget_tokens: 8000,
        stop: ['</response>', '<END>']
      }
    }
  }],
  newChatTags: ['#NewChat'],
  userTags: ['#User'],
  systemTags: ['#System'],
  roleEmojis: {
    newChat: '🆕',
    user: '👤',
    system: '⚙️',
    assistant: '✨'
  },
  mcpServers: [],
  mcpConcurrentLimit: 5,
  mcpSessionLimit: 20,
  mcpGlobalTimeout: 30000,
  mcpParallelExecution: false,
  mcpMaxParallelTools: 10,
  features: {
    reactSettingsTab: true,
    reactStatusBar: false,
    reactModals: false,
    reactMcpUI: false
  }
}

console.log('Original top_k value:', testSettings.providers[0].options.parameters.top_k)

const reactState = adaptObsidianToReact(testSettings)
console.log('React vendorConfig topK value:', reactState.providers[0].vendorConfig.claude.topK)

const obsidianUpdates = adaptReactToObsidian(reactState)
console.log('Converted back top_k value:', obsidianUpdates.providers[0].options.parameters.top_k)

console.log('Round-trip successful:', obsidianUpdates.providers[0].options.parameters.top_k === 250)