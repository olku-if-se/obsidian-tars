import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['iife'],
  dts: false,
  clean: true,
  minify: process.env.NODE_ENV === 'production',
  sourcemap: process.env.NODE_ENV === 'development',
  external: ['obsidian'],
  globalName: 'module.exports',
  banner: {
    js: '// Tars Obsidian Plugin v3.6.0 - Built with tsup and Turbo'
  },
  onSuccess: process.env.NODE_ENV === 'production'
    ? 'echo "Plugin bundle ready for distribution"'
    : 'echo "Plugin bundle ready for development"'
})