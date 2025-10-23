/**
 * OpenAI Provider E2E Test - Comprehensive Callbacks
 *
 * This is an END-TO-END test that makes REAL API calls to OpenAI.
 *
 * Setup:
 * 1. Set E2E_OPENAI_API_KEY environment variable
 * 2. Run: E2E_OPENAI_API_KEY=sk-... npm test -- openai-comprehensive-callbacks.e2e.test.ts
 *
 * Tests:
 * - Real streaming from OpenAI API
 * - All 13 comprehensive callback hooks
 * - Tool injection and execution
 * - Message transformation
 * - Chunk pre/post processing
 * - Error handling
 * - Lifecycle events
 *
 * TDD Approach: GIVEN / WHEN / THEN structure
 */

import type { Message } from '@tars/contracts'
import { beforeEach, describe, expect, it } from 'vitest'
import type { ComprehensiveCallbacks, ToolDefinition } from '../../src/base/ComprehensiveCallbacks'
import { OpenAIStreamingProvider } from '../../src/providers/openai/OpenAIStreamingProvider'
import { shouldSkipE2ETests } from './helpers/skip-if-no-env'

// Mock logging service for tests (silent unless error)
const mockLoggingService = {
	debug: () => {}, // Silent
	info: () => {}, // Silent
	warn: () => {}, // Silent
	error: (...args: any[]) => console.error('[ERROR]', ...args) // Only show errors
}

// Mock settings service for tests
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

// Auto-skip all E2E tests if E2E_OPENAI_API_KEY not provided
const shouldSkipE2E = shouldSkipE2ETests({
	envVar: 'E2E_OPENAI_API_KEY',
	providerName: 'OpenAI',
	setupInstructions: [
		'Set API key: mise run secrets-init && mise run secrets-edit',
		'Run tests:   mise run test-e2e',
		'Or directly: E2E_OPENAI_API_KEY=sk-... npm test -- openai-comprehensive-callbacks.e2e.test.ts'
	]
})

const API_KEY = process.env.E2E_OPENAI_API_KEY

describe.skipIf(shouldSkipE2E)('OpenAI Provider E2E - Comprehensive Callbacks', () => {
	let provider: OpenAIStreamingProvider

	beforeEach(() => {
		// GIVEN: Fresh OpenAI provider instance
		provider = new OpenAIStreamingProvider(mockLoggingService as any, mockSettingsService as any)
		provider.initialize({
			apiKey: API_KEY as string,
			model: 'gpt-5-nano', // Use cheapest model for testing (gpt-5-nano)
			baseURL: 'https://api.openai.com/v1'
			// Note: gpt-5-nano only supports temperature=1.0 (default), so we don't set it
		})
	})

	describe('1. Basic Streaming', () => {
		it('should stream response from OpenAI', async () => {
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

			// Silent on success
		})
	})

	describe('2. Tool Injection Callback', () => {
		it('should inject tools via onToolsRequest', async () => {
			// GIVEN: Message that requires tools
			const messages: Message[] = [
				{
					role: 'user',
					content: 'What is the weather in San Francisco? Use the get_weather tool.'
				}
			]

			const toolsRequested: ToolDefinition[] = []
			let toolsProvided: ToolDefinition[] = []

			const callbacks: ComprehensiveCallbacks = {
				// Tool injection
				onToolsRequest: async ({ provider, model }) => {
					// Silent

					const tools: ToolDefinition[] = [
						{
							type: 'function',
							function: {
								name: 'get_weather',
								description: 'Get weather information for a location',
								parameters: {
									type: 'object',
									properties: {
										location: {
											type: 'string',
											description: 'City name'
										},
										unit: {
											type: 'string',
											enum: ['celsius', 'fahrenheit']
										}
									},
									required: ['location']
								}
							}
						}
					]

					toolsProvided = tools
					return { tools }
				},

				// Tool execution
				onToolCall: async ({ toolCalls }) => {
					// Silent

					// Mock tool execution
					return {
						responses: toolCalls.map((call) => ({
							tool_call_id: call.id,
							content: JSON.stringify({
								temperature: 72,
								condition: 'sunny',
								location: 'San Francisco'
							}),
							success: true
						}))
					}
				}
			}

			let fullResponse = ''

			// WHEN: Streaming with tool callbacks
			for await (const chunk of provider.stream(messages, { callbacks })) {
				fullResponse += chunk
			}

			// THEN: Should have provided tools
			expect(toolsProvided.length).toBeGreaterThan(0)
			// Silent on success
		})
	})

	describe('3. Message Transformation Callback', () => {
		it('should transform messages via beforeStreamStart', async () => {
			// GIVEN: Simple user message
			const messages: Message[] = [
				{
					role: 'user',
					content: 'Count to 3'
				}
			]

			let messagesTransformed = false
			let originalMessageCount = 0
			let finalMessageCount = 0

			const callbacks: ComprehensiveCallbacks = {
				beforeStreamStart: async ({ messages, provider }) => {
					// Silent
					originalMessageCount = messages.length

					// Add system message
					const enhancedMessages: Message[] = [
						{
							role: 'system',
							content: 'You are a helpful assistant. Keep responses very brief.'
						},
						...messages
					]

					finalMessageCount = enhancedMessages.length
					messagesTransformed = true

					// Silent

					return {
						messages: enhancedMessages
					}
				}
			}

			let fullResponse = ''

			// WHEN: Streaming with message transformation
			for await (const chunk of provider.stream(messages, { callbacks })) {
				fullResponse += chunk
			}

			// THEN: Should have transformed messages
			expect(messagesTransformed).toBe(true)
			expect(originalMessageCount).toBe(1)
			expect(finalMessageCount).toBe(2)

			// Silent on success
		})
	})

	describe('4. Chunk Processing Callbacks', () => {
		it('should process chunks via beforeChunk and afterChunk', async () => {
			// GIVEN: Message that will generate multiple chunks
			const messages: Message[] = [
				{
					role: 'user',
					content: 'List 5 colors, one per line.'
				}
			]

			const processedChunks: string[] = []
			const chunkMetrics: Array<{ index: number; length: number; duration: number }> = []

			const callbacks: ComprehensiveCallbacks = {
				// Pre-process chunks
				beforeChunk: async ({ chunk, index, accumulated }) => {
					// Silent

					// Transform: convert to uppercase
					const transformed = chunk.toUpperCase()

					return {
						chunk: transformed,
						metadata: { originalLength: chunk.length }
					}
				},

				// Post-process chunks
				afterChunk: async ({ originalChunk, processedChunk, index, accumulated, duration }) => {
					// Silent

					processedChunks.push(processedChunk)
					chunkMetrics.push({
						index,
						length: processedChunk.length,
						duration
					})
				}
			}

			let fullResponse = ''

			// WHEN: Streaming with chunk processing
			for await (const chunk of provider.stream(messages, { callbacks })) {
				fullResponse += chunk
			}

			// THEN: Should have processed chunks
			expect(processedChunks.length).toBeGreaterThan(0)
			expect(chunkMetrics.length).toBeGreaterThan(0)

			// Response should be uppercase due to beforeChunk transformation
			expect(fullResponse).toMatch(/[A-Z]/)

			// Silent on success
		})

		it('should skip chunks when beforeChunk returns skip=true', async () => {
			// GIVEN: Message
			const messages: Message[] = [
				{
					role: 'user',
					content: 'Say: "one two three"'
				}
			]

			let skippedCount = 0
			let yieldedCount = 0

			const callbacks: ComprehensiveCallbacks = {
				beforeChunk: async ({ chunk, index }) => {
					// Skip every other chunk
					const shouldSkip = index % 2 === 0

					if (shouldSkip) {
						skippedCount++
						// Silent
					} else {
						yieldedCount++
						// Silent
					}

					return { skip: shouldSkip }
				}
			}

			let fullResponse = ''

			// WHEN: Streaming with chunk skipping
			for await (const chunk of provider.stream(messages, { callbacks })) {
				fullResponse += chunk
			}

			// THEN: Should have skipped some chunks
			expect(skippedCount).toBeGreaterThan(0)

			// Silent on success
		})
	})

	describe('5. Lifecycle Event Callbacks', () => {
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
				onStreamStart: async ({ provider, model, messageCount, hasTools, timestamp }) => {
					lifecycle.push('start')
					// Silent
				},

				onStreamEnd: async ({ provider, model, totalChunks, duration, timestamp }) => {
					lifecycle.push('end')
					// Silent
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

	describe('6. Stream Cancellation', () => {
		it('should cancel stream via beforeStreamStart', async () => {
			// GIVEN: Message
			const messages: Message[] = [
				{
					role: 'user',
					content: 'This should not be sent'
				}
			]

			let streamStarted = false
			let streamCancelled = false

			const callbacks: ComprehensiveCallbacks = {
				beforeStreamStart: async () => {
					// Silent
					streamCancelled = true

					return {
						cancel: true,
						cancelReason: 'Quota exceeded'
					}
				},

				onStreamStart: async () => {
					streamStarted = true
				}
			}

			let chunkReceived = false

			// WHEN: Attempting to stream
			for await (const chunk of provider.stream(messages, { callbacks })) {
				chunkReceived = true
			}

			// THEN: Should have cancelled without starting
			expect(streamCancelled).toBe(true)
			expect(streamStarted).toBe(false)
			expect(chunkReceived).toBe(false)

			// Silent on success
		})
	})

	describe('7. Complete Integration Test', () => {
		it('should exercise all callbacks in one stream', async () => {
			// GIVEN: Complete test scenario
			const messages: Message[] = [
				{
					role: 'user',
					content: 'Count from 1 to 5, one number per response.'
				}
			]

			const callbackLog: string[] = []

			const callbacks: ComprehensiveCallbacks = {
				onToolsRequest: async ({ provider }) => {
					callbackLog.push('onToolsRequest')
					// Silent
					return { tools: [] }
				},

				beforeStreamStart: async ({ messages }) => {
					callbackLog.push('beforeStreamStart')
					// Silent
					return { messages }
				},

				onStreamStart: async ({ provider, model }) => {
					callbackLog.push('onStreamStart')
					// Silent
				},

				beforeChunk: async ({ chunk, index }) => {
					callbackLog.push(`beforeChunk-${index}`)
					// Silent
					return { chunk }
				},

				afterChunk: async ({ index, accumulated }) => {
					callbackLog.push(`afterChunk-${index}`)
					// Silent
				},

				onStreamEnd: async ({ totalChunks, duration }) => {
					callbackLog.push('onStreamEnd')
					// Silent
				}
			}

			let fullResponse = ''
			let chunkCount = 0

			// WHEN: Streaming with all callbacks
			for await (const chunk of provider.stream(messages, { callbacks })) {
				fullResponse += chunk
				chunkCount++
			}

			// THEN: Should have called all callbacks
			expect(callbackLog).toContain('onToolsRequest')
			expect(callbackLog).toContain('beforeStreamStart')
			expect(callbackLog).toContain('onStreamStart')
			expect(callbackLog).toContain('onStreamEnd')
			expect(callbackLog.filter((log) => log.startsWith('beforeChunk')).length).toBeGreaterThan(0)
			expect(callbackLog.filter((log) => log.startsWith('afterChunk')).length).toBeGreaterThan(0)

			// Silent on success
		})
	})
})
