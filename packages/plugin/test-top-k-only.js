// Simple test to isolate top_k parameter issue
const { adaptObsidianToReact, adaptReactToObsidian } = require('./dist/src/adapters/reactSettingsAdapter.js');

// Simple test data - Claude only
const testSettings = {
  providers: [{
    tag: 'claude',
    vendor: 'Claude',
    options: {
      apiKey: 'sk-ant-test',
      model: 'claude-3-5-sonnet-20241022',
      baseURL: 'https://api.anthropic.com',
      parameters: {
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 0.9,
        top_k: 250,  // The critical parameter
        thinkingMode: 'auto',
        budget_tokens: 8000,
        stop: ['</response>']
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
  confirmRegenerate: true,
  enableInternalLink: true,
  enableDefaultSystemMsg: true,
  defaultSystemMsg: 'Test',
  enableInternalLinkForAssistantMsg: true,
  answerDelayInMilliseconds: 750,
  enableReplaceTag: true,
  enableExportToJSONL: true,
  enableTagSuggest: true,
  mcpServers: [],
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
};

console.log('=== Testing top_k parameter ===');
console.log('Original top_k:', testSettings.providers[0].options.parameters.top_k);

try {
  const reactState = adaptObsidianToReact(testSettings);
  console.log('React topK:', reactState.providers[0].vendorConfig.claude.topK);

  const obsidianUpdates = adaptReactToObsidian(reactState);
  console.log('Obsidian top_k:', obsidianUpdates.providers[0].options.parameters.top_k);

  const claudeParams = obsidianUpdates.providers?.find(p => p.vendor === 'Claude')?.options.parameters;
  console.log('Claude params top_k:', claudeParams?.top_k);
  console.log('Type of top_k:', typeof claudeParams?.top_k);

  console.log('SUCCESS:', claudeParams?.top_k === 250);
} catch (error) {
  console.error('ERROR:', error.message);
}