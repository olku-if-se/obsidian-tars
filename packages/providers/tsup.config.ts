import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['cjs', 'esm'],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
	outDir: 'dist',
	external: ['@tars/logger'],
	onSuccess: async () => {
		console.log('✅ @tars/providers build completed successfully')
	}
})
