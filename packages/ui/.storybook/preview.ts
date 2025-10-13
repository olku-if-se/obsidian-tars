import type { Preview } from '@storybook/react';
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
			default: 'obsidian',
			values: [
				{
					name: 'obsidian',
					value: 'var(--background-primary)',
				},
				{
					name: 'obsidian-secondary',
					value: 'var(--background-secondary)',
				},
			],
		},
		layout: 'padded',
	},
};

export default preview;
