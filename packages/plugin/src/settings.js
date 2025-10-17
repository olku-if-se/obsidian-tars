import { azureVendor, claudeVendor, deepSeekVendor, doubaoVendor, geminiVendor, gptImageVendor, grokVendor, kimiVendor, ollamaVendor, openAIVendor, openRouterVendor, qianFanVendor, qwenVendor, siliconFlowVendor, zhipuVendor } from '@tars/providers';
export const APP_FOLDER = 'Tars';
export const DEFAULT_SETTINGS = {
    editorStatus: { isTextInserting: false },
    providers: [],
    systemTags: ['System', '系统'],
    newChatTags: ['NewChat', '新对话'],
    userTags: ['User', '我'],
    roleEmojis: {
        assistant: '✨',
        system: '🔧',
        newChat: '🚀',
        user: '💬'
    },
    promptTemplates: [],
    enableInternalLink: true,
    enableInternalLinkForAssistantMsg: false,
    answerDelayInMilliseconds: 2000,
    confirmRegenerate: true,
    enableTagSuggest: true,
    tagSuggestMaxLineLength: 20,
    enableExportToJSONL: false,
    enableReplaceTag: false,
    enableDefaultSystemMsg: false,
    defaultSystemMsg: '',
    enableStreamLog: false,
    enableUtilitySection: true,
    // MCP Server Integration defaults
    mcpServers: [],
    mcpGlobalTimeout: 30000,
    mcpConcurrentLimit: 3,
    mcpSessionLimit: 25,
    mcpFailureThreshold: 3,
    mcpRetryMaxAttempts: 5,
    mcpRetryInitialDelay: 1000,
    mcpRetryMaxDelay: 30000,
    mcpRetryBackoffMultiplier: 2,
    mcpRetryJitter: true,
    mcpParallelExecution: false,
    mcpMaxParallelTools: 3,
    uiState: {
        mcpServersExpanded: false,
        systemMessageExpanded: false,
        advancedExpanded: false
    },
    // React UI feature flags
    features: {
        reactSettingsTab: false,
        reactStatusBar: false,
        reactModals: false,
        reactMcpUI: false
    }
};
export const availableVendors = [
    openAIVendor,
    // The following are arranged in alphabetical order
    azureVendor,
    claudeVendor,
    deepSeekVendor,
    doubaoVendor,
    geminiVendor,
    gptImageVendor,
    grokVendor,
    kimiVendor,
    ollamaVendor,
    openRouterVendor,
    qianFanVendor,
    qwenVendor,
    siliconFlowVendor,
    zhipuVendor
];
//# sourceMappingURL=settings.js.map