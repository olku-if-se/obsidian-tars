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
		'mcpServerCard.statusFormatLabel': 'Format:',
		'mcpServerCard.statusFailureCountLabel': 'Failures:',
		'mcpServerCard.statusLatencyLabel': 'Latency:',
		'mcpServerCard.statusNameLabel': 'Name issue',
		'mcpServerCard.previewCommandLabel': 'Preview command',
		'mcpServerCard.copyPreview': 'Copy preview',
		'mcpServerCard.copyErrors': 'Copy errors',
		'mcpServerCard.copyWarnings': 'Copy warnings',
		'mcpServerCard.copySuccess': 'Copied to clipboard',
		'mcpServerCard.copyFailure': 'Unable to copy. Copy the text manually.',
		'mcpServerCard.validationErrorsLabel': 'Validation errors',
		'mcpServerCard.validationWarningsLabel': 'Warnings',
		'mcpServerCard.badgeInvalid': 'Needs attention',
		'mcpServerCard.badgeAutoDisabled': 'Auto-disabled',
		'mcpServerCard.badgeDisabled': 'Disabled',
		'mcpServerCard.badgeTesting': 'Testing',
		'mcpServerCard.badgeHealthy': 'Healthy',
		'mcpServerCard.badgeAttention': 'Attention',
		'mcpServerCard.badgeReady': 'Ready',
		'mcpServerCard.placeholderName': 'Unnamed server',
		'mcpServerCard.nameErrorRequired': 'A unique server name is required.',
		'mcpServerCard.nameErrorLength': 'Server names must be 1–50 characters long.',
		'mcpServerCard.nameErrorCharacters': 'Use only letters, numbers, hyphens, or underscores.',
		'mcpServerCard.nameErrorDuplicate': 'Server name must be unique.',

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
		'mcpServersSection.sessionLimitDesc':
			'Maximum tool executions per document (prevents infinite loops, -1 for unlimited)',
		'mcpServersSection.defaultTimeout': 'Default Timeout (ms)',
		'mcpServersSection.defaultTimeoutDesc': 'Default timeout for individual tool executions (milliseconds)',
		'mcpServersSection.parallelExecution': 'Parallel Execution',
		'mcpServersSection.parallelExecutionDesc': 'Enable parallel execution of multiple tools simultaneously',
		'mcpServersSection.llmUtility': 'LLM Utility Integration',
		'mcpServersSection.llmUtilityDesc': 'Allow LLM providers to access MCP tools directly',
		'mcpServersSection.maxParallelTools': 'Max Parallel Tools',
		'mcpServersSection.maxParallelToolsDesc':
			'Maximum number of tools that can run in parallel (when parallel execution is enabled)',
		'mcpServersSection.toastDismiss': 'Dismiss notification',
		'mcpServersSection.toastServerRemoved': 'Removed {{name}}',
		'mcpServersSection.toastServerEnabled': '{{name}} enabled',
		'mcpServersSection.toastServerDisabled': '{{name}} disabled',
		'mcpServersSection.toastBlankServerAdded': 'Created a new custom MCP server',
		'mcpServersSection.testError': 'Test failed. Please review configuration.',
		'mcpServersSection.quickAdd.title': 'Quick Add Popular Servers',
		'mcpServersSection.quickAdd.description': 'One-click add pre-configured MCP servers.',
		'mcpServersSection.quickAdd.exa.button': '+ Exa Search',
		'mcpServersSection.quickAdd.exa.toast': 'Exa Search MCP server added. Set EXA_API_KEY before enabling.',
		'mcpServersSection.quickAdd.filesystem.button': '+ Filesystem Server',
		'mcpServersSection.quickAdd.filesystem.toast': 'Filesystem MCP server added. Update the path before enabling.',
		'mcpServersSection.addCustom.title': 'Add Custom Server',
		'mcpServersSection.addCustom.description':
			'Start from a blank configuration and supply your own connection details.',
		'mcpServersSection.addCustom.cta': 'Add custom server',

		// Settings Tab
		'settingsTab.basicSettings': 'Basic Settings',
		'settingsTab.confirmRegenerate': 'Confirm before regeneration',
		'settingsTab.confirmRegenerateDesc':
			'Confirm before replacing existing assistant responses when using assistant commands',
		'settingsTab.internalLinks': 'Internal links',
		'settingsTab.internalLinksDesc':
			'Internal links in user and system messages will be replaced with their referenced content. When disabled, only the original text of the links will be used.',

		// Message Tags Section
		'messageTags.title': 'Message tags',
		'messageTags.newChatTagsLabel': '🆕 New chat tags',
		'messageTags.newChatTagsDescription':
			'Keywords for tags in the text box are separated by spaces. Default: #NewChat',
		'messageTags.userTagsLabel': '👤 User message tags',
		'messageTags.userTagsDescription': 'Keywords for tags in the text box are separated by spaces. Default: #User',
		'messageTags.systemTagsLabel': '⚙️ System message tags',
		'messageTags.systemTagsDescription': 'Keywords for tags in the text box are separated by spaces. Default: #System',
		'messageTags.resetButton': 'Reset',

		// Provider Section
		'providerSection.title': 'AI Assistants',
		'providerSection.sectionTitle': 'Assistant',
		'providerSection.addProvider': 'Add AI Provider',
		'providerSection.emptyState': 'Please add at least one AI assistant to start using the plugin.',
		'providerSection.assistantMessageTag': '✨ Assistant message tag',
		'providerSection.assistantMessageTagDesc': 'Tag used to trigger AI text generation',
		'providerSection.model': 'Model',
		'providerSection.modelPlaceholder': 'Select the model to use',
		'providerSection.apiKey': 'API key',
		'providerSection.apiKeyPlaceholder': 'API key (required)',
		'providerSection.controlsTitle': 'Controls',
		'providerSection.controlsDescription': 'Test connection or remove this provider',
		'providerSection.select': 'Select',
		'providerSection.supportedFeatures': 'Supported features',
		'providerSection.disable': 'Disable',
		'providerSection.test': 'Test',
		'providerSection.remove': 'Delete'
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
export function addTranslations(_language: keyof typeof translations, _newTranslations: Partial<Translations>): void {
	console.warn('Adding translations dynamically is not supported in this i18n implementation')
}

/**
 * Check if a translation key exists
 * @param key - Translation key
 * @param language - Optional language code (defaults to current)
 * @returns True if translation exists
 */
export function hasTranslation(key: TranslationKey, language?: keyof typeof translations): boolean {
	const lang = language || currentLanguage
	return !!(translations[lang]?.[key] || translations.en[key])
}

// Export types for use in components
export type { TranslationKey, Translations }
