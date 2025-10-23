import { InjectionToken } from "@needle-di/core";
import type { McpIntegration, McpToolInjector } from "../providers";
import type { CodeBlockProcessor, IMcpService } from "../services/mcp";
import type {
	MCPServerClient,
	MCPServerManager,
	SessionNotificationHandlers,
	ToolExecutor,
} from "../services/mcp-types";
import type {
	IServerConfigManager,
	OllamaAdapterRuntimeConfig,
} from "../services/unsorted";
import { urn } from "./urn";

type OllamaClient = unknown;

export const ToolExecutorToken = new InjectionToken<ToolExecutor>(
	urn.service("mcp-tool-executor"),
);
export const MCPServerManagerToken = new InjectionToken<MCPServerManager>(
	urn.manager("mcp-server-manager"),
);
export const MCPServerClientToken = new InjectionToken<MCPServerClient>(
	urn.service("mcp-server-client"),
);
export const CodeBlockProcessorToken = new InjectionToken<CodeBlockProcessor>(
	urn.service("mcp-code-block-processor"),
);
export const OllamaClientToken = new InjectionToken<OllamaClient>(
	urn.service("ollama-client"),
);
export const OllamaRuntimeConfigToken =
	new InjectionToken<OllamaAdapterRuntimeConfig>(urn.config("ollama-runtime"));
export const ServerConfigManagerToken =
	new InjectionToken<IServerConfigManager>(urn.manager("mcp-server-config"));
export const SessionNotificationHandlersToken =
	new InjectionToken<SessionNotificationHandlers>(
		urn.service("mcp-session-notifications"),
	);
export const IMcpServiceToken = new InjectionToken<IMcpService>(
	urn.service("mcp-service"),
);
export const MCPIntegrationToken = new InjectionToken<McpIntegration>(
	urn.service("mcp-integration"),
);
export const MCPToolInjectorToken = new InjectionToken<McpToolInjector>(
	urn.service("mcp-tool-injector"),
);
