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
		viewport: {
			defaultViewport: 'desktop',
			viewports: {
				mobile: {
					name: 'Mobile',
					styles: {
						width: '375px',
						height: '667px'
					}
				},
				tablet: {
					name: 'Tablet',
					styles: {
						width: '768px',
						height: '1024px'
					}
				},
				desktop: {
					name: 'Desktop',
					styles: {
						width: '1024px',
						height: '768px'
					}
				},
				wide: {
					name: 'Wide',
					styles: {
						width: '1440px',
						height: '900px'
					}
				}
			}
		},
		layout: {
			constrainWidth: true,
			center: true
		}
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

			// Responsive container decorator
			const ResponsiveContainer = ({ children }: { children: React.ReactNode }) => {
				const layout = context.parameters.layout || {}
				const shouldConstrainWidth = layout.constrainWidth ?? true
				const shouldCenter = layout.center ?? true

				return (
					<div
						style={{
							display: 'flex',
							justifyContent: shouldCenter ? 'center' : 'flex-start',
							alignItems: 'flex-start',
							minHeight: '100vh',
							padding: '2rem',
							background: 'var(--color-background)',
						}}
					>
						<div
							style={{
								// Allow components to be responsive within reasonable bounds
								width: '100%',
								maxWidth: shouldConstrainWidth ? '1200px' : 'none',
								minWidth: shouldConstrainWidth ? '320px' : 'auto',
								// Let components control their own height
								minHeight: 'auto',
							}}
						>
							{children}
						</div>
					</div>
				)
			}

			return (
				<ThemeProvider initialTheme={theme as ThemeName}>
					<ControlledThemeProvider>
						<ResponsiveContainer>
							<Story />
						</ResponsiveContainer>
					</ControlledThemeProvider>
				</ThemeProvider>
			)
		}
	]
}

export default preview
