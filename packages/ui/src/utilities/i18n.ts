/**
 * Simple i18n utility for internationalization support
 * Following React rules for string externalization
 */

// Default translations (can be extended with other languages)
const translations = {
	en: {
		// Configuration Input
		'configurationInput.configPlaceholder.url': 'https://mcp.example.com?token=value',
		'configurationInput.configPlaceholder.command': 'npx @modelcontextprotocol/server-memory',
		'configurationInput.configPlaceholder.json': '{"mcpServers": {"server-name": {"command": "...", "args": []}}}',
		'configurationInput.showAsUrl': 'Show as URL',
		'configurationInput.showAsCommand': 'Show as command',
		'configurationInput.showAsJson': 'Show as JSON',

		// Validation Messages
		'validation.error': 'Error',
		'validation.warning': 'Warning',
		'validation.info': 'Info',
		'validation.dismiss': 'Dismiss error message',
		'validation.dismissWarning': 'Dismiss warning message',
		'validation.dismissInfo': 'Dismiss info message',

		// MCP Server Card
		'mcpServerCard.controls': 'Controls',
		'mcpServerCard.serverName': 'Server Name',
		'mcpServerCard.serverNameDesc': 'Display name for the MCP server',
		'mcpServerCard.configuration': 'Configuration',
		'mcpServerCard.configurationDesc': 'Server configuration in URL, command, or JSON format',
		'mcpServerCard.status': 'Status',
		'mcpServerCard.test': 'Test',
		'mcpServerCard.delete': 'Delete',
		'mcpServerCard.testing': 'Testing...',
		'mcpServerCard.connected': 'Connected successfully',
		'mcpServerCard.connectionFailed': 'Connection failed',
		'mcpServerCard.invalidConfig': 'Invalid configuration',
		'mcpServerCard.ready': 'Ready',
		'mcpServerCard.serverDisabled': 'Server disabled',
		'mcpServerCard.serverAutoDisabled': 'Server auto-disabled due to failures',
		'mcpServerCard.formatUrl': 'URL Format',
		'mcpServerCard.formatCommand': 'Command Format',
		'mcpServerCard.formatJson': 'JSON Format',

		// Template Selector
		'templateSelector.title': 'Add MCP Server Template',
		'templateSelector.search': 'Search templates...',
		'templateSelector.category': 'Category',
		'templateSelector.difficulty': 'Difficulty',
		'templateSelector.allCategories': 'All Categories',
		'templateSelector.allDifficulties': 'All Difficulties',
		'templateSelector.beginner': 'Beginner',
		'templateSelector.intermediate': 'Intermediate',
		'templateSelector.advanced': 'Advanced',
		'templateSelector.select': 'Select Template',
		'templateSelector.cancel': 'Cancel',
		'templateSelector.noTemplates': 'No templates found',
		'templateSelector.noMatchingTemplates': 'No templates match your search',
		'templateSelector.configuration': 'Configuration',
		'templateSelector.selectConfiguration': 'Select configuration',
		'templateSelector.useTemplate': 'Use Template',
		'templateSelector.templateDescription': 'Template description',
		'templateSelector.requirements': 'Requirements',
		'templateSelector.setupInstructions': 'Setup instructions',
		'templateSelector.useCases': 'Use cases',
		'templateSelector.tags': 'Tags',

		// MCP Servers Section
		'mcpServersSection.title': 'MCP Servers',
		'mcpServersSection.addServer': 'Add MCP Server',
		'mcpServersSection.noServers': 'No MCP servers configured. Add a server to enable AI tool calling.',
		'mcpServersSection.globalSettings': 'Global Settings',
		'mcpServersSection.concurrentExecutions': 'Concurrent Executions',
		'mcpServersSection.concurrentExecutionsDesc': 'Maximum number of simultaneous tool executions across all servers',
		'mcpServersSection.sessionLimit': 'Session Limit per Document',
		'mcpServersSection.sessionLimitDesc': 'Maximum tool executions per document (prevents infinite loops)',
		'mcpServersSection.defaultTimeout': 'Default Timeout (seconds)',
		'mcpServersSection.defaultTimeoutDesc': 'Default timeout for individual tool executions',

		// Settings Tab
		'settingsTab.basicSettings': 'Basic Settings',
		'settingsTab.confirmRegenerate': 'Confirm before regeneration',
		'settingsTab.confirmRegenerateDesc': 'Confirm before replacing existing assistant responses when using assistant commands',
		'settingsTab.internalLinks': 'Internal links',
		'settingsTab.internalLinksDesc': 'Internal links in user and system messages will be replaced with their referenced content. When disabled, only the original text of the links will be used.'
	}
}

type Translations = typeof translations.en
type TranslationKey = keyof Translations

// Current language (default to English)
let currentLanguage: keyof typeof translations = 'en'

/**
 * Simple translation function
 * @param key - Translation key
 * @param params - Optional parameters for string interpolation
 * @returns Translated string
 */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
	const translation = translations[currentLanguage]?.[key] || translations.en[key] || key

	if (!params) {
		return translation
	}

	// Simple parameter interpolation
	return translation.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
		const value = params[paramKey]
		return value !== undefined ? String(value) : match
	})
}

/**
 * Set the current language
 * @param language - Language code
 */
export function setLanguage(language: keyof typeof translations): void {
	if (translations[language]) {
		currentLanguage = language
	} else {
		console.warn(`Language '${language}' not supported, falling back to English`)
		currentLanguage = 'en'
	}
}

/**
 * Get the current language
 * @returns Current language code
 */
export function getCurrentLanguage(): keyof typeof translations {
	return currentLanguage
}

/**
 * Get available languages
 * @returns Array of available language codes
 */
export function getAvailableLanguages(): (keyof typeof translations)[] {
	return Object.keys(translations) as (keyof typeof translations)[]
}

/**
 * Add or update translations for a language
 * Note: This function is disabled as translations are readonly
 * @param _language - Language code
 * @param _newTranslations - Translations to add/update
 */
export function addTranslations(
	_language: keyof typeof translations,
	_newTranslations: Partial<Translations>
): void {
	console.warn('Adding translations dynamically is not supported in this i18n implementation')
}

/**
 * Check if a translation key exists
 * @param key - Translation key
 * @param language - Optional language code (defaults to current)
 * @returns True if translation exists
 */
export function hasTranslation(
	key: TranslationKey,
	language?: keyof typeof translations
): boolean {
	const lang = language || currentLanguage
	return !!(translations[lang]?.[key] || translations.en[key])
}

// Export types for use in components
export type { TranslationKey, Translations }