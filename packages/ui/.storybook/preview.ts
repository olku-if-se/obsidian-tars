import type { Preview } from '@storybook/react-vite';
import './obsidian-theme.css';

const preview: Preview = {
    parameters: {
		actions: { argTypesRegex: '^on[A-Z].*' },
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/,
			},
		},
		backgrounds: {
			options: {
				obsidian: {
					name: 'obsidian',
					value: 'var(--background-primary)',
				},

				"obsidian-secondary": {
					name: 'obsidian-secondary',
					value: 'var(--background-secondary)',
				}
			}
		},
		layout: 'padded',
	},

    initialGlobals: {
        backgrounds: {
            value: 'obsidian'
        }
    }
};

export default preview;
