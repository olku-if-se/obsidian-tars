export const ToolExecutorToken = Symbol('ToolExecutor')
export const MCPServerManagerToken = Symbol('MCPServerManager')
export const CodeBlockProcessorToken = Symbol('CodeBlockProcessor')
export const OllamaClientToken = Symbol('OllamaClient')
export const OllamaRuntimeConfigToken = Symbol('OllamaRuntimeConfig')

export interface OllamaAdapterRuntimeConfig {
	readonly model: string
	readonly createAbortController?: () => AbortController
}
