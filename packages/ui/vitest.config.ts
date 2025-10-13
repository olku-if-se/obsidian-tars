import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/test/setup.ts'],
		coverage: {
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.stories.tsx']
		}
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, './src')
		}
	}
})
