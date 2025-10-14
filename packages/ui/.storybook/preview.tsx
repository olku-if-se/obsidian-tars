import React from 'react'
import type { Preview } from '@storybook/react-vite'
import { ThemeProvider, useThemeContext } from '../src/components/atoms/ThemeProvider'
import type { ThemeName } from '../src/hooks/useTheme'
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

			// Create theme provider wrapper
			const ThemeWrapper = () => {
				const { switchTheme } = useThemeContext()

				React.useEffect(() => {
					switchTheme(theme as ThemeName)
				}, [switchTheme])

				return <Story />
			}

			return (
				<ThemeProvider initialTheme={theme as ThemeName}>
					<ThemeWrapper />
				</ThemeProvider>
			)
		}
	]
}

export default preview
