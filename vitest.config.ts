import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    passWithNoTests: true, // Allow packages with no tests to pass
    reporters: [
      ['json', { outputFile: './test-results.json' }],
      'verbose'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        'main.js',
        '*.map',
      ],
    },
  },
  resolve: {
    alias: {
      // Root level aliases
      '@': resolve(__dirname, './src'),
      '~': resolve(__dirname, './src'),
      src: resolve(__dirname, './src'),
    },
  },
})
