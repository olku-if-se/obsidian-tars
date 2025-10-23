import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	resolve: {
		alias: {
			src: path.resolve(__dirname, './src'),
			'@tars/contracts': path.resolve(__dirname, '../contracts/dist/index.js'),
			'@tars/providers': path.resolve(__dirname, '../providers/dist/index.js'),
			'@tars/logger': path.resolve(__dirname, '../logger/dist/index.js'),
			'@tars/mcp-hosting': path.resolve(__dirname, '../mcp-hosting/dist/index.js'),
			'@tars/streams': path.resolve(__dirname, '../streams/dist/index.js'),
			'@tars/ui': path.resolve(__dirname, '../ui/dist/index.js'),
			obsidian: path.resolve(__dirname, 'tests/mocks/obsidian.js')
		}
	},
	test: {
		// Disable watch mode by default
		watch: false,
		// Set timeout for tests (10 seconds)
		testTimeout: 10000,
		// Include all test files in the tests directory and source directory
		include: ['tests/**/*.{test,spec}.ts', 'src/**/__tests__/*.{test,spec}.ts'],
		// Environment for tests
		environment: 'jsdom',
		setupFiles: ['tests/setup/consoleMocks.ts'],
		// Suppress console output during tests
		onConsoleLog: () => false,
		// Coverage configuration
		coverage: {
			// Use V8 coverage provider for Node.js
			provider: 'v8',
			// Coverage reporters
			reporter: ['text', 'json', 'html'],
			// Include source files
			include: ['src/**/*.{ts,js}'],
			// Exclude test files and node_modules
			exclude: [
				'node_modules/**',
				'tests/**',
				'**/*.d.ts',
				'**/*.config.{ts,js}',
				'version-bump.mjs',
				'esbuild.config.mjs'
			],
			// Generate coverage reports in coverage/ directory
			reportsDirectory: './coverage'
		}
	}
})
