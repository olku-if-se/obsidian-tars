import type { StreamEvent } from '../streaming/types'
import type { CallbackConfig } from './CallbackConfig'
import type { ErrorHandlingConfig } from './ErrorHandlingConfig'

/**
 * Complete streaming configuration
 * Combines error handling, callbacks, and processing options
 */

/**
 * Chunk preprocessor function
 * Applied to raw chunks before they are yielded
 */
export type ChunkPreprocessor = (chunk: string, context: ProcessingContext) => string | Promise<string>

/**
 * Chunk postprocessor function
 * Applied to chunks after preprocessing but before yielding
 */
export type ChunkPostprocessor = (chunk: string, context: ProcessingContext) => string | Promise<string>

/**
 * Event filter function
 * Return true to allow the event, false to filter it out
 */
export type EventFilter = (event: StreamEvent) => boolean

/**
 * Context information for processors
 */
export interface ProcessingContext {
	/** Provider name */
	provider: string

	/** Model name */
	model: string

	/** Current chunk index */
	chunkIndex: number

	/** Total chunks processed so far */
	totalChunks: number

	/** Accumulated content so far */
	accumulatedContent: string

	/** Timestamp */
	timestamp: number
}

/**
 * Processing pipeline configuration
 */
export interface ProcessingConfig {
	/** Preprocess chunks before yielding */
	preprocessor?: ChunkPreprocessor

	/** Postprocess chunks after preprocessing */
	postprocessor?: ChunkPostprocessor

	/** Filter events before yielding */
	eventFilter?: EventFilter

	/** Whether to accumulate content or yield chunks immediately */
	accumulateContent: boolean

	/** Buffer size for content accumulation (in characters) */
	bufferSize?: number
}

/**
 * Complete stream configuration
 */
export interface StreamConfig {
	/** Abort signal for cancellation */
	signal?: AbortSignal

	/** Error handling configuration */
	errorHandling?: Partial<ErrorHandlingConfig>

	/** Callback configuration */
	callbacks?: CallbackConfig

	/** Processing configuration */
	processing?: ProcessingConfig

	/** Provider-specific options */
	providerOptions?: Record<string, any>
}

/**
 * Default processing configuration
 */
export const DEFAULT_PROCESSING_CONFIG: ProcessingConfig = {
	accumulateContent: false
}

/**
 * Default stream configuration
 */
export const DEFAULT_STREAM_CONFIG: StreamConfig = {
	processing: DEFAULT_PROCESSING_CONFIG
}
