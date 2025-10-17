import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./test/setup.ts'],
		coverage: {
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', './test/', '**/*.d.ts', '**/*.stories.tsx']
		}
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
			'~': resolve(__dirname, './src')
		}
	}
})
