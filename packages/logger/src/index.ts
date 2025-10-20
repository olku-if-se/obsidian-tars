import Debug from 'debug'
import { injectable } from '@needle-di/core'

const ROOT_NAMESPACE = 'tars'

type LogHandler = (...args: unknown[]) => void

const rootLogger = Debug(ROOT_NAMESPACE)

export interface Logger {
	debug: LogHandler
	info: LogHandler
	warn: LogHandler
	error: LogHandler
}

const buildLogger = (namespace?: string): Logger => {
	const base = namespace ? rootLogger.extend(namespace) : rootLogger
	const warnLogger = base.extend('warn') as unknown as LogHandler
	const errorLogger = base.extend('error') as unknown as LogHandler

	return {
		debug: base.extend('debug') as unknown as LogHandler,
		info: base.extend('info') as unknown as LogHandler,
		warn: (...args: unknown[]) => {
			warnLogger(...args)
			console.warn(...args)
		},
		error: (...args: unknown[]) => {
			errorLogger(...args)
			console.error(...args)
		}
	}
}

export const createLogger = (namespace?: string): Logger => buildLogger(namespace)

@injectable()
export class LoggerFactory {
	create(namespace?: string): Logger {
		return buildLogger(namespace)
	}

	createChild(parentNamespace: string, childNamespace: string): Logger {
		const namespace = parentNamespace ? `${parentNamespace}:${childNamespace}` : childNamespace
		return buildLogger(namespace)
	}
}
