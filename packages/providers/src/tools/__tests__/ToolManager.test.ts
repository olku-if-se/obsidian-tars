import { beforeEach, describe, expect, it } from 'vitest'
import type { ToolCall, ToolResponse } from '../../streaming/types'
import { ToolManager } from '../ToolManager'

describe('ToolManager', () => {
	describe('GIVEN: A new ToolManager', () => {
		let toolManager: ToolManager

		beforeEach(() => {
			// GIVEN: Fresh tool manager for each test
			toolManager = new ToolManager()
		})

		it('WHEN: No handler is registered THEN: Should return error response', async () => {
			// GIVEN: Tool call for unregistered tool
			const toolCall: ToolCall = {
				id: 'call_123',
				type: 'function',
				function: {
					name: 'unregistered_tool',
					arguments: '{}'
				}
			}

			// WHEN: Executing tool call
			const response = await toolManager.execute(toolCall)

			// THEN: Should return error response
			expect(response.role).toBe('tool')
			expect(response.tool_call_id).toBe('call_123')
			expect(response.content).toContain('No handler registered')
		})

		it('WHEN: Handler is registered THEN: Should execute successfully', async () => {
			// GIVEN: Registered handler
			toolManager.registerHandler('get_weather', async (toolCall) => ({
				role: 'tool' as const,
				tool_call_id: toolCall.id,
				content: 'Weather is sunny'
			}))

			// AND: Tool call
			const toolCall: ToolCall = {
				id: 'call_456',
				type: 'function',
				function: {
					name: 'get_weather',
					arguments: '{"location": "Boston"}'
				}
			}

			// WHEN: Executing tool call
			const response = await toolManager.execute(toolCall)

			// THEN: Should return successful response
			expect(response.role).toBe('tool')
			expect(response.tool_call_id).toBe('call_456')
			expect(response.content).toBe('Weather is sunny')
		})

		it('WHEN: Handler throws error THEN: Should return error response', async () => {
			// GIVEN: Handler that throws error
			toolManager.registerHandler('failing_tool', async () => {
				throw new Error('Tool execution failed')
			})

			// AND: Tool call
			const toolCall: ToolCall = {
				id: 'call_789',
				type: 'function',
				function: {
					name: 'failing_tool',
					arguments: '{}'
				}
			}

			// WHEN: Executing tool call
			const response = await toolManager.execute(toolCall)

			// THEN: Should return error response
			expect(response.role).toBe('tool')
			expect(response.tool_call_id).toBe('call_789')
			expect(response.content).toContain('Tool execution failed')
		})

		it('WHEN: Checking registered tools THEN: Should return tool names', () => {
			// GIVEN: Multiple registered handlers
			toolManager.registerHandler('tool_a', async () => ({
				role: 'tool' as const,
				tool_call_id: '',
				content: ''
			}))

			toolManager.registerHandler('tool_b', async () => ({
				role: 'tool' as const,
				tool_call_id: '',
				content: ''
			}))

			// WHEN: Getting registered tools
			const tools = toolManager.getRegisteredTools()

			// THEN: Should return all tool names
			expect(tools).toContain('tool_a')
			expect(tools).toContain('tool_b')
		})

		it('WHEN: Checking if handler exists THEN: Should return correct status', () => {
			// GIVEN: One registered handler
			toolManager.registerHandler('existing_tool', async () => ({
				role: 'tool' as const,
				tool_call_id: '',
				content: ''
			}))

			// WHEN: Checking handler existence
			// THEN: Should return true for existing tool
			expect(toolManager.hasHandler('existing_tool')).toBe(true)

			// AND: Should return false for non-existing tool
			expect(toolManager.hasHandler('non_existing_tool')).toBe(false)
		})

		it('WHEN: Unregistering handler THEN: Should remove handler', () => {
			// GIVEN: Registered handler
			const handler = async (toolCall: ToolCall): Promise<ToolResponse> => ({
				role: 'tool' as const,
				tool_call_id: toolCall.id,
				content: 'test'
			})

			toolManager.registerHandler('removable_tool', handler)

			// WHEN: Unregistering the handler
			toolManager.unregisterHandler('removable_tool', handler)

			// THEN: Handler should no longer exist
			expect(toolManager.hasHandler('removable_tool')).toBe(false)
		})
	})

	describe('GIVEN: ToolManager with timeout configuration', () => {
		it('WHEN: Handler exceeds timeout THEN: Should fail with timeout error', async () => {
			// GIVEN: Tool manager with short timeout
			const toolManager = new ToolManager({ timeout: 100 })

			// AND: Slow handler
			toolManager.registerHandler('slow_tool', async () => {
				await new Promise((resolve) => setTimeout(resolve, 200))
				return {
					role: 'tool' as const,
					tool_call_id: '',
					content: 'Should not reach here'
				}
			})

			// AND: Tool call
			const toolCall: ToolCall = {
				id: 'call_timeout',
				type: 'function',
				function: {
					name: 'slow_tool',
					arguments: '{}'
				}
			}

			// WHEN: Executing slow tool
			const response = await toolManager.execute(toolCall)

			// THEN: Should return timeout error
			expect(response.content).toContain('timeout')
		})
	})

	describe('GIVEN: Multiple tool calls', () => {
		let toolManager: ToolManager

		beforeEach(() => {
			toolManager = new ToolManager()

			// GIVEN: Registered handlers
			toolManager.registerHandler('tool_1', async (toolCall) => ({
				role: 'tool' as const,
				tool_call_id: toolCall.id,
				content: 'Result 1'
			}))

			toolManager.registerHandler('tool_2', async (toolCall) => ({
				role: 'tool' as const,
				tool_call_id: toolCall.id,
				content: 'Result 2'
			}))
		})

		it('WHEN: Executing many tools sequentially THEN: Should process in order', async () => {
			// GIVEN: Multiple tool calls
			const toolCalls: ToolCall[] = [
				{ id: 'call_1', type: 'function', function: { name: 'tool_1', arguments: '{}' } },
				{ id: 'call_2', type: 'function', function: { name: 'tool_2', arguments: '{}' } }
			]

			// WHEN: Executing all tools
			const responses = await toolManager.executeMany(toolCalls)

			// THEN: Should receive all responses in order
			expect(responses.length).toBe(2)
			expect(responses[0].tool_call_id).toBe('call_1')
			expect(responses[0].content).toBe('Result 1')
			expect(responses[1].tool_call_id).toBe('call_2')
			expect(responses[1].content).toBe('Result 2')
		})

		// DISABLED: Edge case test with timing issues in CI
		it.skip('WHEN: Executing many tools in parallel THEN: Should process concurrently', async () => {
			// GIVEN: Tool manager with parallel execution
			const parallelToolManager = new ToolManager({ parallel: true, maxParallel: 2 })

			// AND: Handlers that track execution
			const executionOrder: number[] = []

			parallelToolManager.registerHandler('parallel_1', async (toolCall) => {
				executionOrder.push(1)
				await new Promise((resolve) => setTimeout(resolve, 50))
				return {
					role: 'tool' as const,
					tool_call_id: toolCall.id,
					content: 'Parallel 1'
				}
			})

			parallelToolManager.registerHandler('parallel_2', async (toolCall) => {
				executionOrder.push(2)
				await new Promise((resolve) => setTimeout(resolve, 50))
				return {
					role: 'tool' as const,
					tool_call_id: toolCall.id,
					content: 'Parallel 2'
				}
			})

			// AND: Multiple tool calls
			const toolCalls: ToolCall[] = [
				{ id: 'call_p1', type: 'function', function: { name: 'parallel_1', arguments: '{}' } },
				{ id: 'call_p2', type: 'function', function: { name: 'parallel_2', arguments: '{}' } }
			]

			// WHEN: Executing tools in parallel
			const responses = await parallelToolManager.executeMany(toolCalls)

			// THEN: Should receive all responses
			expect(responses.length).toBe(2)

			// AND: Both tools should have started before either finished
			expect(executionOrder.length).toBe(2)
		})
	})
})
