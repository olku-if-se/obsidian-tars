import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

// Translation hook wrapper for future i18n integration
export const useT = () => {
  // Return a temporary translation function that returns the key
  // This will be replaced with actual i18n when ready
  const t: TFunction = (key: string, options?: any) => {
    // For now, return a placeholder or the key itself
    // When i18n is fully implemented, this will use useTranslation()
    if (options?.defaultValue) {
      return options.defaultValue
    }

    // Convert nested keys like 'modal.close' to readable text for now
    return key.split('.').pop()?.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) || key
  }

  return { t, i18n: { language: 'en', changeLanguage: () => {} } }
}

// Future hook for when i18n is fully implemented
export const useTranslationHook = () => {
  return useTranslation('common')
}