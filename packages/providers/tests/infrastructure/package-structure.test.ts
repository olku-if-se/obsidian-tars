/**
 * Basic tests to verify package structure without importing dependencies
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Providers Package Structure', () => {
	it('should have package.json with correct fields', () => {
		// Infrastructure test - validates build system, no business value
		const packageJsonPath = resolve(__dirname, '../../package.json')
		const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

		expect(packageJson.name).toBe('@tars/providers')
		expect(packageJson.main).toBe('dist/index.js')
		expect(packageJson.types).toBe('dist/index.d.ts')
		expect(packageJson.scripts).toHaveProperty('test')
		expect(packageJson.scripts).toHaveProperty('build')
	})

	it('should have TypeScript source files', () => {
		const indexTsPath = resolve(__dirname, '../../src/index.ts')
		expect(() => readFileSync(indexTsPath, 'utf-8')).not.toThrow()
	})

	it('should have built output files', () => {
		const indexJsPath = resolve(__dirname, '../../dist/index.js')
		const indexMjsPath = resolve(__dirname, '../../dist/index.mjs')

		expect(() => readFileSync(indexJsPath, 'utf-8')).not.toThrow()
		expect(() => readFileSync(indexMjsPath, 'utf-8')).not.toThrow()
	})

	it('should export expected vendor modules in source', () => {
		const srcPath = resolve(__dirname, '../../src/implementations')
		const vendorFiles = ['openAI.ts', 'claude.ts', 'azure.ts', 'ollama.ts', 'openRouter.ts', 'deepSeek.ts', 'gemini.ts']

		for (const vendorFile of vendorFiles) {
			const filePath = resolve(srcPath, vendorFile)
			expect(() => readFileSync(filePath, 'utf-8')).not.toThrow()
		}
	})

	it('should have proper exports in index.ts', () => {
		const indexPath = resolve(__dirname, '../../src/index.ts')
		const indexContent = readFileSync(indexPath, 'utf-8')

		// Check that key exports are present
		expect(indexContent).toContain('export')
		expect(indexContent).toContain('export * from')
		expect(indexContent).toContain('implementations')
		expect(indexContent).toContain('i18n')
		expect(indexContent).toContain('utils')
		expect(indexContent).toContain('factories')

		// Check for DI-specific exports
		expect(indexContent).toContain('ClaudeDIProvider')
		expect(indexContent).toContain('OpenAIDIProvider')
		expect(indexContent).toContain('OllamaDIProvider')
		expect(indexContent).toContain('DIProviderFactory')
	})

	it('should have organized folder structure', () => {
		const srcPath = resolve(__dirname, '../../src')

		// Check that organized folders exist
		const interfacesPath = resolve(srcPath, 'interfaces')
		const implementationsPath = resolve(srcPath, 'implementations')
		const i18nPath = resolve(srcPath, 'i18n')
		const utilsPath = resolve(srcPath, 'utils')

		expect(() => readFileSync(resolve(interfacesPath, 'base.ts'), 'utf-8')).not.toThrow()
		expect(() => readFileSync(resolve(implementationsPath, 'index.ts'), 'utf-8')).not.toThrow()
		expect(() => readFileSync(resolve(i18nPath, 'i18n.ts'), 'utf-8')).not.toThrow()
		expect(() => readFileSync(resolve(utilsPath, 'utils.ts'), 'utf-8')).not.toThrow()
	})

	it('should have MCP integration interfaces', () => {
		const interfacesPath = resolve(__dirname, '../../src/interfaces')
		const baseContent = readFileSync(resolve(interfacesPath, 'base.ts'), 'utf-8')

		// Check that MCP interfaces are present
		expect(baseContent).toContain('MCPToolInjector')
		expect(baseContent).toContain('MCPIntegration')
		expect(baseContent).toContain('injectTools')
	})
})
