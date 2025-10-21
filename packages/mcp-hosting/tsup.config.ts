import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['cjs', 'esm'],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
	treeshake: true,
	tsconfig: './tsconfig.json',
	outDir: 'dist',
	external: [
		'@modelcontextprotocol/sdk',
		'@tars/logger',
		'@tars/contracts',
		'@tars/contracts/services/mcp-types',
		'mcp-use',
		'async-mutex',
		'p-limit',
		'debug'
	],
	onSuccess: async () => {
		console.log('✅ @tars/mcp-hosting build completed successfully')
	}
})
