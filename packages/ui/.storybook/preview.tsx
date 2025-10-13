import type { Preview } from '@storybook/react-vite'
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
			description: 'Global theme for components',
			defaultValue: 'light',
			toolbar: {
				title: 'Theme',
				icon: 'paintbrush',
				items: [
					{ value: 'light', title: 'Light', icon: 'sun' },
					{ value: 'dark', title: 'Dark', icon: 'moon' }
				],
				dynamicTitle: true
			}
		}
	},

	decorators: [
		(Story, context) => {
			const { theme } = context.globals

			// Apply theme to document element
			if (typeof document !== 'undefined') {
				document.documentElement.setAttribute('data-theme', theme)
			}

			return <Story />
		}
	]
}

export default preview
