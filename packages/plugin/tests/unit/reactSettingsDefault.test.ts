import { describe, it, expect } from 'vitest'
import { DEFAULT_SETTINGS } from '../../src/settings'

describe('React Settings Default Configuration', () => {
	it('should have React settings tab enabled by default', () => {
		expect(DEFAULT_SETTINGS.features?.reactSettingsTab).toBe(true)
	})

	it('should have all React features enabled by default', () => {
		expect(DEFAULT_SETTINGS.features?.reactSettingsTab).toBe(true)
		expect(DEFAULT_SETTINGS.features?.reactStatusBar).toBe(true)
		expect(DEFAULT_SETTINGS.features?.reactModals).toBe(true)
		expect(DEFAULT_SETTINGS.features?.reactMcpUI).toBe(true)
	})

	it('should have appropriate default UI state for new users', () => {
		expect(DEFAULT_SETTINGS.uiState?.mcpServersExpanded).toBe(false)
		expect(DEFAULT_SETTINGS.uiState?.systemMessageExpanded).toBe(false)
		expect(DEFAULT_SETTINGS.uiState?.advancedExpanded).toBe(false)
	})

	it('should maintain reasonable MCP defaults', () => {
		expect(DEFAULT_SETTINGS.mcpConcurrentLimit).toBe(3)
		expect(DEFAULT_SETTINGS.mcpSessionLimit).toBe(25)
		expect(DEFAULT_SETTINGS.mcpGlobalTimeout).toBe(30000)
		expect(DEFAULT_SETTINGS.mcpParallelExecution).toBe(false)
		expect(DEFAULT_SETTINGS.mcpMaxParallelTools).toBe(3)
	})

	it('should have sensible basic settings defaults', () => {
		expect(DEFAULT_SETTINGS.confirmRegenerate).toBe(true)
		expect(DEFAULT_SETTINGS.enableInternalLink).toBe(true)
		expect(DEFAULT_SETTINGS.enableTagSuggest).toBe(true)
		expect(DEFAULT_SETTINGS.answerDelayInMilliseconds).toBe(2000)
		expect(DEFAULT_SETTINGS.enableStreamLog).toBe(false)
		expect(DEFAULT_SETTINGS.enableUtilitySection).toBe(true)
	})
})