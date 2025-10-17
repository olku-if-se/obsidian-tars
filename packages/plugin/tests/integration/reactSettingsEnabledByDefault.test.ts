import { describe, it, expect, beforeEach } from 'vitest'
import { PluginSettings, DEFAULT_SETTINGS } from '../../src/settings'
import { adaptObsidianToReact } from '../../src/adapters/reactSettingsAdapter'

describe('React Settings Enabled by Default - Integration Tests', () => {
	describe('Default Settings Configuration', () => {
		it('should have React features enabled by default', () => {
			// Verify that React features are enabled in default settings
			expect(DEFAULT_SETTINGS.features?.reactSettingsTab).toBe(true)
			expect(DEFAULT_SETTINGS.features?.reactStatusBar).toBe(true)
			expect(DEFAULT_SETTINGS.features?.reactModals).toBe(true)
			expect(DEFAULT_SETTINGS.features?.reactMcpUI).toBe(true)
		})

		it('should preserve React feature flags through adapter conversion', () => {
			// Convert default settings through adapter
			const reactState = adaptObsidianToReact(DEFAULT_SETTINGS)

			// Verify React features are preserved
			expect(reactState.reactFeatures.reactSettingsTab).toBe(true)
			expect(reactState.reactFeatures.reactStatusBar).toBe(true)
			expect(reactState.reactFeatures.reactModals).toBe(true)
			expect(reactFeatures.reactMcpUI).toBe(true)
		})
	})

	describe('New Installation Experience', () => {
		it('should provide React-based settings for new users', () => {
			const newInstallationSettings = { ...DEFAULT_SETTINGS }

			// Simulate a new user's settings (just defaults)
			const reactState = adaptObsidianToReact(newInstallationSettings)

			// Verify React features are active for new users
			expect(reactState.reactFeatures.reactSettingsTab).toBe(true)
			expect(reactState.reactFeatures.reactStatusBar).toBe(true)
			expect(reactFeatures.reactModals).toBe(true)
			expect(reactFeatures.reactMcpUI).toBe(true)

			// Verify default UI state is appropriate for new users
			expect(reactState.uiState.mcpServersExpanded).toBe(false) // Keep collapsed for simplicity
			expect(reactState.uiState.systemMessageExpanded).toBe(false)
			expect(reactState.uiState.advancedExpanded).toBe(false)
			expect(reactState.uiState.reactFeaturesExpanded).toBe(false)
		})

		it('should maintain backward compatibility with existing settings', () => {
			// Simulate existing user settings (React features might be disabled)
			const existingUserSettings: Partial<PluginSettings> = {
				...DEFAULT_SETTINGS,
				features: {
					reactSettingsTab: false,
					reactStatusBar: false,
					reactModals: false,
					reactMcpUI: false
				}
			}

			const reactState = adaptObsidianToReact(existingUserSettings as PluginSettings)

			// Should respect existing user's feature preferences
			expect(reactState.reactFeatures.reactSettingsTab).toBe(false)
			expect(reactState.reactFeatures.reactStatusBar).toBe(false)
			expect(reactState.reactFeatures.reactModals).toBe(false)
			expect(reactState.reactFeatures.reactMcpUI).toBe(false)
		})
	})

	describe('Feature Flag Validation', () => {
		it('should handle missing features gracefully', () => {
			// Simulate settings without features field (legacy)
			const legacySettings: Partial<PluginSettings> = {
				...DEFAULT_SETTINGS,
				features: undefined
			}

			const reactState = adaptObsidianToReact(legacySettings as PluginSettings)

			// Should handle missing features field gracefully
			expect(reactState.reactFeatures).toBeDefined()
			expect(typeof reactState.reactFeatures.reactSettingsTab).toBe('boolean')
			expect(typeof reactState.reactFeatures.reactStatusBar).toBe('boolean')
			expect(typeof reactState.reactFeatures.reactModals).toBe('boolean')
			expect(typeof reactState.reactFeatures.reactMcpUI).toBe('boolean')
		})

		it('should handle partial feature configurations', () => {
			// Test with only some React features enabled
			const partialFeaturesSettings: Partial<PluginSettings> = {
				...DEFAULT_SETTINGS,
				features: {
					reactSettingsTab: true,
					reactStatusBar: false,
					reactModals: true,
					reactMcpUI: false
				}
			}

			const reactState = adaptObsidianToReact(partialFeaturesSettings as PluginSettings)

			// Should preserve partial configuration
			expect(reactState.reactFeatures.reactSettingsTab).toBe(true)
			expect(reactState.reactFeatures.reactStatusBar).toBe(false)
			expect(reactState.reactFeatures.reactModals).toBe(true)
			expect(reactState.reactFeatures.reactMcpUI).toBe(false)
		})
	})

	describe('Migration Impact', () => {
		it('should enable React experience for new installations without breaking existing users', () => {
			// New installation - should get React features
			const newInstall = { ...DEFAULT_SETTINGS }
			const newInstallReact = adaptObsidianToReact(newInstall)

			expect(newInstallReact.reactFeatures.reactSettingsTab).toBe(true)
			expect(newInstallReact.reactFeatures.reactMcpUI).toBe(true)

			// Existing installation with React disabled - should stay disabled
			const existingInstall: Partial<PluginSettings> = {
				...DEFAULT_SETTINGS,
				features: {
					reactSettingsTab: false,
					reactStatusBar: false,
					reactModals: false,
					reactMcpUI: false
				}
			}
			const existingInstallReact = adaptObsidianToReact(existingInstall as PluginSettings)

			expect(existingInstallReact.reactFeatures.reactSettingsTab).toBe(false)
			expect(existingInstallReact.reactFeatures.reactMcpUI).toBe(false)

			// Existing installation with React enabled - should stay enabled
			const existingReactInstall: Partial<PluginSettings> = {
				...DEFAULT_SETTINGS,
				features: {
					reactSettingsTab: true,
					reactStatusBar: true,
					reactModals: true,
					reactMcpUI: true
				}
			}
			const existingReactInstallReact = adaptObsidianToReact(existingReactInstall as PluginSettings)

			expect(existingReactInstallReact.reactFeatures.reactSettingsTab).toBe(true)
			expect(existingReactInstallReact.reactFeatures.reactMcpUI).toBe(true)
		})
	})
})