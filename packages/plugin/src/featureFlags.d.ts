import type { PluginSettings } from './settings';
/**
 * Feature flag utilities for gradual React UI rollout
 */
export interface FeatureFlags {
    reactSettingsTab: boolean;
    reactStatusBar: boolean;
    reactModals: boolean;
    reactMcpUI: boolean;
}
/**
 * Check if a React UI feature is enabled
 */
export declare function isFeatureEnabled(settings: PluginSettings, feature: keyof FeatureFlags): boolean;
/**
 * Check if React bridge should be initialized
 */
export declare function shouldInitializeReactBridge(settings: PluginSettings): boolean;
/**
 * Enable a React feature (for testing or admin use)
 */
export declare function enableFeature(settings: PluginSettings, feature: keyof FeatureFlags): void;
/**
 * Disable a React feature
 */
export declare function disableFeature(settings: PluginSettings, feature: keyof FeatureFlags): void;
/**
 * Get all enabled React features
 */
export declare function getEnabledFeatures(settings: PluginSettings): (keyof FeatureFlags)[];
/**
 * Feature rollout helper for gradual deployment
 */
export interface RolloutConfig {
    percentage: number;
    userIdentifier?: string;
}
/**
 * Check if a feature should be enabled based on rollout percentage
 */
export declare function shouldEnableForRollout(config: RolloutConfig): boolean;
//# sourceMappingURL=featureFlags.d.ts.map