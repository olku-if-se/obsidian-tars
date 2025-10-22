/**
 * TEMPLATE: Provider E2E Test with Auto-Skip
 * 
 * Copy this template to create E2E tests for other providers.
 * Replace PROVIDER_NAME with actual provider (e.g., Anthropic, Grok, etc.)
 * 
 * Features:
 * - Auto-skips if API key not set
 * - Helpful console messages
 * - Follows TDD GIVEN/WHEN/THEN pattern
 * - Tests comprehensive callbacks
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { Message } from '@tars/contracts'
import type { ComprehensiveCallbacks } from '../../src/config/ComprehensiveCallbacks'
import { shouldSkipE2ETests } from './helpers/skip-if-no-env'

// Import your provider
// import { YourProviderStreamingProvider } from '../../src/providers/yourprovider/YourProviderStreamingProvider'

// Mock services
const mockLoggingService = {
	debug: (...args: any[]) => console.log('[DEBUG]', ...args),
	info: (...args: any[]) => console.log('[INFO]', ...args),
	warn: (...args: any[]) => console.warn('[WARN]', ...args),
	error: (...args: any[]) => console.error('[ERROR]', ...args)
}

const mockSettingsService = {
	get: (key: string, defaultValue?: any) => defaultValue,
	set: async () => {},
	has: () => false,
	watch: () => () => {},
	remove: async () => {},
	clear: async () => {},
	getAll: () => ({}),
	setAll: async () => {},
	initialize: async () => {}
}

// Auto-skip if API key not set
const shouldSkipE2E = shouldSkipE2ETests({
	envVar: 'PROVIDER_NAME_API_KEY',  // e.g., 'ANTHROPIC_API_KEY'
	providerName: 'ProviderName',     // e.g., 'Anthropic'
	setupInstructions: [
		'Set API key: mise run secrets-init && mise run secrets-edit',
		'Run tests:   mise run test-e2e',
		'Or directly: PROVIDER_NAME_API_KEY=your-key npm test -- provider-*.e2e.test.ts'
	]
})

const API_KEY = process.env.PROVIDER_NAME_API_KEY

describe.skipIf(shouldSkipE2E)('ProviderName E2E - Comprehensive Callbacks', () => {
	let provider: any  // Replace with: YourProviderStreamingProvider

	beforeEach(() => {
		// GIVEN: Fresh provider instance
		// provider = new YourProviderStreamingProvider(mockLoggingService as any, mockSettingsService as any)
		// provider.initialize({
		//   apiKey: API_KEY as string,
		//   model: 'your-cheapest-model',
		//   baseURL: 'https://api.provider.com/v1',
		//   temperature: 0.7
		// })
	})

	describe('1. Basic Streaming', () => {
		it('should stream response from API', async () => {
			// GIVEN: Simple message
			const messages: Message[] = [
				{
					role: 'user',
					content: 'Say "Hello from E2E test" and nothing else.'
				}
			]

			let fullResponse = ''
			let chunkCount = 0

			// WHEN: Streaming without callbacks
			for await (const chunk of provider.stream(messages, {})) {
				fullResponse += chunk
				chunkCount++
			}

			// THEN: Should receive response
			expect(fullResponse).toContain('Hello')
			expect(chunkCount).toBeGreaterThan(0)
			
			console.log(`✅ Received ${chunkCount} chunks`)
			console.log(`📝 Response: ${fullResponse}`)
		})
	})

	describe('2. Lifecycle Callbacks', () => {
		it('should invoke lifecycle callbacks', async () => {
			// GIVEN: Message with lifecycle callbacks
			const messages: Message[] = [
				{
					role: 'user',
					content: 'Count to 3'
				}
			]

			const lifecycle: string[] = []

			const callbacks: ComprehensiveCallbacks = {
				onStreamStart: async ({ provider, model }) => {
					lifecycle.push('start')
					console.log(`🚀 Stream started: ${provider}/${model}`)
				},
				
				onStreamEnd: async ({ provider, totalChunks, duration }) => {
					lifecycle.push('end')
					console.log(`✅ Stream ended: ${provider} - ${totalChunks} chunks in ${duration}ms`)
				}
			}

			// WHEN: Streaming with callbacks
			for await (const chunk of provider.stream(messages, { callbacks })) {
				// Just consume chunks
			}

			// THEN: Should have called lifecycle events
			expect(lifecycle).toEqual(['start', 'end'])
			console.log(`✅ Lifecycle: ${lifecycle.join(' → ')}`)
		})
	})

	describe('3. Chunk Processing', () => {
		it('should process chunks via callbacks', async () => {
			// GIVEN: Message
			const messages: Message[] = [
				{
					role: 'user',
					content: 'List 3 colors'
				}
			]

			const processedChunks: string[] = []

			const callbacks: ComprehensiveCallbacks = {
				beforeChunk: async ({ chunk, index }) => {
					console.log(`⬅️  Chunk ${index}: "${chunk}"`)
					// Transform to uppercase
					return { chunk: chunk.toUpperCase() }
				},
				
				afterChunk: async ({ processedChunk, index }) => {
					console.log(`➡️  Processed ${index}: "${processedChunk}"`)
					processedChunks.push(processedChunk)
				}
			}

			let fullResponse = ''

			// WHEN: Streaming with chunk processing
			for await (const chunk of provider.stream(messages, { callbacks })) {
				fullResponse += chunk
			}

			// THEN: Should have processed chunks
			expect(processedChunks.length).toBeGreaterThan(0)
			expect(fullResponse).toMatch(/[A-Z]/)  // Should be uppercase
			
			console.log(`✅ Processed ${processedChunks.length} chunks`)
		})
	})

	// Add more test scenarios as needed...
})
