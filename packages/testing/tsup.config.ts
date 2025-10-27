import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['@tars/types', '@tars/shared', '@tars/core', 'vitest'],
})
