import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
	stories: ['../src/**/*.stories.@(ts|tsx)'],
	addons: ['@storybook/addon-links', '@storybook/addon-a11y', '@storybook/addon-docs'],

	framework: '@storybook/react-vite',

	// Optimize for faster startup
	typescript: {
		check: false,
		reactDocgen: false // Disable docgen completely for fastest startup
	}
}

export default config
