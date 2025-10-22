/**
 * Configuration types for streaming providers
 * Provides unified configuration across all providers
 */

export type {
	RetryConfig,
	TimeoutConfig,
	ErrorReportingConfig,
	ErrorContext,
	ErrorHandlingConfig
} from './ErrorHandlingConfig'

export {
	DEFAULT_RETRY_CONFIG,
	DEFAULT_TIMEOUT_CONFIG,
	DEFAULT_ERROR_REPORTING_CONFIG,
	DEFAULT_ERROR_HANDLING_CONFIG
} from './ErrorHandlingConfig'

export type {
	ContentCallback,
	ToolCallCallback,
	StreamStartCallback,
	StreamEndCallback,
	ErrorCallback,
	StreamEventCallback,
	ContentMetadata,
	StreamMetadata,
	ToolCallResponse,
	CallbackConfig
} from './CallbackConfig'

export { DEFAULT_CALLBACK_CONFIG } from './CallbackConfig'

export type {
	ChunkPreprocessor,
	ChunkPostprocessor,
	EventFilter,
	ProcessingContext,
	ProcessingConfig,
	StreamConfig
} from './StreamConfig'

export { DEFAULT_PROCESSING_CONFIG, DEFAULT_STREAM_CONFIG } from './StreamConfig'
