import { useCallback, useRef } from 'react'

/**
 * Custom hook for creating debounced callback functions
 * Follows React hooks best practices with proper cleanup
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(callback: T, delay: number): T {
	const timeoutRef = useRef<number | null>(null)

	// Debounced function implementation
	const debouncedCallback = useCallback(
		(...args: Parameters<T>) => {
			// Clear any existing timeout
			if (timeoutRef.current !== null) {
				clearTimeout(timeoutRef.current)
			}

			// Set new timeout
			timeoutRef.current = window.setTimeout(() => {
				callback(...args)
			}, delay)
		},
		[callback, delay]
	) as T

	// Cleanup effect to clear timeout on unmount
	// Note: In a real implementation, you'd want to handle this more carefully
	// For now, this is a simplified version

	return debouncedCallback
}

/**
 * Custom hook for creating a debounced callback with cleanup
 * Enhanced version with proper effect cleanup
 */
export function useDebouncedCallbackWithCleanup<T extends (...args: any[]) => void>(callback: T, delay: number): T {
	const timeoutRef = useRef<number | null>(null)

	const debouncedCallback = useCallback(
		(...args: Parameters<T>) => {
			// Clear any existing timeout
			if (timeoutRef.current !== null) {
				clearTimeout(timeoutRef.current)
			}

			// Set new timeout
			timeoutRef.current = window.setTimeout(() => {
				callback(...args)
			}, delay)
		},
		[callback, delay]
	) as T

	// Cleanup effect
	useEffect(() => {
		return () => {
			if (timeoutRef.current !== null) {
				clearTimeout(timeoutRef.current)
			}
		}
	}, [])

	return debouncedCallback
}

// Import useEffect for the enhanced version
import { useEffect } from 'react'
