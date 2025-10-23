import type { ProcessingContext, StreamConfig } from '../config'

/**
 * Streaming context for providers
 * Maintains state during stream processing
 */
export class StreamingContext {
	private chunkIndex = 0
	private totalChunks = 0
	private accumulatedContent = ''
	private startTime: number

	constructor(
		public readonly provider: string,
		public readonly model: string,
		public readonly config: StreamConfig
	) {
		this.startTime = Date.now()
	}

	/**
	 * Increment chunk counter
	 */
	incrementChunk(): void {
		this.chunkIndex++
		this.totalChunks++
	}

	/**
	 * Reset chunk index (for new stream in queue)
	 */
	resetChunkIndex(): void {
		this.chunkIndex = 0
	}

	/**
	 * Accumulate content
	 */
	addContent(content: string): void {
		this.accumulatedContent += content
	}

	/**
	 * Get accumulated content
	 */
	getAccumulatedContent(): string {
		return this.accumulatedContent
	}

	/**
	 * Clear accumulated content
	 */
	clearContent(): void {
		this.accumulatedContent = ''
	}

	/**
	 * Get processing context for processors
	 */
	getProcessingContext(): ProcessingContext {
		return {
			provider: this.provider,
			model: this.model,
			chunkIndex: this.chunkIndex,
			totalChunks: this.totalChunks,
			accumulatedContent: this.accumulatedContent,
			timestamp: Date.now()
		}
	}

	/**
	 * Get elapsed time since start
	 */
	getElapsedTime(): number {
		return Date.now() - this.startTime
	}

	/**
	 * Get current chunk index
	 */
	getCurrentChunkIndex(): number {
		return this.chunkIndex
	}

	/**
	 * Get total chunks processed
	 */
	getTotalChunks(): number {
		return this.totalChunks
	}
}
