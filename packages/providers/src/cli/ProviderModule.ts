import { Container } from "@needle-di/core";
import { LoggerNoOp, SettingsServiceNoOp } from "@tars/contracts/mocks";
import { tokens } from "@tars/contracts/tokens";
import moduleContainer from "..";

export function createNoOpParentContainer(): Container {
	const container = new Container();

	// Mock core services for demonstration
	container.bind({ provide: tokens.Logger, useValue: LoggerNoOp });
	container.bind({ provide: tokens.Settings, useValue: SettingsServiceNoOp });

	return container;
}
/**
 * Create provider container with mock/stub implementations for MCP services
 * This enables providers to work even without full MCP infrastructure
 */
export function createProviderContainer(parent: Container): Container {
	return parent.bind(moduleContainer);
}
