import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/plugin.ts', 'src/registry.ts', 'src/settings.ts', 'src/events.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['@tars/types', '@tars/shared', 'obsidian'],
  onSuccess: 'echo "Core package built (ESM)"'
})