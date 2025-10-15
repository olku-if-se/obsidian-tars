import { useState, useCallback, useRef, useEffect } from 'react'

export interface AsyncOperationState<T = any> {
	loading: boolean
	data: T | null
	error: Error | null
	lastUpdated: Date | null
}

export interface AsyncOperationOptions {
	onSuccess?: (data: any) => void
	onError?: (error: Error) => void
	onComplete?: () => void
	immediate?: boolean
}

// Hook for managing async operations with loading states, error handling, and caching
export function useAsyncOperation<T = any>(
	asyncFn: () => Promise<T>,
	options: AsyncOperationOptions = {}
) {
	const [state, setState] = useState<AsyncOperationState<T>>({
		loading: false,
		data: null,
		error: null,
		lastUpdated: null
	})

	const { onSuccess, onError, onComplete, immediate = false } = options
	const mountedRef = useRef(true)
	const asyncFnRef = useRef(asyncFn)

	// Update ref if function changes
	useEffect(() => {
		asyncFnRef.current = asyncFn
	}, [asyncFn])

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			mountedRef.current = false
		}
	}, [])

	const execute = useCallback(async (...args: any[]): Promise<T | null> => {
		setState(prev => ({ ...prev, loading: true, error: null }))

		try {
			const result = await asyncFnRef.current(...args)

			if (mountedRef.current) {
				setState({
					loading: false,
					data: result,
					error: null,
					lastUpdated: new Date()
				})

				onSuccess?.(result)
				onComplete?.()
			}

			return result
		} catch (error) {
			const errorObj = error instanceof Error ? error : new Error(String(error))

			if (mountedRef.current) {
				setState(prev => ({
					...prev,
					loading: false,
					error: errorObj
				}))

				onError?.(errorObj)
				onComplete?.()
			}

			return null
		}
	}, [onSuccess, onError, onComplete])

	const reset = useCallback(() => {
		setState({
			loading: false,
			data: null,
			error: null,
			lastUpdated: null
		})
	}, [])

	const clearError = useCallback(() => {
		setState(prev => ({ ...prev, error: null }))
	}, [])

	// Execute immediately if requested
	useEffect(() => {
		if (immediate) {
			execute()
		}
	}, [immediate, execute])

	return {
		...state,
		execute,
		reset,
		clearError,
		isIdle: !state.loading && !state.error && !state.data,
		hasData: state.data !== null,
		hasError: state.error !== null
	}
}

// Hook for managing multiple async operations
export function useAsyncOperations<T = any>(operations: Record<string, () => Promise<T>>) {
	const [states, setStates] = useState<Record<string, AsyncOperationState<T>>>(() =>
		Object.keys(operations).reduce((acc, key) => ({
			...acc,
			[key]: { loading: false, data: null, error: null, lastUpdated: null }
		}), {})
	)

	const execute = useCallback(async (key: string, ...args: any[]) => {
		const operation = operations[key]
		if (!operation) {
			throw new Error(`Operation "${key}" not found`)
		}

		setStates(prev => ({
			...prev,
			[key]: { ...prev[key], loading: true, error: null }
		}))

		try {
			const result = await operation(...args)

			setStates(prev => ({
				...prev,
				[key]: {
					loading: false,
					data: result,
					error: null,
					lastUpdated: new Date()
				}
			}))

			return result
		} catch (error) {
			const errorObj = error instanceof Error ? error : new Error(String(error))

			setStates(prev => ({
				...prev,
				[key]: { ...prev[key], loading: false, error: errorObj }
			}))

			throw errorObj
		}
	}, [operations])

	const reset = useCallback((key?: string) => {
		if (key) {
			setStates(prev => ({
				...prev,
				[key]: { loading: false, data: null, error: null, lastUpdated: null }
			}))
		} else {
			setStates(Object.keys(operations).reduce((acc, key) => ({
				...acc,
				[key]: { loading: false, data: null, error: null, lastUpdated: null }
			}), {}))
		}
	}, [operations])

	return {
		states,
		execute,
		reset,
		getState: (key: string) => states[key],
		isLoading: (key: string) => states[key]?.loading || false,
		hasError: (key: string) => states[key]?.error !== null,
		getData: (key: string) => states[key]?.data
	}
}