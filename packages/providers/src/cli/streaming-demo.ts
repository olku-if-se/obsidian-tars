#!/usr/bin/env node

/**
 * Streaming architecture demo
 * Demonstrates the new llm-chat.md based streaming system
 */

import { EventEmitter } from 'events'
import type { StreamConfig } from '../config'
import { NoOpCompletionsStream, StreamQueue } from '../streaming'
import type { ToolCall } from '../streaming/types'
import { ToolExecutor, ToolManager } from '../tools'

/**
 * Mock streaming provider for testing
 */
class MockStreamingProvider {
	async *stream(messages: any[], config: StreamConfig = {}) {
		console.log('\n🚀 Starting mock stream...\n')

		const queue = new StreamQueue(undefined, config.signal)
		const emitter = new EventEmitter()

		// Create initial stream
		const initialStream = NoOpCompletionsStream.from(messages, {
			signal: config.signal,
			model: 'mock-model'
		})

		queue.push(initialStream)

		// Set up callbacks
		if (config.callbacks?.onContent) {
			emitter.on('content', config.callbacks.onContent)
		}

		if (config.callbacks?.onStreamEnd) {
			emitter.on('stream_end', config.callbacks.onStreamEnd)
		}

		// Process queue
		for await (const event of queue) {
			emitter.emit(event.type, event.data)

			if (event.type === 'content') {
				yield event.data
			} else if (event.type === 'stream_end') {
				break
			}
		}

		queue.close()
		console.log('\n✅ Stream completed\n')
	}
}

/**
 * Demo 1: Basic streaming
 */
async function demoBasicStreaming() {
	console.log('📝 Demo 1: Basic Streaming')
	console.log('─'.repeat(50))

	const provider = new MockStreamingProvider()
	const messages = [
		{ role: 'system', content: 'You are a helpful assistant' },
		{ role: 'user', content: 'Hello!' }
	]

	let accumulatedContent = ''

	const config: StreamConfig = {
		callbacks: {
			onContent: (chunk: string) => {
				process.stdout.write(chunk)
				accumulatedContent += chunk
			},
			onStreamEnd: () => {
				console.log(`\n📊 Total length: ${accumulatedContent.length} characters`)
			}
		}
	}

	for await (const _chunk of provider.stream(messages, config)) {
		// Content is handled by callback
	}
}

/**
 * Demo 2: StreamQueue with multiple streams
 */
async function demoStreamQueue() {
	console.log('📝 Demo 2: StreamQueue with Multiple Streams')
	console.log('─'.repeat(50))

	const controller = new AbortController()
	const queue = new StreamQueue(undefined, controller.signal)

	// Add first stream
	const stream1 = NoOpCompletionsStream.from([], {
		signal: controller.signal,
		model: 'stream-1'
	})
	queue.push(stream1)

	// Add second stream after a delay
	setTimeout(() => {
		console.log('\n🔄 Pushing second stream to queue...\n')
		const stream2 = NoOpCompletionsStream.from([], {
			signal: controller.signal,
			model: 'stream-2'
		})
		queue.push(stream2)
		queue.close()
	}, 100)

	let streamCount = 0
	for await (const event of queue) {
		if (event.type === 'content') {
			streamCount++
			console.log(`📦 Stream ${streamCount}: ${event.data}`)
		}
	}

	console.log(`\n✅ Processed ${streamCount} stream(s)\n`)
}

/**
 * Demo 3: ToolManager with EventEmitter
 */
async function demoToolManager() {
	console.log('📝 Demo 3: ToolManager with Tool Execution')
	console.log('─'.repeat(50))

	const toolManager = new ToolManager()

	// Register a weather tool handler
	toolManager.registerHandler('get_weather', async (toolCall: ToolCall) => {
		const args = JSON.parse(toolCall.function.arguments)
		console.log(`🔧 Executing get_weather for ${args.location}`)

		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 100))

		return {
			role: 'tool' as const,
			tool_call_id: toolCall.id,
			content: `The weather in ${args.location} is 72°F and sunny.`
		}
	})

	// Execute tool call
	const toolCall: ToolCall = {
		id: 'call_123',
		type: 'function',
		function: {
			name: 'get_weather',
			arguments: JSON.stringify({ location: 'Boston, MA' })
		}
	}

	console.log('\n📞 Calling tool: get_weather')
	const response = await toolManager.execute(toolCall)
	console.log('📨 Tool response:', response.content)
	console.log('\n✅ Tool execution complete\n')
}

/**
 * Demo 4: Error handling and retries
 */
async function demoErrorHandling() {
	console.log('📝 Demo 4: Error Handling and Retries')
	console.log('─'.repeat(50))

	let attemptCount = 0
	const maxRetries = 3

	const simulateRetryableOperation = async () => {
		attemptCount++
		console.log(`   Attempt ${attemptCount}/${maxRetries + 1}`)

		if (attemptCount < 3) {
			throw new Error('Network timeout - retryable')
		}

		return 'Success!'
	}

	try {
		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				const result = await simulateRetryableOperation()
				console.log(`✅ ${result}`)
				break
			} catch (error) {
				if (attempt === maxRetries) {
					throw error
				}

				const delay = 100 * 2 ** attempt
				console.log(`   ⏳ Retrying in ${delay}ms...`)
				await new Promise((resolve) => setTimeout(resolve, delay))
			}
		}
	} catch (error) {
		console.log(`❌ Failed after ${maxRetries} retries`)
	}

	console.log('')
}

/**
 * Demo 5: Callbacks and event handling
 */
async function demoCallbacks() {
	console.log('📝 Demo 5: Runtime Callbacks')
	console.log('─'.repeat(50))

	const emitter = new EventEmitter()
	const events: string[] = []

	// Register callbacks
	emitter.on('stream_start', () => {
		events.push('stream_start')
		console.log('📡 Stream started')
	})

	emitter.on('content', (chunk: string) => {
		events.push('content')
		console.log(`📝 Content: ${chunk}`)
	})

	emitter.on('stream_end', () => {
		events.push('stream_end')
		console.log('🏁 Stream ended')
	})

	// Simulate events
	emitter.emit('stream_start')
	emitter.emit('content', 'Hello')
	emitter.emit('content', ' World')
	emitter.emit('stream_end')

	console.log(`\n✅ Total events: ${events.length}\n`)
}

/**
 * Main demo runner
 */
async function runStreamingDemo() {
	console.log('\n🎯 LLM Streaming Architecture Demo\n')
	console.log('Testing new llm-chat.md based streaming system')
	console.log('='.repeat(50))
	console.log('')

	try {
		await demoBasicStreaming()
		await demoStreamQueue()
		await demoToolManager()
		await demoErrorHandling()
		await demoCallbacks()

		console.log('✅ All demos completed successfully!')
		console.log('\n📚 Key Components:')
		console.log('   • StreamQueue - Multi-stream management')
		console.log('   • CompletionsStream - Provider-agnostic streaming')
		console.log('   • ToolManager - EventEmitter-based tool execution')
		console.log('   • Callbacks - Runtime event hooks')
		console.log('   • Error Handling - Retry logic with backoff')
		console.log('\n🔗 Next Steps:')
		console.log('   • Migrate existing providers to new architecture')
		console.log('   • Implement MCP adapter')
		console.log('   • Add comprehensive tests')
		console.log('')
	} catch (error) {
		console.error('\n❌ Demo failed:', error)
		process.exit(1)
	}
}

// Handle graceful shutdown
process.on('SIGINT', () => {
	console.log('\n\n👋 Demo interrupted by user')
	process.exit(0)
})

process.on('SIGTERM', () => {
	console.log('\n\n👋 Demo terminated')
	process.exit(0)
})

// Run demo if this file is executed directly
if (require.main === module) {
	runStreamingDemo().catch((error) => {
		console.error('❌ Demo failed:', error)
		process.exit(1)
	})
}

export { runStreamingDemo }
