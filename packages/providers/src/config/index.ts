/**
 * Configuration types for streaming providers
 * Provides unified configuration across all providers
 */

export type {
	CallbackConfig,
	ContentCallback,
	ContentMetadata,
	ErrorCallback,
	StreamEndCallback,
	StreamEventCallback,
	StreamMetadata,
	StreamStartCallback,
	ToolCallCallback,
	ToolCallResponse
} from './CallbackConfig'
export { DEFAULT_CALLBACK_CONFIG } from './CallbackConfig'
export type {
	ErrorContext,
	ErrorHandlingConfig,
	ErrorReportingConfig,
	RetryConfig,
	TimeoutConfig
} from './ErrorHandlingConfig'
export {
	DEFAULT_ERROR_HANDLING_CONFIG,
	DEFAULT_ERROR_REPORTING_CONFIG,
	DEFAULT_RETRY_CONFIG,
	DEFAULT_TIMEOUT_CONFIG
} from './ErrorHandlingConfig'

export type {
	ChunkPostprocessor,
	ChunkPreprocessor,
	EventFilter,
	ProcessingConfig,
	ProcessingContext,
	StreamConfig
} from './StreamConfig'

export { DEFAULT_PROCESSING_CONFIG, DEFAULT_STREAM_CONFIG } from './StreamConfig'
