export type ThemeName = 'things-v2-light' | 'things-v2-dark' | 'minimal-light' | 'minimal-dark'

export interface Theme {
	name: string
	isDark: boolean
	colors: Record<string, string>
	typography: Record<string, string>
	spacing: Record<string, string>
	borders: Record<string, string>
}

export const DEFAULT_THEME: ThemeName = 'things-v2-light'

export const THEME_CONFIGS: Record<ThemeName, () => Theme> = {
	'things-v2-light': () => ({
		name: 'Things v2 Light',
		isDark: false,
		colors: {
			'--background-primary': '#ffffff',
			'--background-secondary': '#f6f7f8',
			'--background-modifier-border': '#ebedf0',
			'--background-modifier-hover': '#e2e5e9',
			'--text-normal': '#222222',
			'--text-muted': '#707070',
			'--text-faint': '#ababab',
			'--text-accent': '#3182ce',
			'--text-accent-hover': '#2c5282',
			'--text-error': '#e83e3e',
			'--text-success': '#3eb4bf',
			'--text-on-accent': '#ffffff',
			'--interactive-normal': '#f6f7f8',
			'--interactive-hover': '#e2e5e9',
			'--interactive-accent': '#3182ce',
			'--interactive-accent-hover': '#2c5282',
			'--blue': '#2e80f2',
			'--pink': '#ff82b2',
			'--green': '#3eb4bf',
			'--yellow': '#e5b567',
			'--orange': '#e87d3e',
			'--red': '#e83e3e',
			'--purple': '#9e86c8',
			'--h1-color': '#222222',
			'--h2-color': '#2e80f2',
			'--h3-color': '#2e80f2',
			'--h4-color': '#e5b567',
			'--h5-color': '#e83e3e',
			'--h6-color': '#707070',
			'--strong-color': '#ff82b2',
			'--em-color': '#ff82b2',
			'--quote-color': '#3eb4bf'
		},
		typography: {
			'--font-text-theme': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Ubuntu, sans-serif',
			'--font-editor-theme': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Ubuntu, sans-serif',
			'--font-monospace-theme':
				'"JetBrains Mono", "Fira Code", Menlo, SFMono-Regular, Consolas, "Roboto Mono", monospace',
			'--font-interface-theme': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Ubuntu, sans-serif',
			'--font-ui-smaller': '12px',
			'--font-ui-small': '13px',
			'--font-ui-medium': '15px',
			'--font-ui-large': '18px',
			'--font-ui-larger': '20px',
			'--font-medium': '500',
			'--font-semibold': '600',
			'--font-normal-weight': '100'
		},
		spacing: {
			'--size-1-1': '1px',
			'--size-1-2': '2px',
			'--size-2-1': '2px',
			'--size-2-2': '4px',
			'--size-2-3': '6px',
			'--size-4-1': '8px',
			'--size-4-2': '12px',
			'--size-4-3': '16px',
			'--size-4-4': '20px'
		},
		borders: {
			'--checkbox-radius': '30%',
			'--radius-s': '4px',
			'--radius-m': '8px',
			'--radius-l': '12px',
			'--border-width': '1px'
		}
	}),
	'things-v2-dark': () => ({
		name: 'Things v2 Dark',
		isDark: true,
		colors: {
			'--background-primary': '#1c2127',
			'--background-secondary': '#282c34',
			'--background-modifier-border': '#252b32',
			'--background-modifier-hover': '#3f3f3f',
			'--text-normal': '#dadada',
			'--text-muted': '#999999',
			'--text-faint': '#666666',
			'--text-accent': '#027aff',
			'--text-accent-hover': '#4299e1',
			'--text-error': '#fb464c',
			'--text-success': '#44cf6e',
			'--text-on-accent': '#ffffff',
			'--interactive-normal': '#252b32',
			'--interactive-hover': '#3f3f3f',
			'--interactive-accent': '#027aff',
			'--interactive-accent-hover': '#4299e1',
			'--blue': '#027aff',
			'--pink': '#fa99cd',
			'--green': '#53dfdd',
			'--yellow': '#e0de71',
			'--orange': '#e9973f',
			'--red': '#fb464c',
			'--purple': '#a882ff',
			'--h1-color': '#dadada',
			'--h2-color': '#027aff',
			'--h3-color': '#027aff',
			'--h4-color': '#e0de71',
			'--h5-color': '#fb464c',
			'--h6-color': '#999999',
			'--strong-color': '#fa99cd',
			'--em-color': '#fa99cd',
			'--quote-color': '#53dfdd'
		},
		typography: {
			'--font-text-theme': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Ubuntu, sans-serif',
			'--font-editor-theme': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Ubuntu, sans-serif',
			'--font-monospace-theme':
				'"JetBrains Mono", "Fira Code", Menlo, SFMono-Regular, Consolas, "Roboto Mono", monospace',
			'--font-interface-theme': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Ubuntu, sans-serif',
			'--font-ui-smaller': '12px',
			'--font-ui-small': '13px',
			'--font-ui-medium': '15px',
			'--font-ui-large': '18px',
			'--font-ui-larger': '20px',
			'--font-medium': '500',
			'--font-semibold': '600',
			'--font-normal-weight': '100'
		},
		spacing: {
			'--size-1-1': '1px',
			'--size-1-2': '2px',
			'--size-2-1': '2px',
			'--size-2-2': '4px',
			'--size-2-3': '6px',
			'--size-4-1': '8px',
			'--size-4-2': '12px',
			'--size-4-3': '16px',
			'--size-4-4': '20px'
		},
		borders: {
			'--checkbox-radius': '30%',
			'--radius-s': '4px',
			'--radius-m': '8px',
			'--radius-l': '12px',
			'--border-width': '1px'
		}
	}),
	'minimal-light': () => ({
		name: 'Minimal Light',
		isDark: false,
		colors: {
			'--background-primary': '#ffffff',
			'--background-secondary': '#f7f7f7',
			'--background-modifier-border': '#e1e1e1',
			'--background-modifier-hover': '#e1e1e1',
			'--text-normal': '#374151',
			'--text-muted': '#6b7280',
			'--text-faint': '#9ca3af',
			'--text-accent': '#6c99bb',
			'--text-accent-hover': '#4a7c95',
			'--text-error': '#d04255',
			'--text-success': '#a8c373',
			'--text-on-accent': '#ffffff',
			'--interactive-normal': '#f7f7f7',
			'--interactive-hover': '#e1e1e1',
			'--interactive-accent': '#6c99bb',
			'--interactive-accent-hover': '#4a7c95',
			'--blue': '#6c99bb',
			'--pink': '#b05279',
			'--green': '#a8c373',
			'--yellow': '#e5b567',
			'--orange': '#d5763f',
			'--red': '#d04255',
			'--purple': '#9e86c8',
			'--h1-color': '#374151',
			'--h2-color': '#6c99bb',
			'--h3-color': '#6c99bb',
			'--h4-color': '#e5b567',
			'--h5-color': '#d04255',
			'--h6-color': '#9ca3af',
			'--strong-color': '#374151',
			'--em-color': '#6b7280',
			'--quote-color': '#a8c373'
		},
		typography: {
			'--font-text-theme': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Ubuntu, sans-serif',
			'--font-editor-theme': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Ubuntu, sans-serif',
			'--font-monospace-theme': 'Menlo, SFMono-Regular, Consolas, "Roboto Mono", monospace',
			'--font-interface-theme': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Ubuntu, sans-serif',
			'--font-ui-smaller': '12px',
			'--font-ui-small': '13px',
			'--font-ui-medium': '14px',
			'--font-ui-large': '16px',
			'--font-ui-larger': '18px',
			'--font-medium': '500',
			'--font-semibold': '600',
			'--font-normal-weight': '400'
		},
		spacing: {
			'--size-1-1': '1px',
			'--size-1-2': '2px',
			'--size-2-1': '2px',
			'--size-2-2': '4px',
			'--size-2-3': '6px',
			'--size-4-1': '8px',
			'--size-4-2': '12px',
			'--size-4-3': '16px',
			'--size-4-4': '20px'
		},
		borders: {
			'--checkbox-radius': '2px',
			'--radius-s': '2px',
			'--radius-m': '4px',
			'--radius-l': '6px',
			'--border-width': '1px'
		}
	}),
	'minimal-dark': () => ({
		name: 'Minimal Dark',
		isDark: true,
		colors: {
			'--background-primary': '#1c1c1e',
			'--background-secondary': '#282828',
			'--background-modifier-border': '#363636',
			'--background-modifier-hover': '#404040',
			'--text-normal': '#dadada',
			'--text-muted': '#999999',
			'--text-faint': '#666666',
			'--text-accent': '#6c99bb',
			'--text-accent-hover': '#8badcc',
			'--text-error': '#d04255',
			'--text-success': '#a8c373',
			'--text-on-accent': '#1c1c1e',
			'--interactive-normal': '#363636',
			'--interactive-hover': '#404040',
			'--interactive-accent': '#6c99bb',
			'--interactive-accent-hover': '#8badcc',
			'--blue': '#6c99bb',
			'--pink': '#b05279',
			'--green': '#a8c373',
			'--yellow': '#e5b567',
			'--orange': '#d5763f',
			'--red': '#d04255',
			'--purple': '#9e86c8',
			'--h1-color': '#dadada',
			'--h2-color': '#6c99bb',
			'--h3-color': '#6c99bb',
			'--h4-color': '#e5b567',
			'--h5-color': '#d04255',
			'--h6-color': '#999999',
			'--strong-color': '#dadada',
			'--em-color': '#999999',
			'--quote-color': '#a8c373'
		},
		typography: {
			'--font-text-theme': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Ubuntu, sans-serif',
			'--font-editor-theme': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Ubuntu, sans-serif',
			'--font-monospace-theme': 'Menlo, SFMono-Regular, Consolas, "Roboto Mono", monospace',
			'--font-interface-theme': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Ubuntu, sans-serif',
			'--font-ui-smaller': '12px',
			'--font-ui-small': '13px',
			'--font-ui-medium': '14px',
			'--font-ui-large': '16px',
			'--font-ui-larger': '18px',
			'--font-medium': '500',
			'--font-semibold': '600',
			'--font-normal-weight': '400'
		},
		spacing: {
			'--size-1-1': '1px',
			'--size-1-2': '2px',
			'--size-2-1': '2px',
			'--size-2-2': '4px',
			'--size-2-3': '6px',
			'--size-4-1': '8px',
			'--size-4-2': '12px',
			'--size-4-3': '16px',
			'--size-4-4': '20px'
		},
		borders: {
			'--checkbox-radius': '2px',
			'--radius-s': '2px',
			'--radius-m': '4px',
			'--radius-l': '6px',
			'--border-width': '1px'
		}
	})
}

export function getTheme(themeName: ThemeName = DEFAULT_THEME): Theme {
	return THEME_CONFIGS[themeName]()
}
