import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
	stories: ['../stories/**/*.stories.@(ts|tsx)'],
	addons: [
		'@storybook/addon-links',
		'@storybook/addon-essentials',
		'@storybook/addon-interactions',
		'@storybook/addon-a11y',
	],
	framework: {
		name: '@storybook/react-vite',
		options: {},
	},
	docs: {
		autodocs: 'tag',
	},
	// Optimize for faster startup
	typescript: {
		check: false,
		reactDocgen: false, // Disable docgen completely for fastest startup
	},
	viteFinal: async (config) => {
		// Improve dependency optimization performance
		config.optimizeDeps = {
			...config.optimizeDeps,
			force: true,
			include: [
				...(config.optimizeDeps?.include || []),
				'react',
				'react-dom',
				'storybook',
			],
		};

		// Reduce timeout for development server
		config.server = {
			...config.server,
			watch: {
				usePolling: false, // Disable polling which can cause issues in WSL
				interval: 100,
			},
		};

		return config;
	},
};

export default config;