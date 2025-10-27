import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    passWithNoTests: true,
    reporters: ['json'],
    outputFile: 'test-results.json',
  },
})