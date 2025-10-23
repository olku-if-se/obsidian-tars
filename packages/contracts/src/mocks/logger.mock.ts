import type { ILogger } from "../services";

export const LoggerNoOp: ILogger = {
	debug: () => {},
	info: () => {},
	warn: () => {},
	error: () => {},
};
