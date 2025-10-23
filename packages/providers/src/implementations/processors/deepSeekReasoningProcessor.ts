import type { LlmStreamProcessor } from '@tars/contracts'
import { CALLOUT_BLOCK_END, CALLOUT_BLOCK_START } from '../../utils'

export class DeepSeekReasoningProcessor implements LlmStreamProcessor {
	private reasoning = false
	private started = false
	private closed = false

	process(delta: string): string[] {
		if (!delta) {
			return []
		}

		if (delta === '🧀') {
			if (!this.started) {
				this.started = true
				this.reasoning = true
				return [CALLOUT_BLOCK_START]
			}

			if (!this.closed) {
				this.reasoning = false
				this.closed = true
				return [CALLOUT_BLOCK_END]
			}

			return []
		}

		if (this.reasoning) {
			return [delta.replace(/\n/g, '\n> ')]
		}

		return [delta]
	}

	complete(): string[] {
		if (this.reasoning && !this.closed) {
			this.reasoning = false
			this.closed = true
			return [CALLOUT_BLOCK_END]
		}
		return []
	}
}
