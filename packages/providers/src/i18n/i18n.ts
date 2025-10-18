/**
 * Simple i18n utility for providers package
 * Minimal translation support for common error messages
 */

// Basic translations for provider error messages
const translations = {
	en: {
		'API key is required': 'API key is required',
		'API secret is required': 'API secret is required',
		'Model is required': 'Model is required',
		'This is a non-streaming request, please wait...': 'This is a non-streaming request, please wait...',
		'Only the last user message is used for image generation. Other messages are ignored.':
			'Only the last user message is used for image generation. Other messages are ignored.',
		'Multiple embeds found, only the first one will be used': 'Multiple embeds found, only the first one will be used',
		'Only PNG, JPEG, and WebP images are supported for editing.':
			'Only PNG, JPEG, and WebP images are supported for editing.',
		'Embed data is empty or invalid': 'Embed data is empty or invalid',
		'Failed to generate image. no data received from API': 'Failed to generate image. no data received from API',
		'Only PNG, JPEG, GIF, WebP, and PDF files are supported.':
			'Only PNG, JPEG, GIF, WebP, and PDF files are supported.',
		'Only PNG, JPEG, GIF, and WebP images are supported.': 'Only PNG, JPEG, GIF, and WebP images are supported.',
		'Text Generation': 'Text Generation',
		'Image Vision': 'Image Vision',
		'PDF Vision': 'PDF Vision',
		'Image Generation': 'Image Generation',
		'Image Editing': 'Image Editing',
		'Web Search': 'Web Search',
		Reasoning: 'Reasoning',
		'Tool Calling': 'Tool Calling'
	}
}

type TranslationKey = keyof typeof translations.en

/**
 * Simple translation function
 * @param key - Translation key
 * @returns Translated string
 */
export function t(key: TranslationKey): string {
	return translations.en[key] || key
}

/**
 * Get capability emoji
 * @param capability - Capability name
 * @returns Emoji string
 */
export function getCapabilityEmoji(capability: string): string {
	switch (capability) {
		case 'Text Generation':
			return '✍️'
		case 'Image Vision':
			return '👁️'
		case 'PDF Vision':
			return '📄'
		case 'Image Generation':
			return '🎨'
		case 'Image Editing':
			return '✏️'
		case 'Web Search':
			return '🔍'
		case 'Reasoning':
			return '🧠'
		case 'Tool Calling':
			return '🔧'
		default:
			return '❓'
	}
}
