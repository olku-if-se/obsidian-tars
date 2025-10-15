/**
 * Obsidian-specific logger implementation
 * Implements ILogger interface using Obsidian's logging facilities
 */

import type { ILogger } from '@tars/mcp-hosting'
import { createLogger } from '@tars/logger'

export class ObsidianLogger implements ILogger {
	private logger = createLogger('mcp')

	debug(message: string, context?: Record<string, unknown>): void {
		this.logger.debug(message, context)
	}

	info(message: string, context?: Record<string, unknown>): void {
		this.logger.info(message, context)
	}

	warn(message: string, context?: Record<string, unknown>): void {
		this.logger.warn(message, context)
	}

	error(message: string, error?: Error, context?: Record<string, unknown>): void {
		this.logger.error(message, error, context)
	}
}
