import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
	plugins: [
		react(),
	],
	css: {
		modules: {
			localsConvention: 'camelCaseOnly',
			generateScopedName: '[name]__[local]___[hash:base64:5]',
		},
	},
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'TarsUI',
			fileName: 'index',
			formats: ['es', 'cjs'],
		},
		rollupOptions: {
			external: ['react', 'react-dom'],
			output: {
				globals: {
					react: 'React',
					'react-dom': 'ReactDOM',
				},
			},
		},
		sourcemap: true,
	},
	// Add Storybook-specific configuration
	optimizeDeps: {
		include: ['@storybook/react', '@storybook/react-vite'],
	},
	define: {
		// Ensure Storybook globals are available
		global: 'globalThis',
	},
});
