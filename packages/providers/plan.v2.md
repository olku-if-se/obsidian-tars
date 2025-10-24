## Plan: Clean Declarative Streaming Architecture with Pure Event Flow

### Overview
Implement a clean declarative streaming architecture where `StreamingContext` handles all callback arguments, `invokeCallback` manages undefined checks, `context.emit()` returns yieldable results, and the stream loop has no conditional logic - just pure event processing with context-managed lifecycle.

## PHASE 1: Clean Declarative Architecture Foundation (CRITICAL PATH)

### Step 1.1: Enhanced StreamingContext with Complete Callback Support

**StreamingContext with Enhanced Argument Preparation:**
```typescript
import { TypedEmitter } from 'tseep'
import type { StreamEvent, ToolCall } from '../streaming'

export interface StreamEvents {
  content: (chunk: string) => string | string[]
  tool_calls: (toolCalls: ToolCall[]) => (ToolCall | ToolCallResponse)[]
  stream_end: () => void
  error: (error: Error) => void
  follow_up_stream: () => void
  // Users can extend with custom events
}

export class StreamingContext extends TypedEmitter<StreamEvents> {
  private messages: Message[]
  private config: StreamConfig
  private provider: string
  private model: string
  private extras: Record<string, any>

  constructor(
    provider: string,
    model: string,
    config: StreamConfig,
    initialMessages: Message[] = [],
    extras: Record<string, any> = {}
  ) {
    super()
    this.provider = provider
    this.model = model
    this.config = config
    this.messages = [...initialMessages]
    this.extras = { ...extras }
    
    // Pre-register default handlers
    this.setupDefaultHandlers()
  }

  // === Enhanced Message Management ===
  getMessages(): Message[] { return [...this.messages] }
  addMessages(newMessages: Message[]): void { this.messages.push(...newMessages) }

  // === Enhanced Extras for Callback Arguments ===
  setExtra(key: string, value: any): void { this.extras[key] = value }
  getExtra(key: string): any { return this.extras[key] }

  // === Complete Callback Argument Preparation ===
  
  toResourcesRequestArgs(): OnResourcesRequestArgs {
    return {
      provider: this.provider,
      model: this.model,
      messages: this.getMessages(),
      config: this.config,
      ...this.extras
    }
  }

  toPrepareStreamContextArgs(availableResources: any[] = []): PrepareStreamContextArgs {
    return {
      context: this,
      messages: this.getMessages(),
      config: this.config,
      availableResources,
      ...this.extras
    }
  }

  toStreamStartArgs(): OnStreamStartArgs {
    return {
      provider: this.provider,
      model: this.model,
      messageCount: this.getMessages().length,
      hasTools: false, // Can be calculated if needed
      timestamp: Date.now(),
      ...this.extras
    }
  }

  toStreamEndArgs(totalChunks: number): OnStreamEndArgs {
    return {
      provider: this.provider,
      model: this.model,
      totalChunks,
      duration: Date.now() - (this.extras.startTime || Date.now()),
      timestamp: Date.now(),
      ...this.extras
    }
  }

  toErrorArgs(error: Error, attemptNumber: number = 0): OnErrorArgs {
    return {
      provider: this.provider,
      model: this.model,
      error,
      recoverable: true, // Can be enhanced based on error type
      attemptNumber,
      stack: error.stack,
      timestamp: Date.now(),
      ...this.extras
    }
  }

  // === Enhanced Default Handlers ===
  private setupDefaultHandlers(): void {
    // Default content handler - yields content chunks
    this.on('content', (chunk: string) => {
      return chunk // Return chunk for yielding
    })
    
    // Default tool_calls handler - yields tool events and manages follow-up streams
    this.on('tool_calls', async (toolCalls: ToolCall[]) => {
      // Add assistant message with tool calls
      this.addMessages([{ role: "assistant", content: null, tool_calls }])
      
      // Execute tools and collect results
      const results = await Promise.all(
        toolCalls.map(tc => this.executeTool(tc))
      )
      
      // Add tool result messages
      this.addMessages(results)
      
      // Return events for yielding (tool calls + results)
      return [...toolCalls, ...results]
    })
    
    // Default stream_end handler - no return value
    this.on('stream_end', () => {
      // Stream lifecycle managed here
    })
    
    // Default error handler
    this.on('error', (error: Error) => {
      // Error handling managed here
    })
    
    // Default follow_up_stream handler
    this.on('follow_up_stream', () => {
      // Signal for creating follow-up stream
    })
  }

  // === Enhanced Tool Execution ===
  private async executeTool(toolCall: any): Promise<ToolCallResponse> {
    const eventName = toolCall.function.name
    
    try {
      const result = await this.emit(eventName, toolCall)
      
      return result || {
        tool_call_id: toolCall.id,
        content: `Tool '${eventName}' executed successfully`,
        success: true
      }
    } catch (error) {
      return {
        tool_call_id: toolCall.id,
        content: `Tool '${eventName}' failed: ${error}`,
        success: false,
        error: String(error)
      }
    }
  }

  // === Utility Methods ===
  createStream(providerMethod: (messages: Message[], config: StreamConfig) => ICompletionsStream): ICompletionsStream {
    return providerMethod(this.getMessages(), this.config)
  }
}
```

### Step 1.2: Enhanced invokeCallback with Automatic Undefined Handling

**Utility Function for Safe Callback Invocation:**
```typescript
// In StreamingProviderBase or utility file
protected async invokeCallback<T extends AnyFunction>(
  callback: T | undefined,
  ...args: Parameters<T>
): Promise<ReturnType<T> | undefined> {
  if (!callback) return undefined
  
  try {
    return await callback(...args)
  } catch (error) {
    this.logger?.warn?.('Callback error', error)
    return undefined
  }
}
```

### Step 1.3: Clean Declarative StreamingProviderBase

**Pure Declarative Stream Processing:**
```typescript
async *stream(messages: Message[], config: StreamConfig = {}): AsyncGenerator<string | ToolCall | ToolCallResponse, void, unknown> {
  const callbacks = config.callbacks as ComprehensiveCallbacks | undefined

  // 1. CREATE CONTEXT with all necessary data
  const context = new StreamingContext(
    this.name, 
    this.model, 
    config, 
    messages,
    { startTime: Date.now() } // Initial extras
  )
  
  // 2. REQUEST RESOURCES - automatic undefined handling
  const resourcesResult = await this.invokeCallback(
    callbacks?.onResourcesRequest,
    context.toResourcesRequestArgs()
  )
  const availableResources = resourcesResult?.resources || []

  // 3. PREPARE CONTEXT - automatic undefined handling
  await this.invokeCallback(
    callbacks?.prepareStreamContext,
    context.toPrepareStreamContextArgs(availableResources)
  )

  // 4. CREATE STREAM QUEUE
  const initialStream = context.createStream(this.createCompletionStream.bind(this))
  const streamQueue = new StreamQueue(initialStream, context.config.signal)

  // Set up follow-up stream handling
  let shouldContinue = true
  context.on('follow_up_stream', () => {
    if (shouldContinue) {
      const followUpStream = context.createStream(this.createCompletionStream.bind(this))
      streamQueue.push(followUpStream)
    }
  })

  // Set up stream end handling
  context.on('stream_end', () => {
    shouldContinue = false
  })

  // 5. START STREAM - notify observer
  await this.invokeCallback(
    callbacks?.onStreamStart,
    context.toStreamStartArgs()
  )

  // 6. PURE EVENT PROCESSING LOOP - no conditional logic
  for await (const event of streamQueue) {
    // Call stream event callback (automatic undefined handling)
    await this.invokeCallback(callbacks?.onStreamEvent, event)

    // Emit through context and get yieldable results
    const results = await context.emit(event.type, event.data)
    
    // Yield all results from context.emit
    if (results) {
      for (const result of results) {
        yield result
      }
    }
  }

  // 7. END STREAM - notify observer
  await this.invokeCallback(
    callbacks?.onStreamEnd,
    context.toStreamEndArgs(context.getCurrentChunkIndex())
  )
}
```

### Step 1.4: Enhanced StreamingProviderBase with Complete Observer Support

**Complete Observer Callback Integration:**
```typescript
// Enhanced invokeCallback for different callback types
protected async invokeCallback<T extends AnyFunction>(
  callback: T | undefined,
  ...args: Parameters<T>
): Promise<ReturnType<T> | undefined> {
  if (!callback) return undefined
  
  try {
    return await callback(...args)
  } catch (error) {
    this.logger?.warn?.('Callback error', error)
    return undefined
  }
}

// Enhanced error handling with observer callbacks
private async handleStreamError(error: Error, context: StreamingContext, callbacks: ComprehensiveCallbacks | undefined): Promise<void> {
  const errorArgs = context.toErrorArgs(error, 0)
  
  // Call error observer callback
  const errorResult = await this.invokeCallback(callbacks?.onError, errorArgs)
  
  // Handle retry logic if errorResult suggests retry
  if (errorResult?.retry) {
    // Retry logic can be implemented here
    const retryDelay = errorResult.retryDelay || 1000
    await new Promise(resolve => setTimeout(resolve, retryDelay))
    // Restart stream with retry logic
  } else {
    // Propagate error
    throw error
  }
}

// Enhanced timeout handling with observer callbacks
private async handleTimeout(context: StreamingContext, callbacks: ComprehensiveCallbacks | undefined): Promise<void> {
  const timeoutArgs = {
    timeout: context.config.errorHandling?.timeout?.chunkTimeout || 30000,
    chunksReceived: context.getCurrentChunkIndex(),
    partialContent: context.getAccumulatedContent(),
    provider: context.provider,
    timestamp: Date.now()
  }
  
  await this.invokeCallback(callbacks?.onTimeout, timeoutArgs)
}
```

### Step 1.5: Complete Example with External Integration

**Clean Declarative Usage Example:**
```typescript
// External MCP integration
const mcpIntegration = {
  async loadMCPServers(): Promise<ToolDefinition[]> {
    // Load and return available tools
  },

  createToolHandler(serverId: string): (toolCall: ToolCall) => Promise<ToolCallResponse> {
    return async (toolCall: ToolCall) => {
      return await this.mcpManager.executeTool(serverId, toolCall)
    }
  }
}

// Clean streaming usage
const provider = new OpenAIStreamingProvider(logger, settings)
provider.initialize({ apiKey: 'sk-...', model: 'gpt-4o' })

// Stream with clean declarative callbacks
for await (const event of provider.stream(messages, {
  callbacks: {
    // Mutation callbacks
    onResourcesRequest: async (args) => {
      const tools = await mcpIntegration.loadMCPServers()
      return { resources: tools }
    },
    
    prepareStreamContext: async (args) => {
      // Register tool handlers
      for (const tool of args.availableResources) {
        const handler = mcpIntegration.createToolHandler(tool.serverId)
        args.context.on(tool.function.name, handler)
      }
    },

    // Observer callbacks - automatic undefined handling
    onStreamStart: async (args) => {
      console.log(`Stream started for ${args.provider}`)
    },
    
    onStreamEnd: async (args) => {
      console.log(`Stream ended: ${args.totalChunks} chunks in ${args.duration}ms`)
    },
    
    onToolCall: async (args) => {
      console.log('Tool requested:', args.toolCalls.map(t => t.function.name))
    },
    
    onError: async (args) => {
      console.error('Stream error:', args.error.message)
      return { retry: args.attemptNumber < 3, retryDelay: 1000 }
    }
  }
})) {
  // Clean event handling - no type checking needed
  console.log('Event:', event)
}
```

## PHASE 2: Universal Provider Refactoring with Clean Architecture

### Step 2.1: Apply Clean Declarative Pattern to All Providers

**Universal Provider Characteristics:**
1. **Pure stream creation** - Only createCompletionStream responsibility
2. **No conditional logic** - Stream loop is pure event processing
3. **Complete callback support** - All 14+ observers automatically supported
4. **Clean argument preparation** - Context handles all callback arguments
5. **External integration ready** - Clean hooks for MCP and other systems

### Step 2.2: Enhanced Testing Strategy

**Clean Architecture Testing:**
- **Pure event flow testing** - No conditional logic to test
- **Callback argument testing** - Context prepares all arguments correctly
- **External integration testing** - Clean hooks for external systems
- **Observer pattern testing** - All observers work automatically
- **Error flow testing** - Clean error propagation and retry logic

### Benefits of Clean Declarative Architecture

**Code Quality Benefits:**
- **No conditional logic** - Stream processing is pure and predictable
- **Automatic undefined handling** - invokeCallback manages all edge cases
- **Complete argument preparation** - Context handles all callback needs
- **Pure data flow** - Events in, results out, no side effects

**Maintainability Benefits:**
- **Single responsibility** - Each component has one clear purpose
- **Extensible** - New features added to context benefit all providers
- **Testable** - Pure functions are easy to test
- **Readable** - Clear data flow without conditional branching

**Integration Benefits:**
- **External system ready** - Clean hooks for MCP and other integrations
- **Universal patterns** - Same clean architecture works for all providers
- **Flexible configuration** - Easy to add new callback types
- **Robust error handling** - Clean error flow with automatic recovery

### Success Criteria

**Phase 1 Success (Clean Architecture):**
- StreamingProviderBase has no conditional logic in stream loop
- context.emit() returns properly formatted arrays for yielding
- invokeCallback handles all undefined checks automatically
- StreamingContext prepares arguments for all callback types
- Complete observer callback support (14+ callbacks)
- External integration works cleanly with no provider modifications

**Phase 2 Success (Universal Clean Architecture):**
- All providers follow the same clean declarative pattern
- No provider has conditional logic in stream processing
- All external integrations work uniformly across providers
- Complete test coverage for clean architecture patterns
- Easy addition of new callback types and features