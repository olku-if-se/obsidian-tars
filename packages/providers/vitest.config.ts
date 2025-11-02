import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    passWithNoTests: true,
    reporters: ['json', 'verbose'],
    outputFile: 'test-results.json',
  },
})
