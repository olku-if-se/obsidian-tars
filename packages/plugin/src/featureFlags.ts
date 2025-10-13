import type { PluginSettings } from './settings'

/**
 * Feature flag utilities for gradual React UI rollout
 */

export interface FeatureFlags {
	reactSettingsTab: boolean
	reactStatusBar: boolean
	reactModals: boolean
	reactMcpUI: boolean
}

/**
 * Check if a React UI feature is enabled
 */
export function isFeatureEnabled(settings: PluginSettings, feature: keyof FeatureFlags): boolean {
	// If features object doesn't exist (migration from older version), return false for safety
	if (!settings.features) {
		return false
	}

	return Boolean(settings.features[feature])
}

/**
 * Check if React bridge should be initialized
 */
export function shouldInitializeReactBridge(settings: PluginSettings): boolean {
	// Initialize if any React feature is enabled
	if (!settings.features) {
		return false
	}

	return Object.values(settings.features).some((enabled) => enabled)
}

/**
 * Enable a React feature (for testing or admin use)
 */
export function enableFeature(settings: PluginSettings, feature: keyof FeatureFlags): void {
	if (!settings.features) {
		settings.features = {
			reactSettingsTab: false,
			reactStatusBar: false,
			reactModals: false,
			reactMcpUI: false
		}
	}
	settings.features[feature] = true
}

/**
 * Disable a React feature
 */
export function disableFeature(settings: PluginSettings, feature: keyof FeatureFlags): void {
	if (settings.features) {
		settings.features[feature] = false
	}
}

/**
 * Get all enabled React features
 */
export function getEnabledFeatures(settings: PluginSettings): (keyof FeatureFlags)[] {
	if (!settings.features) {
		return []
	}

	return (Object.entries(settings.features) as [keyof FeatureFlags, boolean][])
		.filter(([, enabled]) => enabled)
		.map(([feature]) => feature)
}

/**
 * Feature rollout helper for gradual deployment
 */
export interface RolloutConfig {
	percentage: number // 0-100, percentage of users who should have the feature
	userIdentifier?: string // Optional user-specific identifier for consistent rollout
}

/**
 * Check if a feature should be enabled based on rollout percentage
 */
export function shouldEnableForRollout(config: RolloutConfig): boolean {
	const { percentage, userIdentifier } = config

	// If percentage is 0 or 100, return immediately
	if (percentage <= 0) return false
	if (percentage >= 100) return true

	// Generate a consistent hash for the user (if provided) or random
	const seed = userIdentifier || Math.random().toString()
	const hash = simpleHash(seed)
	const rolloutThreshold = Math.floor((percentage / 100) * 1000) // Scale to 0-1000

	return hash % 1000 < rolloutThreshold
}

/**
 * Simple string hash function for consistent rollout
 */
function simpleHash(str: string): number {
	let hash = 0
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i)
		hash = (hash << 5) - hash + char
		hash = hash & hash // Convert to 32-bit integer
	}
	return Math.abs(hash)
}
