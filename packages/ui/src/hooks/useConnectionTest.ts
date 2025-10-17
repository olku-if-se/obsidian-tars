/**
 * Custom hook for MCP server connection testing
 * Features progressive timeouts, retry logic, and AbortController cancellation
 */

import { useState, useCallback, useRef, useEffect } from 'react'

// Type definitions for connection testing
export type ConnectionTestState = 'idle' | 'testing' | 'success' | 'error'

export type ConnectionTestResult = {
	success: boolean
	message: string
	latency?: number
	errorType?: 'timeout' | 'connection' | 'validation' | 'unknown'
	step?: string
	details?: Record<string, unknown>
}

export type ConnectionTestOptions = {
	maxRetries?: number
	stdioTimeouts?: number[]
	sseTimeouts?: number[]
	retryDelays?: number[]
	onProgress?: (step: string, attempt: number) => void
	onComplete?: (result: ConnectionTestResult) => void
}

export type UseConnectionTestReturn = {
	state: ConnectionTestState
	result: ConnectionTestResult | null
	attempt: number
	testConnection: (config: any, transport: 'stdio' | 'sse') => Promise<ConnectionTestResult>
	cancelTest: () => void
	resetTest: () => void
	isTesting: boolean
}

/**
 * Custom hook for MCP server connection testing
 * @param options - Configuration options for testing behavior
 * @returns Connection test state and controls
 */
export function useConnectionTest(options: ConnectionTestOptions = {}): UseConnectionTestReturn {
	const {
		maxRetries = 3,
		stdioTimeouts = [8000, 12000, 16000], // Progressive timeouts for stdio
		sseTimeouts = [5000, 7500, 10000], // Progressive timeouts for SSE
		retryDelays = [1000, 2000, 4000], // Exponential backoff
		onProgress,
		onComplete
	} = options

	// State management
	const [state, setState] = useState<ConnectionTestState>('idle')
	const [result, setResult] = useState<ConnectionTestResult | null>(null)
	const [attempt, setAttempt] = useState(0)

	// Refs for cleanup and cancellation
	const abortControllerRef = useRef<AbortController | null>(null)
	const timeoutRef = useRef<number | null>(null)

	/**
	 * Reset test state to initial values
	 */
	const resetTest = useCallback(() => {
		setState('idle')
		setResult(null)
		setAttempt(0)

		// Cancel any ongoing operations
		if (abortControllerRef.current) {
			abortControllerRef.current.abort()
			abortControllerRef.current = null
		}

		if (timeoutRef.current !== null) {
			clearTimeout(timeoutRef.current)
			timeoutRef.current = null
		}
	}, [])

	/**
	 * Cancel ongoing test
	 */
	const cancelTest = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort()
		}

		if (timeoutRef.current !== null) {
			clearTimeout(timeoutRef.current)
			timeoutRef.current = null
		}

		setState('idle')

		setResult({
			success: false,
			message: 'Test cancelled by user',
			errorType: 'unknown',
			step: 'cancelled'
		})
	}, [])

	/**
	 * Create a timeout promise for connection testing
	 */
	const createTimeout = (timeoutMs: number): Promise<never> => {
		return new Promise((_, reject) => {
			timeoutRef.current = window.setTimeout(() => {
				reject(new Error(`Connection timeout after ${timeoutMs}ms`))
			}, timeoutMs)
		})
	}

	/**
	 * Simulate connection test for stdio transport
	 */
	const testStdioConnection = async (
		config: any,
		timeoutMs: number,
		signal: AbortSignal
	): Promise<ConnectionTestResult> => {
		const startTime = Date.now()

		// Check for abort signal
		if (signal.aborted) {
			throw new Error('Test aborted')
		}

		// Validate configuration
		if (!config.command) {
			return {
				success: false,
				message: 'Missing command in configuration',
				errorType: 'validation',
				step: 'validation'
			}
		}

		// Simulate connection test with timeout
		await new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error('Stdio connection timeout'))
			}, timeoutMs)

			// Simulate successful connection 70% of the time for demo
			setTimeout(
				() => {
					clearTimeout(timeout)
					if (Math.random() > 0.3) {
						resolve(true)
					} else {
						reject(new Error('Failed to start stdio process'))
					}
				},
				Math.min(timeoutMs * 0.6, 3000)
			) // Simulate work taking up to 60% of timeout
		})

		// Check for abort signal again
		if (signal.aborted) {
			throw new Error('Test aborted')
		}

		const latency = Date.now() - startTime

		return {
			success: true,
			message: 'Successfully connected via stdio',
			latency,
			step: 'connected',
			details: {
				transport: 'stdio',
				command: config.command,
				timeout: timeoutMs
			}
		}
	}

	/**
	 * Simulate connection test for SSE transport
	 */
	const testSSEConnection = async (
		config: any,
		timeoutMs: number,
		signal: AbortSignal
	): Promise<ConnectionTestResult> => {
		const startTime = Date.now()

		// Check for abort signal
		if (signal.aborted) {
			throw new Error('Test aborted')
		}

		// Validate configuration
		if (!config.url) {
			return {
				success: false,
				message: 'Missing URL in configuration',
				errorType: 'validation',
				step: 'validation'
			}
		}

		// Validate URL format
		try {
			new URL(config.url)
		} catch {
			return {
				success: false,
				message: 'Invalid URL format',
				errorType: 'validation',
				step: 'validation'
			}
		}

		// Simulate HTTP connection test
		await new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error('SSE connection timeout'))
			}, timeoutMs)

			// Simulate successful connection 80% of the time for demo
			setTimeout(
				() => {
					clearTimeout(timeout)
					if (Math.random() > 0.2) {
						resolve(true)
					} else {
						reject(new Error('HTTP connection failed'))
					}
				},
				Math.min(timeoutMs * 0.4, 2000)
			) // SSE connections are typically faster
		})

		// Check for abort signal again
		if (signal.aborted) {
			throw new Error('Test aborted')
		}

		const latency = Date.now() - startTime

		return {
			success: true,
			message: 'Successfully connected via SSE',
			latency,
			step: 'connected',
			details: {
				transport: 'sse',
				url: config.url,
				timeout: timeoutMs
			}
		}
	}

	/**
	 * Test connection with retry logic
	 */
	const testConnectionWithRetry = async (
		config: any,
		transport: 'stdio' | 'sse',
		currentAttempt: number
	): Promise<ConnectionTestResult> => {
		const timeouts = transport === 'stdio' ? stdioTimeouts : sseTimeouts
		const timeoutMs = timeouts[Math.min(currentAttempt, timeouts.length - 1)]

		// Create new AbortController for this attempt
		const abortController = new AbortController()
		abortControllerRef.current = abortController

		// Update progress
		setState('testing')
		onProgress?.(`Testing ${transport} connection (attempt ${currentAttempt + 1})`, currentAttempt + 1)

		try {
			// Create timeout promise
			const timeoutPromise = createTimeout(timeoutMs)

			// Create test promise
			const testPromise =
				transport === 'stdio'
					? testStdioConnection(config, timeoutMs, abortController.signal)
					: testSSEConnection(config, timeoutMs, abortController.signal)

			// Race between test and timeout
			const result = await Promise.race([testPromise, timeoutPromise])

			setState('success')
			return result
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error'

			// Determine error type
			let errorType: ConnectionTestResult['errorType'] = 'unknown'
			if (errorMessage.includes('timeout')) {
				errorType = 'timeout'
			} else if (errorMessage.includes('connection') || errorMessage.includes('HTTP')) {
				errorType = 'connection'
			} else if (
				errorMessage.includes('validation') ||
				errorMessage.includes('Missing') ||
				errorMessage.includes('Invalid')
			) {
				errorType = 'validation'
			}

			const testResult: ConnectionTestResult = {
				success: false,
				message: errorMessage,
				errorType,
				step: transport === 'stdio' ? 'stdio_test' : 'sse_test',
				details: {
					transport,
					timeout: timeoutMs,
					attempt: currentAttempt + 1
				}
			}

			// If we have retries left and this isn't a validation error, retry
			if (currentAttempt < maxRetries - 1 && errorType !== 'validation') {
				setState('error') // Show error state briefly before retry

				// Wait before retry
				const retryDelay = retryDelays[Math.min(currentAttempt, retryDelays.length - 1)]
				await new Promise((resolve) => setTimeout(resolve, retryDelay))

				// Recursive retry
				return testConnectionWithRetry(config, transport, currentAttempt + 1)
			}

			setState('error')
			return testResult
		}
	}

	/**
	 * Main connection test function
	 */
	const testConnection = useCallback(
		async (config: any, transport: 'stdio' | 'sse'): Promise<ConnectionTestResult> => {
			// Reset state
			resetTest()
			setState('testing')
			setAttempt(1)

			try {
				const result = await testConnectionWithRetry(config, transport, 0)
				setResult(result)
				onComplete?.(result)
				return result
			} catch (error) {
				const errorResult: ConnectionTestResult = {
					success: false,
					message: error instanceof Error ? error.message : 'Unknown error occurred',
					errorType: 'unknown',
					step: 'unknown'
				}

				setState('error')
				setResult(errorResult)
				onComplete?.(errorResult)
				return errorResult
			}
		},
		[resetTest, onComplete, testConnectionWithRetry, maxRetries, retryDelays, onProgress]
	)

	/**
	 * Cleanup on unmount
	 */
	useEffect(() => {
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort()
			}
			if (timeoutRef.current !== null) {
				clearTimeout(timeoutRef.current)
			}
		}
	}, [])

	return {
		state,
		result,
		attempt,
		testConnection,
		cancelTest,
		resetTest,
		isTesting: state === 'testing'
	}
}
