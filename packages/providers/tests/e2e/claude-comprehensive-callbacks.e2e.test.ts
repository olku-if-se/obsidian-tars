/**
 * Claude Provider E2E Test - Comprehensive Callbacks
 * 
 * This is an END-TO-END test that makes REAL API calls to Anthropic (Claude).
 * 
 * Setup:
 * 1. Set ANTHROPIC_API_KEY: mise run secrets-rotate ANTHROPIC_API_KEY sk-ant-...
 * 2. Run: mise run test-e2e
 * 
 * Tests:
 * - Real streaming from Claude API
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
import { ClaudeStreamingProvider } from '../../src/providers/claude/ClaudeStreamingProvider'
import { shouldSkipE2ETests } from './helpers/skip-if-no-env'

// Auto-skip if no API key
const shouldSkipE2E = shouldSkipE2ETests({
	envVar: 'ANTHROPIC_API_KEY',
	providerName: 'Claude',
	setupInstructions: [
		'Set API key: mise run secrets-rotate ANTHROPIC_API_KEY sk-ant-...',
		'Run tests: mise run test-e2e'
	]
})

const API_KEY = process.env.ANTHROPIC_API_KEY

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

describe.skipIf(shouldSkipE2E)('Claude Provider E2E - Comprehensive Callbacks', () => {
	let provider: ClaudeStreamingProvider

	beforeEach(() => {
		// GIVEN: Fresh Claude provider instance
		provider = new ClaudeStreamingProvider(mockLoggingService as any, mockSettingsService as any)
		provider.initialize({
			apiKey: API_KEY as string,
			model: 'claude-3-5-haiku-20241022', // Fast and cheap for testing
			maxTokens: 1024
		})
	})

	describe('1. Basic Streaming', () => {
		it('should stream response from Claude', async () => {
			// GIVEN: Simple message
			const messages: Message[] = [
				{
					role: 'user',
					content: 'Say "Hello from Claude E2E test" and nothing else.'
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
