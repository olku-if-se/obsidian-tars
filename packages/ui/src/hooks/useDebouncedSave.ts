/**
 * Custom hook for intelligent debounced data persistence
 * Features change classification, immediate vs debounced saving, and conflict resolution
 */

import { useState, useCallback, useRef, useEffect } from 'react'

// Type definitions for debounced saving
export type SaveOperationType = 'immediate' | 'debounced' | 'manual'

export type SaveOperation = {
	id: string
	type: SaveOperationType
	data: unknown
	timestamp: number
	resolve: (value: boolean) => void
	reject: (error: Error) => void
}

export type SaveOptions = {
	debounceMs?: number
	maxQueueSize?: number
	retryAttempts?: number
	retryDelay?: number
	onSaveStart?: (operation: SaveOperation) => void
	onSaveSuccess?: (operation: SaveOperation) => void
	onSaveError?: (operation: SaveOperation, error: Error) => void
}

export type UseDebouncedSaveReturn<T> = {
	saveImmediate: (data: T) => Promise<boolean>
	saveDebounced: (data: T) => Promise<boolean>
	saveManual: (data: T) => Promise<boolean>
	flushPending: () => Promise<boolean>
	getPendingCount: () => number
	clearQueue: () => void
	isSaving: boolean
	lastSaveTime: number | null
	saveHistory: Array<{ timestamp: number; type: SaveOperationType; success: boolean }>
}

/**
 * Custom hook for intelligent debounced saving
 * @param saveFunction - The actual save function to call
 * @param options - Configuration options
 * @returns Save controls and state
 */
export function useDebouncedSave<T>(
	saveFunction: (data: T) => Promise<boolean>,
	options: SaveOptions = {}
): UseDebouncedSaveReturn<T> {
	const {
		debounceMs = 500,
		maxQueueSize = 50,
		retryAttempts = 3,
		retryDelay = 1000,
		onSaveStart,
		onSaveSuccess,
		onSaveError
	} = options

	// State management
	const [isSaving, setIsSaving] = useState(false)
	const [lastSaveTime, setLastSaveTime] = useState<number | null>(null)
	const [saveHistory, setSaveHistory] = useState<Array<{ timestamp: number; type: SaveOperationType; success: boolean }>>([])

	// Refs for queue and timing management
	const queueRef = useRef<SaveOperation[]>([])
	const timeoutRef = useRef<number | null>(null)
	const isProcessingRef = useRef(false)

	/**
	 * Add save operation to history
	 */
	const addToHistory = (type: SaveOperationType, success: boolean) => {
		const entry = {
			timestamp: Date.now(),
			type,
			success
		}

		setSaveHistory(prev => {
			const newHistory = [...prev, entry]
			// Keep only last 100 entries
			return newHistory.slice(-100)
		})
	}

	/**
	 * Process save operation with retry logic
	 */
	const processSaveOperation = async (operation: SaveOperation): Promise<boolean> => {
		const { data, type, resolve, reject } = operation
		let attempts = 0

		while (attempts <= retryAttempts) {
			try {
				setIsSaving(true)
				onSaveStart?.(operation)

				const success = await saveFunction(data as T)

				setIsSaving(false)
				setLastSaveTime(Date.now())
				addToHistory(type, true)
				onSaveSuccess?.(operation)

				resolve(success)
				return success
			} catch (error) {
				attempts++

				if (attempts <= retryAttempts) {
					// Wait before retry with exponential backoff
					await new Promise(resolve => setTimeout(resolve, retryDelay * 2 ** (attempts - 1)))
				} else {
					setIsSaving(false)
					addToHistory(type, false)

					const saveError = error instanceof Error ? error : new Error('Save failed')
					onSaveError?.(operation, saveError)
					reject(saveError)

					return false
				}
			}
		}

		return false
	}

	/**
	 * Process the save queue
	 */
	const processQueue = useCallback(async () => {
		if (isProcessingRef.current || queueRef.current.length === 0) {
			return
		}

		isProcessingRef.current = true

		// Process operations in order
		while (queueRef.current.length > 0) {
			const operation = queueRef.current.shift()
			if (operation) {
				await processSaveOperation(operation)
			}
		}

		isProcessingRef.current = false
	}, [saveFunction, retryAttempts, retryDelay, onSaveStart, onSaveSuccess, onSaveError])

	/**
	 * Add operation to queue and trigger processing
	 */
	const enqueueOperation = (type: SaveOperationType, data: T): Promise<boolean> => {
		return new Promise((resolve, reject) => {
			// Check queue size limit
			if (queueRef.current.length >= maxQueueSize) {
				reject(new Error('Save queue is full'))
				return
			}

			const operation: SaveOperation = {
				id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				type,
				data,
				timestamp: Date.now(),
				resolve,
				reject
			}

			queueRef.current.push(operation)

			// Trigger processing
			if (type === 'immediate') {
				// Process immediately for immediate saves
				processQueue()
			} else if (type === 'debounced') {
				// Debounce for debounced saves
				if (timeoutRef.current !== null) {
					clearTimeout(timeoutRef.current)
				}

				timeoutRef.current = window.setTimeout(() => {
					processQueue()
				}, debounceMs)
			} else {
				// Manual saves trigger immediate processing
				processQueue()
			}
		})
	}

	/**
	 * Save data immediately
	 */
	const saveImmediate = useCallback(async (data: T): Promise<boolean> => {
		try {
			return await enqueueOperation('immediate', data)
		} catch (error) {
			console.error('Immediate save failed:', error)
			return false
		}
	}, [enqueueOperation])

	/**
	 * Save data with debouncing
	 */
	const saveDebounced = useCallback(async (data: T): Promise<boolean> => {
		try {
			return await enqueueOperation('debounced', data)
		} catch (error) {
			console.error('Debounced save failed:', error)
			return false
		}
	}, [enqueueOperation])

	/**
	 * Manual save (immediate processing)
	 */
	const saveManual = useCallback(async (data: T): Promise<boolean> => {
		try {
			return await enqueueOperation('manual', data)
		} catch (error) {
			console.error('Manual save failed:', error)
			return false
		}
	}, [enqueueOperation])

	/**
	 * Flush all pending operations
	 */
	const flushPending = useCallback(async (): Promise<boolean> => {
		if (timeoutRef.current !== null) {
			clearTimeout(timeoutRef.current)
			timeoutRef.current = null
		}

		await processQueue()
		return queueRef.current.length === 0
	}, [processQueue])

	/**
	 * Get number of pending operations
	 */
	const getPendingCount = useCallback((): number => {
		return queueRef.current.length
	}, [])

	/**
	 * Clear the queue
	 */
	const clearQueue = useCallback(() => {
		// Reject all pending operations
		queueRef.current.forEach(operation => {
			operation.reject(new Error('Operation cancelled'))
		})

		queueRef.current = []

		if (timeoutRef.current !== null) {
			clearTimeout(timeoutRef.current)
			timeoutRef.current = null
		}
	}, [])

	/**
	 * Cleanup on unmount
	 */
	useEffect(() => {
		return () => {
			if (timeoutRef.current !== null) {
				clearTimeout(timeoutRef.current)
			}
			clearQueue()
		}
	}, [clearQueue])

	return {
		saveImmediate,
		saveDebounced,
		saveManual,
		flushPending,
		getPendingCount,
		clearQueue,
		isSaving,
		lastSaveTime,
		saveHistory
	}
}

/**
 * Helper function to classify save operations based on change type
 */
export function classifySaveOperation(
	changeType: string,
	previousValue: unknown,
	newValue: unknown
): SaveOperationType {
	// Critical changes that should be saved immediately
	const immediateChanges = [
		'enable', 'disable', 'delete', 'remove',
		'globalLimits', 'timeout', 'concurrentLimit',
		'critical', 'security', 'auth'
	]

	// Manual changes that require explicit user action
	const manualChanges = [
		'bulkImport', 'bulkExport', 'reset', 'restore',
		'migration', 'upgrade', 'advancedConfig'
	]

	const changeTypeLower = changeType.toLowerCase()

	if (immediateChanges.some(change => changeTypeLower.includes(change))) {
		return 'immediate'
	}

	if (manualChanges.some(change => changeTypeLower.includes(change))) {
		return 'manual'
	}

	// Default to debounced for non-critical changes
	return 'debounced'
}

/**
 * Helper function to create a change detector
 */
export function createChangeDetector<T>(getValue: () => T) {
	let previousValue = getValue()

	return {
		hasChanged: (): boolean => {
			const currentValue = getValue()
			const changed = JSON.stringify(previousValue) !== JSON.stringify(currentValue)
			if (changed) {
				previousValue = currentValue
			}
			return changed
		},
		getPreviousValue: () => previousValue,
		getCurrentValue: () => getValue()
	}
}