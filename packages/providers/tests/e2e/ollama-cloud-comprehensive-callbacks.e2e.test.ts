/**
 * Ollama Cloud Provider E2E Test - Comprehensive Callbacks
 * 
 * This is an END-TO-END test that makes REAL API calls to Ollama Cloud.
 * 
 * Ollama Cloud API:
 * - Endpoint: https://ollama.com/api/v1 (OpenAI-compatible)
 * - Models: gpt-oss:120b, etc.
 * - Auth: Bearer token
 * 
 * Setup:
 * 1. Set OLLAMA_CLOUD_API_KEY: mise run secrets-rotate OLLAMA_CLOUD_API_KEY your-key
 * 2. Run: mise run test-e2e
 * 
 * Tests:
 * - Real streaming from Ollama Cloud API
 * - All comprehensive callback hooks
 * - OpenAI-compatible API
 * - Lifecycle events
 * 
 * TDD Approach: GIVEN / WHEN / THEN structure
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { Message } from '@tars/contracts'
import type { ComprehensiveCallbacks } from '../../src/config/ComprehensiveCallbacks'
import { OllamaStreamingProvider } from '../../src/providers/ollama/OllamaStreamingProvider'
import { shouldSkipE2ETests } from './helpers/skip-if-no-env'

// Auto-skip if no API key
const shouldSkipE2E = shouldSkipE2ETests({
	envVar: 'OLLAMA_CLOUD_API_KEY',
	providerName: 'Ollama Cloud',
	setupInstructions: [
		'Set API key: mise run secrets-rotate OLLAMA_CLOUD_API_KEY your-key',
		'Run tests: mise run test-e2e'
	]
})

const API_KEY = process.env.OLLAMA_CLOUD_API_KEY

// Mock services
const mockLoggingService = {
	debug: () => {},
	info: () => {},
	warn: () => {},
	error: (...args: any[]) => console.error('[ERROR]', ...args)
}

const mockSettingsService = {
	get: (key: string, defaultValue?: any) => defaultValue,
	set: async () => {},
	has: () => false,
	watch: () => () => {},
	remove: async () => {},
	clear: async () => {},
	getAll: () => ({})
}

describe.skipIf(shouldSkipE2E)('Ollama Cloud Provider E2E - Comprehensive Callbacks', () => {
	let provider: OllamaStreamingProvider

	beforeEach(() => {
		// GIVEN: Fresh Ollama Cloud provider instance
		provider = new OllamaStreamingProvider(mockLoggingService as any, mockSettingsService as any)
		provider.initialize({
			apiKey: API_KEY as string,
			baseURL: 'https://ollama.com/api/v1', // Ollama Cloud uses OpenAI-compatible v1 endpoint
			model: 'gpt-oss:20b-cloud', // Smallest cloud model for cost-effective testing
			temperature: 0.7
		})
	})

	describe('1. Basic Streaming', () => {
		it('should stream response from Ollama Cloud', async () => {
			// GIVEN: Simple message
			const messages: Message[] = [
				{
					role: 'user',
					content: 'Say "Hello from Ollama Cloud E2E test" and nothing else.'
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
			// Silent on success
		})
	})

	describe('2. Lifecycle Event Callbacks', () => {
		it('should invoke lifecycle callbacks', async () => {
			// GIVEN: Simple message
			const messages: Message[] = [
				{
					role: 'user',
					content: 'Say "testing lifecycle"'
				}
			]

			const lifecycle: string[] = []

			const callbacks: ComprehensiveCallbacks = {
				onStreamStart: async () => {
					lifecycle.push('start')
				},
				
				onStreamEnd: async () => {
					lifecycle.push('end')
				}
			}

			// WHEN: Streaming with lifecycle callbacks
			for await (const chunk of provider.stream(messages, { callbacks })) {
				// Just consume chunks
			}

			// THEN: Should have called lifecycle events in order
			expect(lifecycle).toEqual(['start', 'end'])
			// Silent on success
		})
	})

	describe('3. Local vs Cloud Compatibility', () => {
		it('should work with cloud endpoint', async () => {
			// GIVEN: Message for cloud endpoint
			const messages: Message[] = [
				{
					role: 'user',
					content: 'What is 2+2? Answer with just the number.'
				}
			]

			let fullResponse = ''

			// WHEN: Streaming from cloud
			for await (const chunk of provider.stream(messages, {})) {
				fullResponse += chunk
			}

			// THEN: Should get response
			expect(fullResponse).toContain('4')
			// Silent on success
		})
	})
})
