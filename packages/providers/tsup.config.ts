import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/base.ts'],
  format: ['esm'],
  dts: false, // Disable DTS generation for now due to project reference issues
  clean: true,
  external: ['@tars/types', '@tars/core', '@tars/shared', 'obsidian'],
  onSuccess: 'echo "Providers package built (ESM)"',
})
