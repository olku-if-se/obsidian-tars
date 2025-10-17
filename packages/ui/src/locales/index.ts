import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import common from './en/common.json'

// Prepare i18n infrastructure but don't initialize automatically
// This allows consumers to initialize when ready
export const i18nConfig = {
	lng: 'en',
	fallbackLng: 'en',
	debug: false,

	resources: {
		en: {
			common
		}
	},

	interpolation: {
		escapeValue: false // React already escapes
	}
}

// Pre-configured i18n instance
export const setupI18n = () => {
	i18n.use(initReactI18next).init(i18nConfig)

	return i18n
}

// Export for external initialization
export { i18n }
