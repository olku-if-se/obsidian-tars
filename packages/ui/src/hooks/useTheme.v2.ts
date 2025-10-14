import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import type { Theme, ThemeName } from '../providers/themes/theme'
import { getTheme } from '../providers/themes/theme'

const AVAILABLE_THEME_NAMES: readonly ThemeName[] = [
	'things-v2-light',
	'things-v2-dark',
	'minimal-light',
	'minimal-dark'
]

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

function applyTheme(root: HTMLElement, themeName: ThemeName, theme: Theme) {
	const themeClassPrefix = 'theme-'
	const existingThemeTokens = Array.from(root.classList).filter((token) => token.startsWith(themeClassPrefix))

	existingThemeTokens.forEach((token) => {
		root.classList.remove(token)
	})

	root.classList.add(`${themeClassPrefix}${themeName}`)

	const cssVariables = {
		...theme.colors,
		...theme.typography,
		...theme.spacing,
		...theme.borders
	}

	Object.entries(cssVariables).forEach(([property, value]) => {
		root.style.setProperty(property, value)
	})

	root.setAttribute('data-theme', theme.isDark ? 'dark' : 'light')
}

export function useTheme(initialTheme?: ThemeName) {
	const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => initialTheme ?? DEFAULT_THEME)

	const theme = useMemo(() => getTheme(currentTheme), [currentTheme])
	const availableThemes = useMemo(() => AVAILABLE_THEME_NAMES.slice(), [])

	const switchTheme = useCallback((nextTheme: ThemeName) => {
		setCurrentTheme((previous) => (previous === nextTheme ? previous : nextTheme))
	}, [])

	useIsomorphicLayoutEffect(() => {
		if (typeof document === 'undefined') {
			return
		}

		applyTheme(document.documentElement, currentTheme, theme)
	}, [currentTheme, theme])

	return {
		theme,
		currentTheme,
		switchTheme,
		isDark: theme.isDark,
		isLight: !theme.isDark,
		availableThemes
	}
}
