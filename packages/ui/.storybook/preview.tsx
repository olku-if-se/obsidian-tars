import type { Preview } from '@storybook/react-vite'
import React from 'react'
import { ThemeProvider, useThemeContext } from '../src/providers/themes/ThemeProvider'
import type { ThemeName } from '../src/providers/themes/theme'
import './obsidian-theme.css'

const preview: Preview = {
	parameters: {
		actions: { argTypesRegex: '^on[A-Z].*' },
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/
			}
		},
		backgrounds: {
			default: 'obsidian',
			values: [
				{
					name: 'Obsidian Light',
					value: '#ffffff'
				},
				{
					name: 'Obsidian Dark',
					value: '#1e1e1e',
					dark: true
				}
			]
		},
		docs: {
			story: {
				height: '400px'
			}
		},
		layout: 'padded'
	},

	globalTypes: {
		theme: {
			description: 'Obsidian theme for components',
			defaultValue: 'things-v2-light',
			toolbar: {
				title: 'Theme',
				icon: 'paintbrush',
				items: [
					{ value: 'things-v2-light', title: 'Things v2 Light', icon: 'sun' },
					{ value: 'things-v2-dark', title: 'Things v2 Dark', icon: 'moon' },
					{ value: 'minimal-light', title: 'Minimal Light', icon: 'sun' },
					{ value: 'minimal-dark', title: 'Minimal Dark', icon: 'moon' }
				],
				dynamicTitle: true
			}
		}
	},

	decorators: [
		(Story, context) => {
			const { theme } = context.globals

			// Create a controlled theme provider that responds to Storybook theme changes
			const ControlledThemeProvider = ({ children }: { children: React.ReactNode }) => {
				const { currentTheme, switchTheme } = useThemeContext()
				const isInitialized = React.useRef(false)

				React.useEffect(() => {
					// Only switch theme after initial render or when theme actually changes
					if (isInitialized.current && currentTheme !== theme) {
						switchTheme(theme as ThemeName)
					} else {
						isInitialized.current = true
					}
				}, [currentTheme, switchTheme])

				return <>{children}</>
			}

			return (
				<ThemeProvider initialTheme={theme as ThemeName}>
					<ControlledThemeProvider>
						<Story />
					</ControlledThemeProvider>
				</ThemeProvider>
			)
		}
	]
}

export default preview
