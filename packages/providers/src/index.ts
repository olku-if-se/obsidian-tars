import { Container } from "@needle-di/core";
import { tokens } from "@tars/contracts";
import { LlmProviderRegistry } from "./modules/ProviderRegistry";
import {
	AzureStreamingProvider,
	ClaudeStreamingProvider,
	GeminiStreamingProvider,
	GrokStreamingProvider,
	OllamaStreamingProvider,
	OpenAIStreamingProvider,
} from "./providers";

const container = new Container();

// Major providers
container.bindAll(
	OpenAIStreamingProvider,
	AzureStreamingProvider,
	ClaudeStreamingProvider,
	GrokStreamingProvider,
	GeminiStreamingProvider,
	OllamaStreamingProvider,
);

container.bind({ provide: tokens.Registry, useClass: LlmProviderRegistry });

export default container;
