import { useEffect, useState } from 'react'
import { DEFAULT_THEME, getTheme, THEME_CONFIGS, type Theme, type ThemeName } from '../providers/themes/theme'

export function useTheme(initialTheme?: ThemeName) {
	const [currentTheme, setCurrentTheme] = useState<ThemeName>(initialTheme || DEFAULT_THEME)
	const [theme, setTheme] = useState<Theme>(() => getTheme(currentTheme))

	const switchTheme = (newTheme: ThemeName) => {
		setCurrentTheme(newTheme)
		setTheme(getTheme(newTheme))
	}

	// Apply theme CSS variables to document
	useEffect(() => {
		if (typeof document !== 'undefined') {
			const root = document.documentElement
			const currentThemeConfig = getTheme(currentTheme)

			// Clear existing theme classes
			root.className = root.className.replace(/theme-\w+/g, '')

			// Add current theme class
			root.classList.add(`theme-${currentTheme}`)

			// Apply CSS variables
			Object.entries(currentThemeConfig.colors).forEach(([key, value]) => {
				root.style.setProperty(key, value)
			})

			Object.entries(currentThemeConfig.typography).forEach(([key, value]) => {
				root.style.setProperty(key, value)
			})

			Object.entries(currentThemeConfig.spacing).forEach(([key, value]) => {
				root.style.setProperty(key, value)
			})

			Object.entries(currentThemeConfig.borders).forEach(([key, value]) => {
				root.style.setProperty(key, value)
			})

			// Set theme attribute for CSS selectors
			root.setAttribute('data-theme', currentThemeConfig.isDark ? 'dark' : 'light')
		}
	}, [currentTheme])

	return {
		theme,
		currentTheme,
		switchTheme,
		isDark: theme.isDark,
		isLight: !theme.isDark,
		availableThemes: Object.keys(THEME_CONFIGS) as ThemeName[]
	}
}
