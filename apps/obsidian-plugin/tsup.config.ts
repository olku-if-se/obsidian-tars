import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    main: 'src/main.ts',
  },
  format: ['iife'],
  dts: false, // Obsidian plugins don't need declaration files
  clean: true,
  external: ['obsidian', '@codemirror/view', '@codemirror/state'],
  bundle: true, // Enable bundling for monorepo dependencies
  target: 'es2020',
  platform: 'browser',
  globalName: 'TarsPlugin',
  minify: false,
  outDir: 'dist',
  outExtension: () => ({ js: '.js' }),
})
