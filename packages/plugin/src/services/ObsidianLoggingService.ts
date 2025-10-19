import { injectable } from '@needle-di/core'
import { ILoggingService } from '@tars/contracts/services'
import createDebug from 'debug'

@injectable()
export class ObsidianLoggingService implements ILoggingService {
	private debug: debug.Debugger

	constructor() {
		this.debug = createDebug('tars:plugin')
	}

	debug(message: string, ...args: any[]): void {
		this.debug(`DEBUG: ${message}`, ...args)
	}

	info(message: string, ...args: any[]): void {
		this.debug(`INFO: ${message}`, ...args)
	}

	warn(message: string, ...args: any[]): void {
		this.debug(`WARN: ${message}`, ...args)
	}

	error(message: string, ...args: any[]): void {
		this.debug(`ERROR: ${message}`, ...args)
	}
}