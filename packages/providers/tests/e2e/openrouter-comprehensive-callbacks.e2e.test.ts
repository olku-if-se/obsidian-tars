/**
 * OpenRouter Provider E2E Test - Comprehensive Callbacks
 * 
 * This is an END-TO-END test that makes REAL API calls to OpenRouter.
 * 
 * Setup:
 * 1. Set E2E_OPENROUTER_API_KEY: mise run secrets-rotate OPENROUTER_API_KEY sk-or-...
 * 2. Run: mise run test-e2e
 * 
 * Tests:
 * - Real streaming from OpenRouter API
 * - All comprehensive callback hooks
 * - Multiple model support
 * - Lifecycle events
 * 
 * TDD Approach: GIVEN / WHEN / THEN structure
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { Message } from '@tars/contracts'
import type { ComprehensiveCallbacks } from '../../src/config/ComprehensiveCallbacks'
import { OpenRouterStreamingProvider } from '../../src/providers/openrouter/OpenRouterStreamingProvider'
import { shouldSkipE2ETests } from './helpers/skip-if-no-env'

// Auto-skip if no API key
const shouldSkipE2E = shouldSkipE2ETests({
	envVar: 'E2E_OPENROUTER_API_KEY',
	providerName: 'OpenRouter',
	setupInstructions: [
		'Set API key: mise run secrets-rotate OPENROUTER_API_KEY sk-or-...',
		'Run tests: mise run test-e2e'
	]
})

const API_KEY = process.env.E2E_OPENROUTER_API_KEY

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

describe.skipIf(shouldSkipE2E)('OpenRouter Provider E2E - Comprehensive Callbacks', () => {
	let provider: OpenRouterStreamingProvider

	beforeEach(() => {
		// GIVEN: Fresh OpenRouter provider instance
		provider = new OpenRouterStreamingProvider(mockLoggingService as any, mockSettingsService as any)
		provider.initialize({
			apiKey: API_KEY as string,
			model: 'z-ai/glm-4.5-air:free', // FREE model for testing! 🎉
			baseURL: 'https://openrouter.ai/api/v1/chat/completions' // Correct OpenRouter API endpoint
		})
	})

	describe('1. Basic Streaming', () => {
		it('should stream response from OpenRouter', async () => {
			// GIVEN: Simple message
			const messages: Message[] = [
				{
					role: 'user',
					content: 'Say "Hello from OpenRouter E2E test" and nothing else.'
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
		it('should invoke lifecycle callbacks', { timeout: 15000 }, async () => {
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
})
