import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/mocks.ts', 'src/fixtures.ts', 'src/helpers.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['@tars/types', '@tars/shared', 'vitest'],
  onSuccess: 'echo "Testing package built (ESM)"'
})