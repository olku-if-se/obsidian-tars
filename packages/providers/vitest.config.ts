import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		testTimeout: 10000, // 10 seconds for E2E tests with real API calls
		environment: 'node',
		setupFiles: [],
		include: ['tests/**/*.test.ts'],
		exclude: ['node_modules', 'dist']
	},
	resolve: {
		alias: {
			// Mock obsidian as an empty module
			obsidian: resolve(__dirname, './tests/mocks/obsidian.ts'),
			// Fix i18n import for testing
			'@tars/i18n': resolve(__dirname, './src/i18n/index.ts')
		}
	}
})
