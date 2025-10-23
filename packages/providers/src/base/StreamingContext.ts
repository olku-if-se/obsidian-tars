import type { StreamEvent } from "src/streaming";
import type { ProcessingContext, StreamConfig } from "./StreamConfig";

/**
 * Streaming context for providers
 * Maintains state during stream processing
 */
export class StreamingContext {
	private chunkIndex = 0;
	private totalChunks = 0;
	private accumulatedContent = "";
	private startTime = Date.now();
	private messageCount = 0;
	private hasTools = false;

	constructor(
		public readonly provider: string,
		public readonly model: string,
		public readonly config: StreamConfig,
		extras: object = {},
	) {
		this.startTime = Date.now();

		Object.assign(this, { ...extras });
	}

	/**
	 * Increment chunk counter
	 */
	incrementChunk(): void {
		this.chunkIndex++;
		this.totalChunks++;
	}

	/**
	 * Reset chunk index (for new stream in queue)
	 */
	resetChunkIndex(): void {
		this.chunkIndex = 0;
	}

	/**
	 * Accumulate content
	 */
	addContent(content: string): void {
		this.accumulatedContent += content;
	}

	/**
	 * Get accumulated content
	 */
	getAccumulatedContent(): string {
		return this.accumulatedContent;
	}

	/**
	 * Clear accumulated content
	 */
	clearContent(): void {
		this.accumulatedContent = "";
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
			timestamp: Date.now(),
		};
	}

	/**
	 * Get elapsed time since start
	 */
	getElapsedTime(): number {
		return Date.now() - this.startTime;
	}

	/**
	 * Get current chunk index
	 */
	getCurrentChunkIndex(): number {
		return this.chunkIndex;
	}

	/**
	 * Get total chunks processed
	 */
	getTotalChunks(): number {
		return this.totalChunks;
	}

	toStartStreamArgs() {
		return {
			provider: this.provider,
			model: this.model,
			messageCount: this.messageCount,
			hasTools: this.hasTools,
			timestamp: Date.now(),
		};
	}

	toEndStreamArgs() {
		const timestamp = Date.now();

		return {
			provider: this.provider,
			model: this.model,
			messageCount: this.messageCount,
			hasTools: this.hasTools,
			totalChunks: 0,
			totalTokens: 0,
			duration: timestamp - this.startTime,
			timestamp,
		};
	}

	toErrorArgs(error: Error) {
		return {
			provider: this.provider,
			model: this.model,
			error,
			recoverable: true,
			attemptNumber: 0,
			stack: error.stack,
			timestamp: Date.now(),
		};
	}

	// biome-ignore lint/suspicious/noExplicitAny: keep it simple
	toEventArgs(event: StreamEvent<any>) {
		// TODO: update metrics of the context
		return event;
	}

	toContentArgs(content: string) {
		return {
			content,
			chunkIndex: this.chunkIndex,
			tokens: undefined,
			timestamp: Date.now(),
		};
	}
}
