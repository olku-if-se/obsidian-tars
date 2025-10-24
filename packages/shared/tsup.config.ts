import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/utils.ts', 'src/constants.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['@tars/types'],
  onSuccess: 'echo "Shared package built (ESM)"'
})