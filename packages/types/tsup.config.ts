import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: [],
  splitting: false,
  sourcemap: false,
  minify: false,
})
