/**
 * Check if a React UI feature is enabled
 */
export function isFeatureEnabled(settings, feature) {
    // If features object doesn't exist (migration from older version), return false for safety
    if (!settings.features) {
        return false;
    }
    return Boolean(settings.features[feature]);
}
/**
 * Check if React bridge should be initialized
 */
export function shouldInitializeReactBridge(settings) {
    // Initialize if any React feature is enabled
    if (!settings.features) {
        return false;
    }
    return Object.values(settings.features).some((enabled) => enabled);
}
/**
 * Enable a React feature (for testing or admin use)
 */
export function enableFeature(settings, feature) {
    if (!settings.features) {
        settings.features = {
            reactSettingsTab: false,
            reactStatusBar: false,
            reactModals: false,
            reactMcpUI: false
        };
    }
    settings.features[feature] = true;
}
/**
 * Disable a React feature
 */
export function disableFeature(settings, feature) {
    if (settings.features) {
        settings.features[feature] = false;
    }
}
/**
 * Get all enabled React features
 */
export function getEnabledFeatures(settings) {
    if (!settings.features) {
        return [];
    }
    return Object.entries(settings.features)
        .filter(([, enabled]) => enabled)
        .map(([feature]) => feature);
}
/**
 * Check if a feature should be enabled based on rollout percentage
 */
export function shouldEnableForRollout(config) {
    const { percentage, userIdentifier } = config;
    // If percentage is 0 or 100, return immediately
    if (percentage <= 0)
        return false;
    if (percentage >= 100)
        return true;
    // Generate a consistent hash for the user (if provided) or random
    const seed = userIdentifier || Math.random().toString();
    const hash = simpleHash(seed);
    const rolloutThreshold = Math.floor((percentage / 100) * 1000); // Scale to 0-1000
    return hash % 1000 < rolloutThreshold;
}
/**
 * Simple string hash function for consistent rollout
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}
//# sourceMappingURL=featureFlags.js.map