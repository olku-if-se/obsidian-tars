import { createContext, type ReactNode, useContext, useMemo } from 'react'
import { useTheme } from '~/hooks'
import type { Theme, ThemeName } from './theme'

interface ThemeContextValue {
	theme: Theme
	currentTheme: ThemeName
	switchTheme: (theme: ThemeName) => void
	isDark: boolean
	isLight: boolean
	availableThemes: ThemeName[]
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export interface ThemeProviderProps {
	children: ReactNode
	initialTheme?: ThemeName
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
	const themeData = useTheme(initialTheme)

	// Memoize context value to prevent unnecessary re-renders
	const memoizedValue = useMemo(() => themeData, [themeData.theme, themeData.currentTheme])

	return <ThemeContext.Provider value={memoizedValue}>{children}</ThemeContext.Provider>
}

export function useThemeContext(): ThemeContextValue {
	const context = useContext(ThemeContext)
	if (context === undefined) {
		throw new Error('useThemeContext must be used within a ThemeProvider')
	}
	return context
}

// Hook for accessing theme values without full context
export function useThemeValue() {
	const { theme, isDark, isLight } = useThemeContext()
	return { theme, isDark, isLight }
}

// Hook for accessing specific theme colors
export function useThemeColor(colorVar: string): string {
	const { theme } = useThemeContext()
	return theme.colors[colorVar] || colorVar
}

// Hook for accessing semantic colors
export function useSemanticColors() {
	const { theme } = useThemeContext()
	return {
		background: theme.colors['--background-primary'],
		backgroundSecondary: theme.colors['--background-secondary'],
		text: theme.colors['--text-normal'],
		textMuted: theme.colors['--text-muted'],
		textFaint: theme.colors['--text-faint'],
		accent: theme.colors['--text-accent'],
		accentHover: theme.colors['--text-accent-hover'],
		error: theme.colors['--text-error'],
		success: theme.colors['--text-success'],
		onAccent: theme.colors['--text-on-accent'],
		interactive: theme.colors['--interactive-normal'],
		interactiveHover: theme.colors['--interactive-hover'],
		border: theme.colors['--background-modifier-border'],
		borderHover: theme.colors['--background-modifier-hover'],
		// Semantic colors
		blue: theme.colors['--blue'],
		pink: theme.colors['--pink'],
		green: theme.colors['--green'],
		yellow: theme.colors['--yellow'],
		orange: theme.colors['--orange'],
		red: theme.colors['--red'],
		purple: theme.colors['--purple'],
		h1: theme.colors['--h1-color'],
		h2: theme.colors['--h2-color'],
		h3: theme.colors['--h3-color'],
		h4: theme.colors['--h4-color'],
		h5: theme.colors['--h5-color'],
		h6: theme.colors['--h6-color'],
		strong: theme.colors['--strong-color'],
		em: theme.colors['--em-color'],
		quote: theme.colors['--quote-color']
	}
}
