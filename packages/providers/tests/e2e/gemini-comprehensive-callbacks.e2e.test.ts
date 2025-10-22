/**
 * Gemini Provider E2E Test - Comprehensive Callbacks
 * 
 * This is an END-TO-END test that makes REAL API calls to Google Gemini.
 * 
 * Setup:
 * 1. Set GEMINI_API_KEY: mise run secrets-rotate GEMINI_API_KEY your-key
 * 2. Run: mise run test-e2e
 * 
 * Tests:
 * - Real streaming from Gemini API
 * - All comprehensive callback hooks
 * - Tool calling support
 * - Message transformation
 * - Lifecycle events
 * 
 * TDD Approach: GIVEN / WHEN / THEN structure
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { Message } from '@tars/contracts'
import type { ComprehensiveCallbacks } from '../../src/config/ComprehensiveCallbacks'
import { GeminiStreamingProvider } from '../../src/providers/gemini/GeminiStreamingProvider'
import { shouldSkipE2ETests } from './helpers/skip-if-no-env'

// Auto-skip if no API key
const shouldSkipE2E = shouldSkipE2ETests({
	envVar: 'GEMINI_API_KEY',
	providerName: 'Gemini',
	setupInstructions: [
		'Set API key: mise run secrets-rotate GEMINI_API_KEY your-key',
		'Run tests: mise run test-e2e'
	]
})

const API_KEY = process.env.GEMINI_API_KEY

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

describe.skipIf(shouldSkipE2E)('Gemini Provider E2E - Comprehensive Callbacks', () => {
	let provider: GeminiStreamingProvider

	beforeEach(() => {
		// GIVEN: Fresh Gemini provider instance
		provider = new GeminiStreamingProvider(mockLoggingService as any, mockSettingsService as any)
		provider.initialize({
			apiKey: API_KEY as string,
			model: 'gemini-2.5-flash-lite', // Cheapest and fastest model
			maxOutputTokens: 1024
		})
	})

	describe('1. Basic Streaming', () => {
		it('should stream response from Gemini', async () => {
			// GIVEN: Simple message
			const messages: Message[] = [
				{
					role: 'user',
					content: 'Say "Hello from Gemini E2E test" and nothing else.'
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

	describe('3. System Message Support', () => {
		it('should handle system messages', async () => {
			// GIVEN: Messages with system prompt
			const messages: Message[] = [
				{
					role: 'system',
					content: 'You are a helpful assistant. Be very brief.'
				},
				{
					role: 'user',
					content: 'What is 2+2?'
				}
			]

			let fullResponse = ''

			// WHEN: Streaming with system message
			for await (const chunk of provider.stream(messages, {})) {
				fullResponse += chunk
			}

			// THEN: Should receive answer
			expect(fullResponse).toContain('4')
			// Silent on success
		})
	})
})
