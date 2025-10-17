import type { MCPServerConfig } from '@tars/mcp-hosting';
import type { PromptTemplate } from './prompt';
import type { ProviderSettings, Vendor } from '@tars/providers';
import type { FeatureFlags } from './featureFlags';
export declare const APP_FOLDER = "Tars";
export interface EditorStatus {
    isTextInserting: boolean;
}
export interface PluginSettings {
    editorStatus: EditorStatus;
    providers: ProviderSettings[];
    systemTags: string[];
    newChatTags: string[];
    userTags: string[];
    roleEmojis: {
        assistant: string;
        system: string;
        newChat: string;
        user: string;
    };
    promptTemplates: PromptTemplate[];
    enableInternalLink: boolean;
    enableInternalLinkForAssistantMsg: boolean;
    confirmRegenerate: boolean;
    enableTagSuggest: boolean;
    tagSuggestMaxLineLength: number;
    answerDelayInMilliseconds: number;
    enableExportToJSONL: boolean;
    enableReplaceTag: boolean;
    enableDefaultSystemMsg: boolean;
    defaultSystemMsg: string;
    enableStreamLog: boolean;
    enableUtilitySection: boolean;
    mcpServers: MCPServerConfig[];
    mcpGlobalTimeout: number;
    mcpConcurrentLimit: number;
    mcpSessionLimit: number;
    mcpFailureThreshold: number;
    mcpRetryMaxAttempts: number;
    mcpRetryInitialDelay: number;
    mcpRetryMaxDelay: number;
    mcpRetryBackoffMultiplier: number;
    mcpRetryJitter: boolean;
    mcpParallelExecution: boolean;
    mcpMaxParallelTools: number;
    uiState?: {
        mcpServersExpanded?: boolean;
        systemMessageExpanded?: boolean;
        advancedExpanded?: boolean;
    };
    features?: FeatureFlags;
}
export declare const DEFAULT_SETTINGS: PluginSettings;
export declare const availableVendors: Vendor[];
//# sourceMappingURL=settings.d.ts.map