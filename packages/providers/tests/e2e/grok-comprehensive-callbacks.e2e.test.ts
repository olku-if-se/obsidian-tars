/**
 * Grok Provider E2E Test - Comprehensive Callbacks
 *
 * This is an END-TO-END test that makes REAL API calls to Grok (xAI).
 *
 * Setup:
 * 1. Set E2E_GROK_API_KEY: mise run secrets-rotate E2E_GROK_API_KEY xai-your-key
 * 2. Run: mise run test-e2e
 *
 * Tests:
 * - Real streaming from Grok API
 * - All comprehensive callback hooks
 * - Tool injection and execution
 * - Message transformation
 * - Chunk pre/post processing
 * - Lifecycle events
 *
 * TDD Approach: GIVEN / WHEN / THEN structure
 */

import type { Message } from '@tars/contracts'
import { beforeEach, describe, expect, it } from 'vitest'
import type { ComprehensiveCallbacks } from '../../src/config/ComprehensiveCallbacks'
import { GrokStreamingProvider } from '../../src/providers/grok/GrokStreamingProvider'
import { shouldSkipE2ETests } from './helpers/skip-if-no-env'

// Auto-skip if no API key
const shouldSkipE2E = shouldSkipE2ETests({
	envVar: 'E2E_GROK_API_KEY',
	providerName: 'Grok',
	setupInstructions: ['Set API key: mise run secrets-rotate E2E_GROK_API_KEY xai-...', 'Run tests: mise run test-e2e']
})

const API_KEY = process.env.E2E_GROK_API_KEY

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

describe.skipIf(shouldSkipE2E)('Grok Provider E2E - Comprehensive Callbacks', () => {
	let provider: GrokStreamingProvider

	beforeEach(() => {
		// GIVEN: Fresh Grok provider instance
		provider = new GrokStreamingProvider(mockLoggingService as any, mockSettingsService as any)
		provider.initialize({
			apiKey: API_KEY as string,
			model: 'grok-4-fast-reasoning', // Fast reasoning model for testing
			baseURL: 'https://api.x.ai/v1/chat/completions' // Correct Grok API endpoint
		})
	})

	describe('1. Basic Streaming', () => {
		it('should stream response from Grok', async () => {
			// GIVEN: Simple message
			const messages: Message[] = [
				{
					role: 'user',
					content: 'Say "Hello from Grok E2E test" and nothing else.'
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
})
