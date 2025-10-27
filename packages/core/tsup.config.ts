import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  external: ['@tars/types', '@tars/shared'],
  splitting: false,
  sourcemap: false,
  minify: false,
})
