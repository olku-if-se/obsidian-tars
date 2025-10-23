import { injectable } from '@needle-di/core'
import { ILoggingService } from '@tars/contracts'
import createDebug from 'debug'

@injectable()
export class ObsidianLoggingService implements ILoggingService {
	private logger: debug.Debugger

	constructor() {
		this.logger = createDebug('tars:plugin')
	}

	debug(message: string, ...args: any[]): void {
		this.logger(`DEBUG: ${message}`, ...args)
	}

	info(message: string, ...args: any[]): void {
		this.logger(`INFO: ${message}`, ...args)
	}

	warn(message: string, ...args: any[]): void {
		this.logger(`WARN: ${message}`, ...args)
	}

	error(message: string, ...args: any[]): void {
		this.logger(`ERROR: ${message}`, ...args)
	}
}
