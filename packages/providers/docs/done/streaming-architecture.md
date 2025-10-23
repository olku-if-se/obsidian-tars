# Streaming Architecture

## Overview

This document describes the new streaming architecture based on the llm-chat.md pattern. The architecture provides a unified, provider-agnostic approach to handling LLM streaming with support for:

- **StreamQueue**: Multi-stream management for follow-up streams (e.g., after tool calls)
- **Tool Execution**: EventEmitter-based tool calling with ToolManager
- **Error Handling**: Unified retry logic, timeouts, and error reporting
- **Runtime Callbacks**: Hooks for content, tool calls, stream lifecycle events
- **Chunk Processing**: Pre/post-processors for stream content

## Architecture Components

### 1. Core Streaming (`src/streaming/`)

#### StreamQueue
Manages multiple async streams sequentially with abort support.

```typescript
const queue = new StreamQueue(initialStream, abortSignal)
queue.push(followUpStream)  // Add more streams dynamically
queue.close()  // Signal no more streams coming

for await (const event of queue) {
  // Process events from all streams
}
```

**Use cases:**
- Follow-up streams after tool execution
- Retry streams on recoverable errors
- Sequential processing of related streams

#### CompletionsStream
Abstract base class for provider-specific streaming implementations.

```typescript
class OpenAICompletionsStream extends CompletionsStream {
  async *[Symbol.asyncIterator]() {
    // Yield StreamEvents: content, tool_calls, stream_end, error
  }
}
```

### 2. Configuration (`src/config/`)

#### StreamConfig
Complete streaming configuration combining all options:

```typescript
const config: StreamConfig = {
  signal: controller.signal,
  errorHandling: {
    retry: { maxRetries: 3, retryDelay: 1000 },
    timeout: { chunkTimeout: 30000 }
  },
  callbacks: {
    onContent: (chunk) => console.log(chunk),
    onToolCall: async (calls) => executeTools(calls),
    onStreamEnd: () => cleanup()
  },
  processing: {
    preprocessor: async (chunk) => sanitize(chunk),
    postprocessor: async (chunk) => format(chunk)
  }
}
```

### 3. Tool Management (`src/tools/`)

#### ToolManager
EventEmitter-based tool execution:

```typescript
const toolManager = new ToolManager()

// Register handlers
toolManager.registerHandler('get_weather', async (toolCall) => {
  const args = JSON.parse(toolCall.function.arguments)
  const result = await fetchWeather(args.location)
  return {
    role: 'tool',
    tool_call_id: toolCall.id,
    content: JSON.stringify(result)
  }
})

// Execute tool calls
const responses = await toolManager.executeMany(toolCalls)
```

**Features:**
- Parallel or sequential execution
- Timeout support per tool
- Error handling with fallback responses
- Event emission for monitoring

#### ToolExecutor
Helper for creating tool execution callbacks that push follow-up streams:

```typescript
const executor = ToolExecutor.create(
  toolManager,
  messages,
  (stream) => queue.push(stream),
  (msgs) => createNewStream(msgs)
)

emitter.on('tool_calls', executor)
```

### 4. Provider Base Class (`src/base/`)

#### StreamingProviderBase
Abstract base that integrates all components:

```typescript
@injectable()
class OpenAIStreamingProvider extends StreamingProviderBase {
  protected createCompletionStream(messages, config) {
    return new OpenAICompletionsStream(messages, config, this.client)
  }
}
```

**Built-in features:**
- StreamQueue integration
- Automatic retry with exponential backoff
- Timeout wrapper for chunk delivery
- Callback invocation
- Pre/post-processing pipeline
- Error handling and reporting

### 5. MCP Adapter (`src/adapters/`)

#### IMCPAdapter
Interface for future MCP integration:

```typescript
interface IMCPAdapter {
  hasToolCalling(): boolean
  injectTools(params, providerName): Promise<MCPToolInjectionResult>
  generateWithTools(config): AsyncGenerator<string>
}
```

**Current implementation:**
- `NoOpMCPAdapter`: Stub implementation for providers without MCP

## Provider Organization

Each provider is organized in its own subfolder under `src/providers/`:

```
src/providers/
├── openai/
│   ├── OpenAIStreamingProvider.ts    # Main provider class
│   ├── OpenAICompletionsStream.ts    # Streaming implementation
│   ├── types.ts                       # Provider-specific types
│   ├── __tests__/                     # Provider tests
│   └── index.ts                       # Exports
├── claude/
│   └── ...
└── index.ts                           # Re-export all providers
```

## Event Flow

### Basic Streaming Flow

```
User Request
    ↓
StreamingProviderBase.stream()
    ↓
Create StreamQueue
    ↓
Create Initial CompletionsStream
    ↓
Push to Queue
    ↓
Process Events:
  - content → preprocessor → postprocessor → callbacks → yield
  - tool_calls → callback (optional follow-up stream)
  - stream_end → cleanup
  - error → error handling
    ↓
Close Queue
```

### Tool Calling Flow

```
CompletionsStream yields tool_calls event
    ↓
ToolManager.executeMany(toolCalls)
    ↓
For each tool:
  - Emit event with tool name
  - Execute registered handler
  - Collect response
    ↓
Create follow-up stream with tool responses
    ↓
Push follow-up stream to queue
    ↓
Queue processes follow-up stream
    ↓
Repeat until no more tool calls
```

## Error Handling

### Retry Logic

```typescript
// Configured per provider
const retryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  maxRetryDelay: 30000,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'Network'],
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
}
```

**Retry flow:**
1. Attempt operation
2. On error, check if retryable
3. If retryable and retries remaining:
   - Calculate delay: `retryDelay * (backoffMultiplier ^ attempt)`
   - Wait for delay (capped at maxRetryDelay)
   - Retry operation
4. If not retryable or no retries left, throw error

### Timeout Handling

```typescript
// Two timeout types
const timeoutConfig = {
  requestTimeout: 60000,   // Total request timeout
  chunkTimeout: 30000      // Per-chunk timeout
}
```

**Timeout behavior:**
- **chunkTimeout**: Wraps stream iterator, throws if no chunk received within timeout
- **requestTimeout**: Set at provider level, aborts entire request
- **abortOnTimeout**: Whether to trigger abort signal on timeout

## Testing

### Test Structure

```
src/
├── streaming/__tests__/
│   └── StreamQueue.test.ts
├── tools/__tests__/
│   └── ToolManager.test.ts
├── config/__tests__/
│   └── ErrorHandling.test.ts
└── providers/
    └── openai/__tests__/
        └── OpenAIStreamingProvider.test.ts
```

### Testing Approach

All tests follow the **GIVEN/WHEN/THEN** pattern:

```typescript
describe('ToolManager', () => {
  describe('GIVEN: A new ToolManager', () => {
    let toolManager: ToolManager

    beforeEach(() => {
      // GIVEN: Fresh tool manager
      toolManager = new ToolManager()
    })

    it('WHEN: Handler is registered THEN: Should execute', async () => {
      // GIVEN: Registered handler
      toolManager.registerHandler('test_tool', handler)

      // WHEN: Executing tool
      const response = await toolManager.execute(toolCall)

      // THEN: Should return successful response
      expect(response.content).toBe('expected')
    })
  })
})
```

### Running Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# Run streaming demo
pnpm demo:streaming
```

## Migration Guide

### Migrating Existing Providers

1. **Create provider subfolder:**
   ```bash
   mkdir src/providers/your-provider
   ```

2. **Create types file:**
   ```typescript
   // src/providers/your-provider/types.ts
   export interface YourProviderOptions {
     apiKey: string
     model: string
     // ...
   }
   ```

3. **Create CompletionsStream:**
   ```typescript
   // src/providers/your-provider/YourProviderCompletionsStream.ts
   export class YourProviderCompletionsStream extends CompletionsStream {
     async *[Symbol.asyncIterator]() {
       // Implement streaming logic
     }
   }
   ```

4. **Create Provider class:**
   ```typescript
   // src/providers/your-provider/YourProviderStreamingProvider.ts
   @injectable()
   export class YourProviderStreamingProvider extends StreamingProviderBase {
     protected createCompletionStream(messages, config) {
       return new YourProviderCompletionsStream(messages, config, this.client)
     }
   }
   ```

5. **Add tests:**
   ```typescript
   // src/providers/your-provider/__tests__/YourProviderStreamingProvider.test.ts
   ```

6. **Export from index:**
   ```typescript
   // src/providers/your-provider/index.ts
   export * from './YourProviderStreamingProvider'
   ```

## Demo

Run the streaming architecture demo to see all components in action:

```bash
pnpm demo:streaming
```

**Demo covers:**
- Basic streaming with callbacks
- StreamQueue with multiple streams
- ToolManager with tool execution
- Error handling and retries
- Runtime event handling

## Next Steps

1. **Migrate existing providers** to new architecture
2. **Implement MCP adapter** to replace McpAdapterMock
3. **Add provider-specific optimizations** (batching, caching, etc.)
4. **Enhance error reporting** with provider-specific context
5. **Add metrics and monitoring** hooks
6. **Create provider templates** for faster implementation

## References

- `docs/llm-chat.md` - Original architecture pattern
- `src/cli/streaming-demo.ts` - Working examples
- `src/streaming/` - Core streaming abstractions
- `src/tools/` - Tool management system
- `src/config/` - Configuration types
